import type { Item, MarketQuote, PricePoint } from "./types"

export const VARIANT_LABELS: Record<string, string> = {
  normal: "Normal",
  holofoil: "Holofoil",
  reverseHolofoil: "Reverse holofoil",
  "1stEditionHolofoil": "1st edition holofoil",
  "1stEditionNormal": "1st edition",
  unlimitedHolofoil: "Unlimited holofoil",
}

const VARIANT_ORDER = Object.keys(VARIANT_LABELS)

export const STALE_AFTER_MS = 6 * 60 * 60 * 1000
const HISTORY_LIMIT = 400

export type ApiPrice = {
  low?: number | null
  mid?: number | null
  high?: number | null
  market?: number | null
  directLow?: number | null
}

export type ApiCard = {
  id: string
  name: string
  number: string
  rarity?: string
  set: { id: string; name: string; series?: string; releaseDate?: string; printedTotal?: number }
  images: { small: string; large: string }
  tcgplayer?: { url?: string; updatedAt?: string; prices?: Record<string, ApiPrice> }
}

export type CardResult = {
  id: string
  name: string
  number: string
  setName: string
  setTotal: number | null
  rarity: string
  image: string
  imageLarge: string
  releaseDate: string
  variants: { variant: string; market: number | null }[]
}

export function variantLabel(variant: string) {
  return VARIANT_LABELS[variant] ?? variant.replace(/([A-Z])/g, " $1").toLowerCase()
}

function sortVariants(variants: string[]) {
  return [...variants].sort((a, b) => {
    const ia = VARIANT_ORDER.indexOf(a)
    const ib = VARIANT_ORDER.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
}

export function pickVariant(prices: Record<string, ApiPrice> | undefined, preferred: string) {
  const available = sortVariants(Object.keys(prices ?? {}))
  if (preferred && available.includes(preferred)) return preferred
  return available.find((variant) => prices?.[variant]?.market != null) ?? available[0] ?? ""
}

const num = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? Math.round(value * 100) / 100 : null

export function quoteFrom(card: ApiCard, preferred: string, now: string): MarketQuote | null {
  const prices = card.tcgplayer?.prices
  const variant = pickVariant(prices, preferred)
  if (!variant || !prices) return null
  const price = prices[variant]
  return {
    source: "tcgplayer",
    variant,
    variants: sortVariants(Object.keys(prices)),
    market: num(price.market),
    low: num(price.low),
    mid: num(price.mid),
    high: num(price.high),
    updatedAt: (card.tcgplayer?.updatedAt ?? "").replaceAll("/", "-"),
    fetchedAt: now,
    url: card.tcgplayer?.url ?? `https://prices.pokemontcg.io/tcgplayer/${card.id}`,
  }
}

export function toResult(card: ApiCard): CardResult {
  const prices = card.tcgplayer?.prices ?? {}
  return {
    id: card.id,
    name: card.name,
    number: card.number,
    setName: card.set.name,
    setTotal: card.set.printedTotal ?? null,
    rarity: card.rarity ?? "",
    image: card.images.small,
    imageLarge: card.images.large,
    releaseDate: (card.set.releaseDate ?? "").replaceAll("/", "-"),
    variants: sortVariants(Object.keys(prices)).map((variant) => ({
      variant,
      market: num(prices[variant]?.market),
    })),
  }
}

// TCGplayer prices raw cards, so only raw cards follow the quote; slabs keep it as a reference.
export function followsMarket(item: Pick<Item, "kind" | "cardId" | "livePrice">) {
  return item.kind === "card" && Boolean(item.cardId) && item.livePrice
}

export function applyQuote(item: Item, quote: MarketQuote, today: string) {
  item.market = quote
  if (!followsMarket(item) || quote.market === null) return
  item.marketValue = quote.market
  const history = item.priceHistory
  const point: PricePoint = { date: today, market: quote.market }
  if (history.at(-1)?.date === today) history[history.length - 1] = point
  else history.push(point)
  if (history.length > HISTORY_LIMIT) history.splice(0, history.length - HISTORY_LIMIT)
}

export function isStale(refreshedAt: string | null, now: number) {
  return !refreshedAt || now - Date.parse(refreshedAt) > STALE_AFTER_MS
}

function escapeTerm(term: string) {
  return term.replace(/[^\p{L}\p{N}'-]/gu, "")
}

export function buildSearchQuery(text: string) {
  const parts: string[] = []
  const words: string[] = []
  for (const raw of text.trim().split(/\s+/).filter(Boolean)) {
    const number = raw.match(/^#?(\w*\d\w*)(?:\/\d+)?$/)
    if (number && /\d/.test(number[1]) && !/^\d+[a-z]+$/i.test(raw) && words.length > 0) {
      parts.push(`number:${escapeTerm(number[1])}`)
    } else {
      const word = escapeTerm(raw)
      if (word) words.push(word)
    }
  }
  if (words.length === 0) return ""
  const name = words.length === 1 ? `name:${words[0]}*` : `name:"${words.join(" ")}*"`
  return [name, ...parts].join(" ")
}

function valueOn(history: PricePoint[], date: string) {
  let found: number | null = null
  for (const point of history) {
    if (point.date <= date) found = point.market
    else break
  }
  return found
}

export function periodChange(items: Item[], days: number, today: string) {
  const cutoff = new Date(Date.parse(`${today}T00:00:00Z`) - days * 86400000).toISOString().slice(0, 10)
  let change = 0
  let tracked = 0
  for (const item of items) {
    if (!followsMarket(item) || item.priceHistory.length < 2) continue
    const then = valueOn(item.priceHistory, cutoff) ?? item.priceHistory[0].market
    const now = item.priceHistory.at(-1)!.market
    if (item.priceHistory[0].date > cutoff && then === now) continue
    change += (now - then) * item.quantity
    tracked += 1
  }
  return tracked ? change : null
}

export function today(now = new Date()) {
  return now.toISOString().slice(0, 10)
}
