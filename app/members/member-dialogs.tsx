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
import { createMember, deleteMember, updateMember } from "./actions"
import { MemberForm } from "./member-form"

type Member = {
  id: string
  name: string
  accountId?: string | null
}

type Account = { id: string; name: string }

export function NewMemberDialog({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        新增成員
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增成員</DialogTitle>
        </DialogHeader>
        <MemberForm accounts={accounts} action={createMember} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

export function EditMemberDialog({ member, accounts }: { member: Member; accounts: Account[] }) {
  const [open, setOpen] = useState(false)
  const boundUpdate = updateMember.bind(null, member.id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <PencilIcon />
        <span className="sr-only">編輯「{member.name}」</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>編輯成員</DialogTitle>
        </DialogHeader>
        <MemberForm member={member} accounts={accounts} action={boundUpdate} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

export function DeleteMemberDialog({ member }: { member: Member }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Trash2Icon />
        <span className="sr-only">刪除「{member.name}」</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>刪除「{member.name}」？</AlertDialogTitle>
          <AlertDialogDescription>
            此操作無法復原，這位成員負責的專案將變成未指派負責人。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <form action={deleteMember.bind(null, member.id)}>
            <AlertDialogAction type="submit" variant="destructive" className="w-full">
              刪除
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
