import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { MemberList } from "./member-list"
import { NewMemberDialog } from "./member-dialogs"

export const dynamic = "force-dynamic"

export default async function MembersPage() {
  const members = await prisma.member.findMany({
    include: { _count: { select: { projects: true } } },
  })
  // ids are sequential integers stored as text, so a plain string sort would
  // order "10" before "2" — sort numerically instead
  members.sort((a, b) => Number(a.id) - Number(b.id))

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 sm:p-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/projects"
            className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            返回專案
          </Link>
          <h1 className="font-heading text-2xl font-semibold">成員</h1>
          <p className="text-sm text-muted-foreground">
            管理可以被指派為專案負責人的成員
          </p>
        </div>
        <NewMemberDialog />
      </div>

      <MemberList members={members} />
    </div>
  )
}
