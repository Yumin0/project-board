// One-off import: Notion "所有專案" CSV export -> Neon projects/members tables
// Usage: node scripts/import-notion-projects.mjs

import { readFileSync } from "fs"
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const CSV_PATH =
  "/Users/bcigroup/Downloads/Private & Shared/所有專案/Projects 6b70f2e2a40d4deca4ca4a97144c7215_all.csv"

const STATUS_MAP = {
  已結案: "completed",
  進行中: "in_progress",
  尚未開始: "not_started",
}

// All projects in this export are currently the same category per the user.
const DEFAULT_CATEGORY = "副業"

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

const text = readFileSync(CSV_PATH, "utf-8").replace(/^﻿/, "")
const rows = parseCsv(text)
const [header, ...body] = rows
const records = body
  .filter((r) => r.length > 1 || r[0] !== "")
  .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])))

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

let created = 0
let updated = 0
let skipped = 0
const memberIds = new Map()

for (const rec of records) {
  const title = rec["Project"]
  if (!title) {
    skipped++
    continue
  }

  const status = STATUS_MAP[rec["Status"]] ?? "not_started"
  const description = rec["備註"] || null
  const assigneeName = rec["Assignee"] || null

  let assigneeId = null
  if (assigneeName) {
    if (!memberIds.has(assigneeName)) {
      const member = await prisma.member.upsert({
        where: { name: assigneeName },
        update: {},
        create: { name: assigneeName },
      })
      memberIds.set(assigneeName, member.id)
    }
    assigneeId = memberIds.get(assigneeName)
  }

  const data = {
    description,
    category: DEFAULT_CATEGORY,
    status,
    assigneeId,
  }

  const existing = await prisma.project.findFirst({ where: { title } })
  if (existing) {
    await prisma.project.update({ where: { id: existing.id }, data })
    updated++
  } else {
    await prisma.project.create({ data: { title, ...data } })
    created++
  }
}

console.log({ totalRows: records.length, created, updated, skipped })
console.log("members:", Object.fromEntries(memberIds))

await prisma.$disconnect()
