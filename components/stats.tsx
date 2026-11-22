import {
  CoinsIcon,
  LayersIcon,
  PackageOpenIcon,
  ReceiptIcon,
  TrendingUpIcon,
  TrophyIcon,
  type LucideIcon,
} from "lucide-react"
import type { Insights } from "@/lib/collection"
import { formatCount, formatMoney } from "@/lib/format"
import type { Totals } from "@/lib/types"
import { Card, TrendPill } from "./card"
import { Sticker, TONES, type Tone } from "./sticker"

const tone = (name: string) => TONES.find((t) => t.name === name)!

function Chip({ icon, toneName, children }: { icon: LucideIcon; toneName: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
      <Sticker icon={icon} tone={tone(toneName)} size="sm" className="relative translate-y-1 -rotate-6" />
      <strong className="font-semibold text-fg">{children}</strong>
    </span>
  )
}

export function Summary({
  totals,
  insights,
  portfolioCount,
}: {
  totals: Totals
  insights: Insights
  portfolioCount: number
}) {
  if (totals.count === 0) {
    return (
      <p className="font-display m-0 max-w-3xl text-2xl leading-snug text-muted-fg sm:text-3xl">
        Your vault is empty. Make a portfolio for each{" "}
        <Chip icon={PackageOpenIcon} toneName="mint">bin</Chip>, binder or shelf, then fill it up.
      </p>
    )
  }
  const gain = totals.value - totals.cost
  const share = insights.top && totals.value > 0 ? insights.top.value / totals.value : 0
  return (
    <p className="font-display m-0 max-w-4xl text-2xl leading-[1.45] text-muted-fg sm:text-[2rem]">
      You own <Chip icon={LayersIcon} toneName="sky">{formatCount(totals.count, "item")}</Chip>{" "}
      across <Chip icon={PackageOpenIcon} toneName="mint">{formatCount(portfolioCount, "portfolio")}</Chip>,
      worth <Chip icon={CoinsIcon} toneName="sunny">{formatMoney(totals.value)}</Chip>
      {totals.cost > 0 && (
        <>
          , {gain >= 0 ? "up" : "down"}{" "}
          <strong className={gain >= 0 ? "font-semibold text-gain" : "font-semibold text-loss"}>
            {formatMoney(Math.abs(gain))}
          </strong>{" "}
          on what you paid
        </>
      )}
      .
      {insights.top && share >= 0.1 && (
        <>
          {" "}Your <Chip icon={TrophyIcon} toneName="bubblegum">{insights.top.name}</Chip>{" "}
          alone is {share >= 0.5 ? "more than half" : share >= 0.25 ? "over a quarter" : "more than a tenth"} of it.
        </>
      )}
    </p>
  )
}

function Kpi({
  label,
  value,
  icon,
  tone: kpiTone,
  pill,
  detail,
}: {
  label: string
  value: string
  icon: LucideIcon
  tone: Tone
  pill?: React.ReactNode
  detail: React.ReactNode
}) {
  return (
    <Card className="@container/card gap-3 px-4 py-4 sm:gap-4 sm:px-5 sm:py-5">
      <div className="flex items-start justify-between gap-2">
        <Sticker icon={icon} tone={kpiTone} className="relative" />
        {pill}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-muted-fg">{label}</span>
        <span className="font-display text-xl leading-tight font-semibold tabular-nums @[200px]/card:text-[1.75rem] @[240px]/card:text-[2rem]">
          {value}
        </span>
      </div>
      <div className="line-clamp-2 text-xs text-muted-fg sm:line-clamp-1 sm:text-sm">{detail}</div>
    </Card>
  )
}

export function StatGrid({
  totals,
  insights,
  scope,
}: {
  totals: Totals
  insights: Insights
  scope: string
}) {
  const gain = totals.value - totals.cost
  const ratio = totals.cost > 0 ? (gain / totals.cost) * 100 : null
  const kinds = [
    totals.byKind.sealed && `${totals.byKind.sealed} sealed`,
    totals.byKind.graded && `${totals.byKind.graded} graded`,
    totals.byKind.card && `${totals.byKind.card} raw`,
  ].filter(Boolean)

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 @5xl/main:grid-cols-4">
      <Kpi
        label="Market value"
        value={formatMoney(totals.value)}
        icon={CoinsIcon}
        tone={tone("sunny")}
        pill={ratio !== null && <TrendPill value={ratio} />}
        detail={`Everything in ${scope}`}
      />
      <Kpi
        label="Cost basis"
        value={formatMoney(totals.cost)}
        icon={ReceiptIcon}
        tone={tone("lavender")}
        detail={
          insights.unpriced
            ? `${formatCount(insights.unpriced, "entry", "entries")} missing a price`
            : "Every entry has a price"
        }
      />
      <Kpi
        label="Unrealized gain"
        value={`${gain >= 0 ? "+" : "−"}${formatMoney(Math.abs(gain))}`}
        icon={TrendingUpIcon}
        tone={tone("mint")}
        pill={ratio !== null && <TrendPill value={ratio} />}
        detail={
          insights.best
            ? `Best: ${insights.best.name} +${formatMoney(insights.best.gain)}`
            : "No gains recorded yet"
        }
      />
      <Kpi
        label="Items"
        value={totals.count.toLocaleString("en-US")}
        icon={LayersIcon}
        tone={tone("sky")}
        detail={kinds.length ? kinds.join(" · ") : "Nothing here yet"}
      />
    </div>
  )
}
