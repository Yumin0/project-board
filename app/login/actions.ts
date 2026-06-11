"use server"

import { redirect } from "next/navigation"
import { checkSitePassword, createSession, destroySession } from "@/lib/auth"

function safeRedirectTarget(from: FormDataEntryValue | null) {
  const value = String(from ?? "")
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value
  }
  return "/"
}

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "")
  const from = safeRedirectTarget(formData.get("from"))

  if (!checkSitePassword(password)) {
    const params = new URLSearchParams({ error: "1" })
    if (from !== "/") params.set("from", from)
    redirect(`/login?${params.toString()}`)
  }

  await createSession()
  redirect(from)
}

export async function logout() {
  await destroySession()
  redirect("/login")
}
