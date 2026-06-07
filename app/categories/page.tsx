import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { CategoryList } from "./category-list"
import { NewCategoryDialog } from "./category-dialogs"

export const dynamic = "force-dynamic"

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      fields: { orderBy: { order: "asc" } },
      _count: { select: { projects: true } },
    },
    orderBy: { name: "asc" },
  })

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 sm:p-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/projects"
            className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            返回專案
          </Link>
          <h1 className="font-heading text-2xl font-semibold">類別</h1>
          <p className="text-sm text-muted-foreground">
            管理專案類別，並為每個類別設定專屬的固定欄位
          </p>
        </div>
        <NewCategoryDialog />
      </div>

      <CategoryList categories={categories} />
    </div>
  )
}
