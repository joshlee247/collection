import type { Item } from "./types"

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
})

export function formatMoney(value: number, { compact = false } = {}) {
  return compact && Math.abs(value) >= 10000
    ? compactCurrency.format(value)
    : currency.format(value)
}

export function formatCount(count: number, noun: string, plural = `${noun}s`) {
  return `${count.toLocaleString("en-US")} ${count === 1 ? noun : plural}`
}

export function itemDetail(item: Item): string {
  const parts: string[] = []
  if (item.kind === "graded") {
    parts.push([item.grader, item.grade].filter(Boolean).join(" "))
  }
  if (item.kind === "sealed" && item.sealedType) parts.push(item.sealedType)
  if (item.set) parts.push(item.set)
  if (item.number) parts.push(`#${item.number}`)
  if (item.kind === "card" && item.condition) parts.push(item.condition)
  if (item.language && item.language !== "English") parts.push(item.language)
  return parts.filter(Boolean).join(" · ")
}

export function unitValue(item: Item): number {
  return item.marketValue ?? item.purchasePrice ?? 0
}
