"use client"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { DASHBOARD_CATEGORIES, DASHBOARD_CATEGORY_LABELS, DASHBOARD_CATEGORY_STYLES } from "@/lib/dashboard-categories"

export type WeeklySubtaskHistoryPoint = {
  weekLabel: string
  main: number
  side: number
  life: number
  learn: number
  total: number
}

export default function WeeklySubtaskHistoryChart({ data }: { data: WeeklySubtaskHistoryPoint[] }) {
  if (data.length === 0 || data.every((d) => d.total === 0)) {
    return <p className="text-sm text-muted-foreground">這段期間還沒有完成的子任務</p>
  }

  const maxValue = Math.max(...data.flatMap((d) => DASHBOARD_CATEGORIES.map((cat) => d[cat])))

  return (
    <div className="h-[220px] sm:h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid horizontal vertical={false} stroke="rgba(120,128,170,.12)" strokeWidth={1} />
          <YAxis hide domain={[0, maxValue]} />
          <XAxis
            dataKey="weekLabel"
            tick={{ fontSize: 10.5, fill: "rgba(70,78,120,.5)", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip cursor={{ stroke: "rgba(120,128,170,.2)" }} />
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 12, color: "rgba(70,78,120,.6)" }}
          />
          {DASHBOARD_CATEGORIES.map((cat) => (
            <Line
              key={cat}
              type="monotone"
              dataKey={cat}
              name={DASHBOARD_CATEGORY_LABELS[cat]}
              stroke={DASHBOARD_CATEGORY_STYLES[cat].dot}
              strokeWidth={2.4}
              strokeLinecap="round"
              dot={{ r: 3, fill: DASHBOARD_CATEGORY_STYLES[cat].dot, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
