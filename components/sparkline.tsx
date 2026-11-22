"use client"

import { useState } from "react"
import { formatMoney } from "@/lib/format"
import type { PricePoint } from "@/lib/types"

const WIDTH = 320
const HEIGHT = 72
const PAD = 4

function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
}

export function Sparkline({ history }: { history: PricePoint[] }) {
  const [active, setActive] = useState<number | null>(null)
  if (history.length < 2) return null

  const values = history.map((point) => point.market)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const x = (index: number) => PAD + (index / (history.length - 1)) * (WIDTH - PAD * 2)
  const y = (value: number) => PAD + (1 - (value - min) / span) * (HEIGHT - PAD * 2)
  const path = history.map((point, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(point.market).toFixed(1)}`).join(" ")
  const first = history[0]
  const last = history.at(-1)!
  const shown = active === null ? last : history[active]
  const up = last.market >= first.market

  function track(event: React.PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - box.left) / box.width
    setActive(Math.max(0, Math.min(history.length - 1, Math.round(ratio * (history.length - 1)))))
  }

  return (
    <figure className="m-0 flex flex-col gap-2">
      <figcaption className="flex items-baseline justify-between text-xs text-muted-fg">
        <span>Market history</span>
        <span className="tabular-nums">
          {formatDate(shown.date)} · <span className="text-fg">{formatMoney(shown.market)}</span>
        </span>
      </figcaption>
      <svg
        role="img"
        aria-label={`Market price went from ${formatMoney(first.market)} on ${formatDate(first.date)} to ${formatMoney(last.market)} on ${formatDate(last.date)}, between a low of ${formatMoney(min)} and a high of ${formatMoney(max)}.`}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="h-[4.5rem] w-full touch-none overflow-visible"
        onPointerMove={track}
        onPointerLeave={() => setActive(null)}
      >
        <path
          d={path}
          fill="none"
          stroke={up ? "var(--gain)" : "var(--loss)"}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {active !== null && (
          <>
            <line
              x1={x(active)}
              x2={x(active)}
              y1={0}
              y2={HEIGHT}
              stroke="var(--ui-border)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={x(active)} cy={y(history[active].market)} r="4" fill="var(--card)" stroke="var(--ui-foreground)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>
    </figure>
  )
}
