import { buildSearchQuery, toResult, type ApiCard, type CardResult } from "./pricing"

const BASE = "https://api.pokemontcg.io/v2"
const FIELDS = "id,name,number,rarity,set,images,tcgplayer"

export class PricingError extends Error {}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// The API answers a share of requests with 5xx at random, so retry those a few times.
async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" }
  if (process.env.POKEMONTCG_API_KEY) headers["X-Api-Key"] = process.env.POKEMONTCG_API_KEY
  let last: unknown
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt) await wait(250 * 2 ** attempt)
    try {
      const response = await fetch(`${BASE}${path}`, { headers, signal, cache: "no-store" })
      if (response.ok) return (await response.json()) as T
      if (response.status === 404) throw new PricingError("Card not found.")
      if (response.status === 429) throw new PricingError("The pricing API is rate limiting requests. Try again in a minute.")
      last = new PricingError(`The pricing API returned ${response.status}.`)
      if (response.status < 500) break
    } catch (error) {
      if (error instanceof PricingError || signal?.aborted) throw error
      last = error
    }
  }
  throw last instanceof PricingError ? last : new PricingError("Couldn't reach the pricing API.")
}

export async function searchCards(text: string, signal?: AbortSignal): Promise<CardResult[]> {
  const q = buildSearchQuery(text)
  if (!q) return []
  const params = new URLSearchParams({ q, pageSize: "20", select: FIELDS, orderBy: "-set.releaseDate" })
  const body = await request<{ data: ApiCard[] }>(`/cards?${params}`, signal)
  return body.data.map(toResult)
}

export async function getCard(id: string): Promise<ApiCard> {
  const body = await request<{ data: ApiCard }>(`/cards/${encodeURIComponent(id)}?select=${FIELDS}`)
  return body.data
}

export async function getCards(ids: string[]) {
  const unique = [...new Set(ids)]
  const found = new Map<string, ApiCard>()
  const failed: string[] = []
  let next = 0
  async function worker() {
    while (next < unique.length) {
      const id = unique[next++]
      try {
        found.set(id, await getCard(id))
      } catch {
        failed.push(id)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, unique.length) }, worker))
  return { found, failed }
}
