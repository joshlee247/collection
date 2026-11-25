export const SESSION_COOKIE = "vault_session"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 180

export type AuthConfig = {
  enabled: boolean
  passcode: string
  secret: string
}

export function authConfig(env: Record<string, string | undefined> = process.env): AuthConfig {
  const passcode = env.APP_PASSCODE ?? ""
  const deployed = env.NODE_ENV === "production" || Boolean(env.VERCEL)
  return {
    // Deployed without a passcode, the app stays locked rather than open.
    enabled: Boolean(passcode) || deployed,
    passcode,
    secret: env.SESSION_SECRET || (passcode ? `passcode:${passcode}` : ""),
  }
}

const encoder = new TextEncoder()

function base64url(bytes: ArrayBuffer) {
  let text = ""
  for (const byte of new Uint8Array(bytes)) text += String.fromCharCode(byte)
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

async function sign(secret: string, data: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  return base64url(await crypto.subtle.sign("HMAC", key, encoder.encode(data)))
}

function sameText(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function createToken(secret: string, now: number) {
  const expires = Math.floor(now / 1000) + SESSION_MAX_AGE
  return `${expires}.${await sign(secret, `v1.${expires}`)}`
}

export async function verifyToken(token: string | undefined, secret: string, now: number) {
  if (!token || !secret) return false
  const [expires, signature] = token.split(".")
  if (!expires || !signature || !/^\d+$/.test(expires)) return false
  if (Number(expires) * 1000 < now) return false
  return sameText(signature, await sign(secret, `v1.${expires}`))
}

// Hashing first makes the comparison constant-time whatever the lengths.
export async function passcodeMatches(given: string, expected: string) {
  if (!expected) return false
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(given)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ])
  return sameText(base64url(a), base64url(b))
}

export function safeNext(value: unknown) {
  const next = typeof value === "string" ? value : ""
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/"
}
