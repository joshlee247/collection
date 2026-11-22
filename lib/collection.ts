import {
  CONDITIONS,
  GRADERS,
  ITEM_KINDS,
  SEALED_TYPES,
  type Collection,
  type Item,
  type ItemInput,
  type ItemKind,
  type Portfolio,
  type PortfolioSummary,
  type Totals,
  type TreeNode,
} from "./types"

export class CollectionError extends Error {}

export function emptyCollection(): Collection {
  return { portfolios: [], items: [] }
}

export function descendantIds(collection: Collection, id: string): string[] {
  const result: string[] = []
  const queue = [id]
  while (queue.length) {
    const current = queue.shift()!
    for (const portfolio of collection.portfolios) {
      if (portfolio.parentId === current) {
        result.push(portfolio.id)
        queue.push(portfolio.id)
      }
    }
  }
  return result
}

export function ancestors(collection: Collection, id: string): Portfolio[] {
  const chain: Portfolio[] = []
  const seen = new Set<string>()
  let current = collection.portfolios.find((p) => p.id === id)
  while (current?.parentId && !seen.has(current.parentId)) {
    seen.add(current.parentId)
    current = collection.portfolios.find((p) => p.id === current!.parentId)
    if (current) chain.unshift(current)
  }
  return chain
}

export function totalsOf(items: Item[]): Totals {
  const byKind: Record<ItemKind, number> = { card: 0, graded: 0, sealed: 0 }
  let count = 0
  let cost = 0
  let value = 0
  for (const item of items) {
    count += item.quantity
    byKind[item.kind] += item.quantity
    cost += (item.purchasePrice ?? 0) * item.quantity
    value += (item.marketValue ?? item.purchasePrice ?? 0) * item.quantity
  }
  return { count, cost, value, byKind }
}

export function itemsWithin(
  collection: Collection,
  id: string,
  { deep }: { deep: boolean }
): Item[] {
  const ids = new Set([id, ...(deep ? descendantIds(collection, id) : [])])
  return collection.items.filter((item) => ids.has(item.portfolioId))
}

export function summarize(
  collection: Collection,
  portfolio: Portfolio
): PortfolioSummary {
  return {
    ...portfolio,
    totals: totalsOf(itemsWithin(collection, portfolio.id, { deep: true })),
    childCount: collection.portfolios.filter((p) => p.parentId === portfolio.id)
      .length,
  }
}

export function childrenOf(
  collection: Collection,
  parentId: string | null
): Portfolio[] {
  return collection.portfolios
    .filter((p) => p.parentId === parentId)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
}

export function buildTree(
  collection: Collection,
  parentId: string | null = null
): TreeNode[] {
  return childrenOf(collection, parentId).map((portfolio) => ({
    id: portfolio.id,
    name: portfolio.name,
    count: totalsOf(itemsWithin(collection, portfolio.id, { deep: true }))
      .count,
    children: buildTree(collection, portfolio.id),
  }))
}

export function portfolioPath(collection: Collection, id: string): string {
  return [...ancestors(collection, id), collection.portfolios.find((p) => p.id === id)]
    .filter(Boolean)
    .map((p) => p!.name)
    .join(" / ")
}

function text(value: unknown, max = 200): string {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

function money(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) return null
  return Math.round(number * 100) / 100
}

function oneOf<T extends readonly string[]>(
  list: T,
  value: unknown,
  fallback: string
): string {
  const candidate = text(value)
  return (list as readonly string[]).includes(candidate) ? candidate : fallback
}

export function parseItemInput(
  collection: Collection,
  raw: Record<string, unknown>
): ItemInput {
  const kind = (ITEM_KINDS as readonly string[]).includes(String(raw.kind))
    ? (raw.kind as ItemKind)
    : "card"
  const name = text(raw.name)
  if (!name) throw new CollectionError("Give the item a name.")
  const portfolioId = text(raw.portfolioId)
  if (!collection.portfolios.some((p) => p.id === portfolioId)) {
    throw new CollectionError("Choose where the item is stored.")
  }
  const quantity = Math.floor(Number(raw.quantity ?? 1))
  return {
    portfolioId,
    kind,
    name,
    set: text(raw.set),
    number: text(raw.number, 40),
    language: text(raw.language, 40) || "English",
    quantity: Number.isFinite(quantity) ? Math.min(Math.max(quantity, 0), 99999) : 1,
    condition: kind === "card" ? oneOf(CONDITIONS, raw.condition, "Near Mint") : "",
    grader: kind === "graded" ? oneOf(GRADERS, raw.grader, "PSA") : "",
    grade: kind === "graded" ? text(raw.grade, 20) : "",
    certNumber: kind === "graded" ? text(raw.certNumber, 60) : "",
    sealedType:
      kind === "sealed" ? oneOf(SEALED_TYPES, raw.sealedType, "Booster Box") : "",
    purchasePrice: money(raw.purchasePrice),
    marketValue: money(raw.marketValue),
    imageUrl: /^https?:\/\//.test(text(raw.imageUrl, 1000))
      ? text(raw.imageUrl, 1000)
      : "",
    notes: text(raw.notes, 2000),
  }
}

export function addItem(
  collection: Collection,
  input: ItemInput,
  id: string,
  now: string
): Item {
  const item: Item = { ...input, id, createdAt: now, updatedAt: now }
  collection.items.push(item)
  return item
}

export function updateItem(
  collection: Collection,
  id: string,
  input: ItemInput,
  now: string
): Item {
  const item = findItem(collection, id)
  Object.assign(item, input, { updatedAt: now })
  return item
}

export function setQuantity(
  collection: Collection,
  id: string,
  quantity: number,
  now: string
): Item {
  const item = findItem(collection, id)
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new CollectionError("Quantity must be a whole number.")
  }
  item.quantity = quantity
  item.updatedAt = now
  return item
}

export function removeItem(collection: Collection, id: string): Item {
  const item = findItem(collection, id)
  collection.items = collection.items.filter((i) => i.id !== id)
  return item
}

export function restoreItem(collection: Collection, item: Item): void {
  if (collection.items.some((i) => i.id === item.id)) return
  if (!collection.portfolios.some((p) => p.id === item.portfolioId)) {
    throw new CollectionError("Its portfolio no longer exists.")
  }
  collection.items.push(item)
}

export function findItem(collection: Collection, id: string): Item {
  const item = collection.items.find((i) => i.id === id)
  if (!item) throw new CollectionError("That item no longer exists.")
  return item
}

export function findPortfolio(collection: Collection, id: string): Portfolio {
  const portfolio = collection.portfolios.find((p) => p.id === id)
  if (!portfolio) throw new CollectionError("That portfolio no longer exists.")
  return portfolio
}

export function parsePortfolioInput(
  collection: Collection,
  raw: Record<string, unknown>,
  selfId?: string
): Pick<Portfolio, "name" | "description" | "parentId"> {
  const name = text(raw.name, 80)
  if (!name) throw new CollectionError("Give the portfolio a name.")
  const parent = text(raw.parentId)
  const parentId = parent && parent !== "root" ? parent : null
  if (parentId) {
    findPortfolio(collection, parentId)
    if (
      selfId &&
      (parentId === selfId || descendantIds(collection, selfId).includes(parentId))
    ) {
      throw new CollectionError("A portfolio can't go inside itself.")
    }
  }
  return { name, description: text(raw.description, 500), parentId }
}

export function addPortfolio(
  collection: Collection,
  input: Pick<Portfolio, "name" | "description" | "parentId">,
  id: string,
  now: string
): Portfolio {
  const portfolio: Portfolio = { ...input, id, createdAt: now }
  collection.portfolios.push(portfolio)
  return portfolio
}

export function updatePortfolio(
  collection: Collection,
  id: string,
  input: Pick<Portfolio, "name" | "description" | "parentId">
): Portfolio {
  const portfolio = findPortfolio(collection, id)
  Object.assign(portfolio, input)
  return portfolio
}

export function removePortfolio(collection: Collection, id: string): Portfolio {
  const portfolio = findPortfolio(collection, id)
  const doomed = new Set([id, ...descendantIds(collection, id)])
  collection.portfolios = collection.portfolios.filter((p) => !doomed.has(p.id))
  collection.items = collection.items.filter((i) => !doomed.has(i.portfolioId))
  return portfolio
}
