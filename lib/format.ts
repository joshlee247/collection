import type { Item } from "./types"

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

function trim(n: number) {
  return n.toFixed(1).replace(/\.0$/, "")
}

// Intl's compact notation differs between Node and browsers, which breaks hydration.
export function compactMoney(value: number) {
  const sign = value < 0 ? "−" : ""
  const n = Math.abs(value)
  if (n >= 1e6) return `${sign}$${trim(n / 1e6)}M`
  if (n >= 1e3) return `${sign}$${trim(n / 1e3)}k`
  return `${sign}$${Math.round(n)}`
}

export function formatMoney(value: number, { compact = false } = {}) {
  return compact && Math.abs(value) >= 10000 ? compactMoney(value) : currency.format(value)
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
