import { ChevronRightIcon, FolderIcon, PackageIcon } from "lucide-react"
import Link from "next/link"
import { formatCount, formatMoney } from "@/lib/format"
import type { PortfolioSummary } from "@/lib/types"

export function PortfolioCard({ portfolio }: { portfolio: PortfolioSummary }) {
  const { totals } = portfolio
  const Icon = portfolio.childCount > 0 ? FolderIcon : PackageIcon
  const segments = [
    { key: "card", count: totals.byKind.card, color: "bg-kind-card" },
    { key: "graded", count: totals.byKind.graded, color: "bg-kind-graded" },
    { key: "sealed", count: totals.byKind.sealed, color: "bg-kind-sealed" },
  ].filter((segment) => segment.count > 0)

  return (
    <Link
      href={`/p/${portfolio.id}`}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-line bg-surface p-4 text-fg no-underline shadow-[0_1px_2px_oklch(0.3_0.05_278/0.05)] transition hover:-translate-y-0.5 hover:shadow-[var(--ui-shadow)] focus-visible:outline-4 focus-visible:outline-[var(--ui-ring)]"
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-[image:var(--holo)] opacity-70 transition group-hover:opacity-100"
      />
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-muted text-muted-fg">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <ChevronRightIcon
          aria-hidden="true"
          className="size-4 text-muted-fg transition group-hover:translate-x-0.5"
        />
      </div>
      <div className="min-w-0">
        <h3 className="m-0 truncate text-base font-semibold tracking-tight">
          {portfolio.name}
        </h3>
        <p className="m-0 text-sm text-muted-fg">
          {formatCount(totals.count, "item")}
          {portfolio.childCount > 0 &&
            ` · ${formatCount(portfolio.childCount, "portfolio")}`}
        </p>
      </div>
      <div className="flex items-end justify-between gap-3">
        <span className="text-lg font-semibold tabular-nums">
          {formatMoney(totals.value, { compact: true })}
        </span>
        {segments.length > 0 && (
          <span aria-hidden="true" className="flex h-1.5 w-24 overflow-hidden rounded-full bg-muted">
            {segments.map((segment) => (
              <span
                key={segment.key}
                className={segment.color}
                style={{ flexGrow: segment.count }}
              />
            ))}
          </span>
        )}
      </div>
    </Link>
  )
}
