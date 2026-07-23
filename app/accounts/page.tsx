import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { AccountList } from "./account-list"
import { NewAccountDialog } from "./account-dialogs"

export const dynamic = "force-dynamic"

export default async function AccountsPage() {
  const [accounts, projects] = await Promise.all([
    prisma.account.findMany({
      include: {
        records: {
          include: { project: { select: { id: true, title: true } } },
          orderBy: { date: "desc" },
        },
        transfersOut: {
          include: {
            project: { select: { id: true, title: true } },
            toAccount: { select: { id: true, name: true } },
          },
          orderBy: { date: "desc" },
        },
        transfersIn: {
          include: {
            project: { select: { id: true, title: true } },
            fromAccount: { select: { id: true, name: true } },
          },
          orderBy: { date: "desc" },
        },
      },
      orderBy: { id: "asc" },
    }),
    prisma.project.findMany({
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
    }),
  ])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 sm:p-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/projects"
            className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            返回專案
          </Link>
          <h1 className="font-heading text-2xl font-semibold">收入帳戶</h1>
          <p className="text-sm text-muted-foreground">
            建立虛擬收入帳戶，手動記錄每一筆收入，掌握每個人賺了多少錢
          </p>
        </div>
        <NewAccountDialog />
      </div>

      <AccountList accounts={accounts} projects={projects} />
    </div>
  )
}
