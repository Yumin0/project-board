import { NextResponse } from "next/server"
import { getMonthLogs, toggleWorkLog } from "@/lib/work-log"
import { isDashboardCategory } from "@/lib/dashboard-categories"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const month = searchParams.get("month") // "YYYY-MM"

  const match = month?.match(/^(\d{4})-(\d{2})$/)
  if (!match) {
    return NextResponse.json({ error: "month must be in YYYY-MM format" }, { status: 400 })
  }

  const year = Number(match[1])
  const monthNum = Number(match[2])

  try {
    const logs = await getMonthLogs(year, monthNum)
    return NextResponse.json(logs)
  } catch (error) {
    console.error("Error fetching work logs:", error)
    return NextResponse.json({ error: "Failed to fetch work logs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body: { date?: string; category?: string } = await request.json()
    const { date, category } = body

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "date must be in YYYY-MM-DD format" }, { status: 400 })
    }
    if (!category || !isDashboardCategory(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    const categories = await toggleWorkLog(date, category)
    return NextResponse.json({ date, categories })
  } catch (error) {
    console.error("Error toggling work log:", error)
    return NextResponse.json({ error: "Failed to toggle work log" }, { status: 500 })
  }
}
