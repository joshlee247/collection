"use client"

import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@ui-sdk/react/collapsible"
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "@ui-sdk/react/segmented-control"
import { useRef, useState } from "react"
import type { LocationBreakdown } from "@/lib/collection"
import { compactMoney, formatMoney } from "@/lib/format"
import { ITEM_KINDS, KIND_LABELS, type ItemKind } from "@/lib/types"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "./card"
import { KIND_DOT } from "@/lib/kinds"

type Measure = "value" | "cost" | "count"

const MEASURES: Record<Measure, { label: string; description: string }> = {
  value: { label: "Market value", description: "Market value stored in each location, by type" },
  cost: { label: "Paid", description: "What you paid for what's in each location, by type" },
  count: { label: "Items", description: "How many items are in each location, by type" },
}

const MAX_ROWS = 7

type Row = { id: string; label: string; parts: Record<ItemKind, number>; total: number }

function rowsFor(locations: LocationBreakdown[], measure: Measure): Row[] {
  const rows = locations
    .map((location) => {
      const parts = Object.fromEntries(
        ITEM_KINDS.map((kind) => [kind, location.byKind[kind][measure]])
      ) as Record<ItemKind, number>
      return {
        id: location.id,
        label: location.label,
        parts,
        total: ITEM_KINDS.reduce((sum, kind) => sum + parts[kind], 0),
      }
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total)
  if (rows.length <= MAX_ROWS) return rows
  const rest = rows.slice(MAX_ROWS - 1)
  const other: Row = {
    id: "other",
    label: `${rest.length} other locations`,
    parts: { card: 0, graded: 0, sealed: 0 },
    total: 0,
  }
  for (const row of rest) {
    for (const kind of ITEM_KINDS) other.parts[kind] += row.parts[kind]
    other.total += row.total
  }
  return [...rows.slice(0, MAX_ROWS - 1), other]
}

function niceMax(value: number) {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 2.5, 5, 10].find((n) => n * magnitude >= value)!
  return step * magnitude
}

export function LocationChart({ locations }: { locations: LocationBreakdown[] }) {
  const [measure, setMeasure] = useState<Measure>("value")
  const [hover, setHover] = useState<{ row: Row; x: number; y: number } | null>(null)
  const plot = useRef<HTMLDivElement>(null)

  const rows = rowsFor(locations, measure)
  const max = niceMax(Math.max(0, ...rows.map((row) => row.total)))
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max)
  const format = (n: number, compact = false) =>
    measure === "count" ? n.toLocaleString("en-US") : formatMoney(n, { compact })
  const tick = (n: number) =>
    measure === "count" ? n.toLocaleString("en-US", { maximumFractionDigits: 1 }) : compactMoney(n)
  const kindsShown = ITEM_KINDS.filter((kind) => rows.some((row) => row.parts[kind] > 0))

  function place(row: Row, event: React.PointerEvent | React.FocusEvent) {
    const box = plot.current?.getBoundingClientRect()
    if (!box) return
    const target = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const x = "clientX" in event ? event.clientX - box.left : target.right - box.left
    setHover({ row, x: Math.min(x, box.width - 200), y: target.bottom - box.top + 6 })
  }

  return (
    <Card className="@container/chart">
      <div className="flex flex-wrap items-start justify-between gap-3 px-6">
        <div className="flex flex-col gap-1">
          <CardTitle>Value by location</CardTitle>
          <CardDescription>{MEASURES[measure].description}</CardDescription>
        </div>
        <div>
          <SegmentedControl
            aria-label="Measure"
            value={measure}
            onValueChange={(value) => value && setMeasure(value as Measure)}
          >
            <SegmentedControlIndicator />
            {(Object.keys(MEASURES) as Measure[]).map((key) => (
              <SegmentedControlItem key={key} value={key}>
                {MEASURES[key].label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </div>
      </div>
      <CardContent className="flex flex-col gap-4">
        {rows.length === 0 ? (
          <p className="m-0 rounded-lg border border-dashed border-line py-10 text-center text-sm text-muted-fg">
            Add items to see where your collection’s value sits.
          </p>
        ) : (
          <>
            <ul aria-label="Legend" className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-sm text-muted-fg">
              {kindsShown.map((kind) => (
                <li key={kind} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className={`size-2.5 rounded-[3px] ${KIND_DOT[kind]}`} />
                  {KIND_LABELS[kind]}
                </li>
              ))}
            </ul>

            <div ref={plot} className="relative" onPointerLeave={() => setHover(null)}>
              <div className="grid grid-cols-[minmax(0,7rem)_1fr_auto] gap-x-3 @lg/chart:grid-cols-[minmax(0,11rem)_1fr_auto]">
                <div aria-hidden="true" className="pointer-events-none relative col-start-2" style={{ gridRow: `1 / span ${rows.length}` }}>
                  {ticks.map((value, index) => (
                    <span
                      key={index}
                      className="absolute inset-y-0 border-s border-dashed border-line"
                      style={{ insetInlineStart: `${(value / max) * 100}%` }}
                    />
                  ))}
                </div>
                {rows.map((row, index) => (
                  <div
                    key={row.id}
                    role="img"
                    tabIndex={0}
                    aria-label={`${row.label}: ${format(row.total)}. ${kindsShown
                      .map((kind) => `${KIND_LABELS[kind]} ${format(row.parts[kind])}`)
                      .join(", ")}`}
                    className="relative col-span-3 grid grid-cols-subgrid items-center rounded-md py-1.5 outline-none focus-visible:ring-4 focus-visible:ring-[var(--ui-ring)] hover:bg-muted/60"
                    style={{ gridRow: index + 1, gridColumn: "1 / -1" }}
                    onPointerMove={(event) => place(row, event)}
                    onFocus={(event) => place(row, event)}
                    onBlur={() => setHover(null)}
                  >
                    <span className="truncate ps-1 text-sm" title={row.label}>
                      {row.label}
                    </span>
                    <span className="flex h-5 gap-[2px]" style={{ width: `${(row.total / max) * 100}%` }}>
                      {kindsShown
                        .filter((kind) => row.parts[kind] > 0)
                        .map((kind, i, shown) => (
                          <span
                            key={kind}
                            className={`h-full min-w-[2px] ${KIND_DOT[kind]} ${i === shown.length - 1 ? "rounded-e-[4px]" : ""}`}
                            style={{ flexGrow: row.parts[kind], flexBasis: 0 }}
                          />
                        ))}
                    </span>
                    <span className="pe-1 text-end text-sm font-medium tabular-nums">
                      {format(row.total, true)}
                    </span>
                  </div>
                ))}
                <div aria-hidden="true" className="relative col-start-2 mt-1 h-4 text-xs text-muted-fg tabular-nums" style={{ gridRow: rows.length + 1 }}>
                  {ticks.map((value, index) => (
                    <span
                      key={index}
                      className={`absolute ${index === 0 ? "" : index === ticks.length - 1 ? "-translate-x-full" : "-translate-x-1/2"} ${index % 2 ? "hidden @xl/chart:inline" : ""}`}
                      style={{ insetInlineStart: `${(value / max) * 100}%` }}
                    >
                      {tick(value)}
                    </span>
                  ))}
                </div>
              </div>

              {hover && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute z-10 w-48 rounded-lg border border-line bg-surface p-2.5 text-xs shadow-[var(--ui-shadow)]"
                  style={{ left: Math.max(0, hover.x), top: hover.y }}
                >
                  <div className="mb-1.5 truncate font-medium">{hover.row.label}</div>
                  {kindsShown.map((kind) => (
                    <div key={kind} className="flex items-center gap-2 py-0.5">
                      <span className={`size-2 rounded-[2px] ${KIND_DOT[kind]}`} />
                      <span className="text-muted-fg">{KIND_LABELS[kind]}</span>
                      <span className="ms-auto font-medium tabular-nums">
                        {format(hover.row.parts[kind])}
                      </span>
                    </div>
                  ))}
                  <div className="mt-1.5 flex border-t border-line pt-1.5 font-medium">
                    Total
                    <span className="ms-auto tabular-nums">{format(hover.row.total)}</span>
                  </div>
                </div>
              )}
            </div>

            <Collapsible>
              <CollapsibleTrigger className="h-auto border-0 bg-transparent p-0 text-sm text-muted-fg hover:bg-transparent hover:text-fg">
                Show as table
              </CollapsibleTrigger>
              <CollapsiblePanel>
                <ChartTable rows={rows} kinds={kindsShown} format={format} label={MEASURES[measure].label} />
              </CollapsiblePanel>
            </Collapsible>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function ChartTable({
  rows,
  kinds,
  format,
  label,
}: {
  rows: Row[]
  kinds: ItemKind[]
  format: (n: number) => string
  label: string
}) {
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-sm">
        <caption className="sr-only">{label} by location and type</caption>
        <thead className="bg-muted">
          <tr>
            <th scope="col" className="h-9 px-3 text-start font-medium">Location</th>
            {kinds.map((kind) => (
              <th key={kind} scope="col" className="h-9 px-3 text-end font-medium">
                {KIND_LABELS[kind]}
              </th>
            ))}
            <th scope="col" className="h-9 px-3 text-end font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-line">
              <th scope="row" className="px-3 py-2 text-start font-normal">{row.label}</th>
              {kinds.map((kind) => (
                <td key={kind} className="px-3 py-2 text-end tabular-nums">
                  {format(row.parts[kind])}
                </td>
              ))}
              <td className="px-3 py-2 text-end font-medium tabular-nums">{format(row.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
