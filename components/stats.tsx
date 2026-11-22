import { formatMoney } from "@/lib/format"
import type { Totals } from "@/lib/types"

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: "gain" | "loss"
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-2xl border border-line bg-surface p-4">
      <dt className="text-xs font-medium tracking-wide text-muted-fg uppercase">
        {label}
      </dt>
      <dd
        className={`m-0 truncate text-xl font-semibold tracking-tight tabular-nums sm:text-2xl ${
          tone === "gain" ? "text-gain" : tone === "loss" ? "text-loss" : ""
        }`}
      >
        {value}
      </dd>
      {hint && <dd className="m-0 text-xs text-muted-fg">{hint}</dd>}
    </div>
  )
}

export function StatGrid({ totals }: { totals: Totals }) {
  const gain = totals.value - totals.cost
  const percent = totals.cost > 0 ? (gain / totals.cost) * 100 : null
  return (
    <dl className="m-0 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Market value" value={formatMoney(totals.value)} />
      <Stat
        label="Items"
        value={totals.count.toLocaleString("en-US")}
        hint={
          [
            totals.byKind.card && `${totals.byKind.card} raw`,
            totals.byKind.graded && `${totals.byKind.graded} graded`,
            totals.byKind.sealed && `${totals.byKind.sealed} sealed`,
          ]
            .filter(Boolean)
            .join(" · ") || "Nothing here yet"
        }
      />
      <Stat label="Cost basis" value={formatMoney(totals.cost)} />
      <Stat
        label="Gain"
        value={`${gain >= 0 ? "+" : "−"}${formatMoney(Math.abs(gain))}`}
        hint={percent === null ? "Add what you paid to track it" : `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}% overall`}
        tone={totals.cost > 0 ? (gain >= 0 ? "gain" : "loss") : undefined}
      />
    </dl>
  )
}
