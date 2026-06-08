"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import { z } from "zod"

import { prisma } from "@/lib/prisma"

const NO_PROJECT = "__no_project__"

function isUniqueNameViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

const accountSchema = z.object({
  name: z.string().trim().min(1, "名稱為必填").max(100),
  description: z.string().trim().max(500).optional(),
})

export type AccountFormState = {
  status: "idle" | "success" | "error"
  error?: string
  fieldErrors?: Partial<Record<"name" | "description", string[]>>
}

function parseAccountForm(formData: FormData) {
  return accountSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  })
}

export async function createAccount(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const parsed = parseAccountForm(formData)
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  try {
    await prisma.account.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
      },
    })
  } catch (error) {
    if (isUniqueNameViolation(error)) {
      return { status: "error", fieldErrors: { name: ["已有相同名稱的帳戶"] } }
    }
    throw error
  }

  revalidatePath("/accounts")
  return { status: "success" }
}

export async function updateAccount(
  id: string,
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const parsed = parseAccountForm(formData)
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  try {
    await prisma.account.update({
      where: { id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
      },
    })
  } catch (error) {
    if (isUniqueNameViolation(error)) {
      return { status: "error", fieldErrors: { name: ["已有相同名稱的帳戶"] } }
    }
    return { status: "error", error: "找不到此帳戶，可能已被刪除" }
  }

  revalidatePath("/accounts")
  return { status: "success" }
}

export async function deleteAccount(id: string) {
  try {
    await prisma.account.delete({ where: { id } })
  } catch {
    // already deleted — nothing to do
  }

  revalidatePath("/accounts")
}

const incomeRecordSchema = z.object({
  accountId: z.string().trim().min(1, "請選擇帳戶"),
  amount: z.coerce.number().int("請輸入整數金額").refine((value) => value !== 0, "金額不可為 0"),
  date: z
    .string()
    .trim()
    .min(1, "請選擇日期")
    .refine((value) => !Number.isNaN(Date.parse(value)), "請輸入有效的日期"),
  note: z.string().trim().max(500).optional(),
  projectId: z.string().trim().optional(),
})

export type IncomeRecordFormState = {
  status: "idle" | "success" | "error"
  error?: string
  fieldErrors?: Partial<Record<"accountId" | "amount" | "date" | "note" | "projectId", string[]>>
}

function parseIncomeRecordForm(formData: FormData) {
  const projectId = formData.get("projectId")

  return incomeRecordSchema.safeParse({
    accountId: formData.get("accountId"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    note: formData.get("note") ?? "",
    projectId: projectId === NO_PROJECT ? "" : projectId ?? "",
  })
}

export async function createIncomeRecord(
  _prevState: IncomeRecordFormState,
  formData: FormData
): Promise<IncomeRecordFormState> {
  const parsed = parseIncomeRecordForm(formData)
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  await prisma.incomeRecord.create({
    data: {
      accountId: parsed.data.accountId,
      amount: parsed.data.amount,
      date: new Date(parsed.data.date),
      note: parsed.data.note || null,
      projectId: parsed.data.projectId || null,
    },
  })

  revalidatePath("/accounts")
  return { status: "success" }
}

export async function updateIncomeRecord(
  id: string,
  _prevState: IncomeRecordFormState,
  formData: FormData
): Promise<IncomeRecordFormState> {
  const parsed = parseIncomeRecordForm(formData)
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  try {
    await prisma.incomeRecord.update({
      where: { id },
      data: {
        accountId: parsed.data.accountId,
        amount: parsed.data.amount,
        date: new Date(parsed.data.date),
        note: parsed.data.note || null,
        projectId: parsed.data.projectId || null,
      },
    })
  } catch {
    return { status: "error", error: "找不到此收入紀錄，可能已被刪除" }
  }

  revalidatePath("/accounts")
  return { status: "success" }
}

export async function deleteIncomeRecord(id: string) {
  try {
    await prisma.incomeRecord.delete({ where: { id } })
  } catch {
    // already deleted — nothing to do
  }

  revalidatePath("/accounts")
}

const transferSchema = z
  .object({
    fromAccountId: z.string().trim().min(1, "請選擇轉出帳戶"),
    toAccountId: z.string().trim().min(1, "請選擇轉入帳戶"),
    amount: z.coerce.number().int("請輸入整數金額").positive("金額需大於 0"),
    date: z
      .string()
      .trim()
      .min(1, "請選擇日期")
      .refine((value) => !Number.isNaN(Date.parse(value)), "請輸入有效的日期"),
    name: z.string().trim().max(100).optional(),
    note: z.string().trim().max(500).optional(),
    projectId: z.string().trim().optional(),
  })
  .refine((value) => value.fromAccountId !== value.toAccountId, {
    message: "轉出與轉入帳戶不可相同",
    path: ["toAccountId"],
  })

export type TransferFormState = {
  status: "idle" | "success" | "error"
  error?: string
  fieldErrors?: Partial<
    Record<"fromAccountId" | "toAccountId" | "amount" | "date" | "name" | "note" | "projectId", string[]>
  >
}

function parseTransferForm(formData: FormData) {
  const projectId = formData.get("projectId")

  return transferSchema.safeParse({
    fromAccountId: formData.get("fromAccountId"),
    toAccountId: formData.get("toAccountId"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    name: formData.get("name") ?? "",
    note: formData.get("note") ?? "",
    projectId: projectId === NO_PROJECT ? "" : projectId ?? "",
  })
}

export async function createTransfer(
  _prevState: TransferFormState,
  formData: FormData
): Promise<TransferFormState> {
  const parsed = parseTransferForm(formData)
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  await prisma.transfer.create({
    data: {
      fromAccountId: parsed.data.fromAccountId,
      toAccountId: parsed.data.toAccountId,
      amount: parsed.data.amount,
      date: new Date(parsed.data.date),
      name: parsed.data.name || null,
      note: parsed.data.note || null,
      projectId: parsed.data.projectId || null,
    },
  })

  revalidatePath("/accounts")
  return { status: "success" }
}

export async function updateTransfer(
  id: string,
  _prevState: TransferFormState,
  formData: FormData
): Promise<TransferFormState> {
  const parsed = parseTransferForm(formData)
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  try {
    await prisma.transfer.update({
      where: { id },
      data: {
        fromAccountId: parsed.data.fromAccountId,
        toAccountId: parsed.data.toAccountId,
        amount: parsed.data.amount,
        date: new Date(parsed.data.date),
        name: parsed.data.name || null,
        note: parsed.data.note || null,
        projectId: parsed.data.projectId || null,
      },
    })
  } catch {
    return { status: "error", error: "找不到此轉帳紀錄，可能已被刪除" }
  }

  revalidatePath("/accounts")
  return { status: "success" }
}

export async function deleteTransfer(id: string) {
  try {
    await prisma.transfer.delete({ where: { id } })
  } catch {
    // already deleted — nothing to do
  }

  revalidatePath("/accounts")
}
