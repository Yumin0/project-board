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
  assigneeIds: z.array(z.string().trim()).default([]),
})

export type ProjectFormState = {
  status: "idle" | "success" | "error"
  error?: string
  fieldErrors?: Partial<
    Record<"title" | "description" | "categoryId" | "status" | "assigneeIds", string[]>
  >
  customFieldErrors?: Record<string, string>
}

function parseProjectForm(formData: FormData) {
  const rawAssigneeIds = formData.getAll("assigneeIds").filter(
    (id): id is string => typeof id === "string" && id.length > 0
  )
  const categoryId = formData.get("categoryId")

  return projectSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    categoryId: categoryId === "__uncategorized__" ? "" : categoryId ?? "",
    status: formData.get("status") || "not_started",
    assigneeIds: rawAssigneeIds,
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
      assignees: parsed.data.assigneeIds.length > 0
        ? { connect: parsed.data.assigneeIds.map((id) => ({ id })) }
        : undefined,
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
        assignees: { set: parsed.data.assigneeIds.map((id) => ({ id })) },
      },
    })
  } catch {
    return { status: "error", error: "找不到此專案，可能已被刪除" }
  }

  revalidatePath("/projects")
  return { status: "success" }
}

export type BatchEditState = {
  status: "idle" | "success" | "error"
  error?: string
  count?: number
}

export async function batchUpdateProjects(
  _prevState: BatchEditState,
  formData: FormData
): Promise<BatchEditState> {
  const ids = formData
    .getAll("ids")
    .filter((id): id is string => typeof id === "string" && id.length > 0)

  if (ids.length === 0) {
    return { status: "error", error: "尚未選取任何專案" }
  }

  const projects = await prisma.project.findMany({
    where: { id: { in: ids } },
    include: { category: { include: { fields: true } } },
  })

  if (projects.length === 0) {
    return { status: "error", error: "找不到選取的專案，可能已被刪除" }
  }

  const sharedData: Prisma.ProjectUpdateInput = {}

  if (formData.get("enable_status") === "on") {
    const parsed = z
      .enum(["not_started", "in_progress", "completed"])
      .safeParse(formData.get("status"))
    if (!parsed.success) {
      return { status: "error", error: "請選擇有效的狀態" }
    }
    sharedData.status = parsed.data
  }

  if (formData.get("enable_assigneeIds") === "on") {
    const rawIds = formData
      .getAll("assigneeIds")
      .filter((id): id is string => typeof id === "string" && id.length > 0)
    sharedData.assignees = { set: rawIds.map((id) => ({ id })) }
  }

  // Custom fields live in a per-project JSON map keyed by field id, and field
  // ids are scoped to a category — only safe to batch-write them when every
  // selected project shares the same category.
  const categoryIds = new Set(projects.map((project) => project.categoryId))
  const sharedCategory = categoryIds.size === 1 ? projects[0].category : null

  const customFieldUpdates: Record<string, string> = {}

  if (sharedCategory) {
    for (const field of sharedCategory.fields) {
      if (formData.get(`enable_customField_${field.id}`) !== "on") continue

      const raw = formData.get(`customField_${field.id}`)
      const value = typeof raw === "string" ? raw.trim() : ""

      if (value === "" || value === SELECT_FIELD_EMPTY) {
        customFieldUpdates[field.id] = ""
        continue
      }
      if (field.type === "number" && Number.isNaN(Number(value))) {
        return { status: "error", error: `「${field.name}」請輸入有效的數字` }
      }
      if (field.type === "date" && Number.isNaN(Date.parse(value))) {
        return { status: "error", error: `「${field.name}」請輸入有效的日期` }
      }
      if (field.type === "select" && !field.options.includes(value)) {
        return { status: "error", error: `「${field.name}」請選擇有效的選項` }
      }

      customFieldUpdates[field.id] = value
    }
  }

  const hasCustomFieldUpdates = Object.keys(customFieldUpdates).length > 0

  if (Object.keys(sharedData).length === 0 && !hasCustomFieldUpdates) {
    return { status: "error", error: "請至少選擇一個要更新的欄位" }
  }

  await prisma.$transaction(
    projects.map((project) => {
      const data: Prisma.ProjectUpdateInput = { ...sharedData }

      if (hasCustomFieldUpdates) {
        const merged = {
          ...((project.customFieldValues as Record<string, string> | null) ?? {}),
        }
        for (const [fieldId, value] of Object.entries(customFieldUpdates)) {
          if (value === "") delete merged[fieldId]
          else merged[fieldId] = value
        }
        data.customFieldValues = Object.keys(merged).length > 0 ? merged : Prisma.DbNull
      }

      return prisma.project.update({ where: { id: project.id }, data })
    })
  )

  revalidatePath("/projects")
  return { status: "success", count: projects.length }
}

export async function deleteProject(id: string) {
  try {
    await prisma.project.delete({ where: { id } })
  } catch {
    // already deleted — nothing to do
  }

  revalidatePath("/projects")
}

// ---------------------------------------------------------------------------
// Quick create: a new project plus its first income record, in one step —
// used by the homepage "收入" widget's quick actions.
// ---------------------------------------------------------------------------

const quickCreateSchema = z.object({
  title: z.string().trim().min(1, "標題為必填").max(200),
  accountId: z.string().trim().min(1, "請選擇帳戶"),
  amount: z.coerce.number().int("請輸入整數金額").refine((value) => value !== 0, "金額不可為 0"),
  date: z
    .string()
    .trim()
    .min(1, "請選擇日期")
    .refine((value) => !Number.isNaN(Date.parse(value)), "請輸入有效的日期"),
  note: z.string().trim().max(500).optional(),
})

export type QuickCreateProjectState = {
  status: "idle" | "success" | "error"
  error?: string
  fieldErrors?: Partial<
    Record<"title" | "categoryId" | "accountId" | "amount" | "date" | "note", string[]>
  >
  customFieldErrors?: Record<string, string>
  projectId?: string
}

export async function createProjectWithIncome(
  _prevState: QuickCreateProjectState,
  formData: FormData
): Promise<QuickCreateProjectState> {
  const parsed = quickCreateSchema.safeParse({
    title: formData.get("title"),
    accountId: formData.get("accountId"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    note: formData.get("note") ?? "",
  })
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const rawCategoryId = formData.get("categoryId")
  const categoryId = rawCategoryId === "__uncategorized__" ? null : ((rawCategoryId as string) || null)

  const { values: customFieldValues, errors: customFieldErrors } =
    await buildCustomFieldValues(formData, categoryId)
  if (Object.keys(customFieldErrors).length > 0) {
    return { status: "error", customFieldErrors }
  }

  const { title, ...income } = parsed.data

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        title,
        categoryId,
        customFieldValues: customFieldValues ?? Prisma.DbNull,
        status: "in_progress",
      },
    })

    await tx.incomeRecord.create({
      data: {
        accountId: income.accountId,
        amount: income.amount,
        date: new Date(income.date),
        note: income.note || null,
        projectId: created.id,
      },
    })

    return created
  })

  revalidatePath("/projects")
  revalidatePath("/accounts")
  revalidatePath("/")
  return { status: "success", projectId: project.id }
}
