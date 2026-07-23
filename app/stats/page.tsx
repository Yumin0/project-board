import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { getWeeklySubtaskHistory } from "@/lib/weekly-subtasks"
import {
  DASHBOARD_CATEGORIES,
  DASHBOARD_CATEGORY_LABELS,
  DASHBOARD_CATEGORY_STYLES,
} from "@/lib/dashboard-categories"
import WeeklySubtaskHistoryChart from "@/components/stats/WeeklySubtaskHistoryChart"
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"

export const dynamic = "force-dynamic"

const HISTORY_WEEKS = 8

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(150deg, rgba(255,255,255,0.62), rgba(255,255,255,0.40))",
  backdropFilter: "blur(22px) saturate(140%)",
  WebkitBackdropFilter: "blur(22px) saturate(140%)",
  border: "1px solid rgba(255,255,255,0.7)",
  borderRadius: "22px",
  boxShadow: "0 10px 34px rgba(70,78,120,0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
  padding: "20px 18px",
}

function formatWeekLabel(weekStart: string): string {
  const [, month, day] = weekStart.split("-")
  return `${Number(month)}/${Number(day)}`
}

export default async function StatsPage() {
  const history = await getWeeklySubtaskHistory(HISTORY_WEEKS)

  const chartData = history.map((week) => ({
    weekLabel: formatWeekLabel(week.weekStart),
    ...week.counts,
    total: week.total,
  }))

  const grandTotals = DASHBOARD_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = history.reduce((sum, week) => sum + week.counts[cat], 0)
      return acc
    },
    { main: 0, side: 0, life: 0, learn: 0 } as Record<(typeof DASHBOARD_CATEGORIES)[number], number>
  )
  const grandTotal = DASHBOARD_CATEGORIES.reduce((sum, cat) => sum + grandTotals[cat], 0)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 sm:p-10">
      <div>
        <Link
          href="/"
          className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          返回首頁
        </Link>
        <h1 className="font-heading text-2xl font-semibold">任務完成趨勢</h1>
        <p className="text-sm text-muted-foreground">近 {HISTORY_WEEKS} 週 · 各類別</p>
      </div>

      <div style={cardStyle}>
        <WeeklySubtaskHistoryChart data={chartData} />

        <div className="mt-6 border-t border-white/50 pt-2">
          <Table surface={false}>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>週別</TableHead>
                {DASHBOARD_CATEGORIES.map((cat) => (
                  <TableHead key={cat} className="text-right">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="size-[7px] shrink-0 rounded-full"
                        style={{ background: DASHBOARD_CATEGORY_STYLES[cat].dot }}
                      />
                      {DASHBOARD_CATEGORY_LABELS[cat]}
                    </span>
                  </TableHead>
                ))}
                <TableHead className="text-right">總計</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((week) => (
                <TableRow key={week.weekStart} className="hover:bg-white/40">
                  <TableCell className="text-muted-foreground">
                    {formatWeekLabel(week.weekStart)} - {formatWeekLabel(week.weekEnd)}
                  </TableCell>
                  {DASHBOARD_CATEGORIES.map((cat) => (
                    <TableCell key={cat} className="text-right tabular-nums">
                      {week.counts[cat]}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-semibold tabular-nums">{week.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="bg-transparent">
              <TableRow className="hover:bg-transparent">
                <TableCell className="font-semibold">總計</TableCell>
                {DASHBOARD_CATEGORIES.map((cat) => (
                  <TableCell key={cat} className="text-right font-semibold tabular-nums">
                    {grandTotals[cat]}
                  </TableCell>
                ))}
                <TableCell className="text-right font-semibold tabular-nums">{grandTotal}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </div>
  )
}
