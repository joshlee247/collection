export const ITEM_KINDS = ["card", "graded", "sealed"] as const
export type ItemKind = (typeof ITEM_KINDS)[number]

export const KIND_LABELS: Record<ItemKind, string> = {
  card: "Raw card",
  graded: "Graded",
  sealed: "Sealed",
}

export const CONDITIONS = [
  "Mint",
  "Near Mint",
  "Lightly Played",
  "Moderately Played",
  "Heavily Played",
  "Damaged",
] as const

export const GRADERS = ["PSA", "BGS", "CGC", "SGC", "TAG", "Other"] as const

export const SEALED_TYPES = [
  "Booster Box",
  "Elite Trainer Box",
  "Booster Bundle",
  "Booster Pack",
  "Collection Box",
  "Tin",
  "Blister",
  "Ultra Premium Collection",
  "Case",
  "Other",
] as const

export type Portfolio = {
  id: string
  name: string
  description: string
  parentId: string | null
  createdAt: string
}

export type Item = {
  id: string
  portfolioId: string
  kind: ItemKind
  name: string
  set: string
  number: string
  language: string
  quantity: number
  condition: string
  grader: string
  grade: string
  certNumber: string
  sealedType: string
  purchasePrice: number | null
  marketValue: number | null
  imageUrl: string
  notes: string
  cardId: string
  priceVariant: string
  livePrice: boolean
  market: MarketQuote | null
  priceHistory: PricePoint[]
  createdAt: string
  updatedAt: string
}

export type MarketQuote = {
  source: "tcgplayer"
  variant: string
  variants: string[]
  market: number | null
  low: number | null
  mid: number | null
  high: number | null
  updatedAt: string
  fetchedAt: string
  url: string
}

export type PricePoint = { date: string; market: number }

export type ItemInput = Omit<Item, "id" | "createdAt" | "updatedAt" | "market" | "priceHistory">

export type Collection = {
  portfolios: Portfolio[]
  items: Item[]
  pricesRefreshedAt: string | null
}

export type Totals = {
  count: number
  cost: number
  value: number
  byKind: Record<ItemKind, number>
}

export type PortfolioSummary = Portfolio & {
  totals: Totals
  childCount: number
}

export type TreeNode = {
  id: string
  name: string
  count: number
  children: TreeNode[]
}
