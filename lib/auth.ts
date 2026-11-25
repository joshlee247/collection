import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { authConfig, SESSION_COOKIE, verifyToken } from "./session"

export async function hasSession() {
  const config = authConfig()
  if (!config.enabled) return true
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  return verifyToken(token, config.secret, Date.now())
}

export async function requireSession() {
  if (!(await hasSession())) redirect("/login")
}
