import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DeleteProjectDialog, EditProjectDialog } from "./project-dialogs"

type CategoryField = {
  id: string
  name: string
  type: string
  options: string[]
}

type Category = {
  id: string
  name: string
  fields: CategoryField[]
}

type Project = {
  id: string
  title: string
  description: string | null
  categoryId: string | null
  category: Category | null
  customFieldValues: Record<string, string> | null
  status: string
  updatedAt: Date
  assigneeId: string | null
  assignee: { id: string; name: string } | null
  tasks: { id: string; status: string }[]
}

type Member = {
  id: string
  name: string
}

type CategoryOption = {
  id: string
  name: string
  fields: { id: string; name: string; type: string; options: string[] }[]
}

const statusLabel: Record<string, string> = {
  not_started: "尚未開始",
  in_progress: "進行中",
  completed: "已結案",
}

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  not_started: "outline",
  in_progress: "default",
  completed: "secondary",
}

export function ProjectList({
  projects,
  members,
  categories,
}: {
  projects: Project[]
  members: Member[]
  categories: CategoryOption[]
}) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed py-16 text-center">
        <p className="text-sm font-medium">還沒有任何專案</p>
        <p className="text-sm text-muted-foreground">
          點擊「新增專案」開始把 Notion 裡的內容搬過來吧
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => {
        const filledCustomFields = (project.category?.fields ?? []).flatMap((field) => {
          const value = project.customFieldValues?.[field.id]
          return value ? [{ field, value }] : []
        })

        return (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
              {project.description && (
                <CardDescription className="line-clamp-3">
                  {project.description}
                </CardDescription>
              )}
              <CardAction className="flex gap-1">
                <EditProjectDialog
                  project={project}
                  members={members}
                  categories={categories}
                />
                <DeleteProjectDialog project={project} />
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-1.5">
              <Badge variant={statusVariant[project.status] ?? "default"}>
                {statusLabel[project.status] ?? project.status}
              </Badge>
              {project.category && (
                <Badge variant="outline">{project.category.name}</Badge>
              )}
              {filledCustomFields.map(({ field, value }) => (
                <Badge key={field.id} variant="secondary">
                  {field.name}：{value}
                </Badge>
              ))}
              {project.assignee && (
                <Badge variant="outline">負責人：{project.assignee.name}</Badge>
              )}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              {project.tasks.length} 項任務 · 更新於{" "}
              {new Intl.DateTimeFormat("zh-TW", {
                dateStyle: "medium",
              }).format(project.updatedAt)}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
