import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import MonthlyRevenueChart from "./MonthlyRevenueChart"

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

  const data = Object.entries(byMonth).map(([month, amount]) => ({ month, amount }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>收入月累計曲線圖</CardTitle>
      </CardHeader>
      <CardContent>
        <MonthlyRevenueChart data={data} />
      </CardContent>
    </Card>
  )
}
