"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import { z } from "zod"

import { prisma } from "@/lib/prisma"

const fieldSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1, "欄位名稱為必填").max(50),
    type: z.enum(["text", "number", "date", "select"]),
    options: z.array(z.string().trim().min(1).max(50)).max(50).default([]),
    hiddenOptions: z.array(z.string().trim().min(1).max(50)).max(50).default([]),
  })
  .refine((field) => field.type !== "select" || field.options.length > 0, {
    message: "下拉選單至少需要一個選項",
    path: ["options"],
  })

const categorySchema = z.object({
  name: z.string().trim().min(1, "名稱為必填").max(100),
  fields: z.array(fieldSchema).max(30),
})

export type CategoryFormState = {
  status: "idle" | "success" | "error"
  error?: string
  fieldErrors?: Partial<Record<"name" | "fields", string[]>>
}

function parseCategoryForm(formData: FormData) {
  const rawFields = formData.get("fields")
  let fields: unknown = []

  if (typeof rawFields === "string" && rawFields.trim()) {
    try {
      fields = JSON.parse(rawFields)
    } catch {
      return { ok: false as const, error: "欄位資料格式錯誤" }
    }
  }

  return {
    ok: true as const,
    parsed: categorySchema.safeParse({
      name: formData.get("name"),
      fields,
    }),
  }
}

// Non-select fields carry no options at all, and a hidden option only makes
// sense while it still exists in `options`.
function normalizeOptions(field: z.infer<typeof fieldSchema>) {
  if (field.type !== "select") {
    return { options: [], hiddenOptions: [] }
  }
  return {
    options: field.options,
    hiddenOptions: field.hiddenOptions.filter((option) =>
      field.options.includes(option)
    ),
  }
}

// Prisma errors are many lines long and would blow up the dialog layout; the
// last non-empty line is the part that actually says what went wrong.
function shortErrorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error)
  const lastLine = raw.split("\n").filter((line) => line.trim()).pop() ?? raw
  return lastLine.trim().slice(0, 200)
}

function isUniqueNameViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  )
}

export async function createCategory(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const form = parseCategoryForm(formData)
  if (!form.ok) {
    return { status: "error", error: form.error }
  }
  if (!form.parsed.success) {
    return { status: "error", fieldErrors: form.parsed.error.flatten().fieldErrors }
  }

  const { name, fields } = form.parsed.data

  try {
    await prisma.category.create({
      data: {
        name,
        fields: {
          create: fields.map((field, index) => ({
            name: field.name,
            type: field.type,
            ...normalizeOptions(field),
            order: index,
          })),
        },
      },
    })
  } catch (error) {
    if (isUniqueNameViolation(error)) {
      return { status: "error", fieldErrors: { name: ["已有相同名稱的類別"] } }
    }
    throw error
  }

  revalidatePath("/categories")
  revalidatePath("/projects")
  return { status: "success" }
}

export async function updateCategory(
  id: string,
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const form = parseCategoryForm(formData)
  if (!form.ok) {
    return { status: "error", error: form.error }
  }
  if (!form.parsed.success) {
    return { status: "error", fieldErrors: form.parsed.error.flatten().fieldErrors }
  }

  const { name, fields } = form.parsed.data
  const keepIds = fields.flatMap((field) => (field.id ? [field.id] : []))

  try {
    await prisma.$transaction([
      prisma.category.update({ where: { id }, data: { name } }),
      prisma.categoryField.deleteMany({
        where: { categoryId: id, id: { notIn: keepIds } },
      }),
      ...fields.map((field, index) => {
        const options = normalizeOptions(field)
        return field.id
          ? prisma.categoryField.update({
              where: { id: field.id },
              data: { name: field.name, type: field.type, ...options, order: index },
            })
          : prisma.categoryField.create({
              data: {
                categoryId: id,
                name: field.name,
                type: field.type,
                ...options,
                order: index,
              },
            })
      }),
    ])
  } catch (error) {
    if (isUniqueNameViolation(error)) {
      return { status: "error", fieldErrors: { name: ["已有相同名稱的類別"] } }
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { status: "error", error: "找不到此類別，可能已被刪除" }
    }
    // Anything else is a real bug — surface it instead of blaming the category.
    // The full stack goes to the server log; the dialog only gets a short hint.
    console.error("updateCategory failed", error)
    return { status: "error", error: `儲存失敗：${shortErrorMessage(error)}` }
  }

  revalidatePath("/categories")
  revalidatePath("/projects")
  return { status: "success" }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({ where: { id } })
  } catch {
    // already deleted — nothing to do
  }

  revalidatePath("/categories")
  revalidatePath("/projects")
}
