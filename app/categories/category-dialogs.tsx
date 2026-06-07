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
import { createCategory, deleteCategory, updateCategory } from "./actions"
import { CategoryForm } from "./category-form"

type Category = {
  id: string
  name: string
  fields: { id: string; name: string; type: string; options: string[] }[]
}

export function NewCategoryDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        新增類別
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增類別</DialogTitle>
        </DialogHeader>
        <CategoryForm action={createCategory} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

export function EditCategoryDialog({ category }: { category: Category }) {
  const [open, setOpen] = useState(false)
  const boundUpdate = updateCategory.bind(null, category.id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <PencilIcon />
        <span className="sr-only">編輯「{category.name}」</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>編輯類別</DialogTitle>
        </DialogHeader>
        <CategoryForm
          category={category}
          action={boundUpdate}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

export function DeleteCategoryDialog({ category }: { category: Category }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Trash2Icon />
        <span className="sr-only">刪除「{category.name}」</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>刪除「{category.name}」？</AlertDialogTitle>
          <AlertDialogDescription>
            此操作無法復原，使用此類別的專案將變成未分類，已填寫的固定欄位內容也會一併消失。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <form action={deleteCategory.bind(null, category.id)}>
            <AlertDialogAction
              type="submit"
              variant="destructive"
              className="w-full"
            >
              刪除
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
