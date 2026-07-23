import Link from "next/link"
import { Settings } from "lucide-react"
import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { WIDGET_REGISTRY } from "@/app/api/dashboard/route"
import { Button } from "@/components/ui/button"
import RecentProjectsWidget from "@/components/widgets/RecentProjectsWidget"
import MonthlyRevenueWidget from "@/components/widgets/MonthlyRevenueWidget"
import MoneyQuickActionsButton from "@/components/widgets/MoneyQuickActionsButton"
import CalendarWidget from "@/components/widgets/CalendarWidget"
import WeeklySubtasksWidget from "@/components/widgets/WeeklySubtasksWidget"

export const dynamic = "force-dynamic"

const WIDGET_COMPONENTS: Record<string, React.ComponentType> = {
  recent_projects: RecentProjectsWidget,
  monthly_revenue: MonthlyRevenueWidget,
  monthly_calendar: CalendarWidget,
  weekly_subtasks: WeeklySubtasksWidget,
}

export default async function HomePage() {
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

  const enabled = widgets.filter((w) => w.enabled)
  const calendarWidget = enabled.find((w) => w.widgetType === "monthly_calendar")
  const weeklySubtasksWidget = enabled.find((w) => w.widgetType === "weekly_subtasks")
  const mainWidgets = enabled.filter(
    (w) => w.widgetType !== "monthly_calendar" && w.widgetType !== "weekly_subtasks"
  )

  function widgetTitle(w: (typeof enabled)[number]) {
    return w.title || WIDGET_REGISTRY.find((r) => r.widgetType === w.widgetType)?.defaultTitle || ""
  }

  function renderWidget(w: (typeof enabled)[number]) {
    const Component = WIDGET_COMPONENTS[w.widgetType]
    if (!Component) return null
    return (
      <div key={w.widgetType} className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold" style={{ color: "#2c3150" }}>
            {widgetTitle(w)}
          </h2>
          {w.widgetType === "recent_projects" && (
            <Link
              href="/projects"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              管理專案 →
            </Link>
          )}
          {w.widgetType === "monthly_revenue" && (
            <Suspense fallback={null}>
              <MoneyQuickActionsButton />
            </Suspense>
          )}
          {w.widgetType === "weekly_subtasks" && (
            <Link
              href="/stats"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              查看趨勢 →
            </Link>
          )}
        </div>
        <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-muted" />}>
          <Component />
        </Suspense>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute -right-24 -bottom-24 h-[340px] w-[340px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(158,162,178,.13), transparent 70%)",
          filter: "blur(44px)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 sm:p-10 lg:max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold">首頁</h1>
            <p className="text-sm text-muted-foreground">你的專案總覽</p>
          </div>
          <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/settings/dashboard" />}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_336px] lg:items-start">
          <div className="flex flex-col gap-6">
            {mainWidgets.slice(0, 2).map(renderWidget)}
            {calendarWidget && <div className="lg:hidden">{renderWidget(calendarWidget)}</div>}
            {weeklySubtasksWidget && <div className="lg:hidden">{renderWidget(weeklySubtasksWidget)}</div>}
            {mainWidgets.slice(2).map(renderWidget)}
          </div>
          <div className="hidden flex-col gap-5 lg:flex">
            {calendarWidget && renderWidget(calendarWidget)}
            {weeklySubtasksWidget && renderWidget(weeklySubtasksWidget)}
          </div>
        </div>
      </div>
    </div>
  )
}
