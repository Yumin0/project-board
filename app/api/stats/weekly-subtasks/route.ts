import { NextResponse } from "next/server"
import { getWeeklySubtaskStats } from "@/lib/weekly-subtasks"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const week = searchParams.get("week") ?? "current"

  if (week !== "current" && !DATE_RE.test(week)) {
    return NextResponse.json({ error: "Invalid week parameter" }, { status: 400 })
  }

  try {
    const stats = await getWeeklySubtaskStats(week)
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching weekly subtask stats:", error)
    return NextResponse.json({ error: "Failed to fetch weekly subtask stats" }, { status: 500 })
  }
}
