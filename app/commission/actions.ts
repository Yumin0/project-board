"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { prisma } from "@/lib/prisma"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTotalAmount(
  project: {
    customFieldValues: unknown
    category: { fields: { id: string; name: string }[] } | null
  }
): number {
  if (!project.category || !project.customFieldValues) return 0
  const field = project.category.fields.find((f) => f.name === "專案金額")
  if (!field) return 0
  const values = project.customFieldValues as Record<string, string>
  return parseInt(values[field.id] ?? "0", 10) || 0
}

function computeAmounts(totalAmount: number, commissionRate: number, consultingFee: number) {
  const commissionAmount = Math.round((totalAmount * commissionRate) / 100)
  const productionFee = totalAmount - commissionAmount - consultingFee
  return { commissionAmount, productionFee }
}

// Default rate based on how many records already exist for this month (tiered).
function defaultRate(existingCount: number): number {
  const position = existingCount + 1
  if (position <= 3) return 20
  if (position <= 6) return 25
  return 30
}

// ---------------------------------------------------------------------------
// Add project to a month's commission calculation
// ---------------------------------------------------------------------------

const addSchema = z.object({
  projectId: z.string().trim().min(1),
  month: z.string().trim().regex(/^\d{4}-\d{2}$/, "月份格式錯誤"),
  productionMemberId: z.string().trim().optional(),
})

export type AddCommissionState = {
  status: "idle" | "success" | "error"
  error?: string
}

export async function addCommissionRecord(
  _prev: AddCommissionState,
  formData: FormData
): Promise<AddCommissionState> {
  const parsed = addSchema.safeParse({
    projectId: formData.get("projectId"),
    month: formData.get("month"),
    productionMemberId: formData.get("productionMemberId") || undefined,
  })
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0]?.message ?? "輸入錯誤" }
  }

  const { projectId, month, productionMemberId } = parsed.data

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { category: { include: { fields: true } }, assignees: true },
  })
  if (!project) return { status: "error", error: "找不到此專案" }
  if (project.dashboardCategory !== "side") {
    return { status: "error", error: "只有副業專案才能加入分潤計算" }
  }

  const existing = await prisma.commissionRecord.count({ where: { month } })
  const rate = defaultRate(existing)
  const totalAmount = getTotalAmount(project)
  const { commissionAmount, productionFee } = computeAmounts(totalAmount, rate, 0)

  // Default production member: first assignee that isn't named "業務"
  let prodMemberId = productionMemberId ?? null
  if (!prodMemberId) {
    const prod = project.assignees.find((a) => a.name !== "業務")
    prodMemberId = prod?.id ?? null
  }

  await prisma.commissionRecord.create({
    data: {
      month,
      totalAmount,
      commissionRate: rate,
      commissionAmount,
      consultingFee: 0,
      productionFee,
      projectId,
      productionMemberId: prodMemberId,
    },
  })

  revalidatePath("/commission")
  return { status: "success" }
}

// ---------------------------------------------------------------------------
// Update rate / consulting fee / production member
// ---------------------------------------------------------------------------

const updateSchema = z.object({
  commissionRate: z.coerce.number().min(0).max(100),
  consultingFee: z.coerce.number().int().min(0),
  productionMemberId: z.string().trim().optional(),
})

export type UpdateCommissionState = {
  status: "idle" | "success" | "error"
  error?: string
}

export async function updateCommissionRecord(
  id: string,
  _prev: UpdateCommissionState,
  formData: FormData
): Promise<UpdateCommissionState> {
  const parsed = updateSchema.safeParse({
    commissionRate: formData.get("commissionRate"),
    consultingFee: formData.get("consultingFee"),
    productionMemberId: formData.get("productionMemberId") || undefined,
  })
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0]?.message ?? "輸入錯誤" }
  }

  const record = await prisma.commissionRecord.findUnique({ where: { id } })
  if (!record) return { status: "error", error: "找不到此紀錄" }

  const { commissionRate, consultingFee, productionMemberId } = parsed.data
  const { commissionAmount, productionFee } = computeAmounts(
    record.totalAmount,
    commissionRate,
    consultingFee
  )

  await prisma.commissionRecord.update({
    where: { id },
    data: {
      commissionRate,
      commissionAmount,
      consultingFee,
      productionFee,
      productionMemberId: productionMemberId ?? null,
    },
  })

  revalidatePath("/commission")
  return { status: "success" }
}

// ---------------------------------------------------------------------------
// Remove a project from commission calculation
// ---------------------------------------------------------------------------

export async function deleteCommissionRecord(id: string) {
  await prisma.commissionRecord.delete({ where: { id } }).catch(() => null)
  revalidatePath("/commission")
}

// ---------------------------------------------------------------------------
// Confirm payment (creates a Transfer and marks paid date)
// ---------------------------------------------------------------------------

const paymentSchema = z.object({
  commissionRecordId: z.string().trim().min(1),
  paymentType: z.enum(["sales", "consulting", "production"]),
  date: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Date.parse(v)), "請輸入有效的日期"),
  fromAccountId: z.string().trim().min(1, "請選擇轉出帳戶"),
  toAccountId: z.string().trim().min(1, "請選擇轉入帳戶"),
})

export type ConfirmPaymentState = {
  status: "idle" | "success" | "error"
  error?: string
}

const PAYMENT_LABELS: Record<string, string> = {
  sales: "業務佣金",
  consulting: "專案諮詢費",
  production: "專案製作費",
}

export async function confirmPayment(
  _prev: ConfirmPaymentState,
  formData: FormData
): Promise<ConfirmPaymentState> {
  const parsed = paymentSchema.safeParse({
    commissionRecordId: formData.get("commissionRecordId"),
    paymentType: formData.get("paymentType"),
    date: formData.get("date"),
    fromAccountId: formData.get("fromAccountId"),
    toAccountId: formData.get("toAccountId"),
  })
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0]?.message ?? "輸入錯誤" }
  }

  const { commissionRecordId, paymentType, date, fromAccountId, toAccountId } = parsed.data

  const record = await prisma.commissionRecord.findUnique({
    where: { id: commissionRecordId },
    include: { project: true },
  })
  if (!record) return { status: "error", error: "找不到此紀錄" }

  const amount =
    paymentType === "sales"
      ? record.commissionAmount
      : paymentType === "consulting"
        ? record.consultingFee
        : record.productionFee

  if (amount <= 0) return { status: "error", error: "金額必須大於 0" }

  const paidAtField =
    paymentType === "sales"
      ? "salesPaidAt"
      : paymentType === "consulting"
        ? "consultingPaidAt"
        : "productionPaidAt"

  await prisma.$transaction([
    prisma.transfer.create({
      data: {
        fromAccountId,
        toAccountId,
        amount,
        date: new Date(date),
        name: PAYMENT_LABELS[paymentType],
        note: record.project.title,
        projectId: record.projectId,
      },
    }),
    prisma.commissionRecord.update({
      where: { id: commissionRecordId },
      data: { [paidAtField]: new Date(date) },
    }),
  ])

  revalidatePath("/commission")
  revalidatePath("/accounts")
  return { status: "success" }
}

// ---------------------------------------------------------------------------
// Undo a payment (delete transfer + clear paid date)
// ---------------------------------------------------------------------------

export async function undoPayment(commissionRecordId: string, paymentType: "sales" | "consulting" | "production") {
  const paidAtField =
    paymentType === "sales"
      ? "salesPaidAt"
      : paymentType === "consulting"
        ? "consultingPaidAt"
        : "productionPaidAt"

  const record = await prisma.commissionRecord.findUnique({
    where: { id: commissionRecordId },
    include: { project: true },
  })
  if (!record) return

  const label = PAYMENT_LABELS[paymentType]

  // Find the most recent matching transfer for this project
  const transfer = await prisma.transfer.findFirst({
    where: { projectId: record.projectId, name: label },
    orderBy: { createdAt: "desc" },
  })

  await prisma.$transaction([
    ...(transfer ? [prisma.transfer.delete({ where: { id: transfer.id } })] : []),
    prisma.commissionRecord.update({
      where: { id: commissionRecordId },
      data: { [paidAtField]: null },
    }),
  ])

  revalidatePath("/commission")
  revalidatePath("/accounts")
}
