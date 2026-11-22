import {
  ancestors,
  buildTree,
  childrenOf,
  descendantIds,
  itemsWithin,
  portfolioPath,
  summarize,
  totalsOf,
} from "./collection"
import { readCollection } from "./store"
import type { Item, Portfolio, PortfolioSummary, Totals, TreeNode } from "./types"

export type PortfolioOption = { value: string; label: string; depth: number }

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
  portfolios: PortfolioSummary[]
  recent: LocatedItem[]
  options: PortfolioOption[]
}

export async function getDashboard(): Promise<Dashboard> {
  const collection = await readCollection()
  return {
    totals: totalsOf(collection.items),
    portfolios: childrenOf(collection, null).map((p) => summarize(collection, p)),
    recent: [...collection.items]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 8)
      .map((item) => ({
        ...item,
        location: portfolioPath(collection, item.portfolioId),
      })),
    options: options(collection),
  }
}

export type PortfolioView = {
  portfolio: Portfolio
  trail: Portfolio[]
  children: PortfolioSummary[]
  items: LocatedItem[]
  totals: Totals
  options: PortfolioOption[]
  nestedIds: string[]
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
    options: options(collection),
    nestedIds: descendantIds(collection, id),
  }
}
