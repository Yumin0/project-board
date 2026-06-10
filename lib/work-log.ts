import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { isDashboardCategory, type DashboardCategory } from "@/lib/dashboard-categories"

export type MonthLogs = Record<string, DashboardCategory[]>

function dateKey(date: Date): string {
  const yyyy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(date.getUTCDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

// Returns a map of "YYYY-MM-DD" -> categories logged that day, for the given
// month (1-indexed).
export const getMonthLogs = cache(async function getMonthLogs(year: number, month: number): Promise<MonthLogs> {
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 1))

  const logs = await prisma.workLog.findMany({
    where: { date: { gte: start, lt: end } },
    select: { date: true, category: true },
  })

  const result: MonthLogs = {}
  for (const log of logs) {
    if (!isDashboardCategory(log.category)) continue
    const key = dateKey(log.date)
    ;(result[key] ??= []).push(log.category)
  }
  return result
})

// Toggles a category on/off for the given date. Returns the categories
// logged for that date after the change.
export async function toggleWorkLog(date: string, category: DashboardCategory): Promise<DashboardCategory[]> {
  const existing = await prisma.workLog.findUnique({
    where: { date_category: { date: new Date(`${date}T00:00:00.000Z`), category } },
  })

  if (existing) {
    await prisma.workLog.delete({ where: { id: existing.id } })
  } else {
    await prisma.workLog.create({
      data: { date: new Date(`${date}T00:00:00.000Z`), category },
    })
  }

  const logs = await prisma.workLog.findMany({
    where: { date: new Date(`${date}T00:00:00.000Z`) },
    select: { category: true },
  })
  return logs.map((l) => l.category).filter(isDashboardCategory)
}
