import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const WIDGET_REGISTRY = [
  { widgetType: "recent_projects", label: "近期進行中的專案" },
  { widgetType: "monthly_revenue", label: "收入月累計曲線圖" },
  { widgetType: "monthly_calendar", label: "本月行事曆" },
] as const

export type WidgetType = (typeof WIDGET_REGISTRY)[number]["widgetType"]

export async function GET() {
  try {
    let widgets = await prisma.dashboardWidget.findMany({
      orderBy: { position: "asc" },
    })

    const existingTypes = new Set(widgets.map((w) => w.widgetType))
    const missing = WIDGET_REGISTRY.filter((w) => !existingTypes.has(w.widgetType))
    if (missing.length > 0) {
      const nextPosition = widgets.reduce((max, w) => Math.max(max, w.position + 1), 0)
      const data = missing.map((w, i) => ({
        widgetType: w.widgetType,
        position: nextPosition + i,
        enabled: true,
      }))
      await prisma.dashboardWidget.createMany({ data, skipDuplicates: true })
      widgets = await prisma.dashboardWidget.findMany({ orderBy: { position: "asc" } })
    }

    return NextResponse.json(widgets)
  } catch (error) {
    console.error("Error fetching dashboard config:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard config" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body: { widgetType: string; position: number; enabled: boolean }[] = await request.json()
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Expected an array" }, { status: 400 })
    }
    await Promise.all(
      body.map((w) =>
        prisma.dashboardWidget.upsert({
          where: { widgetType: w.widgetType },
          update: { position: w.position, enabled: w.enabled },
          create: { widgetType: w.widgetType, position: w.position, enabled: w.enabled },
        })
      )
    )
    const updated = await prisma.dashboardWidget.findMany({ orderBy: { position: "asc" } })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error saving dashboard config:", error)
    return NextResponse.json({ error: "Failed to save dashboard config" }, { status: 500 })
  }
}
