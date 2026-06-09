"use client"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

type DataPoint = { month: string; amount: number }

export default function MonthlyRevenueChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">目前沒有收入紀錄</p>
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} width={48} />
        <Tooltip
          formatter={(value) => [`$${Number(value).toLocaleString()}`, "收入"]}
        />
        <Line
          type="monotone"
          dataKey="amount"
          strokeWidth={2}
          dot={false}
          className="stroke-primary"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
