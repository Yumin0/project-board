"use client"

import { useActionState, useEffect, useId, useMemo, useState, type FormEvent } from "react"
import Link from "next/link"
import { PlusIcon, ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getCategoryStyleByName } from "@/lib/dashboard-categories"
import { createIncomeRecord, type IncomeRecordFormState } from "@/app/accounts/actions"
import { createProjectWithIncome, type QuickCreateProjectState } from "@/app/projects/actions"

type Project = { id: string; title: string }
type Account = { id: string; name: string }
type CategoryField = { id: string; name: string; type: string; options: string[] }
type Category = { id: string; name: string; fields: CategoryField[] }

const UNCATEGORIZED = "__uncategorized__"
const SELECT_FIELD_EMPTY = "__empty__"

const fieldInputType: Record<string, string> = {
  text: "text",
  number: "number",
  date: "date",
}

function todayInputValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Remounts anything keyed by the returned token each time `open` transitions
// from closed to open, so a dialog's form state doesn't linger between uses.
function useResetKey(open: boolean) {
  const [prevOpen, setPrevOpen] = useState(open)
  const [resetToken, setResetToken] = useState(0)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setResetToken((token) => token + 1)
  }
  return resetToken
}

// ---------------------------------------------------------------------------
// 新增收款（既有專案）
// ---------------------------------------------------------------------------

const addIncomeInitialState: IncomeRecordFormState = { status: "idle" }

function QuickAddIncomeForm({
  projects,
  accounts,
  defaultAccountId,
  onSuccess,
}: {
  projects: Project[]
  accounts: Account[]
  defaultAccountId?: string
  onSuccess: () => void
}) {
  const formId = useId()
  const [state, formAction, pending] = useActionState<IncomeRecordFormState, FormData>(
    createIncomeRecord,
    addIncomeInitialState
  )
  const [projectId, setProjectId] = useState<string | null>(null)
  const [showProjectRequired, setShowProjectRequired] = useState(false)

  useEffect(() => {
    if (state.status === "success") {
      onSuccess()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const projectItems = useMemo(
    () => projects.map((project) => ({ value: project.id, label: project.title })),
    [projects]
  )

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!projectId) {
      event.preventDefault()
      setShowProjectRequired(true)
    }
  }

  return (
    <form id={formId} action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-4">
      {state.error && (
        <p className="text-sm text-destructive" aria-live="polite">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-projectId`}>專案</Label>
        <input type="hidden" name="projectId" value={projectId ?? ""} />
        <Combobox
          items={projectItems}
          value={projectItems.find((item) => item.value === projectId) ?? null}
          onValueChange={(item) => {
            setProjectId(item?.value ?? null)
            setShowProjectRequired(false)
          }}
        >
          <ComboboxInputGroup>
            <ComboboxInput id={`${formId}-projectId`} placeholder="搜尋專案，例如：龍泉" />
          </ComboboxInputGroup>
          <ComboboxContent>
            <ComboboxEmpty>找不到符合的專案</ComboboxEmpty>
            <ComboboxList>
              {(item: { value: string; label: string }) => (
                <ComboboxItem key={item.value} value={item}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        {showProjectRequired && <p className="text-xs text-destructive">請先選擇要登記收款的專案</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${formId}-amount`}>金額</Label>
          <Input
            id={`${formId}-amount`}
            name="amount"
            type="number"
            step={1}
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
            defaultValue={todayInputValue()}
            aria-invalid={!!state.fieldErrors?.date}
            required
          />
          {state.fieldErrors?.date && (
            <p className="text-xs text-destructive">{state.fieldErrors.date[0]}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-accountId`}>帳戶</Label>
        <Select name="accountId" defaultValue={defaultAccountId}>
          <SelectTrigger id={`${formId}-accountId`} className="w-full">
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
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-note`}>備註</Label>
        <Textarea id={`${formId}-note`} name="note" placeholder="這筆收入的說明（選填）" />
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>取消</DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "新增中…" : "新增收入紀錄"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function QuickAddIncomeDialog({
  open,
  onOpenChange,
  projects,
  accounts,
  defaultAccountId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: Project[]
  accounts: Account[]
  defaultAccountId?: string
}) {
  const resetToken = useResetKey(open)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增收款</DialogTitle>
        </DialogHeader>
        <QuickAddIncomeForm
          key={resetToken}
          projects={projects}
          accounts={accounts}
          defaultAccountId={defaultAccountId}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// 新增專案並登記收款
// ---------------------------------------------------------------------------

const newProjectInitialState: QuickCreateProjectState = { status: "idle" }

function QuickNewProjectForm({
  categories,
  accounts,
  defaultAccountId,
  onSuccess,
}: {
  categories: Category[]
  accounts: Account[]
  defaultAccountId?: string
  onSuccess: () => void
}) {
  const formId = useId()
  const [state, formAction, pending] = useActionState<QuickCreateProjectState, FormData>(
    createProjectWithIncome,
    newProjectInitialState
  )
  const [categoryId, setCategoryId] = useState(UNCATEGORIZED)
  // The income amount mirrors the "專案金額" custom field (they match when a
  // period is paid in full) until the user edits it — e.g. to log a deposit.
  const [incomeAmount, setIncomeAmount] = useState("")
  const [amountEdited, setAmountEdited] = useState(false)

  useEffect(() => {
    if (state.status === "success") {
      onSuccess()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId),
    [categories, categoryId]
  )
  const categoryStyle = getCategoryStyleByName(selectedCategory?.name)
  const totalAmountFieldId = selectedCategory?.fields.find((f) => f.name === "專案金額")?.id

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
          placeholder="例如：龍泉第三期"
          aria-invalid={!!state.fieldErrors?.title}
          required
        />
        {state.fieldErrors?.title && (
          <p className="text-xs text-destructive">{state.fieldErrors.title[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-categoryId`}>類型</Label>
        <Select name="categoryId" value={categoryId} onValueChange={(value) => setCategoryId(value ?? UNCATEGORIZED)}>
          <SelectTrigger id={`${formId}-categoryId`} className="w-full">
            <SelectValue placeholder="選擇類型">
              {(value: string) => categories.find((category) => category.id === value)?.name ?? "未分類"}
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
          <p className="text-xs font-semibold" style={{ color: categoryStyle?.ink ?? "#3a4066" }}>
            {selectedCategory.name} 的固定欄位
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {selectedCategory.fields.map((field) => (
              <div key={field.id} className="flex flex-col gap-1.5">
                <Label htmlFor={`${formId}-customField-${field.id}`}>{field.name}</Label>
                {field.type === "select" ? (
                  <Select name={`customField_${field.id}`} defaultValue={SELECT_FIELD_EMPTY}>
                    <SelectTrigger
                      id={`${formId}-customField-${field.id}`}
                      className="w-full"
                      aria-invalid={!!state.customFieldErrors?.[field.id]}
                    >
                      <SelectValue placeholder="請選擇">
                        {(value: string) => (value === SELECT_FIELD_EMPTY ? "請選擇" : value)}
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
                    aria-invalid={!!state.customFieldErrors?.[field.id]}
                    onChange={
                      field.id === totalAmountFieldId
                        ? (event) => {
                            if (!amountEdited) setIncomeAmount(event.target.value)
                          }
                        : undefined
                    }
                  />
                )}
                {state.customFieldErrors?.[field.id] && (
                  <p className="text-xs text-destructive">{state.customFieldErrors[field.id]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${formId}-amount`}>收款金額</Label>
          <Input
            id={`${formId}-amount`}
            name="amount"
            type="number"
            step={1}
            placeholder="這次收到的錢"
            value={incomeAmount}
            onChange={(event) => {
              setIncomeAmount(event.target.value)
              setAmountEdited(true)
            }}
            aria-invalid={!!state.fieldErrors?.amount}
            required
          />
          {totalAmountFieldId && !amountEdited && (
            <p className="text-xs text-muted-foreground">已帶入專案金額，若只收訂金可自行改小</p>
          )}
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
            defaultValue={todayInputValue()}
            aria-invalid={!!state.fieldErrors?.date}
            required
          />
          {state.fieldErrors?.date && (
            <p className="text-xs text-destructive">{state.fieldErrors.date[0]}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-accountId`}>帳戶</Label>
        <Select name="accountId" defaultValue={defaultAccountId}>
          <SelectTrigger id={`${formId}-accountId`} className="w-full">
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
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-note`}>備註</Label>
        <Textarea id={`${formId}-note`} name="note" placeholder="例如：訂金（選填）" />
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>取消</DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "建立中…" : "建立專案並登記收款"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function QuickNewProjectDialog({
  open,
  onOpenChange,
  categories,
  accounts,
  defaultAccountId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  accounts: Account[]
  defaultAccountId?: string
}) {
  const resetToken = useResetKey(open)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增專案並登記收款</DialogTitle>
        </DialogHeader>
        <QuickNewProjectForm
          key={resetToken}
          categories={categories}
          accounts={accounts}
          defaultAccountId={defaultAccountId}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// 「＋」快捷選單
// ---------------------------------------------------------------------------

export function MoneyQuickActionsMenu({
  projects,
  accounts,
  categories,
  defaultAccountId,
}: {
  projects: Project[]
  accounts: Account[]
  categories: Category[]
  defaultAccountId?: string
}) {
  const [addIncomeOpen, setAddIncomeOpen] = useState(false)
  const [newProjectOpen, setNewProjectOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <PlusIcon />
          <span className="sr-only">新增收款相關操作</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setAddIncomeOpen(true)}>
            <span className="font-medium">新增收款</span>
            <span className="text-xs text-muted-foreground">幫既有專案登記收到的款項</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setNewProjectOpen(true)}>
            <span className="font-medium">新增專案並登記收款</span>
            <span className="text-xs text-muted-foreground">新簽約的案子，建立專案同時記錄這筆收入</span>
          </DropdownMenuItem>
          <DropdownMenuLinkItem render={<Link href="/commission" />}>
            <span className="flex items-center gap-1 font-medium">
              前往結算分潤
              <ArrowRightIcon className="size-3.5" />
            </span>
            <span className="text-xs text-muted-foreground">確認業務佣金與製作費是否已撥款</span>
          </DropdownMenuLinkItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <QuickAddIncomeDialog
        open={addIncomeOpen}
        onOpenChange={setAddIncomeOpen}
        projects={projects}
        accounts={accounts}
        defaultAccountId={defaultAccountId}
      />
      <QuickNewProjectDialog
        open={newProjectOpen}
        onOpenChange={setNewProjectOpen}
        categories={categories}
        accounts={accounts}
        defaultAccountId={defaultAccountId}
      />
    </>
  )
}
