"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import { z } from "zod"

import { prisma } from "@/lib/prisma"

// Must match the placeholder sentinel used by the select-type custom field in project-form.tsx
const SELECT_FIELD_EMPTY = "__empty__"

const projectSchema = z.object({
  title: z.string().trim().min(1, "標題為必填").max(200),
  description: z.string().trim().max(2000).optional(),
  categoryId: z.string().trim().optional(),
  status: z.enum(["not_started", "in_progress", "completed"]),
  assigneeId: z.string().trim().optional(),
})

export type ProjectFormState = {
  status: "idle" | "success" | "error"
  error?: string
  fieldErrors?: Partial<
    Record<"title" | "description" | "categoryId" | "status" | "assigneeId", string[]>
  >
  customFieldErrors?: Record<string, string>
}

function parseProjectForm(formData: FormData) {
  const assigneeId = formData.get("assigneeId")
  const categoryId = formData.get("categoryId")

  return projectSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    categoryId: categoryId === "__uncategorized__" ? "" : categoryId ?? "",
    status: formData.get("status") || "not_started",
    assigneeId: assigneeId === "__unassigned__" ? "" : assigneeId ?? "",
  })
}

async function buildCustomFieldValues(formData: FormData, categoryId: string | null) {
  if (!categoryId) {
    return { values: null as Record<string, string> | null, errors: {} as Record<string, string> }
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { fields: true },
  })

  if (!category) {
    return { values: null, errors: {} }
  }

  const values: Record<string, string> = {}
  const errors: Record<string, string> = {}

  for (const field of category.fields) {
    const raw = formData.get(`customField_${field.id}`)
    const value = typeof raw === "string" ? raw.trim() : ""

    if (value === "" || value === SELECT_FIELD_EMPTY) continue

    if (field.type === "number" && Number.isNaN(Number(value))) {
      errors[field.id] = "請輸入有效的數字"
      continue
    }
    if (field.type === "date" && Number.isNaN(Date.parse(value))) {
      errors[field.id] = "請輸入有效的日期"
      continue
    }
    if (field.type === "select" && !field.options.includes(value)) {
      errors[field.id] = "請選擇有效的選項"
      continue
    }

    values[field.id] = value
  }

  return {
    values: Object.keys(values).length > 0 ? values : null,
    errors,
  }
}

export async function createProject(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const parsed = parseProjectForm(formData)
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const categoryId = parsed.data.categoryId || null
  const { values: customFieldValues, errors: customFieldErrors } =
    await buildCustomFieldValues(formData, categoryId)

  if (Object.keys(customFieldErrors).length > 0) {
    return { status: "error", customFieldErrors }
  }

  await prisma.project.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      categoryId,
      customFieldValues: customFieldValues ?? Prisma.DbNull,
      status: parsed.data.status,
      assigneeId: parsed.data.assigneeId || null,
    },
  })

  revalidatePath("/projects")
  return { status: "success" }
}

export async function updateProject(
  id: string,
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const parsed = parseProjectForm(formData)
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const categoryId = parsed.data.categoryId || null
  const { values: customFieldValues, errors: customFieldErrors } =
    await buildCustomFieldValues(formData, categoryId)

  if (Object.keys(customFieldErrors).length > 0) {
    return { status: "error", customFieldErrors }
  }

  try {
    await prisma.project.update({
      where: { id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        categoryId,
        customFieldValues: customFieldValues ?? Prisma.DbNull,
        status: parsed.data.status,
        assigneeId: parsed.data.assigneeId || null,
      },
    })
  } catch {
    return { status: "error", error: "找不到此專案，可能已被刪除" }
  }

  revalidatePath("/projects")
  return { status: "success" }
}

export async function deleteProject(id: string) {
  try {
    await prisma.project.delete({ where: { id } })
  } catch {
    // already deleted — nothing to do
  }

  revalidatePath("/projects")
}
