import { getDashboardGrid } from "@/lib/dashboard-pins"
import RecentProjectsGrid from "@/components/widgets/RecentProjectsGrid"

export default async function RecentProjectsWidget() {
  const grid = await getDashboardGrid()

  return <RecentProjectsGrid initialGrid={grid} />
}
