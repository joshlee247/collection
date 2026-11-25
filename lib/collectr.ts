import { addItem, addPortfolio } from "./collection"
import type { Collection, Item } from "./types"

export type CollectrProduct = {
  product_id: string
  product_name: string
  catalog_group: string
  image_url: string
  quantity: string
  market_price: string
  card_condition?: string
  is_card?: boolean
}

const TYPES: [RegExp, string][] = [
  [/ultra[- ]premium collection/i, "Ultra Premium Collection"],
  [/elite trainer box/i, "Elite Trainer Box"],
  [/booster box/i, "Booster Box"],
  [/booster bundle/i, "Booster Bundle"],
  [/booster pack/i, "Booster Pack"],
  [/collection/i, "Collection Box"],
  [/\btins?\b/i, "Tin"],
  [/blister/i, "Blister"],
  [/\bcase\b/i, "Case"],
]

export function sealedTypeOf(name: string) {
  return TYPES.find(([pattern]) => pattern.test(name))?.[1] ?? "Other"
}

export function setNameOf(group: string) {
  const name = group.replace(/^(SV|SWSH|SM|XY|ME):\s*/i, "").trim()
  return /miscellaneous/i.test(name) ? "" : name
}

const money = (value: string) => {
  const number = Number(value)
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : null
}

// Items keep a stable id per Collectr product, so importing again updates them instead of duplicating.
export function importCollectrSealed(
  collection: Collection,
  products: CollectrProduct[],
  { portfolioName, now }: { portfolioName: string; now: string }
) {
  const portfolio =
    collection.portfolios.find(
      (p) => p.parentId === null && p.name.toLowerCase() === portfolioName.toLowerCase()
    ) ??
    addPortfolio(
      collection,
      { name: portfolioName, description: "Imported from Collectr", parentId: null },
      collection.portfolios.some((p) => p.id === "sealed") ? "sealed-collectr" : "sealed",
      now
    )
  let added = 0
  let updated = 0
  for (const product of products.filter((p) => !p.is_card)) {
    const id = `collectr-${product.product_id}`
    const fields = {
      quantity: Math.max(0, Math.floor(Number(product.quantity) || 0)),
      marketValue: money(product.market_price),
      imageUrl: product.image_url,
    }
    const existing = collection.items.find((item) => item.id === id)
    if (existing) {
      Object.assign(existing, fields, { updatedAt: now })
      updated += 1
      continue
    }
    const item: Omit<Item, "id" | "createdAt" | "updatedAt" | "market" | "priceHistory"> = {
      portfolioId: portfolio.id,
      kind: "sealed",
      name: product.product_name.trim(),
      set: setNameOf(product.catalog_group),
      number: "",
      language: "English",
      condition: "",
      grader: "",
      grade: "",
      certNumber: "",
      sealedType: sealedTypeOf(product.product_name),
      purchasePrice: null,
      notes: `Imported from Collectr on ${now.slice(0, 10)} at $${Number(product.market_price).toFixed(2)} each.`,
      cardId: "",
      priceVariant: "",
      livePrice: false,
      ...fields,
    }
    addItem(collection, item, id, now)
    added += 1
  }
  return { portfolioId: portfolio.id, added, updated }
}
