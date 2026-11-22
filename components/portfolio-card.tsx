import Link from "next/link"
import { formatCount, formatMoney } from "@/lib/format"
import type { PortfolioSummary } from "@/lib/types"
import { iconsFor, Sticker, toneFor } from "./sticker"

const PEEK = [
  "bg-[conic-gradient(from_200deg,oklch(0.85_0.12_330),oklch(0.88_0.12_80),oklch(0.86_0.12_170),oklch(0.82_0.12_260),oklch(0.85_0.12_330))]",
  "bg-[linear-gradient(160deg,oklch(0.8_0.14_250),oklch(0.72_0.17_290))]",
  "bg-[linear-gradient(160deg,oklch(0.9_0.13_95),oklch(0.75_0.17_45))]",
]

export function PortfolioCard({ portfolio }: { portfolio: PortfolioSummary }) {
  const { totals } = portfolio
  const tone = toneFor(portfolio.id)
  const [First, Second] = iconsFor(portfolio.id)
  const peeking = Math.min(3, Math.max(1, Math.ceil(totals.count / 3)))

  return (
    <Link
      href={`/p/${portfolio.id}`}
      className="group flex flex-col gap-3 rounded-[1.75rem] p-1 text-fg no-underline outline-none focus-visible:ring-4 focus-visible:ring-[var(--ui-ring)]"
    >
      <div aria-hidden="true" className="relative aspect-[5/4] w-full">
        <div className={`absolute top-[6%] left-[8%] h-[24%] w-[38%] rounded-t-2xl ${tone.tab}`} />
        <div className={`absolute inset-x-0 top-[14%] bottom-0 rounded-[1.6rem] ${tone.tab} opacity-80`} />
        {totals.count > 0 &&
          PEEK.slice(0, peeking).map((paint, index) => (
            <div
              key={index}
              className={`absolute top-[4%] h-[62%] w-[34%] rounded-lg border-[3px] border-white shadow-md transition-transform duration-300 group-hover:-translate-y-2 ${paint}`}
              style={{
                left: `${16 + index * 22}%`,
                rotate: `${(index - 1) * 8}deg`,
                transitionDelay: `${index * 40}ms`,
              }}
            >
              <div className="absolute inset-1.5 rounded-sm border border-white/50" />
            </div>
          ))}
        <div
          className={`absolute inset-x-0 top-[38%] bottom-0 overflow-hidden rounded-[1.6rem] border border-white/70 bg-linear-to-br shadow-[inset_0_1px_0_white,0_10px_24px_-12px_oklch(0.35_0.12_290/0.45)] ${tone.pocket}`}
        >
          <div className="absolute inset-x-6 top-2 h-px bg-white/70" />
        </div>
        <Sticker icon={First} tone={tone} size="lg" className="absolute bottom-[12%] left-[12%] -rotate-12" />
        <Sticker icon={Second} tone={tone} size="lg" className="absolute right-[12%] bottom-[18%] rotate-6" />
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 px-2">
        <span className="min-w-0">
          <span className="block truncate font-semibold">
            {portfolio.name}{" "}
            <span className="font-normal text-muted-fg">{totals.count}</span>
          </span>
          <span className="block truncate text-xs text-muted-fg">
            {portfolio.childCount > 0
              ? formatCount(portfolio.childCount, "portfolio")
              : formatCount(totals.count, "item")}
          </span>
        </span>
        <span className="font-display text-lg font-semibold tabular-nums">
          {formatMoney(totals.value, { compact: true })}
        </span>
      </div>
    </Link>
  )
}
