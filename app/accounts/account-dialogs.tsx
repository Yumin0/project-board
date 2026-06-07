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
import { createAccount, deleteAccount, updateAccount } from "./actions"
import { AccountForm } from "./account-form"

type Account = {
  id: string
  name: string
  description: string | null
}

export function NewAccountDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        新增帳戶
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增收入帳戶</DialogTitle>
        </DialogHeader>
        <AccountForm action={createAccount} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

export function EditAccountDialog({ account }: { account: Account }) {
  const [open, setOpen] = useState(false)
  const boundUpdate = updateAccount.bind(null, account.id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <PencilIcon />
        <span className="sr-only">編輯「{account.name}」</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>編輯帳戶</DialogTitle>
        </DialogHeader>
        <AccountForm account={account} action={boundUpdate} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

export function DeleteAccountDialog({ account }: { account: Account }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Trash2Icon />
        <span className="sr-only">刪除「{account.name}」</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>刪除「{account.name}」？</AlertDialogTitle>
          <AlertDialogDescription>
            此操作無法復原，這個帳戶底下的所有收入紀錄也會一併刪除。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <form action={deleteAccount.bind(null, account.id)}>
            <AlertDialogAction type="submit" variant="destructive" className="w-full">
              刪除
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
