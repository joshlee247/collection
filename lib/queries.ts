import {
  ancestors,
  buildTree,
  childrenOf,
  descendantIds,
  insightsOf,
  itemsWithin,
  locationBreakdown,
  portfolioPath,
  summarize,
  totalsOf,
} from "./collection"
import type { Insights, LocationBreakdown } from "./collection"
import { periodChange, today } from "./pricing"
import { readCollection } from "./store"
import type { Item, Portfolio, PortfolioSummary, Totals, TreeNode } from "./types"

export type PortfolioOption = { value: string; label: string; depth: number }

export type PricingState = {
  refreshedAt: string | null
  linked: number
  weekChange: number | null
}

function pricingState(collection: Awaited<ReturnType<typeof readCollection>>, items: Item[]): PricingState {
  return {
    refreshedAt: collection.pricesRefreshedAt,
    linked: collection.items.filter((item) => item.cardId && item.kind !== "sealed").length,
    weekChange: periodChange(items, 7, today()),
  }
}

export type LocatedItem = Item & { location: string }

export type NavData = {
  tree: TreeNode[]
  options: PortfolioOption[]
  nested: Record<string, string[]>
}

export async function getNavData(): Promise<NavData> {
  const collection = await readCollection()
  return {
    tree: buildTree(collection),
    options: options(collection),
    nested: Object.fromEntries(
      collection.portfolios.map((p) => [p.id, descendantIds(collection, p.id)])
    ),
  }
}

function options(
  collection: Awaited<ReturnType<typeof readCollection>>
): PortfolioOption[] {
  const result: PortfolioOption[] = []
  const walk = (parentId: string | null, depth: number) => {
    for (const portfolio of childrenOf(collection, parentId)) {
      result.push({
        value: portfolio.id,
        label: portfolioPath(collection, portfolio.id),
        depth,
      })
      walk(portfolio.id, depth + 1)
    }
  }
  walk(null, 0)
  return result
}

export type Dashboard = {
  totals: Totals
  insights: Insights
  portfolioCount: number
  portfolios: PortfolioSummary[]
  items: LocatedItem[]
  locations: LocationBreakdown[]
  pricing: PricingState
}

export async function getDashboard(): Promise<Dashboard> {
  const collection = await readCollection()
  return {
    totals: totalsOf(collection.items),
    insights: insightsOf(collection.items),
    portfolioCount: collection.portfolios.length,
    portfolios: childrenOf(collection, null).map((p) => summarize(collection, p)),
    items: [...collection.items]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((item) => ({
        ...item,
        location: portfolioPath(collection, item.portfolioId),
      })),
    locations: locationBreakdown(collection, collection.items),
    pricing: pricingState(collection, collection.items),
  }
}

export type PortfolioView = {
  portfolio: Portfolio
  trail: Portfolio[]
  children: PortfolioSummary[]
  items: LocatedItem[]
  totals: Totals
  insights: Insights
  options: PortfolioOption[]
  nestedIds: string[]
  pricing: PricingState
}

export async function getPortfolioView(id: string): Promise<PortfolioView | null> {
  const collection = await readCollection()
  const portfolio = collection.portfolios.find((p) => p.id === id)
  if (!portfolio) return null
  const items = itemsWithin(collection, id, { deep: true })
  return {
    portfolio,
    trail: ancestors(collection, id),
    children: childrenOf(collection, id).map((p) => summarize(collection, p)),
    items: items
      .map((item) => ({
        ...item,
        location:
          item.portfolioId === id
            ? ""
            : portfolioPath(collection, item.portfolioId)
                .split(" / ")
                .slice(ancestors(collection, id).length + 1)
                .join(" / "),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    totals: totalsOf(items),
    insights: insightsOf(items),
    options: options(collection),
    nestedIds: descendantIds(collection, id),
    pricing: pricingState(collection, items),
  }
}
