// One-off import: Notion tasks CSV export -> Neon tasks table
// Usage: node scripts/import-notion-tasks.mjs

import { readFileSync } from "fs"
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const CSV_PATH =
  "/Users/bcigroup/Documents/project-board/Tasks 7b1d9ada6bca4d31b809ce9cf251ae09_all.csv"

// CSV 負責人 -> Member name in DB
const ASSIGNEE_MAP = {
  "耀輝 黃": "Riku",
  "Yumin Huang": "Yumin",
  "Yumin": "Yumin",
  "黃 耀增": "Tzeng",
  "哲源 張": "Andy",
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
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ",") {
      row.push(field); field = ""
    } else if (c === "\n") {
      row.push(field); field = ""
      rows.push(row); row = []
    } else if (c === "\r") {
      // skip
    } else {
      field += c
    }
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows
}

// Parse date string; for ranges like "2024/02/06 → 2024/02/07" take the end date
function parseDate(raw) {
  if (!raw || !raw.trim()) return null
  const str = raw.trim()
  // range: "YYYY/MM/DD → YYYY/MM/DD"
  const rangeMatch = str.match(/→\s*(\d{4}\/\d{2}\/\d{2})/)
  const dateStr = rangeMatch ? rangeMatch[1] : str.match(/\d{4}\/\d{2}\/\d{2}/)?.[0]
  if (!dateStr) return null
  const [y, m, d] = dateStr.split("/")
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)))
  return isNaN(date.getTime()) ? null : date
}

// Strip Notion URL from project name like "祥泰第二期(2/6 - 3/4) (https://...)"
function parseProjectName(raw) {
  return raw.replace(/\s*\(https?:\/\/[^)]+\)\s*$/, "").trim()
}

async function main() {
  const { Pool } = await import("pg")
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  // Load all projects and members into memory for lookups
  const [allProjects, allMembers] = await Promise.all([
    prisma.project.findMany({ select: { id: true, title: true } }),
    prisma.member.findMany({ select: { id: true, name: true } }),
  ])

  const projectByTitle = new Map(allProjects.map((p) => [p.title, p.id]))
  const memberByName = new Map(allMembers.map((m) => [m.name, m.id]))

  const text = readFileSync(CSV_PATH, "utf-8").replace(/^﻿/, "") // strip BOM
  const [, ...dataRows] = parseCsv(text)

  let imported = 0
  let skipped = 0
  const unmappedProjects = new Set()
  const unmappedAssignees = new Set()

  for (const row of dataRows) {
    if (row.length < 4) continue
    const [name, , completedRaw, projectRaw, dueDateRaw, assigneeRaw] = row

    const title = name?.trim()
    if (!title) continue

    const projectName = parseProjectName(projectRaw ?? "")
    const projectId = projectByTitle.get(projectName)
    if (!projectId) {
      unmappedProjects.add(projectName)
      skipped++
      continue
    }

    const status = completedRaw?.trim() === "Yes" ? "done" : "todo"
    const dueDate = parseDate(dueDateRaw)

    // For multi-assignee (comma-separated), take the first
    const rawAssignee = (assigneeRaw ?? "").trim().split(",")[0].trim()
    const memberName = ASSIGNEE_MAP[rawAssignee]
    const assigneeId = memberName ? memberByName.get(memberName) ?? null : null
    if (rawAssignee && !memberName) unmappedAssignees.add(rawAssignee)

    await prisma.task.create({
      data: { title, status, dueDate, assigneeId, projectId },
    })
    imported++
  }

  console.log(`✅ Imported ${imported} tasks, skipped ${skipped}`)
  if (unmappedProjects.size > 0) {
    console.log("⚠️  Unmapped projects:", [...unmappedProjects].slice(0, 10))
  }
  if (unmappedAssignees.size > 0) {
    console.log("⚠️  Unmapped assignees:", [...unmappedAssignees])
  }

  await prisma.$disconnect()
  await pool.end()
}

main().catch((err) => { console.error(err); process.exit(1) })
