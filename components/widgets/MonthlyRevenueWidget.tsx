import { TrendingUp } from "lucide-react"
import { prisma } from "@/lib/prisma"
import MonthlyRevenueChart from "./MonthlyRevenueChart"

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(150deg, rgba(255,255,255,0.62), rgba(255,255,255,0.40))",
  backdropFilter: "blur(22px) saturate(140%)",
  WebkitBackdropFilter: "blur(22px) saturate(140%)",
  border: "1px solid rgba(255,255,255,0.7)",
  borderRadius: "22px",
  boxShadow: "0 10px 34px rgba(70,78,120,0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
  padding: "18px 16px 12px",
}

const pillStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #8aa6e8, #ab92d8)",
  boxShadow: "0 4px 12px rgba(138,146,216,0.4)",
}

export default async function MonthlyRevenueWidget() {
  const records = await prisma.incomeRecord.findMany({
    select: { amount: true, date: true },
    orderBy: { date: "asc" },
  })

  const byMonth: Record<string, number> = {}
  for (const r of records) {
    const key = `${r.date.getFullYear()}/${String(r.date.getMonth() + 1).padStart(2, "0")}`
    byMonth[key] = (byMonth[key] ?? 0) + r.amount
  }

  let running = 0
  const data = Object.entries(byMonth).map(([month, amount]) => {
    running += amount
    return { month, amount: running }
  })

  const total = data.length > 0 ? data[data.length - 1].amount : 0
  const delta = data.length > 0 ? data[data.length - 1].amount - (data[data.length - 2]?.amount ?? 0) : 0

  return (
    <div style={cardStyle}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12.5px] font-medium" style={{ color: "rgba(70,78,120,0.66)" }}>
            累計收入
          </p>
          <p className="text-[31px] leading-tight font-semibold tracking-[-0.02em]" style={{ color: "#2c3150" }}>
            {total.toLocaleString()}
          </p>
        </div>
        {delta > 0 && (
          <div
            className="flex shrink-0 items-center gap-1 rounded-full px-[11px] py-[5px] text-[12.5px] font-semibold text-white"
            style={pillStyle}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+{delta.toLocaleString()}</span>
          </div>
        )}
      </div>
      <MonthlyRevenueChart data={data} />
    </div>
  )
}
