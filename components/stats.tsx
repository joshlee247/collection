import type { Insights } from "@/lib/collection"
import { formatCount, formatMoney } from "@/lib/format"
import type { Totals } from "@/lib/types"
import { Change } from "./card"

function Figure({ label, value, detail }: { label: string; value: React.ReactNode; detail?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-line px-5 py-4 sm:border-s">
      <dt className="text-xs text-muted-fg">{label}</dt>
      <dd className="m-0 truncate text-lg font-semibold tracking-tight tabular-nums">{value}</dd>
      {detail && <dd className="m-0 truncate text-xs text-muted-fg">{detail}</dd>}
    </div>
  )
}

export function StatGrid({
  totals,
  insights,
  scope,
  weekChange = null,
}: {
  totals: Totals
  insights: Insights
  scope: string
  weekChange?: number | null
}) {
  const gain = totals.value - totals.cost
  const percent = totals.cost > 0 ? (gain / totals.cost) * 100 : null
  const kinds = [
    totals.byKind.sealed && `${totals.byKind.sealed} sealed`,
    totals.byKind.graded && `${totals.byKind.graded} graded`,
    totals.byKind.card && `${totals.byKind.card} raw`,
  ].filter(Boolean)

  return (
    <dl className="bento m-0 grid grid-cols-2 overflow-hidden lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
      <div className="col-span-2 flex flex-col gap-1 border-b border-line px-5 py-5 lg:col-span-1 lg:border-b-0">
        <dt className="text-xs text-muted-fg">Market value · {scope}</dt>
        <dd className="m-0 text-4xl font-semibold tracking-tight tabular-nums">{formatMoney(totals.value)}</dd>
        <dd className="m-0 text-sm">
          {percent === null ? (
            <span className="text-muted-fg">Add what you paid to track gains</span>
          ) : (
            <>
              <Change amount={formatMoney(Math.abs(gain))} percent={percent} />{" "}
              <span className="text-muted-fg">all time</span>
            </>
          )}
        </dd>
        {weekChange !== null && (
          <dd className="m-0 text-sm">
            <Change
              amount={formatMoney(Math.abs(weekChange))}
              percent={totals.value - weekChange > 0 ? (weekChange / (totals.value - weekChange)) * 100 : 0}
            />{" "}
            <span className="text-muted-fg">past 7 days</span>
          </dd>
        )}
      </div>
      <Figure
        label="Cost basis"
        value={formatMoney(totals.cost)}
        detail={insights.unpriced ? `${formatCount(insights.unpriced, "entry", "entries")} unpriced` : "All entries priced"}
      />
      <Figure
        label="Top performer"
        value={insights.best ? insights.best.name : "—"}
        detail={insights.best ? <span className="text-gain">+{formatMoney(insights.best.gain)}</span> : "No gains yet"}
      />
      <Figure
        label="Items"
        value={totals.count.toLocaleString("en-US")}
        detail={kinds.length ? kinds.join(" · ") : "Nothing here yet"}
      />
    </dl>
  )
}
