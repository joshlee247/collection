"use server"

import { refresh } from "next/cache"
import { unstable_rethrow } from "next/navigation"
import {
  CollectionError,
  addItem,
  addPortfolio,
  parseItemInput,
  parsePortfolioInput,
  removeItem,
  removePortfolio,
  restoreItem,
  setQuantity,
  updateItem,
  updatePortfolio,
} from "@/lib/collection"
import { importCollectrSealed, type CollectrProduct } from "@/lib/collectr"
import { getCard, getCards, PricingError } from "@/lib/pokemontcg"
import { applyQuote, quoteFrom, today } from "@/lib/pricing"
import { mutate, readCollection } from "@/lib/store"
import type { Item, MarketQuote, PricePoint } from "@/lib/types"

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string }

async function run<T>(work: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await work()
    refresh()
    return { ok: true, data }
  } catch (error) {
    unstable_rethrow(error)
    if (error instanceof CollectionError || error instanceof PricingError) {
      return { ok: false, error: error.message }
    }
    console.error(error)
    return { ok: false, error: "Something went wrong. Try again." }
  }
}

const now = () => new Date().toISOString()

export async function saveItem(
  formData: FormData
): Promise<ActionResult<{ id: string; name: string; warning: string }>> {
  const raw = Object.fromEntries(formData)
  const id = typeof raw.id === "string" && raw.id ? raw.id : null
  const linked = typeof raw.cardId === "string" ? raw.cardId : ""
  let quoteCard: Awaited<ReturnType<typeof getCard>> | null = null
  let priceWarning = ""
  if (linked && raw.kind !== "sealed") {
    try {
      quoteCard = await getCard(linked)
    } catch {
      priceWarning = "Saved, but the live price couldn't be fetched. It'll update on the next refresh."
    }
  }
  return run(() =>
    mutate((collection) => {
      const input = parseItemInput(collection, raw)
      const item = id
        ? updateItem(collection, id, input, now())
        : addItem(collection, input, crypto.randomUUID(), now())
      if (quoteCard && item.cardId === quoteCard.id) {
        const quote = quoteFrom(quoteCard, item.priceVariant, now())
        if (quote) applyQuote(item, quote, today())
      }
      return { id: item.id, name: item.name, warning: priceWarning }
    })
  )
}

export async function refreshPrices(): Promise<
  ActionResult<{ updated: number; failed: number; refreshedAt: string }>
> {
  const collection = await readCollection()
  const ids = collection.items.filter((item) => item.cardId && item.kind !== "sealed").map((item) => item.cardId)
  if (ids.length === 0) return { ok: true, data: { updated: 0, failed: 0, refreshedAt: now() } }
  const { found, failed } = await getCards(ids)
  if (found.size === 0) {
    return { ok: false, error: "Couldn't reach the pricing API. Your last prices are kept." }
  }
  return run(() =>
    mutate((latest) => {
      const stamp = now()
      let updated = 0
      for (const item of latest.items) {
        const card = found.get(item.cardId)
        if (!card || item.kind === "sealed") continue
        const quote = quoteFrom(card, item.priceVariant, stamp)
        if (!quote) continue
        applyQuote(item, quote, today())
        updated += 1
      }
      latest.pricesRefreshedAt = stamp
      return { updated, failed: failed.length, refreshedAt: stamp }
    })
  )
}

export async function setItemQuantity(
  id: string,
  quantity: number
): Promise<ActionResult<{ quantity: number }>> {
  return run(() =>
    mutate((collection) => ({
      quantity: setQuantity(collection, id, quantity, now()).quantity,
    }))
  )
}

export async function deleteItem(id: string): Promise<ActionResult<Item>> {
  return run(() => mutate((collection) => removeItem(collection, id)))
}

export async function undoDeleteItem(item: Item): Promise<ActionResult> {
  return run(() =>
    mutate((collection) => {
      const input = parseItemInput(collection, { ...item })
      restoreItem(collection, {
        ...input,
        market: validQuote(item.market),
        priceHistory: validHistory(item.priceHistory),
        id: String(item.id),
        createdAt: String(item.createdAt),
        updatedAt: now(),
      })
      return undefined
    })
  )
}

export async function savePortfolio(
  formData: FormData
): Promise<ActionResult<{ id: string; name: string }>> {
  const raw = Object.fromEntries(formData)
  const id = typeof raw.id === "string" && raw.id ? raw.id : null
  return run(() =>
    mutate((collection) => {
      const input = parsePortfolioInput(collection, raw, id ?? undefined)
      const portfolio = id
        ? updatePortfolio(collection, id, input)
        : addPortfolio(collection, input, crypto.randomUUID().slice(0, 8), now())
      return { id: portfolio.id, name: portfolio.name }
    })
  )
}

export async function deletePortfolio(
  id: string
): Promise<ActionResult<{ parentId: string | null }>> {
  return run(() =>
    mutate((collection) => ({
      parentId: removePortfolio(collection, id).parentId,
    }))
  )
}

function validQuote(value: unknown): MarketQuote | null {
  const quote = value as MarketQuote | null
  return quote && quote.source === "tcgplayer" && typeof quote.variant === "string" ? quote : null
}

function validHistory(value: unknown): PricePoint[] {
  return Array.isArray(value)
    ? value.filter(
        (point): point is PricePoint =>
          typeof point?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(point.date) && Number.isFinite(point.market)
      )
    : []
}

export async function importFromCollectr(): Promise<
  ActionResult<{ portfolioId: string; added: number; updated: number }>
> {
  const { default: products } = await import("@/imports/collectr-sealed.json")
  return run(() =>
    mutate((collection) =>
      importCollectrSealed(collection, products as CollectrProduct[], { portfolioName: "Sealed", now: now() })
    )
  )
}
