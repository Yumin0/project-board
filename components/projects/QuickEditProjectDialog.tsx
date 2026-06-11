"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { updateProject } from "@/app/projects/actions"
import { ProjectForm } from "@/app/projects/project-form"

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

type ProjectData = {
  id: string
  title: string
  description: string | null
  categoryId: string | null
  customFieldValues: Record<string, string> | null
  status: string
  assignees: { id: string; name: string }[]
}

type EditData = {
  project: ProjectData
  members: Member[]
  categories: Category[]
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
    if (!projectId) {
      setData(null)
      return
    }

    let cancelled = false
    fetch(`/api/projects/${projectId}/edit-data`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: EditData | null) => {
        if (!cancelled) setData(json)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })

    return () => {
      cancelled = true
    }
  }, [projectId])

  function handleSuccess() {
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={projectId !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>編輯專案</DialogTitle>
        </DialogHeader>
        {data ? (
          <ProjectForm
            key={data.project.id}
            project={{ ...data.project, assigneeIds: data.project.assignees.map((a) => a.id) }}
            members={data.members}
            categories={data.categories}
            action={updateProject.bind(null, data.project.id)}
            onSuccess={handleSuccess}
          />
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">載入中…</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
