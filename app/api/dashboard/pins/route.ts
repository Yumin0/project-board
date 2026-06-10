// app/api/dashboard/pins/route.ts
// API route for the dashboard's four pinned-project quadrants (main / side / life / learn)

import { NextResponse } from "next/server"
import { getDashboardGrid } from "@/lib/dashboard-pins"

export async function GET() {
  try {
    const grid = await getDashboardGrid()
    return NextResponse.json(grid)
  } catch (error) {
    console.error("Error fetching dashboard pins:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard pins" }, { status: 500 })
  }
}
