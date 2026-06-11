import crypto from "crypto"
import { cookies } from "next/headers"

export const SESSION_COOKIE_NAME = "pb_session"
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60 // 30 days

function getSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set")
  }
  return secret
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex")
}

export function createSessionToken() {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  const payload = String(expiresAt)
  return `${payload}.${sign(payload)}`
}

export function isValidSessionToken(token: string | undefined | null) {
  if (!token) return false
  const [payload, signature] = token.split(".")
  if (!payload || !signature) return false

  const expected = sign(payload)
  const provided = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (provided.length !== expectedBuffer.length) return false
  if (!crypto.timingSafeEqual(provided, expectedBuffer)) return false

  const expiresAt = Number(payload)
  return Number.isFinite(expiresAt) && expiresAt > Date.now()
}

export function checkSitePassword(password: string) {
  const sitePassword = process.env.SITE_PASSWORD
  if (!sitePassword) return false

  const provided = Buffer.from(password)
  const expected = Buffer.from(sitePassword)
  if (provided.length !== expected.length) return false
  return crypto.timingSafeEqual(provided, expected)
}

export async function createSession() {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
