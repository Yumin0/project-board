import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DeleteCategoryDialog, EditCategoryDialog } from "./category-dialogs"

type Category = {
  id: string
  name: string
  fields: {
    id: string
    name: string
    type: string
    options: string[]
    hiddenOptions: string[]
  }[]
  _count: { projects: number }
}

const fieldTypeLabel: Record<string, string> = {
  text: "文字",
  number: "數字",
  date: "日期",
  select: "下拉選單",
}

export function CategoryList({ categories }: { categories: Category[] }) {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed py-16 text-center">
        <p className="text-sm font-medium">還沒有任何類別</p>
        <p className="text-sm text-muted-foreground">
          點擊「新增類別」設定像「副業」這樣的分類，並加上專屬的固定欄位
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <Card key={category.id}>
          <CardHeader>
            <CardTitle>{category.name}</CardTitle>
            <CardDescription>
              {category._count.projects} 個專案使用此類別
            </CardDescription>
            <CardAction className="flex gap-1">
              <EditCategoryDialog category={category} />
              <DeleteCategoryDialog category={category} />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-1.5">
            {category.fields.length === 0 ? (
              <p className="text-sm text-muted-foreground">尚未設定固定欄位</p>
            ) : (
              category.fields.map((field) => (
                <Badge key={field.id} variant="outline">
                  {field.name} · {fieldTypeLabel[field.type] ?? field.type}
                </Badge>
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
