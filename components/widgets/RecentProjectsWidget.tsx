import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function RecentProjectsWidget() {
  const projects = await prisma.project.findMany({
    where: { status: "in_progress" },
    include: {
      assignees: { select: { id: true, name: true } },
      tasks: { select: { status: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>近期進行中的專案</CardTitle>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">目前沒有進行中的專案</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {projects.map((project) => {
              const total = project.tasks.length
              const done = project.tasks.filter((t) => t.status === "done").length
              return (
                <li key={project.id} className="flex items-center justify-between gap-4">
                  <Link
                    href="/projects"
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {project.title}
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    {total > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {done}/{total} 任務
                      </span>
                    )}
                    {project.assignees.map((a) => (
                      <Badge key={a.id} variant="secondary" className="text-xs">
                        {a.name}
                      </Badge>
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
