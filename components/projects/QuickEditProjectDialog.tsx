"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs"
import { updateProject } from "@/app/projects/actions"
import { ProjectForm } from "@/app/projects/project-form"
import { ProjectSubtasksPanel } from "@/components/projects/ProjectSubtasksPanel"
import { addRecentProject } from "@/lib/recent-projects"
import { cn } from "@/lib/utils"

const FONT_FAMILY = '"Noto Sans TC", var(--font-sans), system-ui, sans-serif'
const INK = "#2c3150"
const SUBTLE = "rgba(70,78,120,.62)"

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

type Member = {
  id: string
  name: string
}

type Task = {
  id: string
  title: string
  status: string
  dueDate: string | null
  assigneeId: string | null
  assignee: { id: string; name: string } | null
}

type ProjectData = {
  id: string
  title: string
  description: string | null
  categoryId: string | null
  customFieldValues: Record<string, string> | null
  status: string
  assignees: { id: string; name: string }[]
  tasks: Task[]
}

type EditData = {
  project: ProjectData
  members: Member[]
  categories: Category[]
}

const editDataCache: Record<string, EditData> = {}

export async function prefetchProjectEditData(projectId: string): Promise<void> {
  if (editDataCache[projectId]) return
  try {
    const res = await fetch(`/api/projects/${projectId}/edit-data`)
    if (res.ok) editDataCache[projectId] = await res.json()
  } catch {
    // best-effort，失敗不影響正常流程
  }
}

export function QuickEditProjectDialog({
  projectId,
  onOpenChange,
}: {
  projectId: string | null
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [data, setData] = useState<EditData | null>(null)

  useEffect(() => {
    if (!projectId) return

    if (editDataCache[projectId]) {
      setData(editDataCache[projectId])
      addRecentProject({
        id: editDataCache[projectId].project.id,
        title: editDataCache[projectId].project.title,
        status: editDataCache[projectId].project.status,
      })
      return
    }

    setData(null)
    let cancelled = false
    fetch(`/api/projects/${projectId}/edit-data`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: EditData | null) => {
        if (cancelled) return
        if (json) {
          editDataCache[projectId] = json
          addRecentProject({
            id: json.project.id,
            title: json.project.title,
            status: json.project.status,
          })
        }
        setData(json)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })

    return () => {
      cancelled = true
    }
  }, [projectId])

  function handleSuccess() {
    if (projectId) delete editDataCache[projectId]
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={projectId !== null} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-[24px] outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[640px] sm:w-[620px] sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[26px]"
          )}
          style={{
            background: "linear-gradient(155deg, rgba(255,255,255,.82), rgba(255,255,255,.70))",
            backdropFilter: "blur(30px) saturate(150%)",
            WebkitBackdropFilter: "blur(30px) saturate(150%)",
            border: "1px solid rgba(255,255,255,.75)",
            boxShadow: "0 26px 70px rgba(44,49,80,.30), inset 0 1px 0 rgba(255,255,255,.7)",
            fontFamily: FONT_FAMILY,
          }}
        >
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&display=swap"
            precedence="default"
          />

          <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-[rgba(120,128,170,.25)] sm:hidden" />

          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-3 right-3 rounded-full text-[rgba(70,78,120,.5)] hover:bg-[rgba(120,128,170,.12)] hover:text-[rgba(70,78,120,.8)] sm:top-4 sm:right-4"
              />
            }
          >
            <XIcon className="size-4" />
            <span className="sr-only">關閉</span>
          </DialogPrimitive.Close>

          <div className="shrink-0 px-4 pt-4 pr-12 sm:pt-5">
            <DialogPrimitive.Title className="text-[17px] leading-tight font-bold" style={{ color: INK }}>
              編輯專案
            </DialogPrimitive.Title>
            {data && (
              <p className="mt-0.5 truncate text-[13px]" style={{ color: SUBTLE }}>
                {data.project.title}
              </p>
            )}
          </div>

          {!data ? (
            <p className="flex flex-1 items-center justify-center py-12 text-sm" style={{ color: SUBTLE }}>
              載入中…
            </p>
          ) : (
            <Tabs key={data.project.id} defaultValue="subtasks" className="flex min-h-0 flex-1 flex-col gap-0">
              <div className="shrink-0 px-4 pt-3">
                <TabsList>
                  <TabsTab value="subtasks">子任務</TabsTab>
                  <TabsTab value="info">資料</TabsTab>
                </TabsList>
              </div>
              <TabsPanel value="subtasks" className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
                <ProjectSubtasksPanel projectId={data.project.id} tasks={data.project.tasks} />
              </TabsPanel>
              <TabsPanel value="info" className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
                <ProjectForm
                  project={{ ...data.project, assigneeIds: data.project.assignees.map((a) => a.id) }}
                  members={data.members}
                  categories={data.categories}
                  action={updateProject.bind(null, data.project.id)}
                  onSuccess={handleSuccess}
                  footerClassName="shrink-0 rounded-b-none sm:rounded-b-[26px]"
                />
              </TabsPanel>
            </Tabs>
          )}
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  )
}
