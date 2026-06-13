import type { DashboardCategory } from "@/lib/dashboard-categories"

// Dispatched on `window` after a subtask's completion status changes, so the
// homepage weekly stats card can refetch without a full page reload.
export const SUBTASKS_UPDATED_EVENT = "subtasks:updated"

export type WeeklySubtaskStats = {
  weekStart: string
  weekEnd: string
  counts: Record<DashboardCategory, number>
  total: number
}
