import type { NextRequest } from "next/server"
import { PricingError, searchCards } from "@/lib/pokemontcg"

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.slice(0, 80) ?? ""
  try {
    return Response.json(await searchCards(query, request.signal))
  } catch (error) {
    const message = error instanceof PricingError ? error.message : "Search failed."
    return Response.json({ error: message }, { status: 502 })
  }
}
