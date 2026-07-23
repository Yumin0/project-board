"use client"

import { useActionState, useEffect, useId, useMemo, useState } from "react"
import { PlusIcon, Trash2Icon } from "lucide-react"

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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  batchUpdateProjects,
  createProject,
  deleteProject,
  type BatchEditState,
} from "./actions"
import { ProjectForm } from "./project-form"

type Project = {
  id: string
  title: string
  description: string | null
  categoryId: string | null
  customFieldValues: Record<string, string> | null
  status: string
  assignees: { id: string; name: string }[]
}

type Member = {
  id: string
  name: string
}

type Category = {
  id: string
  name: string
  fields: {
    id: string
    name: string
    type: string
    options: string[]
    hiddenOptions: string[]
  }[]
}

const SELECT_FIELD_EMPTY = "__empty__"

const statusLabel: Record<string, string> = {
  not_started: "尚未開始",
  in_progress: "進行中",
  completed: "已結案",
}

const fieldInputType: Record<string, string> = {
  text: "text",
  number: "number",
  date: "date",
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

const batchEditInitialState: BatchEditState = { status: "idle" }

type SelectedProjectForBatch = {
  id: string
  categoryId: string | null
  status: string
  assigneeIds: string[]
  customFieldValues: Record<string, string>
}

function BatchEditForm({
  selectedProjects,
  members,
  categories,
  onSuccess,
}: {
  selectedProjects: SelectedProjectForBatch[]
  members: Member[]
  categories: Category[]
  onSuccess?: () => void
}) {
  const formId = useId()
  const [state, formAction, pending] = useActionState<BatchEditState, FormData>(
    batchUpdateProjects,
    batchEditInitialState
  )

  const [enableStatus, setEnableStatus] = useState(false)
  const [status, setStatus] = useState(() => {
    if (selectedProjects.length === 0) return "not_started"
    const first = selectedProjects[0].status
    return selectedProjects.every((p) => p.status === first) ? first : "not_started"
  })
  const [enableAssignee, setEnableAssignee] = useState(false)
  const [assigneeIds, setAssigneeIds] = useState<Set<string>>(() => {
    if (selectedProjects.length === 0) return new Set()
    const firstSorted = [...selectedProjects[0].assigneeIds].sort().join(",")
    const allSame = selectedProjects.every(
      (p) => [...p.assigneeIds].sort().join(",") === firstSorted
    )
    return allSame ? new Set(selectedProjects[0].assigneeIds) : new Set()
  })
  const [enabledFields, setEnabledFields] = useState<Record<string, boolean>>({})
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const result: Record<string, string> = {}
    if (selectedProjects.length === 0) return result
    const firstCategoryId = selectedProjects[0].categoryId
    if (!firstCategoryId) return result
    if (selectedProjects.some((p) => p.categoryId !== firstCategoryId)) return result
    const category = categories.find((c) => c.id === firstCategoryId)
    if (!category) return result
    for (const field of category.fields) {
      const first = selectedProjects[0].customFieldValues[field.id] ?? ""
      if (selectedProjects.every((p) => (p.customFieldValues[field.id] ?? "") === first)) {
        result[field.id] = first
      }
    }
    return result
  })

  useEffect(() => {
    if (state.status === "success") {
      onSuccess?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const sharedCategory = useMemo(() => {
    if (selectedProjects.length === 0) return null
    const firstCategoryId = selectedProjects[0].categoryId
    if (!firstCategoryId) return null
    if (selectedProjects.some((project) => project.categoryId !== firstCategoryId)) {
      return null
    }
    return categories.find((category) => category.id === firstCategoryId) ?? null
  }, [selectedProjects, categories])

  const hasMixedCategories = useMemo(
    () => new Set(selectedProjects.map((project) => project.categoryId)).size > 1,
    [selectedProjects]
  )

  return (
    <>
      <DialogHeader>
        <DialogTitle>批次編輯專案</DialogTitle>
        <DialogDescription>
          已選取 {selectedProjects.length} 個專案。勾選想要更新的欄位並填入新值，未勾選的欄位會維持原本內容。
        </DialogDescription>
      </DialogHeader>

      <form id={formId} action={formAction} className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto">
        {state.status === "error" && state.error && (
            <p className="text-sm text-destructive" aria-live="polite">
              {state.error}
            </p>
          )}

          {selectedProjects.map((project) => (
            <input key={project.id} type="hidden" name="ids" value={project.id} />
          ))}

          <div className="flex flex-col gap-1.5 rounded-lg border p-3">
            <Label htmlFor={`${formId}-enable-status`} className="cursor-pointer">
              <Checkbox
                id={`${formId}-enable-status`}
                name="enable_status"
                checked={enableStatus}
                onCheckedChange={setEnableStatus}
              />
              更新狀態
            </Label>
            <Select
              name="status"
              value={status}
              onValueChange={(value) => setStatus(value ?? "not_started")}
              disabled={!enableStatus}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="選擇狀態">
                  {(value: string) => statusLabel[value] ?? value}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">尚未開始</SelectItem>
                <SelectItem value="in_progress">進行中</SelectItem>
                <SelectItem value="completed">已結案</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 rounded-lg border p-3">
            <Label htmlFor={`${formId}-enable-assignee`} className="cursor-pointer">
              <Checkbox
                id={`${formId}-enable-assignee`}
                name="enable_assigneeIds"
                checked={enableAssignee}
                onCheckedChange={setEnableAssignee}
              />
              更新負責人
            </Label>
            {/* Hidden inputs carry the selected assignee IDs into FormData */}
            {Array.from(assigneeIds).map((id) => (
              <input key={id} type="hidden" name="assigneeIds" value={id} />
            ))}
            <div
              className={`flex flex-col gap-2 rounded-md border p-2 transition-opacity ${!enableAssignee ? "pointer-events-none opacity-40" : ""}`}
            >
              {members.map((member) => (
                <Label
                  key={member.id}
                  htmlFor={`${formId}-batch-assignee-${member.id}`}
                  className="flex cursor-pointer items-center gap-2 font-normal"
                >
                  <Checkbox
                    id={`${formId}-batch-assignee-${member.id}`}
                    checked={assigneeIds.has(member.id)}
                    onCheckedChange={(checked) =>
                      setAssigneeIds((prev) => {
                        const next = new Set(prev)
                        if (checked) next.add(member.id)
                        else next.delete(member.id)
                        return next
                      })
                    }
                    disabled={!enableAssignee}
                  />
                  {member.name}
                </Label>
              ))}
              {members.length === 0 && (
                <p className="text-xs text-muted-foreground">尚無可指派的成員</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              未勾選任何成員表示清除所有負責人
            </p>
          </div>

          {sharedCategory && sharedCategory.fields.length > 0 && (
            <div className="flex flex-col gap-3 rounded-lg border border-dashed p-3">
              <p className="text-xs font-medium text-muted-foreground">
                {sharedCategory.name} 的固定欄位
              </p>
              {sharedCategory.fields.map((field) => {
                const enabled = enabledFields[field.id] ?? false
                const value = fieldValues[field.id] ?? ""

                return (
                  <div key={field.id} className="flex flex-col gap-1.5">
                    <Label
                      htmlFor={`${formId}-enable-field-${field.id}`}
                      className="cursor-pointer"
                    >
                      <Checkbox
                        id={`${formId}-enable-field-${field.id}`}
                        name={`enable_customField_${field.id}`}
                        checked={enabled}
                        onCheckedChange={(checked) =>
                          setEnabledFields((prev) => ({ ...prev, [field.id]: checked }))
                        }
                      />
                      更新「{field.name}」
                    </Label>
                    {field.type === "select" ? (
                      <Select
                        name={`customField_${field.id}`}
                        value={value || SELECT_FIELD_EMPTY}
                        onValueChange={(next) =>
                          setFieldValues((prev) => ({
                            ...prev,
                            [field.id]: !next || next === SELECT_FIELD_EMPTY ? "" : next,
                          }))
                        }
                        disabled={!enabled}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="請選擇">
                            {(v: string) => (v === SELECT_FIELD_EMPTY ? "未選擇（清空）" : v)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false} className="max-h-72">
                          <SelectItem value={SELECT_FIELD_EMPTY}>未選擇（清空）</SelectItem>
                          {field.options
                            .filter((option) => !field.hiddenOptions.includes(option))
                            .map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        name={`customField_${field.id}`}
                        type={fieldInputType[field.type] ?? "text"}
                        value={value}
                        onChange={(event) =>
                          setFieldValues((prev) => ({ ...prev, [field.id]: event.target.value }))
                        }
                        placeholder="留空表示清空此欄位"
                        disabled={!enabled}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {hasMixedCategories && (
            <p className="text-xs text-muted-foreground">
              選取的專案分屬不同類別，因此無法批次編輯固定欄位（如廠商、專案金額），請分別編輯。
            </p>
          )}

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            取消
          </DialogClose>
          <Button type="submit" disabled={pending}>
            {pending ? "更新中…" : `套用到 ${selectedProjects.length} 個專案`}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export function BatchEditDialog({
  open,
  onOpenChange,
  selectedProjects,
  members,
  categories,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedProjects: SelectedProjectForBatch[]
  members: Member[]
  categories: Category[]
  onSuccess?: () => void
}) {
  // Remount the form with a fresh key each time the dialog transitions from
  // closed to open, so leftover selections from a previous batch don't linger.
  const [prevOpen, setPrevOpen] = useState(open)
  const [resetToken, setResetToken] = useState(0)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setResetToken((token) => token + 1)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <BatchEditForm
          key={resetToken}
          selectedProjects={selectedProjects}
          members={members}
          categories={categories}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
