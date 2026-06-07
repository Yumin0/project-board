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
import { DeleteAccountDialog, EditAccountDialog } from "./account-dialogs"
import {
  DeleteIncomeRecordDialog,
  EditIncomeRecordDialog,
  NewIncomeRecordDialog,
} from "./income-record-dialogs"

type Project = {
  id: string
  title: string
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

type Account = {
  id: string
  name: string
  description: string | null
  records: IncomeRecord[]
}

const currencyFormatter = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium" })

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
        const total = account.records.reduce((sum, record) => sum + record.amount, 0)

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
                  <Badge variant="outline">{account.records.length} 筆紀錄</Badge>
                  <NewIncomeRecordDialog
                    account={account}
                    accounts={accountOptions}
                    projects={projects}
                  />
                </div>
              </div>

              {account.records.length === 0 ? (
                <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
                  尚無收入紀錄
                </p>
              ) : (
                <ul className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
                  {account.records.map((record) => (
                    <li
                      key={record.id}
                      className="flex items-center justify-between gap-2 rounded-lg border p-2.5"
                    >
                      <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-medium tabular-nums">
                            {currencyFormatter.format(record.amount)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {dateFormatter.format(record.date)}
                          </span>
                          {record.project && (
                            <Badge variant="secondary" className="max-w-full">
                              <span className="truncate">{record.project.title}</span>
                            </Badge>
                          )}
                        </div>
                        {record.note && (
                          <p className="truncate text-xs text-muted-foreground">{record.note}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <EditIncomeRecordDialog
                          record={record}
                          accounts={accountOptions}
                          projects={projects}
                        />
                        <DeleteIncomeRecordDialog record={record} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
