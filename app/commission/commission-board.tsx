"use client"

import { useActionState, useId, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  Trash2Icon,
  PencilIcon,
  CheckIcon,
  UndoIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
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
  addCommissionRecord,
  confirmPayment,
  deleteCommissionRecord,
  undoPayment,
  updateCommissionRecord,
  type AddCommissionState,
  type ConfirmPaymentState,
  type UpdateCommissionState,
} from "./actions"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Account = { id: string; name: string }

type MemberBase = {
  id: string
  name: string
  accountId?: string | null
  account?: { id: string; name: string } | null
}

type ProjectBase = {
  id: string
  title: string
  customFieldValues: Record<string, string> | null
  assignees: { id: string; name: string }[]
  category: { fields: { id: string; name: string }[] } | null
}

type CommissionRecord = {
  id: string
  month: string
  totalAmount: number
  commissionRate: number
  commissionAmount: number
  consultingFee: number
  productionFee: number
  salesPaidAt: Date | null
  consultingPaidAt: Date | null
  productionPaidAt: Date | null
  project: ProjectBase
  productionMember: MemberBase | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TWD = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
})

function fmt(n: number) {
  return TWD.format(n)
}

function addMonths(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-")
  return `${y} 年 ${Number(m)} 月`
}

function todayValue() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`
}

function tierLabel(count: number) {
  if (count <= 3) return "全部 20%"
  if (count <= 6) return "前 3 個 20%，第 4 個起 25%"
  return "前 3 個 20%，4-6 個 25%，第 7 個起 30%"
}

function getProjectTotalAmount(project: ProjectBase): number {
  if (!project.category || !project.customFieldValues) return 0
  const field = project.category.fields.find((f) => f.name === "專案金額")
  if (!field) return 0
  return parseInt(project.customFieldValues[field.id] ?? "0", 10) || 0
}

// ---------------------------------------------------------------------------
// Month navigator
// ---------------------------------------------------------------------------

function MonthNav({ month }: { month: string }) {
  const router = useRouter()
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => router.push(`/commission?month=${addMonths(month, -1)}`)}
      >
        <ChevronLeftIcon />
      </Button>
      <span className="min-w-28 text-center text-base font-semibold">{monthLabel(month)}</span>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => router.push(`/commission?month=${addMonths(month, 1)}`)}
      >
        <ChevronRightIcon />
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add project dialog
// ---------------------------------------------------------------------------

function AddProjectDialog({
  month,
  availableProjects,
  members,
}: {
  month: string
  availableProjects: ProjectBase[]
  members: MemberBase[]
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const formId = useId()

  const initialState: AddCommissionState = { status: "idle" }
  const [state, formAction, pending] = useActionState<AddCommissionState, FormData>(
    addCommissionRecord,
    initialState
  )

  const filtered = availableProjects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <PlusIcon data-icon="inline-start" />
        加入專案
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>加入專案到 {monthLabel(month)}</DialogTitle>
        </DialogHeader>

        <form id={formId} action={async (fd) => {
          await formAction(fd)
          if (state.status !== "error") setOpen(false)
        }} className="flex flex-col gap-4">
          <input type="hidden" name="month" value={month} />

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>搜尋專案</Label>
            <Input
              placeholder="輸入專案名稱…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-projectId`}>選擇專案</Label>
            <Select name="projectId" required>
              <SelectTrigger id={`${formId}-projectId`} className="w-full">
                <SelectValue placeholder="選擇要加入的專案">
                  {(v: string) => filtered.find((p) => p.id === v)?.title ?? "選擇要加入的專案"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {filtered.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">無符合的專案</div>
                )}
                {filtered.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                    {getProjectTotalAmount(p) > 0 && (
                      <span className="ml-1 text-muted-foreground">
                        ({fmt(getProjectTotalAmount(p))})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${formId}-productionMemberId`}>製作負責人</Label>
            <Select name="productionMemberId">
              <SelectTrigger id={`${formId}-productionMemberId`} className="w-full">
                <SelectValue placeholder="自動判斷">
                  {(v: string) => members.find((m) => m.id === v)?.name ?? "自動判斷"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">自動判斷（取第一位非業務成員）</SelectItem>
                {members
                  .filter((m) => m.name !== "業務")
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                      {m.account && (
                        <span className="ml-1 text-muted-foreground">({m.account.name})</span>
                      )}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "加入中…" : "加入此月"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Payment row
// ---------------------------------------------------------------------------

function PaymentRow({
  label,
  amount,
  paidAt,
  recordId,
  paymentType,
  accounts,
  defaultSourceAccountId,
  defaultTargetAccountId,
}: {
  label: string
  amount: number
  paidAt: Date | null
  recordId: string
  paymentType: "sales" | "consulting" | "production"
  accounts: Account[]
  defaultSourceAccountId?: string
  defaultTargetAccountId?: string
}) {
  const [showForm, setShowForm] = useState(false)
  const [pending, startTransition] = useTransition()
  const formId = useId()

  const initialState: ConfirmPaymentState = { status: "idle" }
  const [state, formAction, submitting] = useActionState<ConfirmPaymentState, FormData>(
    confirmPayment,
    initialState
  )

  if (amount <= 0) return null

  if (paidAt) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm">
        <div className="flex items-center gap-2">
          <CheckIcon className="size-4 text-green-600" />
          <span className="font-medium text-green-800">{label}</span>
          <span className="text-green-700">{fmt(amount)}</span>
          <span className="text-green-600">
            已付 {paidAt.toLocaleDateString("zh-TW")}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          title="取消付款"
          onClick={() =>
            startTransition(() => undoPayment(recordId, paymentType))
          }
          disabled={pending}
        >
          <UndoIcon className="size-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm">
          <span className="font-medium">{label}</span>
          <span className="ml-2 text-muted-foreground">{fmt(amount)}</span>
        </div>
        {!showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            確認付款
          </Button>
        )}
      </div>

      {showForm && (
        <form
          id={formId}
          action={async (fd) => {
            await formAction(fd)
            setShowForm(false)
          }}
          className="flex flex-col gap-2 rounded-lg border border-dashed p-3"
        >
          <input type="hidden" name="commissionRecordId" value={recordId} />
          <input type="hidden" name="paymentType" value={paymentType} />

          {state.error && (
            <p className="text-xs text-destructive">{state.error}</p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs" htmlFor={`${formId}-from`}>轉出帳戶</Label>
              <Select name="fromAccountId" defaultValue={defaultSourceAccountId}>
                <SelectTrigger id={`${formId}-from`} className="w-full" size="sm">
                  <SelectValue placeholder="選擇轉出">
                    {(v: string) => accounts.find((a) => a.id === v)?.name ?? "選擇轉出"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs" htmlFor={`${formId}-to`}>轉入帳戶</Label>
              <Select name="toAccountId" defaultValue={defaultTargetAccountId}>
                <SelectTrigger id={`${formId}-to`} className="w-full" size="sm">
                  <SelectValue placeholder="選擇轉入">
                    {(v: string) => accounts.find((a) => a.id === v)?.name ?? "選擇轉入"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs" htmlFor={`${formId}-date`}>匯款日期</Label>
            <Input
              id={`${formId}-date`}
              name="date"
              type="date"
              defaultValue={todayValue()}
              className="h-8 text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              取消
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "確認中…" : "確認"}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Record edit form
// ---------------------------------------------------------------------------

function RecordEditForm({
  record,
  members,
  onDone,
}: {
  record: CommissionRecord
  members: MemberBase[]
  onDone: () => void
}) {
  const formId = useId()
  const boundUpdate = updateCommissionRecord.bind(null, record.id)
  const initialState: UpdateCommissionState = { status: "idle" }
  const [state, formAction, pending] = useActionState<UpdateCommissionState, FormData>(
    boundUpdate,
    initialState
  )

  return (
    <form
      id={formId}
      action={async (fd) => {
        await formAction(fd)
        onDone()
      }}
      className="flex flex-col gap-3 rounded-lg border border-dashed p-3"
    >
      {state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs" htmlFor={`${formId}-rate`}>分潤% (業務)</Label>
          <Input
            id={`${formId}-rate`}
            name="commissionRate"
            type="number"
            step="0.1"
            min="0"
            max="100"
            defaultValue={record.commissionRate}
            className="h-8 text-sm"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs" htmlFor={`${formId}-consulting`}>諮詢費（Yumin）</Label>
          <Input
            id={`${formId}-consulting`}
            name="consultingFee"
            type="number"
            step="1"
            min="0"
            defaultValue={record.consultingFee}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs" htmlFor={`${formId}-prod`}>製作負責人（收製作費的人）</Label>
        <Select name="productionMemberId" defaultValue={record.productionMember?.id ?? ""}>
          <SelectTrigger id={`${formId}-prod`} className="w-full" size="sm">
            <SelectValue placeholder="未設定">
              {(v: string) =>
                v ? (members.find((m) => m.id === v)?.name ?? "未設定") : "未設定"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">未設定</SelectItem>
            {members
              .filter((m) => m.name !== "業務")
              .map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                  {m.account && (
                    <span className="ml-1 text-muted-foreground">({m.account.name})</span>
                  )}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          取消
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "儲存中…" : "儲存"}
        </Button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Single record management card
// ---------------------------------------------------------------------------

function RecordCard({
  record,
  members,
  accounts,
  salesMember,
  sourceAccountId,
}: {
  record: CommissionRecord
  members: MemberBase[]
  accounts: Account[]
  salesMember: MemberBase | null
  sourceAccountId?: string
}) {
  const [editing, setEditing] = useState(false)
  const [, startTransition] = useTransition()

  const isYuminProduction =
    !record.productionMember || record.productionMember.name === "Yumin"
  const showConsulting = record.consultingFee > 0

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{record.project.title}</p>
          <p className="text-sm text-muted-foreground">總金額 {fmt(record.totalAmount)}</p>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setEditing((v) => !v)}
            title="編輯"
          >
            <PencilIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            title="移除"
            onClick={() => startTransition(() => deleteCommissionRecord(record.id))}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Amounts breakdown */}
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 px-4 py-3 text-sm">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">業務佣金 ({record.commissionRate}%)</p>
          <p className="font-semibold">{fmt(record.commissionAmount)}</p>
        </div>
        {showConsulting && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">諮詢費</p>
            <p className="font-semibold">{fmt(record.consultingFee)}</p>
          </div>
        )}
        <div className={showConsulting ? "text-center" : "col-span-2 text-center"}>
          <p className="text-xs text-muted-foreground">
            製作費
            {record.productionMember && ` (${record.productionMember.name})`}
          </p>
          <p className="font-semibold">{fmt(record.productionFee)}</p>
        </div>
      </div>

      {editing && (
        <RecordEditForm record={record} members={members} onDone={() => setEditing(false)} />
      )}

      {/* Payment rows */}
      <div className="flex flex-col gap-2">
        <PaymentRow
          label="業務佣金"
          amount={record.commissionAmount}
          paidAt={record.salesPaidAt}
          recordId={record.id}
          paymentType="sales"
          accounts={accounts}
          defaultSourceAccountId={sourceAccountId}
          defaultTargetAccountId={salesMember?.account?.id}
        />
        {showConsulting && (
          <PaymentRow
            label="諮詢費 (Yumin)"
            amount={record.consultingFee}
            paidAt={record.consultingPaidAt}
            recordId={record.id}
            paymentType="consulting"
            accounts={accounts}
            defaultSourceAccountId={sourceAccountId}
            defaultTargetAccountId={
              members.find((m) => m.name === "Yumin")?.account?.id
            }
          />
        )}
        {!isYuminProduction && (
          <PaymentRow
            label={`製作費 (${record.productionMember?.name ?? "未設定"})`}
            amount={record.productionFee}
            paidAt={record.productionPaidAt}
            recordId={record.id}
            paymentType="production"
            accounts={accounts}
            defaultSourceAccountId={sourceAccountId}
            defaultTargetAccountId={record.productionMember?.account?.id}
          />
        )}
        {isYuminProduction && (
          <PaymentRow
            label="製作費 (Yumin)"
            amount={record.productionFee}
            paidAt={record.productionPaidAt}
            recordId={record.id}
            paymentType="production"
            accounts={accounts}
            defaultSourceAccountId={sourceAccountId}
            defaultTargetAccountId={
              members.find((m) => m.name === "Yumin")?.account?.id
            }
          />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sales view
// ---------------------------------------------------------------------------

function SalesPrintView({ records, month }: { records: CommissionRecord[]; month: string }) {
  const total = records.reduce((s, r) => s + r.commissionAmount, 0)
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card">
      <h2 className="mb-5 text-lg font-bold">{monthLabel(month)} 給業務</h2>

      {/* Desktop table */}
      <table className="hidden w-full text-sm sm:table">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-3 font-medium text-muted-foreground">廠商</th>
            <th className="pb-3 font-medium text-muted-foreground">總金額</th>
            <th className="pb-3 font-medium text-muted-foreground">製作費</th>
            <th className="pb-3 font-medium text-muted-foreground">佣金</th>
            <th className="pb-3 font-medium text-muted-foreground">分潤%</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-b last:border-b-0">
              <td className="py-3 font-medium">{r.project.title}</td>
              <td className="py-3">{fmt(r.totalAmount)}</td>
              <td className="py-3">{fmt(r.totalAmount - r.commissionAmount)}</td>
              <td className="py-3 font-semibold text-yellow-600">{fmt(r.commissionAmount)}</td>
              <td className="py-3">{r.commissionRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 hidden items-center justify-end gap-3 sm:flex">
        <span className="text-sm text-muted-foreground">佣金合計</span>
        <span className="rounded-full bg-yellow-50 px-4 py-1.5 font-bold text-yellow-700">
          {fmt(total)}
        </span>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {records.map((r) => (
          <div key={r.id} className="rounded-xl border p-4">
            <p className="mb-3 font-semibold">{r.project.title}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">總金額</p>
                <p className="font-semibold">{fmt(r.totalAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">製作費</p>
                <p className="font-semibold">{fmt(r.totalAmount - r.commissionAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">分潤%</p>
                <p className="font-semibold">{r.commissionRate}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">佣金</p>
                <p className="font-bold text-yellow-600">{fmt(r.commissionAmount)}</p>
              </div>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-xl bg-yellow-50 px-4 py-3">
          <span className="text-sm font-medium text-yellow-700">佣金合計</span>
          <span className="text-lg font-bold text-yellow-700">{fmt(total)}</span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Producer view (per-member)
// ---------------------------------------------------------------------------

function ProducerView({
  records,
  month,
  memberId,
  memberName,
}: {
  records: CommissionRecord[]
  month: string
  memberId: string
  memberName: string
}) {
  const filtered =
    memberName === "Yumin"
      ? records.filter((r) => !r.productionMember || r.productionMember.name === "Yumin")
      : records.filter((r) => r.productionMember?.id === memberId)

  const total = filtered.reduce((s, r) => s + r.productionFee, 0)

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6 text-sm text-muted-foreground dark:bg-card">
        本月沒有{memberName}的製作專案
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card">
      <h2 className="mb-5 text-lg font-bold">{monthLabel(month)} 給{memberName}</h2>

      {/* Desktop table */}
      <table className="hidden w-full text-sm sm:table">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-3 font-medium text-muted-foreground">廠商</th>
            <th className="pb-3 font-medium text-muted-foreground">總金額</th>
            <th className="pb-3 font-medium text-muted-foreground">業務佣金</th>
            <th className="pb-3 font-medium text-muted-foreground">諮詢費</th>
            <th className="pb-3 font-medium text-muted-foreground">製作費（實拿）</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="border-b last:border-b-0">
              <td className="py-3 font-medium">{r.project.title}</td>
              <td className="py-3">{fmt(r.totalAmount)}</td>
              <td className="py-3">{fmt(r.commissionAmount)}</td>
              <td className="py-3">{r.consultingFee > 0 ? fmt(r.consultingFee) : "—"}</td>
              <td className="py-3 font-semibold text-yellow-600">{fmt(r.productionFee)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 hidden items-center justify-end gap-3 sm:flex">
        <span className="text-sm text-muted-foreground">製作費實拿合計</span>
        <span className="rounded-full bg-yellow-50 px-4 py-1.5 font-bold text-yellow-700">
          {fmt(total)}
        </span>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {filtered.map((r) => (
          <div key={r.id} className="rounded-xl border p-4">
            <p className="mb-3 font-semibold">{r.project.title}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">總金額</p>
                <p className="font-semibold">{fmt(r.totalAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">業務佣金</p>
                <p className="font-semibold">{fmt(r.commissionAmount)}</p>
              </div>
              {r.consultingFee > 0 ? (
                <>
                  <div>
                    <p className="text-muted-foreground">諮詢費</p>
                    <p className="font-semibold">{fmt(r.consultingFee)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">製作費 (實拿)</p>
                    <p className="font-bold text-yellow-600">{fmt(r.productionFee)}</p>
                  </div>
                </>
              ) : (
                <div className="col-span-2">
                  <p className="text-muted-foreground">製作費 (實拿)</p>
                  <p className="font-bold text-yellow-600">{fmt(r.productionFee)}</p>
                </div>
              )}
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-xl bg-yellow-50 px-4 py-3">
          <span className="text-sm font-medium text-yellow-700">製作費實拿合計</span>
          <span className="text-lg font-bold text-yellow-700">{fmt(total)}</span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main board
// ---------------------------------------------------------------------------

type ViewOption = { value: string; label: string }

export function CommissionBoard({
  month,
  records,
  availableProjects,
  members,
  accounts,
  salesMember,
}: {
  month: string
  records: CommissionRecord[]
  availableProjects: ProjectBase[]
  members: MemberBase[]
  accounts: Account[]
  salesMember: MemberBase | null
}) {
  const [viewMode, setViewMode] = useState("manage")

  const sourceAccount = accounts.find((a) => a.name === "專案總收入")
  const totalCommission = records.reduce((s, r) => s + r.commissionAmount, 0)

  // Build producer options from this month's records
  const producerMap = new Map<string, { id: string; name: string }>()
  const yuminMember = members.find((m) => m.name === "Yumin")
  for (const r of records) {
    if (!r.productionMember || r.productionMember.name === "Yumin") {
      if (yuminMember) producerMap.set(yuminMember.id, { id: yuminMember.id, name: "Yumin" })
    } else {
      producerMap.set(r.productionMember.id, {
        id: r.productionMember.id,
        name: r.productionMember.name,
      })
    }
  }

  const viewOptions: ViewOption[] = [
    { value: "manage", label: "管理視圖" },
    { value: "sales", label: "業務視圖" },
    ...Array.from(producerMap.values()).map((p) => ({
      value: `producer:${p.id}`,
      label: `外包·${p.name}`,
    })),
  ]

  const activeProducer = viewMode.startsWith("producer:")
    ? Array.from(producerMap.values()).find((p) => p.id === viewMode.slice("producer:".length)) ?? null
    : null

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthNav month={month} />
        <Select value={viewMode} onValueChange={setViewMode}>
          <SelectTrigger className="h-9 w-auto rounded-full border-0 bg-foreground px-4 text-sm text-background shadow-none">
            <SelectValue placeholder="選擇視圖">
              {(v: string) => viewOptions.find((o) => o.value === v)?.label ?? "選擇視圖"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {viewOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary bar (management only) */}
      {viewMode === "manage" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/50 px-5 py-3">
          <div className="text-sm">
            <span className="font-medium">本月 {records.length} 個方案</span>
            <span className="mx-2 text-muted-foreground">·</span>
            <span className="text-muted-foreground">{tierLabel(records.length)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">
              業務佣金合計 {fmt(totalCommission)}
            </span>
            <AddProjectDialog
              month={month}
              availableProjects={availableProjects}
              members={members}
            />
          </div>
        </div>
      )}

      {/* Content */}
      {viewMode === "manage" && (
        <>
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
              <p className="text-sm font-medium">本月尚無專案</p>
              <p className="text-sm text-muted-foreground">點擊「加入專案」將副業專案加入本月分潤計算</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {records.map((r) => (
                <RecordCard
                  key={r.id}
                  record={r}
                  members={members}
                  accounts={accounts}
                  salesMember={salesMember}
                  sourceAccountId={sourceAccount?.id}
                />
              ))}
            </div>
          )}
        </>
      )}

      {viewMode === "sales" && <SalesPrintView records={records} month={month} />}

      {activeProducer && (
        <ProducerView
          records={records}
          month={month}
          memberId={activeProducer.id}
          memberName={activeProducer.name}
        />
      )}
    </div>
  )
}
