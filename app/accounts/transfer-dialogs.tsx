"use client"

import { useState } from "react"
import { ArrowRightLeftIcon, PencilIcon, Trash2Icon } from "lucide-react"

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
import { createTransfer, deleteTransfer, updateTransfer } from "./actions"
import { TransferForm } from "./transfer-form"

type Account = {
  id: string
  name: string
}

type Project = {
  id: string
  title: string
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
}

export function NewTransferDialog({
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
        <ArrowRightLeftIcon data-icon="inline-start" />
        新增轉帳
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>從「{account.name}」轉帳到其他帳戶</DialogTitle>
        </DialogHeader>
        <TransferForm
          accounts={accounts}
          projects={projects}
          defaultFromAccountId={account.id}
          action={createTransfer}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

export function EditTransferDialog({
  transfer,
  accounts,
  projects,
}: {
  transfer: Transfer
  accounts: Account[]
  projects: Project[]
}) {
  const [open, setOpen] = useState(false)
  const boundUpdate = updateTransfer.bind(null, transfer.id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <PencilIcon />
        <span className="sr-only">編輯這筆轉帳紀錄</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>編輯轉帳紀錄</DialogTitle>
        </DialogHeader>
        <TransferForm
          transfer={transfer}
          accounts={accounts}
          projects={projects}
          action={boundUpdate}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

export function DeleteTransferDialog({ transfer }: { transfer: Transfer }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Trash2Icon />
        <span className="sr-only">刪除這筆轉帳紀錄</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>刪除這筆轉帳紀錄？</AlertDialogTitle>
          <AlertDialogDescription>此操作無法復原，且會同時影響轉出與轉入兩個帳戶的餘額。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <form action={deleteTransfer.bind(null, transfer.id)}>
            <AlertDialogAction type="submit" variant="destructive" className="w-full">
              刪除
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
