"use client"

import { useActionState, useEffect, useId, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getCategoryStyleByName } from "@/lib/dashboard-categories"
import { cn } from "@/lib/utils"
import type { ProjectFormState } from "./actions"

const initialState: ProjectFormState = { status: "idle" }

const LABEL_CLASS = "text-[13px] font-semibold text-[#3a4066]"

type CategoryField = {
  id: string
  name: string
  type: string
  options: string[]
  hiddenOptions?: string[]
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
  footerClassName,
}: {
  project?: ProjectFormValues
  members: Member[]
  categories: Category[]
  action: (prevState: ProjectFormState, formData: FormData) => Promise<ProjectFormState>
  onSuccess?: () => void
  footerClassName?: string
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

  const isSideBusiness = selectedCategory?.name === "副業"
  const categoryStyle = getCategoryStyleByName(selectedCategory?.name)

  useEffect(() => {
    if (!isSideBusiness) {
      const yumin = members.find((member) => member.name === "Yumin")
      setAssigneeIds(yumin ? new Set([yumin.id]) : new Set())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSideBusiness])

  return (
    <form id={formId} action={formAction} className="contents">
      <div className="@container flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        {state.error && (
          <p className="text-sm text-destructive" aria-live="polite">
            {state.error}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${formId}-title`} className={LABEL_CLASS}>
            標題
          </Label>
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
          <Label htmlFor={`${formId}-description`} className={LABEL_CLASS}>
            描述
          </Label>
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

        {Array.from(assigneeIds).map((id) => (
          <input key={id} type="hidden" name="assigneeIds" value={id} />
        ))}

        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2">
          <div className={cn("flex flex-col gap-1.5", !isSideBusiness && "@sm:col-span-2")}>
            <Label htmlFor={`${formId}-categoryId`} className={LABEL_CLASS}>
              類型
            </Label>
            <Select
              name="categoryId"
              value={categoryId}
              onValueChange={(value) => setCategoryId(value ?? UNCATEGORIZED)}
            >
              <SelectTrigger id={`${formId}-categoryId`} className="w-full">
                <SelectValue placeholder="選擇類型">
                  {(value: string) => {
                    const name =
                      categories.find((category) => category.id === value)?.name ?? "未分類"
                    const style = getCategoryStyleByName(name)
                    return (
                      <>
                        {style && (
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: style.dot }}
                          />
                        )}
                        {name}
                      </>
                    )
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNCATEGORIZED}>未分類</SelectItem>
                {categories.map((category) => {
                  const style = getCategoryStyleByName(category.name)
                  return (
                    <SelectItem key={category.id} value={category.id}>
                      {style && (
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: style.dot }}
                        />
                      )}
                      {category.name}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {state.fieldErrors?.categoryId && (
              <p className="text-xs text-destructive">{state.fieldErrors.categoryId[0]}</p>
            )}
          </div>

          {isSideBusiness && (
            <div className="flex flex-col gap-1.5">
              <Label className={LABEL_CLASS}>
                負責人{" "}
                <span className="text-xs font-normal text-[rgba(70,78,120,.5)]">可多選</span>
              </Label>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">尚無可指派的成員</p>
              ) : (
                <MultiSelect
                  options={members.map((member) => ({ value: member.id, label: member.name }))}
                  value={assigneeIds}
                  onChange={setAssigneeIds}
                  placeholder="選擇負責人"
                />
              )}
            </div>
          )}
        </div>

        {selectedCategory && selectedCategory.fields.length > 0 && (
          <div
            className="flex flex-col gap-4 rounded-[14px] border p-3.5"
            style={{
              borderColor: categoryStyle ? `${categoryStyle.a}40` : "rgba(120,128,170,.20)",
              background: categoryStyle
                ? `linear-gradient(150deg, ${categoryStyle.tint}, rgba(255,255,255,.30))`
                : "rgba(120,128,170,.06)",
            }}
          >
            <p
              className="flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: categoryStyle?.ink ?? "#3a4066" }}
            >
              {categoryStyle && (
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: categoryStyle.dot }}
                />
              )}
              {selectedCategory.name} 的固定欄位
            </p>
            <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2">
              {selectedCategory.fields.map((field) => {
                const currentValue = project?.customFieldValues?.[field.id] ?? ""
                // Hidden options stay out of the list, unless this project is
                // still using one — otherwise editing would silently drop it.
                const visibleOptions = field.options.filter(
                  (option) =>
                    !field.hiddenOptions?.includes(option) || option === currentValue
                )
                return (
                <div key={field.id} className="flex flex-col gap-1.5">
                  <Label htmlFor={`${formId}-customField-${field.id}`} className={LABEL_CLASS}>
                    {field.name}
                  </Label>
                  {field.type === "select" ? (
                    <Select
                      name={`customField_${field.id}`}
                      defaultValue={currentValue || SELECT_FIELD_EMPTY}
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
                      <SelectContent alignItemWithTrigger={false} className="max-h-72">
                        <SelectItem value={SELECT_FIELD_EMPTY}>未選擇</SelectItem>
                        {visibleOptions.map((option) => (
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
                )
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${formId}-status`} className={LABEL_CLASS}>
            狀態
          </Label>
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
      </div>

      <DialogFooter className={footerClassName}>
        <DialogClose
          render={<Button type="button" variant="outline" />}
          className="rounded-[12px] border-[rgba(120,128,170,.25)] bg-[rgba(255,255,255,.6)] text-[rgba(70,78,120,.75)] hover:bg-[rgba(255,255,255,.85)] hover:text-[rgba(70,78,120,.9)]"
        >
          取消
        </DialogClose>
        <Button
          type="submit"
          disabled={pending}
          className="rounded-[12px] border-none bg-[linear-gradient(135deg,#8aa6e8,#ab92d8)] font-semibold text-white shadow-[0_6px_18px_rgba(138,166,232,.4)] hover:opacity-90"
        >
          {pending ? "儲存中…" : project ? "儲存變更" : "新增專案"}
        </Button>
      </DialogFooter>
    </form>
  )
}
