"use client"

import { useState } from "react"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createProject, deleteProject, updateProject } from "./actions"
import { ProjectForm } from "./project-form"

type Project = {
  id: string
  title: string
  description: string | null
  categoryId: string | null
  customFieldValues: Record<string, string> | null
  status: string
  assigneeId: string | null
}

type Member = {
  id: string
  name: string
}

type Category = {
  id: string
  name: string
  fields: { id: string; name: string; type: string; options: string[] }[]
}

export function NewProjectDialog({
  members,
  categories,
}: {
  members: Member[]
  categories: Category[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        新增專案
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增專案</DialogTitle>
        </DialogHeader>
        <ProjectForm
          members={members}
          categories={categories}
          action={createProject}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

export function EditProjectDialog({
  project,
  members,
  categories,
}: {
  project: Project
  members: Member[]
  categories: Category[]
}) {
  const [open, setOpen] = useState(false)
  const boundUpdate = updateProject.bind(null, project.id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <PencilIcon />
        <span className="sr-only">編輯「{project.title}」</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>編輯專案</DialogTitle>
        </DialogHeader>
        <ProjectForm
          project={project}
          members={members}
          categories={categories}
          action={boundUpdate}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

export function DeleteProjectDialog({ project }: { project: Project }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="ghost" size="icon-sm" />}
      >
        <Trash2Icon />
        <span className="sr-only">刪除「{project.title}」</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>刪除「{project.title}」？</AlertDialogTitle>
          <AlertDialogDescription>
            此操作無法復原，專案內的所有任務也會一併刪除。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <form action={deleteProject.bind(null, project.id)}>
            <AlertDialogAction
              type="submit"
              variant="destructive"
              className="w-full"
            >
              刪除
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
