"use client"

import { useActionState, useEffect, useId } from "react"

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
import { Textarea } from "@/components/ui/textarea"
import type { IncomeRecordFormState } from "./actions"

const initialState: IncomeRecordFormState = { status: "idle" }

const NO_PROJECT = "__no_project__"

type Account = {
  id: string
  name: string
}

type Project = {
  id: string
  title: string
}

type IncomeRecordFormValues = {
  id: string
  accountId: string
  amount: number
  date: Date
  note: string | null
  projectId: string | null
}

// Existing records are stored as UTC midnight for the entered calendar date
// (see actions.ts: `new Date("YYYY-MM-DD")`), so reading back the UTC date
// parts round-trips to the same string regardless of the browser's timezone.
function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

// "Today" has to use the browser's local date parts — converting `new Date()`
// to UTC first can land on the previous day for timezones ahead of UTC.
function todayInputValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function IncomeRecordForm({
  record,
  accounts,
  projects,
  defaultAccountId,
  action,
  onSuccess,
}: {
  record?: IncomeRecordFormValues
  accounts: Account[]
  projects: Project[]
  defaultAccountId?: string
  action: (prevState: IncomeRecordFormState, formData: FormData) => Promise<IncomeRecordFormState>
  onSuccess?: () => void
}) {
  const formId = useId()
  const [state, formAction, pending] = useActionState<IncomeRecordFormState, FormData>(
    action,
    initialState
  )

  useEffect(() => {
    if (state.status === "success") {
      onSuccess?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <form id={formId} action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <p className="text-sm text-destructive" aria-live="polite">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-accountId`}>帳戶</Label>
        <Select
          name="accountId"
          defaultValue={record?.accountId ?? defaultAccountId}
        >
          <SelectTrigger
            id={`${formId}-accountId`}
            className="w-full"
            aria-invalid={!!state.fieldErrors?.accountId}
          >
            <SelectValue placeholder="選擇帳戶">
              {(value: string) => accounts.find((account) => account.id === value)?.name ?? "選擇帳戶"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.fieldErrors?.accountId && (
          <p className="text-xs text-destructive">{state.fieldErrors.accountId[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${formId}-amount`}>金額</Label>
          <Input
            id={`${formId}-amount`}
            name="amount"
            type="number"
            step={1}
            defaultValue={record?.amount}
            placeholder="例如：10000"
            aria-invalid={!!state.fieldErrors?.amount}
            required
          />
          {state.fieldErrors?.amount && (
            <p className="text-xs text-destructive">{state.fieldErrors.amount[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${formId}-date`}>日期</Label>
          <Input
            id={`${formId}-date`}
            name="date"
            type="date"
            defaultValue={record ? toDateInputValue(record.date) : todayInputValue()}
            aria-invalid={!!state.fieldErrors?.date}
            required
          />
          {state.fieldErrors?.date && (
            <p className="text-xs text-destructive">{state.fieldErrors.date[0]}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-projectId`}>關聯專案</Label>
        <Select
          name="projectId"
          defaultValue={record?.projectId ?? NO_PROJECT}
        >
          <SelectTrigger id={`${formId}-projectId`} className="w-full">
            <SelectValue placeholder="選擇專案（選填）">
              {(value: string) =>
                value === NO_PROJECT
                  ? "不關聯專案"
                  : (projects.find((project) => project.id === value)?.title ?? "不關聯專案")
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_PROJECT}>不關聯專案</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-note`}>備註</Label>
        <Textarea
          id={`${formId}-note`}
          name="note"
          defaultValue={record?.note ?? ""}
          placeholder="這筆收入的說明（選填）"
          aria-invalid={!!state.fieldErrors?.note}
        />
        {state.fieldErrors?.note && (
          <p className="text-xs text-destructive">{state.fieldErrors.note[0]}</p>
        )}
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          取消
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "儲存中…" : record ? "儲存變更" : "新增收入紀錄"}
        </Button>
      </DialogFooter>
    </form>
  )
}
