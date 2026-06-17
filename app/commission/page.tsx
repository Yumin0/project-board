import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { CommissionBoard } from "./commission-board"

export const dynamic = "force-dynamic"

export default async function CommissionPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month: rawMonth } = await searchParams

  // Default to current month
  const now = new Date()
  const month =
    rawMonth && /^\d{4}-\d{2}$/.test(rawMonth)
      ? rawMonth
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const [records, sideProjects, members, accounts] = await Promise.all([
    prisma.commissionRecord.findMany({
      where: { month },
      include: {
        project: {
          include: {
            assignees: { select: { id: true, name: true } },
            category: { include: { fields: { orderBy: { order: "asc" } } } },
          },
        },
        productionMember: {
          include: { account: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    // 副業 projects without a commission record yet
    prisma.project.findMany({
      where: { dashboardCategory: "side", commissionRecord: null },
      include: {
        assignees: { select: { id: true, name: true } },
        category: { include: { fields: { orderBy: { order: "asc" } } } },
      },
      orderBy: { id: "desc" },
    }),
    prisma.member.findMany({
      include: { account: { select: { id: true, name: true } } },
      orderBy: { id: "asc" },
    }),
    prisma.account.findMany({ orderBy: { id: "asc" }, select: { id: true, name: true } }),
  ])

  // Find 業務 member (name === "業務") for display purposes
  const salesMember = members.find((m) => m.name === "業務") ?? null

  const typedRecords = records.map((r) => ({
    ...r,
    project: {
      ...r.project,
      customFieldValues: r.project.customFieldValues as Record<string, string> | null,
    },
  }))

  const typedSideProjects = sideProjects.map((p) => ({
    ...p,
    customFieldValues: p.customFieldValues as Record<string, string> | null,
  }))

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 sm:p-10">
      <div>
        <Link
          href="/projects"
          className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          返回專案
        </Link>
        <h1 className="font-heading text-2xl font-semibold">分潤結算</h1>
        <p className="text-sm text-muted-foreground">
          管理每月經貿網專案的業務佣金與製作費分配
        </p>
      </div>

      <CommissionBoard
        month={month}
        records={typedRecords}
        availableProjects={typedSideProjects}
        members={members}
        accounts={accounts}
        salesMember={salesMember}
      />
    </div>
  )
}
