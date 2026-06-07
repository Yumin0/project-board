"use client"

import { useState } from "react"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createIncomeRecord, deleteIncomeRecord, updateIncomeRecord } from "./actions"
import { IncomeRecordForm } from "./income-record-form"

type Account = {
  id: string
  name: string
}

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
}

export function NewIncomeRecordDialog({
  account,
  accounts,
  projects,
}: {
  account: Account
  accounts: Account[]
  projects: Project[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <PlusIcon data-icon="inline-start" />
        新增收入紀錄
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增收入紀錄到「{account.name}」</DialogTitle>
        </DialogHeader>
        <IncomeRecordForm
          accounts={accounts}
          projects={projects}
          defaultAccountId={account.id}
          action={createIncomeRecord}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

export function EditIncomeRecordDialog({
  record,
  accounts,
  projects,
}: {
  record: IncomeRecord
  accounts: Account[]
  projects: Project[]
}) {
  const [open, setOpen] = useState(false)
  const boundUpdate = updateIncomeRecord.bind(null, record.id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <PencilIcon />
        <span className="sr-only">編輯這筆收入紀錄</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>編輯收入紀錄</DialogTitle>
        </DialogHeader>
        <IncomeRecordForm
          record={record}
          accounts={accounts}
          projects={projects}
          action={boundUpdate}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

export function DeleteIncomeRecordDialog({ record }: { record: IncomeRecord }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Trash2Icon />
        <span className="sr-only">刪除這筆收入紀錄</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>刪除這筆收入紀錄？</AlertDialogTitle>
          <AlertDialogDescription>此操作無法復原。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <form action={deleteIncomeRecord.bind(null, record.id)}>
            <AlertDialogAction type="submit" variant="destructive" className="w-full">
              刪除
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
