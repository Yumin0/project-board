"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
// account and an inflow for the destination account).
type LedgerEntry =
  | { kind: "income"; key: string; signedAmount: number; date: Date; record: IncomeRecord }
  | {
      kind: "transfer"
      key: string
      signedAmount: number
      date: Date
      direction: "in" | "out"
      transfer: Transfer
      counterpart?: AccountRef
    }

function buildLedger(account: Account): LedgerEntry[] {
  const entries: LedgerEntry[] = [
    ...account.records.map((record): LedgerEntry => ({
      kind: "income",
      key: `income-${record.id}`,
      signedAmount: record.amount,
      date: record.date,
      record,
    })),
    ...account.transfersOut.map((transfer): LedgerEntry => ({
      kind: "transfer",
      key: `transfer-out-${transfer.id}`,
      signedAmount: -transfer.amount,
      date: transfer.date,
      direction: "out",
      transfer,
      counterpart: transfer.toAccount,
    })),
    ...account.transfersIn.map((transfer): LedgerEntry => ({
      kind: "transfer",
      key: `transfer-in-${transfer.id}`,
      signedAmount: transfer.amount,
      date: transfer.date,
      direction: "in",
      transfer,
      counterpart: transfer.fromAccount,
    })),
  ]

  return entries.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export function AccountList({
  accounts,
  projects,
}: {
  accounts: Account[]
  projects: Project[]
}) {
  const accountOptions = accounts.map(({ id, name }) => ({ id, name }))

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

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {accounts.map((account) => {
        const ledger = buildLedger(account)
        const total = ledger.reduce((sum, entry) => sum + entry.signedAmount, 0)

        return (
          <Card key={account.id}>
            <CardHeader>
              <CardTitle>{account.name}</CardTitle>
              {account.description && (
                <CardDescription className="line-clamp-2">{account.description}</CardDescription>
              )}
              <CardAction className="flex gap-1">
                <EditAccountDialog account={account} />
                <DeleteAccountDialog account={account} />
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-2xl font-semibold tabular-nums">
                  {currencyFormatter.format(total)}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{ledger.length} 筆紀錄</Badge>
                  <NewIncomeRecordDialog
                    account={account}
                    accounts={accountOptions}
                    projects={projects}
                  />
                  <NewTransferDialog
                    account={account}
                    accounts={accountOptions}
                    projects={projects}
                  />
                </div>
              </div>

              {ledger.length === 0 ? (
                <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
                  尚無收支紀錄
                </p>
              ) : (
                <div className="max-h-80 overflow-y-auto rounded-lg border">
                  <Table className="table-fixed">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-16">日期</TableHead>
                        <TableHead>內容</TableHead>
                        <TableHead className="w-24 text-right">金額</TableHead>
                        <TableHead className="w-16 text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledger.map((entry) => {
                        const project =
                          entry.kind === "income" ? entry.record.project : entry.transfer.project
                        const note = entry.kind === "income" ? entry.record.note : entry.transfer.note

                        return (
                          <TableRow key={entry.key}>
                            <TableCell className="text-xs text-muted-foreground">
                              {dateFormatter.format(entry.date)}
                            </TableCell>
                            <TableCell className="whitespace-normal">
                              <div className="flex flex-col items-start gap-1">
                                <div className="flex flex-wrap items-center gap-1">
                                  {entry.kind === "income" ? (
                                    <Badge variant="outline">收入</Badge>
                                  ) : (
                                    <Badge variant="outline">
                                      {entry.direction === "in" ? "轉入" : "轉出"}
                                      {entry.counterpart ? `．${entry.counterpart.name}` : ""}
                                    </Badge>
                                  )}
                                  {entry.kind === "transfer" && entry.transfer.name && (
                                    <Badge variant="secondary">{entry.transfer.name}</Badge>
                                  )}
                                  {project && (
                                    <Badge variant="secondary" className="max-w-full">
                                      <span className="truncate">{project.title}</span>
                                    </Badge>
                                  )}
                                </div>
                                {note && (
                                  <p className="w-full break-words text-xs text-muted-foreground">
                                    {note}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-right font-medium tabular-nums",
                                entry.signedAmount < 0 && "text-destructive"
                              )}
                            >
                              {signedCurrencyFormatter.format(entry.signedAmount)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-0.5">
                                {entry.kind === "income" ? (
                                  <>
                                    <EditIncomeRecordDialog
                                      record={entry.record}
                                      accounts={accountOptions}
                                      projects={projects}
                                    />
                                    <DeleteIncomeRecordDialog record={entry.record} />
                                  </>
                                ) : (
                                  <>
                                    <EditTransferDialog
                                      transfer={entry.transfer}
                                      accounts={accountOptions}
                                      projects={projects}
                                    />
                                    <DeleteTransferDialog transfer={entry.transfer} />
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
