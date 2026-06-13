import { getWeeklySubtaskStats } from "@/lib/weekly-subtasks"
import WeeklySubtasksCard from "./WeeklySubtasksCard"

export default async function WeeklySubtasksWidget() {
  const stats = await getWeeklySubtaskStats()
  return <WeeklySubtasksCard initialStats={stats} />
}
