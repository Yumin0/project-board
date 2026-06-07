"use client"

import { useActionState, useEffect, useId, useState } from "react"
import { PlusIcon, Trash2Icon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import type { CategoryFormState } from "./actions"

const initialState: CategoryFormState = { status: "idle" }

type FieldType = "text" | "number" | "date" | "select"

type FieldDraft = {
  key: string
  id?: string
  name: string
  type: FieldType
  options: string[]
}

type CategoryFormValues = {
  id: string
  name: string
  fields: { id: string; name: string; type: string; options?: string[] }[]
}

const fieldTypeLabel: Record<FieldType, string> = {
  text: "文字",
  number: "數字",
  date: "日期",
  select: "下拉選單",
}

function isFieldType(value: string): value is FieldType {
  return value === "text" || value === "number" || value === "date" || value === "select"
}

function createDraftKey() {
  return crypto.randomUUID()
}

export function CategoryForm({
  category,
  action,
  onSuccess,
}: {
  category?: CategoryFormValues
  action: (prevState: CategoryFormState, formData: FormData) => Promise<CategoryFormState>
  onSuccess?: () => void
}) {
  const formId = useId()
  const [state, formAction, pending] = useActionState<CategoryFormState, FormData>(
    action,
    initialState
  )
  const [fields, setFields] = useState<FieldDraft[]>(() =>
    (category?.fields ?? []).map((field) => ({
      key: field.id,
      id: field.id,
      name: field.name,
      type: isFieldType(field.type) ? field.type : "text",
      options: field.options ?? [],
    }))
  )

  useEffect(() => {
    if (state.status === "success") {
      onSuccess?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const fieldsJson = JSON.stringify(
    fields.map(({ id, name, type, options }) => ({
      id,
      name,
      type,
      options:
        type === "select"
          ? options.map((option) => option.trim()).filter((option) => option.length > 0)
          : [],
    }))
  )

  return (
    <form id={formId} action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <p className="text-sm text-destructive" aria-live="polite">
          {state.error}
        </p>
      )}

      <input type="hidden" name="fields" value={fieldsJson} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-name`}>類別名稱</Label>
        <Input
          id={`${formId}-name`}
          name="name"
          defaultValue={category?.name}
          placeholder="例如：副業"
          aria-invalid={!!state.fieldErrors?.name}
          required
        />
        {state.fieldErrors?.name && (
          <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>固定欄位</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setFields((prev) => [
                ...prev,
                { key: createDraftKey(), name: "", type: "text", options: [] },
              ])
            }
          >
            <PlusIcon data-icon="inline-start" />
            新增欄位
          </Button>
        </div>

        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground">
            還沒有設定固定欄位，點擊「新增欄位」加入像是專案金額、廠商之類的項目
          </p>
        )}

        {fields.map((field, index) => (
          <div key={field.key} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Input
                value={field.name}
                onChange={(event) => {
                  const value = event.target.value
                  setFields((prev) =>
                    prev.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, name: value } : item
                    )
                  )
                }}
                placeholder="欄位名稱，例如：專案金額"
                className="flex-1"
              />
              <Select
                value={field.type}
                onValueChange={(value) =>
                  setFields((prev) =>
                    prev.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, type: value as FieldType }
                        : item
                    )
                  )
                }
              >
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="類型">
                    {(value: string) => fieldTypeLabel[value as FieldType] ?? value}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">文字</SelectItem>
                  <SelectItem value="number">數字</SelectItem>
                  <SelectItem value="date">日期</SelectItem>
                  <SelectItem value="select">下拉選單</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  setFields((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
                }
              >
                <Trash2Icon />
                <span className="sr-only">刪除「{field.name || "此欄位"}」</span>
              </Button>
            </div>

            {field.type === "select" && (
              <div className="ml-1 flex flex-col gap-2 rounded-lg border border-dashed p-2.5">
                <p className="text-xs font-medium text-muted-foreground">選項</p>
                {field.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(event) => {
                        const value = event.target.value
                        setFields((prev) =>
                          prev.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  options: item.options.map((opt, optIndex) =>
                                    optIndex === optionIndex ? value : opt
                                  ),
                                }
                              : item
                          )
                        )
                      }}
                      placeholder="選項名稱，例如：廠商 A"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setFields((prev) =>
                          prev.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  options: item.options.filter(
                                    (_, optIndex) => optIndex !== optionIndex
                                  ),
                                }
                              : item
                          )
                        )
                      }
                    >
                      <XIcon />
                      <span className="sr-only">刪除選項「{option || "此選項"}」</span>
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() =>
                    setFields((prev) =>
                      prev.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, options: [...item.options, ""] }
                          : item
                      )
                    )
                  }
                >
                  <PlusIcon data-icon="inline-start" />
                  新增選項
                </Button>
              </div>
            )}
          </div>
        ))}

        {state.fieldErrors?.fields && (
          <p className="text-xs text-destructive">{state.fieldErrors.fields[0]}</p>
        )}
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          取消
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "儲存中…" : category ? "儲存變更" : "新增類別"}
        </Button>
      </DialogFooter>
    </form>
  )
}
