import { prisma } from "@/lib/prisma"
import { WIDGET_REGISTRY } from "@/app/api/dashboard/route"
import DashboardSettingsClient from "./DashboardSettingsClient"

export const dynamic = "force-dynamic"

export default async function DashboardSettingsPage() {
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

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6 sm:p-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold">首頁佈局設定</h1>
        <p className="text-sm text-muted-foreground">自訂首頁顯示的區塊</p>
      </div>
      <DashboardSettingsClient initialWidgets={widgets} registry={WIDGET_REGISTRY} />
    </div>
  )
}
