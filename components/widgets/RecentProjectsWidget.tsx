import { getDashboardGrid, getPinnableProjects } from "@/lib/dashboard-pins"
import RecentProjectsGrid from "@/components/widgets/RecentProjectsGrid"

export default async function RecentProjectsWidget() {
  const grid = await getDashboardGrid()

  const emptyCats = grid.filter((g) => g.project === null).map((g) => g.cat)
  const candidateLists = await Promise.all(emptyCats.map((cat) => getPinnableProjects(cat)))
  const initialCandidates = Object.fromEntries(emptyCats.map((cat, i) => [cat, candidateLists[i]]))

  return <RecentProjectsGrid initialGrid={grid} initialCandidates={initialCandidates} />
}
