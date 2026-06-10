"use client"

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

type DataPoint = { month: string; amount: number }

export default function MonthlyRevenueChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">目前沒有收入紀錄</p>
  }

  const maxAmount = Math.max(...data.map((d) => d.amount))
  const gridTicks = [maxAmount * 0.25, maxAmount * 0.5, maxAmount * 0.75]

  return (
    <div className="h-[160px] sm:h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8aa6e8" />
              <stop offset="100%" stopColor="#ab92d8" />
            </linearGradient>
            <linearGradient id="revenueAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8aa6e8" stopOpacity={0.26} />
              <stop offset="100%" stopColor="#ab92d8" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            horizontal
            vertical={false}
            stroke="rgba(120,128,170,.12)"
            strokeWidth={1}
          />
          <YAxis hide domain={[0, maxAmount]} ticks={gridTicks} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10.5, fill: "rgba(70,78,120,.5)", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "累計收入"]} />
          <Area
            type="natural"
            dataKey="amount"
            stroke="url(#revenueLineGradient)"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#revenueAreaGradient)"
            dot={(props) => {
              const { cx, cy, index } = props
              if (index !== data.length - 1) return <g key={`dot-${index}`} />
              return (
                <circle
                  key={`dot-${index}`}
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill="#fff"
                  stroke="#ab92d8"
                  strokeWidth={2.6}
                />
              )
            }}
            activeDot={{ r: 5, fill: "#fff", stroke: "#ab92d8", strokeWidth: 2.6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
