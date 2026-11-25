"use client"

import { useEffect, useRef } from "react"
import { cx } from "./card"
import {
  Barcode,
  CardWindow,
  SLAB_CASE,
  SlabCase,
  slabStyle,
  useIsSlabPhoto,
  type SlabStyle,
  type VisualItem,
} from "./item-visuals"

const REST = { x: -6, y: 0 }
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

type Motion = {
  x: number
  y: number
  vx: number
  vy: number
  dragging: boolean
  touched: boolean
  target: { x: number; y: number } | null
  pointer: { x: number; y: number } | null
}

// A slab you can turn over: drag (or use the arrow keys) to rotate it, flick it to spin it,
// double-click or press Home to set it straight. Untouched, it sways gently.
export function Slab3D({ item }: { item: VisualItem }) {
  const ref = useRef<HTMLDivElement>(null)
  const motion = useRef<Motion>({
    x: REST.x,
    y: -18,
    vx: 0,
    vy: 0,
    dragging: false,
    touched: false,
    target: null,
    pointer: null,
  })
  const photo = useIsSlabPhoto(item.imageUrl)
  const style = slabStyle(item.grader)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const m = motion.current
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      if (!m.dragging) {
        if (m.target) {
          m.x += (m.target.x - m.x) * (reduce ? 1 : 0.12)
          m.y += (m.target.y - m.y) * (reduce ? 1 : 0.12)
          if (Math.abs(m.target.x - m.x) + Math.abs(m.target.y - m.y) < 0.05) {
            m.x = m.target.x
            m.y = m.target.y
            m.target = null
          }
        } else if (!m.touched) {
          if (!reduce) {
            const t = (now - start) / 1000
            m.y = Math.sin(t * 0.7 - 0.8) * 22
            m.x = REST.x + Math.sin(t * 0.45) * 4
          } else {
            m.y = 0
          }
        } else if (!reduce && (Math.abs(m.vx) > 0.01 || Math.abs(m.vy) > 0.01)) {
          m.x = clamp(m.x + m.vx, -70, 70)
          m.y += m.vy
          m.vx *= 0.94
          m.vy *= 0.95
        }
      }
      // Which side faces you decides the light: the shine sweeps across as it turns.
      const turn = ((((m.y + 180) % 360) + 360) % 360) - 180
      const facing = Math.abs(turn) > 90 ? turn - Math.sign(turn) * 180 : turn
      el.style.setProperty("--rx", `${m.x.toFixed(2)}deg`)
      el.style.setProperty("--ry", `${m.y.toFixed(2)}deg`)
      el.style.setProperty("--shine", `${(50 - facing * 1.4 + m.x * 0.6).toFixed(1)}%`)
      el.style.setProperty("--turn", `${(m.y * 2 + m.x * 3).toFixed(1)}deg`)
      el.style.setProperty("--shade", `${(Math.abs(facing) / 90).toFixed(3)}`)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  function settle() {
    const m = motion.current
    m.touched = true
    m.vx = m.vy = 0
    m.target = { x: REST.x, y: Math.round(m.y / 360) * 360 }
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    const m = motion.current
    event.currentTarget.setPointerCapture(event.pointerId)
    m.dragging = m.touched = true
    m.target = null
    m.vx = m.vy = 0
    m.pointer = { x: event.clientX, y: event.clientY }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const m = motion.current
    if (!m.dragging || !m.pointer) return
    const dx = (event.clientX - m.pointer.x) * 0.6
    const dy = (event.clientY - m.pointer.y) * 0.6
    m.pointer = { x: event.clientX, y: event.clientY }
    m.y += dx
    m.x = clamp(m.x - dy, -70, 70)
    m.vy = dx
    m.vx = -dy
  }

  function onPointerUp() {
    const m = motion.current
    m.dragging = false
    m.pointer = null
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const m = motion.current
    const base = m.target ?? { x: m.x, y: m.y }
    const steps: Record<string, [number, number]> = {
      ArrowLeft: [0, -30],
      ArrowRight: [0, 30],
      ArrowUp: [20, 0],
      ArrowDown: [-20, 0],
    }
    if (event.key === "Home") {
      event.preventDefault()
      settle()
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      m.touched = true
      m.vx = m.vy = 0
      m.target = { x: REST.x, y: Math.round(base.y / 180) * 180 + 180 }
    } else if (steps[event.key]) {
      event.preventDefault()
      const [sx, sy] = steps[event.key]
      m.touched = true
      m.vx = m.vy = 0
      m.target = { x: clamp(base.x + sx, -70, 70), y: base.y + sy }
    }
  }

  const edge =
    style === "tag"
      ? "bg-[linear-gradient(90deg,oklch(0.12_0_0),oklch(0.34_0_0)_45%,oklch(0.2_0_0)_55%,oklch(0.1_0_0))]"
      : "bg-[linear-gradient(90deg,oklch(0.78_0_0/0.95),oklch(0.98_0_0/0.95)_45%,oklch(0.9_0_0/0.95)_55%,oklch(0.72_0_0/0.95))]"

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div
        ref={ref}
        data-style={style}
        role="group"
        tabIndex={0}
        aria-roledescription="3D slab"
        aria-label={`${item.grader || "Graded"} ${item.grade} ${item.name}. Drag or use the arrow keys to turn it; Enter flips it, Home sets it straight.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={settle}
        onKeyDown={onKeyDown}
        className="slab-3d w-full cursor-grab touch-none rounded-[2.5cqw] outline-none select-none [container-type:inline-size] focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-8 focus-visible:ring-offset-black active:cursor-grabbing"
      >
        <div className="slab-3d__scene relative aspect-[3/5] w-full">
          <div className="slab-3d__body absolute inset-0">
            {/* Front */}
            <div className="slab-3d__face slab-3d__front">
              {photo ? (
                <img src={item.imageUrl} alt="" draggable={false} className="block h-full w-full object-fill" />
              ) : (
                <SlabCase item={item} fixed />
              )}
              <span aria-hidden="true" className="slab-3d__shine" />
            </div>
            {/* Back */}
            <div className="slab-3d__face slab-3d__back">
              <SlabBack item={item} style={style} />
              <span aria-hidden="true" className="slab-3d__shine" />
            </div>
            {/* Edges */}
            <div className={cx("slab-3d__edge slab-3d__edge--left", edge)} />
            <div className={cx("slab-3d__edge slab-3d__edge--right", edge)} />
            <div className={cx("slab-3d__edge slab-3d__edge--top", edge)} />
            <div className={cx("slab-3d__edge slab-3d__edge--bottom", edge)} />
          </div>
        </div>
      </div>
      <p aria-hidden="true" className="m-0 text-xs text-muted-fg">
        Drag to turn it over
      </p>
    </div>
  )
}

function SlabBack({ item, style }: { item: VisualItem; style: SlabStyle }) {
  const grader = item.grader && item.grader !== "Other" ? item.grader : "Graded"
  const seed = item.certNumber || `${item.name}${item.set}${item.number}`
  const tag = style === "tag"
  return (
    <span
      className={cx(
        "flex h-full w-full flex-col justify-between gap-[5cqw] overflow-hidden rounded-[2.5cqw] p-[4cqw] pb-[6cqw]",
        SLAB_CASE[tag ? "tag" : "light"]
      )}
    >
      <span
        className={cx(
          "flex items-center justify-between gap-[3cqw] px-[4cqw] py-[3.5cqw]",
          tag
            ? "border-[0.5cqw] border-[oklch(0.75_0_0)] bg-black text-white"
            : style === "psa"
              ? "border-[2cqw] border-[oklch(0.55_0.21_27)] bg-white text-black"
              : "border-[2cqw] border-[oklch(0.86_0_0)] bg-[oklch(0.97_0_0)] text-black"
        )}
      >
        <span className="flex min-w-0 flex-col gap-[1.5cqw]">
          <span
            className={cx(
              "text-[7cqw] leading-none font-black tracking-tight",
              style === "psa" && "text-[oklch(0.42_0.17_260)] italic",
              tag && "tracking-[0.18em] [font-family:Georgia,serif]"
            )}
          >
            {grader}
          </span>
          <Barcode seed={`${seed}back`} className="h-[3.4cqw]" />
          {item.certNumber && (
            <span className="truncate text-[2.4cqw] leading-none tabular-nums opacity-70">
              Cert {item.certNumber}
            </span>
          )}
        </span>
        {/* A holographic seal, like the sticker on the back of a real label. */}
        <span
          aria-hidden="true"
          className="aspect-square w-[15cqw] shrink-0 rounded-full border-[0.4cqw] border-white/70 bg-[conic-gradient(from_var(--turn,0deg),oklch(0.8_0.12_330),oklch(0.85_0.12_90),oklch(0.8_0.12_170),oklch(0.75_0.12_255),oklch(0.8_0.12_330))] shadow-[inset_0_0_2cqw_oklch(1_0_0/60%)]"
        />
      </span>
      <CardWindow style={style}>
        <CardBack />
      </CardWindow>
    </span>
  )
}

function CardBack() {
  return (
    <span className="relative grid h-full w-full place-items-center overflow-hidden rounded-[4.5%] border-[3cqw] border-[oklch(0.42_0.1_255)] bg-[radial-gradient(circle_at_50%_45%,oklch(0.5_0.14_255),oklch(0.3_0.1_260)_55%,oklch(0.2_0.07_262))]">
      <span className="absolute inset-0 bg-[repeating-conic-gradient(from_0deg_at_50%_45%,oklch(1_0_0/5%)_0deg_6deg,transparent_6deg_12deg)]" />
      <span className="relative aspect-square w-[46%] rounded-full border-[1.5cqw] border-[oklch(0.85_0.06_255/0.7)] bg-[radial-gradient(circle_at_35%_30%,oklch(0.75_0.1_250),oklch(0.42_0.13_258)_60%)] shadow-[0_0_8cqw_oklch(0.6_0.15_255/45%)]">
        <span className="absolute inset-[22%] rounded-full border-[1.5cqw] border-[oklch(0.9_0.04_255/0.6)]" />
      </span>
    </span>
  )
}
