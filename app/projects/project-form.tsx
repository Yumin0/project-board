"use client"

import { useActionState, useEffect, useId, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ProjectFormState } from "./actions"

const initialState: ProjectFormState = { status: "idle" }

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

type ProjectFormValues = {
  id: string
  title: string
  description: string | null
  categoryId: string | null
  customFieldValues: Record<string, string> | null
  status: string
  assigneeIds: string[]
}

type Member = {
  id: string
  name: string
}

const UNCATEGORIZED = "__uncategorized__"
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

export function ProjectForm({
  project,
  members,
  categories,
  action,
  onSuccess,
}: {
  project?: ProjectFormValues
  members: Member[]
  categories: Category[]
  action: (prevState: ProjectFormState, formData: FormData) => Promise<ProjectFormState>
  onSuccess?: () => void
}) {
  const formId = useId()
  const [state, formAction, pending] = useActionState<ProjectFormState, FormData>(
    action,
    initialState
  )
  const [categoryId, setCategoryId] = useState(project?.categoryId ?? UNCATEGORIZED)
  const [assigneeIds, setAssigneeIds] = useState<Set<string>>(
    new Set(project?.assigneeIds ?? [])
  )

  useEffect(() => {
    if (state.status === "success") {
      onSuccess?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId),
    [categories, categoryId]
  )

  function toggleAssignee(memberId: string, checked: boolean) {
    setAssigneeIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(memberId)
      else next.delete(memberId)
      return next
    })
  }

  return (
    <form id={formId} action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <p className="text-sm text-destructive" aria-live="polite">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-title`}>標題</Label>
        <Input
          id={`${formId}-title`}
          name="title"
          defaultValue={project?.title}
          placeholder="例如：個人網站改版"
          aria-invalid={!!state.fieldErrors?.title}
          required
        />
        {state.fieldErrors?.title && (
          <p className="text-xs text-destructive">{state.fieldErrors.title[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-description`}>描述</Label>
        <Textarea
          id={`${formId}-description`}
          name="description"
          defaultValue={project?.description ?? ""}
          placeholder="專案的簡短說明（選填）"
          aria-invalid={!!state.fieldErrors?.description}
        />
        {state.fieldErrors?.description && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.description[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-categoryId`}>類型</Label>
        <Select
          name="categoryId"
          value={categoryId}
          onValueChange={(value) => setCategoryId(value ?? UNCATEGORIZED)}
        >
          <SelectTrigger id={`${formId}-categoryId`} className="w-full">
            <SelectValue placeholder="選擇類型">
              {(value: string) =>
                categories.find((category) => category.id === value)?.name ?? "未分類"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNCATEGORIZED}>未分類</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.fieldErrors?.categoryId && (
          <p className="text-xs text-destructive">{state.fieldErrors.categoryId[0]}</p>
        )}
      </div>

      {selectedCategory && selectedCategory.fields.length > 0 && (
        <div className="flex flex-col gap-4 rounded-lg border border-dashed p-3">
          <p className="text-xs font-medium text-muted-foreground">
            {selectedCategory.name} 的固定欄位
          </p>
          {selectedCategory.fields.map((field) => (
            <div key={field.id} className="flex flex-col gap-1.5">
              <Label htmlFor={`${formId}-customField-${field.id}`}>{field.name}</Label>
              {field.type === "select" ? (
                <Select
                  name={`customField_${field.id}`}
                  defaultValue={project?.customFieldValues?.[field.id] || SELECT_FIELD_EMPTY}
                >
                  <SelectTrigger
                    id={`${formId}-customField-${field.id}`}
                    className="w-full"
                    aria-invalid={!!state.customFieldErrors?.[field.id]}
                  >
                    <SelectValue placeholder="請選擇">
                      {(value: string) =>
                        value === SELECT_FIELD_EMPTY ? "請選擇" : value
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SELECT_FIELD_EMPTY}>未選擇</SelectItem>
                    {field.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`${formId}-customField-${field.id}`}
                  name={`customField_${field.id}`}
                  type={fieldInputType[field.type] ?? "text"}
                  defaultValue={project?.customFieldValues?.[field.id] ?? ""}
                  aria-invalid={!!state.customFieldErrors?.[field.id]}
                />
              )}
              {state.customFieldErrors?.[field.id] && (
                <p className="text-xs text-destructive">
                  {state.customFieldErrors[field.id]}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>負責人</Label>
        {/* Hidden inputs carry the selected IDs into FormData */}
        {Array.from(assigneeIds).map((id) => (
          <input key={id} type="hidden" name="assigneeIds" value={id} />
        ))}
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚無可指派的成員</p>
        ) : (
          <div className="flex flex-col gap-2 rounded-lg border p-3">
            {members.map((member) => (
              <Label
                key={member.id}
                htmlFor={`${formId}-assignee-${member.id}`}
                className="flex cursor-pointer items-center gap-2 font-normal"
              >
                <Checkbox
                  id={`${formId}-assignee-${member.id}`}
                  checked={assigneeIds.has(member.id)}
                  onCheckedChange={(checked) => toggleAssignee(member.id, !!checked)}
                />
                {member.name}
              </Label>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-status`}>狀態</Label>
        <Select name="status" defaultValue={project?.status ?? "not_started"}>
          <SelectTrigger id={`${formId}-status`} className="w-full">
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

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          取消
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "儲存中…" : project ? "儲存變更" : "新增專案"}
        </Button>
      </DialogFooter>
    </form>
  )
}
