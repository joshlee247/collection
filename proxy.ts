import { NextResponse, type NextRequest } from "next/server"
import { authConfig, SESSION_COOKIE, verifyToken } from "./lib/session"

export async function proxy(request: NextRequest) {
  const config = authConfig()
  if (!config.enabled) return NextResponse.next()
  if (await verifyToken(request.cookies.get(SESSION_COOKIE)?.value, config.secret, Date.now())) {
    return NextResponse.next()
  }
  const { pathname, search } = request.nextUrl
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 })
  }
  const login = new URL("/login", request.url)
  if (pathname !== "/") login.searchParams.set("next", `${pathname}${search}`)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|images/|favicon\\.ico).*)"],
}
