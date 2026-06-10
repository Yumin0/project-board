import { prisma } from "@/lib/prisma"
import { DASHBOARD_CATEGORIES, type DashboardCategory } from "@/lib/dashboard-categories"

export {
  DASHBOARD_CATEGORIES,
  DASHBOARD_CATEGORY_LABELS,
  DASHBOARD_CATEGORY_STYLES,
  isDashboardCategory,
} from "@/lib/dashboard-categories"
export type { DashboardCategory, DashboardCategoryStyle } from "@/lib/dashboard-categories"

export type PinnedDashboardProject = {
  id: string
  cat: DashboardCategory
  name: string
  progress: number
  nextTask: string | null
  due: string | null
}

type ProjectWithTasks = {
  id: string
  title: string
  tasks: { title: string; status: string; dueDate: Date | null }[]
}

function formatDue(date: Date | null): string | null {
  if (!date) return null
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${mm} / ${dd}`
}

function toPinnedProject(cat: DashboardCategory, project: ProjectWithTasks): PinnedDashboardProject {
  const total = project.tasks.length
  const done = project.tasks.filter((t) => t.status === "done").length
  const progress = total === 0 ? 0 : Math.round((done / total) * 100)

  const nextTask = project.tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime()
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return 0
    })[0]

  return {
    id: project.id,
    cat,
    name: project.title,
    progress,
    nextTask: nextTask?.title ?? null,
    due: formatDue(nextTask?.dueDate ?? null),
  }
}

const PINNED_PROJECT_INCLUDE = {
  tasks: { select: { title: true, status: true, dueDate: true } },
} as const

/**
 * Returns the four dashboard quadrants in fixed order (main, side, life,
 * learn). Each entry is the pinned project for that category, or null if
 * nothing is pinned yet.
 */
export async function getDashboardGrid(): Promise<
  { cat: DashboardCategory; project: PinnedDashboardProject | null }[]
> {
  const pins = await prisma.dashboardPin.findMany({
    include: { project: { include: PINNED_PROJECT_INCLUDE } },
  })

  const byCategory = new Map(pins.map((pin) => [pin.category, pin]))

  return DASHBOARD_CATEGORIES.map((cat) => {
    const pin = byCategory.get(cat)
    return {
      cat,
      project: pin ? toPinnedProject(cat, pin.project) : null,
    }
  })
}

/** Lists the projects in a category that can be pinned to the dashboard. */
export async function getPinnableProjects(category: DashboardCategory) {
  return prisma.project.findMany({
    where: { dashboardCategory: category, status: "in_progress" },
    select: { id: true, title: true },
    orderBy: { updatedAt: "desc" },
  })
}

export class ProjectNotFoundError extends Error {}
export class ProjectCategoryMismatchError extends Error {}

/** Pins a project to its category's dashboard slot, replacing any existing pin. */
export async function setPin(category: DashboardCategory, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { dashboardCategory: true },
  })

  if (!project) throw new ProjectNotFoundError()
  if (project.dashboardCategory !== category) throw new ProjectCategoryMismatchError()

  await prisma.dashboardPin.upsert({
    where: { category },
    update: { projectId },
    create: { category, projectId },
  })
}

/** Clears whatever project is pinned to the given category, if any. */
export async function clearPin(category: DashboardCategory) {
  await prisma.dashboardPin.deleteMany({ where: { category } })
}

/** Creates a new in-progress project in the given category and pins it. */
export async function createAndPinProject(category: DashboardCategory, title: string) {
  const project = await prisma.project.create({
    data: { title, dashboardCategory: category, status: "in_progress" },
    select: { id: true },
  })
  await setPin(category, project.id)
  return project
}
