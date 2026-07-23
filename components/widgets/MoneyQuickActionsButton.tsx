import { prisma } from "@/lib/prisma"
import { MoneyQuickActionsMenu } from "./money-quick-actions"

export default async function MoneyQuickActionsButton() {
  const [projects, accounts, categories] = await Promise.all([
    // "新增收款" is a to-collect list: 副業-category projects that have been
    // created but not yet paid. So it lists projects with NO income record yet
    // (each period is normally collected once; the rare split-payment case goes
    // through /accounts). Also excludes completed periods. Filter on the
    // category the user actually picks, not dashboardCategory (which just
    // defaults to "side" for every project and isn't a real type signal).
    prisma.project.findMany({
      where: {
        category: { name: "副業" },
        status: { not: "completed" },
        incomeRecords: { none: {} },
      },
      select: { id: true, title: true },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.account.findMany({
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    }),
    prisma.category.findMany({
      include: { fields: { orderBy: { order: "asc" } } },
      orderBy: { name: "asc" },
    }),
  ])

  const defaultAccountId = accounts.find((account) => account.name === "專案總收入")?.id

  return (
    <MoneyQuickActionsMenu
      projects={projects}
      accounts={accounts}
      categories={categories}
      defaultAccountId={defaultAccountId}
    />
  )
}
