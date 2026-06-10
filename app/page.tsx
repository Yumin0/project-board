import Link from "next/link"
import { Settings } from "lucide-react"
import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { WIDGET_REGISTRY } from "@/app/api/dashboard/route"
import { Button } from "@/components/ui/button"
import RecentProjectsWidget from "@/components/widgets/RecentProjectsWidget"
import MonthlyRevenueWidget from "@/components/widgets/MonthlyRevenueWidget"

export const dynamic = "force-dynamic"

const WIDGET_COMPONENTS: Record<string, React.ComponentType> = {
  recent_projects: RecentProjectsWidget,
  monthly_revenue: MonthlyRevenueWidget,
}

export default async function HomePage() {
  let widgets = await prisma.dashboardWidget.findMany({
    orderBy: { position: "asc" },
  })

  if (widgets.length === 0) {
    const data = WIDGET_REGISTRY.map((w, i) => ({
      widgetType: w.widgetType,
      position: i,
      enabled: true,
    }))
    await prisma.dashboardWidget.createMany({ data, skipDuplicates: true })
    widgets = await prisma.dashboardWidget.findMany({ orderBy: { position: "asc" } })
  }

  const enabled = widgets.filter((w) => w.enabled)

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "linear-gradient(155deg, #e5e7ea 0%, #ebedf0 48%, #f1f2f4 100%)" }}
    >
      <div
        className="pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(148,156,174,.16), transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="pointer-events-none absolute -right-24 -bottom-24 h-[340px] w-[340px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(158,162,178,.13), transparent 70%)",
          filter: "blur(44px)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold">首頁</h1>
            <p className="text-sm text-muted-foreground">你的專案總覽</p>
          </div>
          <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/settings/dashboard" />}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-6">
          {enabled.map((w) => {
            const Component = WIDGET_COMPONENTS[w.widgetType]
            if (!Component) return null
            return (
              <Suspense key={w.widgetType} fallback={<div className="h-32 animate-pulse rounded-xl bg-muted" />}>
                <Component />
              </Suspense>
            )
          })}
        </div>
      </div>
    </div>
  )
}
