// One-off import: Notion "收入 Income" / "轉帳 Transfer" CSV exports ->
// Neon income_records/transfers tables.
//
// Each row is processed independently — a failure on one row does not roll
// back the others. Rows that can't be matched (account/project lookup fails,
// validation error, etc.) are collected and printed at the end with their
// original CSV content + reason, so they can be fixed by hand and re-run
// individually (the script is safe to re-run for the rows that failed, since
// it doesn't de-duplicate already-imported rows — only re-run on the ones
// that were reported as failed).
//
// Usage: node scripts/import-notion-income.mjs

import { readFileSync } from "fs"
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const INCOME_CSV_PATH = new URL("../tmp:income-export.csv", import.meta.url)
const TRANSFER_CSV_PATH = new URL("../tmp:transfer-export.csv", import.meta.url)

// Notion project titles sometimes use different spellings/wording for the
// vendor than the 類別 Categories tag on the income record. Map the vendor
// tag to every title-prefix it can match.
const VENDOR_PROJECT_PREFIX_ALIASES = {
  劉記: ["劉紀茶葉", "劉記茶葉", "劉記"],
  泰順: ["順泰"],
}

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ",") {
      row.push(field)
      field = ""
    } else if (c === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else if (c !== "\r") {
      field += c
    }
  }
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function loadCsv(url) {
  const text = readFileSync(url, "utf-8").replace(/^﻿/, "")
  const [header, ...body] = parseCsv(text)
  return body
    .filter((r) => r.some((cell) => cell.trim() !== ""))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])))
}

// Notion exports relations as "Title (https://app.notion.com/...)" — keep the title only.
function stripNotionLink(value) {
  return value.replace(/\s*\(https:\/\/[^)]*\)\s*$/, "").trim()
}

function parseAmount(value) {
  const n = Number(value.replace(/,/g, "").trim())
  return Number.isFinite(n) ? n : null
}

// Notion dates export as "YYYY/M/D" (no zero-padding). Convert to the
// "YYYY-MM-DD" form the app already uses, so `new Date(...)` lands on UTC
// midnight for the entered calendar date (see income-record-form.tsx).
function toIsoDate(value) {
  const m = value.trim().match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
  if (!m) return null
  const [, y, mo, d] = m
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`
}

const CN_DIGITS = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }

// Handles 一..九十九, which covers every period number seen in the export.
function cnToNumber(s) {
  if (s === "十") return 10
  if (s.length === 1) return CN_DIGITS[s] ?? null
  if (s.length === 2 && s[0] === "十") return 10 + (CN_DIGITS[s[1]] ?? 0)
  if (s.length === 2 && s[1] === "十") return (CN_DIGITS[s[0]] ?? 0) * 10
  if (s.length === 3 && s[1] === "十") return (CN_DIGITS[s[0]] ?? 0) * 10 + (CN_DIGITS[s[2]] ?? 0)
  return null
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const accounts = await prisma.account.findMany({ select: { id: true, name: true } })
const projects = await prisma.project.findMany({ select: { id: true, title: true } })

const accountIdByName = new Map(accounts.map((a) => [a.name.replace(/\s+/g, ""), a.id]))
const projectIdByTitle = new Map(projects.map((p) => [p.title.trim(), p.id]))

function findAccountId(rawName) {
  return accountIdByName.get(stripNotionLink(rawName).replace(/\s+/g, "")) ?? null
}

// Income rows don't carry a Projects relation — derive it from
// "<vendor 類別> + 第N期" in the Name column (e.g. 羽佑 + 第一期專案費用).
function findProjectIdForIncome(name, vendorTag) {
  const vendor = stripNotionLink(vendorTag)
  const m = name.match(/第([一二三四五六七八九十]+)期/)
  if (!m) return { error: `無法從名稱解析期數："${name}"` }

  const ordinal = m[1]
  const prefixes = VENDOR_PROJECT_PREFIX_ALIASES[vendor] ?? [vendor]
  const pattern = new RegExp(`^(?:${prefixes.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})第${ordinal}期`)
  const matches = projects.filter((p) => pattern.test(p.title))

  if (matches.length === 1) return { projectId: matches[0].id }
  if (matches.length === 0) {
    return { error: `找不到符合「${vendor}第${ordinal}期」開頭的專案` }
  }
  return { error: `符合「${vendor}第${ordinal}期」的專案有 ${matches.length} 個，需人工選擇：${matches.map((p) => p.title).join("、")}` }
}

const failures = []

console.log("=== 匯入收入 Income ===")
const incomeRows = loadCsv(INCOME_CSV_PATH)
let incomeCreated = 0
for (let i = 0; i < incomeRows.length; i++) {
  const row = incomeRows[i]
  const lineNo = i + 2 // +1 for header, +1 for 1-based row numbering
  try {
    const amount = parseAmount(row["Amount"])
    const date = toIsoDate(row["Date"])
    const accountId = findAccountId(row["所有帳戶Accounts"])
    const projectLookup = findProjectIdForIncome(row["Name"], row["類別 Categories"])

    if (amount == null) throw new Error(`金額無法解析："${row["Amount"]}"`)
    if (!date) throw new Error(`日期無法解析："${row["Date"]}"`)
    if (!accountId) throw new Error(`找不到帳戶："${stripNotionLink(row["所有帳戶Accounts"])}"`)
    if (projectLookup.error) throw new Error(projectLookup.error)

    await prisma.incomeRecord.create({
      data: {
        amount,
        date: new Date(date),
        note: row["Name"] || null,
        accountId,
        projectId: projectLookup.projectId,
      },
    })
    incomeCreated++
  } catch (error) {
    failures.push({ table: "收入 Income", line: lineNo, row, reason: error.message })
  }
}
console.log(`收入 Income：${incomeRows.length} 筆中成功匯入 ${incomeCreated} 筆`)

console.log("\n=== 匯入轉帳 Transfer ===")
const transferRows = loadCsv(TRANSFER_CSV_PATH)
let transferCreated = 0
for (let i = 0; i < transferRows.length; i++) {
  const row = transferRows[i]
  const lineNo = i + 2
  try {
    const amount = parseAmount(row["Amount"])
    const date = toIsoDate(row["Date"])
    const fromAccountId = findAccountId(row["From Account"])
    const toAccountId = findAccountId(row["To Account"])
    const projectTitle = stripNotionLink(row["Projects"])
    const projectId = projectIdByTitle.get(projectTitle) ?? null

    if (amount == null) throw new Error(`金額無法解析："${row["Amount"]}"`)
    if (!date) throw new Error(`日期無法解析："${row["Date"]}"`)
    if (!fromAccountId) throw new Error(`找不到轉出帳戶："${stripNotionLink(row["From Account"])}"`)
    if (!toAccountId) throw new Error(`找不到轉入帳戶："${stripNotionLink(row["To Account"])}"`)
    if (!projectId) throw new Error(`找不到專案："${projectTitle}"`)

    await prisma.transfer.create({
      data: {
        amount,
        date: new Date(date),
        name: row["Name"] || null,
        fromAccountId,
        toAccountId,
        projectId,
      },
    })
    transferCreated++
  } catch (error) {
    failures.push({ table: "轉帳 Transfer", line: lineNo, row, reason: error.message })
  }
}
console.log(`轉帳 Transfer：${transferRows.length} 筆中成功匯入 ${transferCreated} 筆`)

if (failures.length > 0) {
  console.log(`\n=== ${failures.length} 筆未匯入，請手動處理 ===`)
  for (const f of failures) {
    console.log(`\n[${f.table}] CSV 第 ${f.line} 行 — ${f.reason}`)
    console.log("  原始資料：", JSON.stringify(f.row))
  }
} else {
  console.log("\n全部匯入成功，沒有需要手動處理的紀錄。")
}

const [incomeSum, transferSum] = await Promise.all([
  prisma.incomeRecord.aggregate({ _sum: { amount: true } }),
  prisma.transfer.aggregate({ _sum: { amount: true } }),
])
console.log("\n=== 匯入後總額核對 ===")
console.log(`income_records 總額：${incomeSum._sum.amount ?? 0}（Notion 顯示 1,275,500）`)
console.log(`transfers 總額：${transferSum._sum.amount ?? 0}（Notion 顯示 1,241,000）`)

await prisma.$disconnect()
