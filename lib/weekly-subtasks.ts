import { prisma } from "@/lib/prisma"
import { DASHBOARD_CATEGORIES, isDashboardCategory } from "@/lib/dashboard-categories"
import type { WeeklySubtaskStats } from "@/lib/weekly-subtasks-shared"

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Returns the Monday 00:00 (inclusive) and following Monday 00:00 (exclusive)
// of the ISO week containing `date`, in local time.
function getWeekRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = start.getDay() // 0 = Sunday .. 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diffToMonday)

  const end = new Date(start)
  end.setDate(end.getDate() + 7)

  return { start, end }
}

// Returns counts of subtasks completed (status = "done", grouped by their
// project's dashboard category) within the Monday-Sunday week containing
// `week` ("current" or a "YYYY-MM-DD" date).
export async function getWeeklySubtaskStats(week: string = "current"): Promise<WeeklySubtaskStats> {
  const refDate = week === "current" ? new Date() : new Date(`${week}T00:00:00`)
  const { start, end } = getWeekRange(refDate)

  const tasks = await prisma.task.findMany({
    where: {
      status: "done",
      completedAt: { gte: start, lt: end },
    },
    select: { project: { select: { dashboardCategory: true } } },
  })

  const counts: Record<DashboardCategory, number> = { main: 0, side: 0, life: 0, learn: 0 }
  for (const task of tasks) {
    const cat = task.project.dashboardCategory
    if (isDashboardCategory(cat)) counts[cat]++
  }

  const total = DASHBOARD_CATEGORIES.reduce((sum, cat) => sum + counts[cat], 0)

  const weekEnd = new Date(end)
  weekEnd.setDate(weekEnd.getDate() - 1)

  return { weekStart: dateKey(start), weekEnd: dateKey(weekEnd), counts, total }
}
