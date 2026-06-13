const STORAGE_KEY = "pb:recent-projects"
const MAX_ITEMS = 5

export type RecentProject = {
  id: string
  title: string
  status: string
}

export function getRecentProjects(): RecentProject[] {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function addRecentProject(project: RecentProject) {
  if (typeof window === "undefined") return

  const next = [project, ...getRecentProjects().filter((p) => p.id !== project.id)].slice(
    0,
    MAX_ITEMS
  )
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}
