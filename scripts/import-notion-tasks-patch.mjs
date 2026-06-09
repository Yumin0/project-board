// Patch: import the 11 tasks skipped by import-notion-tasks.mjs
// Usage: node scripts/import-notion-tasks-patch.mjs

import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

// Rows skipped due to unmapped project names (title, status, dueDate, assigneeName)
const PATCH_ROWS = [
  // 弘康第四期+五期 shared tasks - dates fall in 弘康第五期(9/2 - 10/2)
  { title: "確認收到款項：$10,000", status: "done", dueDate: "2024-09-02", assignee: "Yumin", project: "弘康第五期(9/2 - 10/2)" },
  { title: "撥款給業務：3000",      status: "done", dueDate: "2024-09-06", assignee: "Yumin", project: "弘康第五期(9/2 - 10/2)" },
  { title: "釐清製作需求",          status: "done", dueDate: "2024-09-07", assignee: "Yumin", project: "弘康第五期(9/2 - 10/2)" },
  { title: "廠商校稿",              status: "done", dueDate: "2024-09-27", assignee: "Yumin", project: "弘康第五期(9/2 - 10/2)" },
  { title: "撥款給輝：6000",        status: "done", dueDate: "2024-10-02", assignee: "Yumin", project: "弘康第五期(9/2 - 10/2)" },
  // 劉記第八期 (CSV name) -> 劉記茶葉第八期 (11/16 - 12/16) in DB
  { title: "收到款項",     status: "done", dueDate: "2025-11-16", assignee: "Yumin", project: "劉記茶葉第八期 (11/16 - 12/16)" },
  { title: "確認製作項目", status: "done", dueDate: "2025-11-15", assignee: "Riku",  project: "劉記茶葉第八期 (11/16 - 12/16)" },
  { title: "開始製作",     status: "done", dueDate: null,          assignee: null,    project: "劉記茶葉第八期 (11/16 - 12/16)" },
  { title: "廠商校稿",     status: "done", dueDate: null,          assignee: null,    project: "劉記茶葉第八期 (11/16 - 12/16)" },
  { title: "Yumin確認",   status: "done", dueDate: null,          assignee: null,    project: "劉記茶葉第八期 (11/16 - 12/16)" },
  // 崟岱第一期 - project not in DB, skip
]

async function main() {
  const { Pool } = await import("pg")
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  const [allProjects, allMembers] = await Promise.all([
    prisma.project.findMany({ select: { id: true, title: true } }),
    prisma.member.findMany({ select: { id: true, name: true } }),
  ])

  const projectByTitle = new Map(allProjects.map((p) => [p.title, p.id]))
  const memberByName = new Map(allMembers.map((m) => [m.name, m.id]))

  let imported = 0
  for (const row of PATCH_ROWS) {
    const projectId = projectByTitle.get(row.project)
    if (!projectId) { console.warn(`Project not found: ${row.project}`); continue }
    const assigneeId = row.assignee ? (memberByName.get(row.assignee) ?? null) : null

    await prisma.task.create({
      data: {
        title: row.title,
        status: row.status,
        dueDate: row.dueDate ? new Date(row.dueDate) : null,
        assigneeId,
        projectId,
      },
    })
    imported++
  }

  console.log(`✅ Patch imported ${imported} tasks`)
  await prisma.$disconnect()
  await pool.end()
}

main().catch((err) => { console.error(err); process.exit(1) })
