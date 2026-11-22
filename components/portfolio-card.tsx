import { ArrowUpRightIcon } from "lucide-react"
import Link from "next/link"
import { formatCount, formatMoney } from "@/lib/format"
import type { PortfolioSummary } from "@/lib/types"
import { KIND_DOT } from "@/lib/kinds"

export function PortfolioCard({ portfolio }: { portfolio: PortfolioSummary }) {
  const { totals } = portfolio
  const segments = (["card", "graded", "sealed"] as const)
    .map((kind) => ({ kind, count: totals.byKind[kind] }))
    .filter((segment) => segment.count > 0)
  const gain = totals.value - totals.cost

  return (
    <Link
      href={`/p/${portfolio.id}`}
      className="bento group flex flex-col gap-6 p-5 text-fg no-underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="m-0 truncate text-base font-semibold tracking-tight">{portfolio.name}</h3>
          <p className="m-0 truncate text-sm text-muted-fg">
            {formatCount(totals.count, "item")}
            {portfolio.childCount > 0 && ` · ${formatCount(portfolio.childCount, "bin")}`}
          </p>
        </div>
        <ArrowUpRightIcon
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-fg transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-fg"
        />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {formatMoney(totals.value, { compact: true })}
          </span>
          {totals.cost > 0 && (
            <span className={`text-xs tabular-nums ${gain >= 0 ? "text-gain" : "text-loss"}`}>
              {gain >= 0 ? "▲" : "▼"} {formatMoney(Math.abs(gain), { compact: true })}
            </span>
          )}
        </div>
        <span aria-hidden="true" className="flex h-1 gap-[2px] overflow-hidden rounded-full bg-[oklch(1_0_0/6%)]">
          {segments.map((segment) => (
            <span key={segment.kind} className={KIND_DOT[segment.kind]} style={{ flexGrow: segment.count }} />
          ))}
        </span>
      </div>
    </Link>
  )
}
