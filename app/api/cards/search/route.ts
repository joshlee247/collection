import type { NextRequest } from "next/server"
import { hasSession } from "@/lib/auth"
import { PricingError, searchCards } from "@/lib/pokemontcg"

export async function GET(request: NextRequest) {
  if (!(await hasSession())) return Response.json({ error: "Sign in first." }, { status: 401 })
  const query = request.nextUrl.searchParams.get("q")?.slice(0, 80) ?? ""
  try {
    return Response.json(await searchCards(query, request.signal))
  } catch (error) {
    const message = error instanceof PricingError ? error.message : "Search failed."
    return Response.json({ error: message }, { status: 502 })
  }
}
