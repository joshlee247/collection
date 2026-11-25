"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { authConfig, createToken, passcodeMatches, safeNext, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session"

export type LoginState = { error: string }

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const config = authConfig()
  if (!config.passcode) {
    return { error: "This site has no passcode yet. Set APP_PASSCODE in the project's environment variables." }
  }
  if (!(await passcodeMatches(String(formData.get("passcode") ?? ""), config.passcode))) {
    await new Promise((resolve) => setTimeout(resolve, 600))
    return { error: "That passcode isn't right." }
  }
  ;(await cookies()).set(SESSION_COOKIE, await createToken(config.secret, Date.now()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
  redirect(safeNext(formData.get("next")))
}

export async function logout() {
  ;(await cookies()).delete(SESSION_COOKIE)
  redirect("/login")
}
