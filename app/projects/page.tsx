import Link from "next/link"

import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { NewProjectDialog } from "./project-dialogs"
import { ProjectList } from "./project-list"

export const dynamic = "force-dynamic"

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const [projects, members, categories] = await Promise.all([
    prisma.project.findMany({
      include: {
        assignees: { select: { id: true, name: true } },
        category: { include: { fields: { orderBy: { order: "asc" } } } },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
            assigneeId: true,
            assignee: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    prisma.member.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({
      include: { fields: { orderBy: { order: "asc" } } },
      orderBy: { name: "asc" },
    }),
  ])

  const projectsWithTypedFields = projects
    .map((project) => ({
      ...project,
      customFieldValues: project.customFieldValues as Record<string, string> | null,
    }))
    // ids are sequential integers stored as text, so a plain string sort would
    // order "10" before "2" — sort numerically instead
    .sort((a, b) => Number(a.id) - Number(b.id))

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 sm:p-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">專案</h1>
          <p className="text-sm text-muted-foreground">
            管理你的專案項目，將 Notion 內容逐步搬移過來
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/categories" />}
          >
            管理類別
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/members" />}
          >
            管理成員
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/accounts" />}
          >
            收入帳戶
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/commission" />}
          >
            分潤結算
          </Button>
          <NewProjectDialog members={members} categories={categories} />
        </div>
      </div>

      <ProjectList
        projects={projectsWithTypedFields}
        members={members}
        categories={categories}
        initialSearch={q}
      />
    </div>
  )
}
