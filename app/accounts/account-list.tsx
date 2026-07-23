"use client"

import { useMemo, useState } from "react"
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon, SearchIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { DeleteAccountDialog, EditAccountDialog } from "./account-dialogs"
import {
  DeleteIncomeRecordDialog,
  EditIncomeRecordDialog,
  NewIncomeRecordDialog,
} from "./income-record-dialogs"
import { DeleteTransferDialog, EditTransferDialog, NewTransferDialog } from "./transfer-dialogs"

type Project = {
  id: string
  title: string
}

type AccountRef = {
  id: string
  name: string
}

type IncomeRecord = {
  id: string
  accountId: string
  amount: number
  date: Date
  note: string | null
  projectId: string | null
  project: Project | null
}

type Transfer = {
  id: string
  fromAccountId: string
  toAccountId: string
  amount: number
  date: Date
  name: string | null
  note: string | null
  projectId: string | null
  project: Project | null
  fromAccount?: AccountRef
  toAccount?: AccountRef
}

type Account = {
  id: string
  name: string
  description: string | null
  records: IncomeRecord[]
  transfersOut: Transfer[]
  transfersIn: Transfer[]
}

const currencyFormatter = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
})

const signedCurrencyFormatter = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
  signDisplay: "always",
})

const dateFormatter = new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium" })

// A unified, chronological view of everything that moved money in or out of
// an account: income landing directly in it, plus the two sides of internal
// transfers (the same Transfer row shows up as an outflow for the source
// account and an inflow for the destination account). Each entry is flattened
// into the discrete fields the table renders as sortable / filterable columns.
type LedgerEntry = {
  key: string
  kind: "income" | "transfer"
  typeLabel: "收入" | "轉入" | "轉出"
  signedAmount: number
  date: Date
  account: AccountRef
  counterpart: AccountRef | null
  item: string | null
  project: Project | null
  note: string | null
  record?: IncomeRecord
  transfer?: Transfer
  direction?: "in" | "out"
}

function buildLedger(account: Account): LedgerEntry[] {
  const ref: AccountRef = { id: account.id, name: account.name }

  return [
    ...account.records.map((record): LedgerEntry => ({
      key: `income-${record.id}`,
      kind: "income",
      typeLabel: "收入",
      signedAmount: record.amount,
      date: record.date,
      account: ref,
      counterpart: null,
      item: null,
      project: record.project,
      note: record.note,
      record,
    })),
    ...account.transfersOut.map((transfer): LedgerEntry => ({
      key: `transfer-out-${transfer.id}`,
      kind: "transfer",
      typeLabel: "轉出",
      signedAmount: -transfer.amount,
      date: transfer.date,
      account: ref,
      counterpart: transfer.toAccount ?? null,
      item: transfer.name,
      project: transfer.project,
      note: transfer.note,
      transfer,
      direction: "out",
    })),
    ...account.transfersIn.map((transfer): LedgerEntry => ({
      key: `transfer-in-${transfer.id}`,
      kind: "transfer",
      typeLabel: "轉入",
      signedAmount: transfer.amount,
      date: transfer.date,
      account: ref,
      counterpart: transfer.fromAccount ?? null,
      item: transfer.name,
      project: transfer.project,
      note: transfer.note,
      transfer,
      direction: "in",
    })),
  ]
}

const ALL = "__all__"

type SortColumn = "date" | "project" | "amount"
type SortDir = "asc" | "desc"

export function AccountList({
  accounts,
  projects,
}: {
  accounts: Account[]
  projects: Project[]
}) {
  const accountOptions = accounts.map(({ id, name }) => ({ id, name }))
  const [selectedId, setSelectedId] = useState<string>(ALL)
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<{ column: SortColumn; dir: SortDir }>({
    column: "date",
    dir: "desc",
  })

  // Per-account total plus the flat ledger for every account.
  const { totals, ledger } = useMemo(() => {
    const totals = new Map<string, number>()
    const ledger: LedgerEntry[] = []

    for (const account of accounts) {
      const entries = buildLedger(account)
      totals.set(
        account.id,
        entries.reduce((sum, entry) => sum + entry.signedAmount, 0)
      )
      ledger.push(...entries)
    }

    return { totals, ledger }
  }, [accounts])

  const selectedAccount =
    selectedId === ALL ? null : accounts.find((account) => account.id === selectedId) ?? null

  const grandTotal = accounts.reduce((sum, account) => sum + (totals.get(account.id) ?? 0), 0)

  // Filter by the selected account, then by the free-text query, then sort by
  // the active column. The result is what the table renders.
  const visibleLedger = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()

    const filtered = ledger.filter((entry) => {
      if (selectedId !== ALL && entry.account.id !== selectedId) return false
      if (!needle) return true
      const haystack = [
        entry.project?.title,
        entry.item,
        entry.note,
        entry.account.name,
        entry.counterpart?.name,
        entry.typeLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase()
      return haystack.includes(needle)
    })

    const dir = sort.dir === "asc" ? 1 : -1
    return filtered.sort((a, b) => {
      let cmp = 0
      if (sort.column === "date") cmp = a.date.getTime() - b.date.getTime()
      else if (sort.column === "amount") cmp = a.signedAmount - b.signedAmount
      else cmp = (a.project?.title ?? "").localeCompare(b.project?.title ?? "", "zh-Hant")
      // Stable tiebreaker so equal keys keep a deterministic order.
      if (cmp === 0) cmp = a.date.getTime() - b.date.getTime()
      return cmp * dir
    })
  }, [ledger, selectedId, query, sort])

  function toggleSort(column: SortColumn) {
    setSort((prev) =>
      prev.column === column
        ? { column, dir: prev.dir === "asc" ? "desc" : "asc" }
        : // Text defaults to A→Z; date / amount default to newest / largest first.
          { column, dir: column === "project" ? "asc" : "desc" }
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed py-16 text-center">
        <p className="text-sm font-medium">還沒有任何收入帳戶</p>
        <p className="text-sm text-muted-foreground">
          點擊「新增帳戶」建立像「Yumin收入帳戶」這樣的虛擬帳戶來記錄收入
        </p>
      </div>
    )
  }

  const colSpan = selectedId === ALL ? 7 : 6

  return (
    <div className="flex flex-col gap-5">
      {/* Balance summary cards double as account filters. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => setSelectedId(ALL)}
          className={cn(
            "flex flex-col gap-1 rounded-xl bg-card px-4 py-3 text-left ring-1 ring-foreground/10 transition-colors hover:bg-muted/50",
            selectedId === ALL && "ring-2 ring-primary hover:bg-card"
          )}
        >
          <span className="text-xs text-muted-foreground">全部帳戶</span>
          <span className="text-xl font-semibold tabular-nums">
            {currencyFormatter.format(grandTotal)}
          </span>
          <span className="text-xs text-muted-foreground">{ledger.length} 筆紀錄</span>
        </button>

        {accounts.map((account) => {
          const total = totals.get(account.id) ?? 0
          const count =
            account.records.length + account.transfersOut.length + account.transfersIn.length
          const active = selectedId === account.id

          return (
            <button
              key={account.id}
              type="button"
              onClick={() => setSelectedId(account.id)}
              className={cn(
                "flex flex-col gap-1 rounded-xl bg-card px-4 py-3 text-left ring-1 ring-foreground/10 transition-colors hover:bg-muted/50",
                active && "ring-2 ring-primary hover:bg-card"
              )}
            >
              <span className="truncate text-xs text-muted-foreground">{account.name}</span>
              <span className="text-xl font-semibold tabular-nums">
                {currencyFormatter.format(total)}
              </span>
              <span className="text-xs text-muted-foreground">{count} 筆紀錄</span>
            </button>
          )
        })}
      </div>

      {/* Toolbar: current filter title + relevant actions. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-lg font-semibold">
            {selectedAccount ? selectedAccount.name : "全部帳戶明細"}
          </h2>
          {selectedAccount?.description && (
            <span className="hidden truncate text-sm text-muted-foreground sm:inline">
              {selectedAccount.description}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <NewIncomeRecordDialog
            account={selectedAccount ?? accountOptions[0]}
            accounts={accountOptions}
            projects={projects}
          />
          <NewTransferDialog
            account={selectedAccount ?? accountOptions[0]}
            accounts={accountOptions}
            projects={projects}
          />
          {selectedAccount && (
            <>
              <EditAccountDialog account={selectedAccount} />
              <DeleteAccountDialog account={selectedAccount} />
            </>
          )}
        </div>
      </div>

      {/* Search across project / item / note / account. */}
      <div className="relative max-w-sm">
        <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜尋廠商、專案、項目、備註…"
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SortableHead
                className="w-28"
                active={sort.column === "date"}
                dir={sort.dir}
                onClick={() => toggleSort("date")}
              >
                日期
              </SortableHead>
              {selectedId === ALL && <TableHead className="w-32">帳戶</TableHead>}
              <TableHead className="w-20">類型</TableHead>
              <TableHead className="w-28">項目</TableHead>
              <SortableHead
                active={sort.column === "project"}
                dir={sort.dir}
                onClick={() => toggleSort("project")}
              >
                專案
              </SortableHead>
              <SortableHead
                className="w-32"
                align="right"
                active={sort.column === "amount"}
                dir={sort.dir}
                onClick={() => toggleSort("amount")}
              >
                金額
              </SortableHead>
              <TableHead className="w-20 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleLedger.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={colSpan} className="py-12 text-center text-sm text-muted-foreground">
                  {query.trim() ? "找不到符合的紀錄" : "尚無收支紀錄"}
                </TableCell>
              </TableRow>
            ) : (
              visibleLedger.map((entry) => (
                <TableRow key={entry.key}>
                  <TableCell className="align-top text-sm whitespace-nowrap text-muted-foreground">
                    {dateFormatter.format(entry.date)}
                  </TableCell>
                  {selectedId === ALL && (
                    <TableCell className="align-top text-sm font-medium">
                      <span className="block truncate">{entry.account.name}</span>
                    </TableCell>
                  )}
                  <TableCell className="align-top">
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0",
                        entry.typeLabel === "轉出" && "text-destructive"
                      )}
                    >
                      {entry.typeLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top text-sm whitespace-normal">
                    {entry.item ? (
                      <span>{entry.item}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="align-top whitespace-normal">
                    {entry.project ? (
                      <span className="text-sm">{entry.project.title}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                    {entry.note && entry.note !== entry.project?.title && entry.note !== entry.item && (
                      <p className="break-words text-xs text-muted-foreground">{entry.note}</p>
                    )}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "align-top text-right font-medium whitespace-nowrap tabular-nums",
                      entry.signedAmount < 0 && "text-destructive"
                    )}
                  >
                    {signedCurrencyFormatter.format(entry.signedAmount)}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex items-center justify-end gap-0.5">
                      {entry.kind === "income" && entry.record ? (
                        <>
                          <EditIncomeRecordDialog
                            record={entry.record}
                            accounts={accountOptions}
                            projects={projects}
                          />
                          <DeleteIncomeRecordDialog record={entry.record} />
                        </>
                      ) : entry.transfer ? (
                        <>
                          <EditTransferDialog
                            transfer={entry.transfer}
                            accounts={accountOptions}
                            projects={projects}
                          />
                          <DeleteTransferDialog transfer={entry.transfer} />
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function SortableHead({
  children,
  active,
  dir,
  onClick,
  align = "left",
  className,
}: {
  children: React.ReactNode
  active: boolean
  dir: SortDir
  onClick: () => void
  align?: "left" | "right"
  className?: string
}) {
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:text-foreground",
          align === "right" ? "flex-row-reverse" : "flex-row",
          active ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {children}
        {active ? (
          dir === "asc" ? (
            <ArrowUpIcon className="size-3.5" />
          ) : (
            <ArrowDownIcon className="size-3.5" />
          )
        ) : (
          <ChevronsUpDownIcon className="size-3.5 opacity-50" />
        )}
      </button>
    </TableHead>
  )
}
