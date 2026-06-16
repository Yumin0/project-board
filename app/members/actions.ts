"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import { z } from "zod"

import { prisma } from "@/lib/prisma"

function isUniqueNameViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

const memberSchema = z.object({
  name: z.string().trim().min(1, "名稱為必填").max(100),
  accountId: z.string().trim().optional(),
})

export type MemberFormState = {
  status: "idle" | "success" | "error"
  error?: string
  fieldErrors?: Partial<Record<"name" | "accountId", string[]>>
}

function parseMemberForm(formData: FormData) {
  const accountId = formData.get("accountId")
  return memberSchema.safeParse({
    name: formData.get("name"),
    accountId: accountId && accountId !== "__none__" ? String(accountId) : undefined,
  })
}

export async function createMember(
  _prevState: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  const parsed = parseMemberForm(formData)
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  try {
    await prisma.member.create({
      data: { name: parsed.data.name, accountId: parsed.data.accountId ?? null },
    })
  } catch (error) {
    if (isUniqueNameViolation(error)) {
      return { status: "error", fieldErrors: { name: ["已有相同名稱的成員"] } }
    }
    throw error
  }

  revalidatePath("/members")
  revalidatePath("/projects")
  return { status: "success" }
}

export async function updateMember(
  id: string,
  _prevState: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  const parsed = parseMemberForm(formData)
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  try {
    await prisma.member.update({
      where: { id },
      data: { name: parsed.data.name, accountId: parsed.data.accountId ?? null },
    })
  } catch (error) {
    if (isUniqueNameViolation(error)) {
      return { status: "error", fieldErrors: { name: ["已有相同名稱的成員"] } }
    }
    return { status: "error", error: "找不到此成員，可能已被刪除" }
  }

  revalidatePath("/members")
  revalidatePath("/projects")
  return { status: "success" }
}

export async function deleteMember(id: string) {
  try {
    await prisma.member.delete({ where: { id } })
  } catch {
    // already deleted — nothing to do
  }

  revalidatePath("/members")
  revalidatePath("/projects")
}
