"use client"

import { PackageIcon } from "lucide-react"
import { useRef } from "react"
import { KIND_DOT } from "@/lib/kinds"
import { KIND_LABELS, type Item, type ItemKind } from "@/lib/types"
import { Badge, cx } from "./card"


export function KindBadge({ kind }: { kind: ItemKind }) {
  return (
    <Badge>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${KIND_DOT[kind]}`} />
      {KIND_LABELS[kind]}
    </Badge>
  )
}

type VisualItem = Pick<Item, "kind" | "name" | "set" | "number" | "imageUrl" | "grader" | "grade" | "sealedType">

function CardFace({ item, className }: { item: VisualItem; className?: string }) {
  if (item.imageUrl) {
    return (
      <img
        src={item.imageUrl}
        alt=""
        loading="lazy"
        draggable={false}
        className={cx("block h-full w-full rounded-[4.5%] object-cover", className)}
      />
    )
  }
  return (
    <div
      className={cx(
        "flex h-full w-full flex-col justify-between overflow-hidden rounded-[4.5%] border border-[oklch(1_0_0/10%)] bg-[radial-gradient(120%_80%_at_30%_0%,oklch(0.3_0.03_250),oklch(0.16_0.012_250)_70%)] p-[8%] text-start",
        className
      )}
    >
      <span className="line-clamp-2 text-[clamp(0.6rem,4.5cqw,0.95rem)] leading-tight font-semibold text-fg">
        {item.name}
      </span>
      <span className="grid flex-1 place-items-center">
        <span className="aspect-square w-1/2 rounded-full border border-[oklch(1_0_0/12%)] bg-[conic-gradient(from_200deg,oklch(0.55_0.12_330/0.5),oklch(0.6_0.12_90/0.5),oklch(0.55_0.1_170/0.5),oklch(0.55_0.12_255/0.5),oklch(0.55_0.12_330/0.5))]" />
      </span>
      <span className="truncate text-[clamp(0.5rem,3.4cqw,0.75rem)] text-muted-fg">
        {[item.set, item.number && `#${item.number}`].filter(Boolean).join(" · ") || "Pokémon TCG"}
      </span>
    </div>
  )
}

export function Toploader({ item, lift = true }: { item: VisualItem; lift?: boolean }) {
  return (
    <span className="group/visual relative flex aspect-[5/7] w-full items-center justify-center [container-type:inline-size]">
      <span
        className={cx(
          "absolute top-[3.5%] left-[8.5%] aspect-[63/88] w-[83%] transition-transform duration-300",
          lift && "group-hover/visual:-translate-y-[12%]"
        )}
      >
        <CardFace item={item} />
      </span>
      <img
        src="/images/toploader.webp"
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
      />
    </span>
  )
}

export function Slab({ item }: { item: VisualItem }) {
  if (item.imageUrl) {
    return (
      <span className="block w-full">
        <img
          src={item.imageUrl}
          alt=""
          loading="lazy"
          draggable={false}
          className="block w-full transition-transform duration-300 group-hover/tile:-translate-y-1"
        />
      </span>
    )
  }
  return (
    <span className="flex aspect-[3/5] w-full flex-col gap-[5%] rounded-[6%] border-[6px] border-[oklch(0.85_0_0/0.35)] bg-[linear-gradient(180deg,oklch(1_0_0/10%),oklch(1_0_0/3%))] p-[6%] shadow-[inset_0_0_0_1px_oklch(1_0_0/12%)] [container-type:inline-size]">
      <span className="flex items-center justify-between gap-2 rounded-[4px] border border-[oklch(1_0_0/20%)] bg-black/60 px-[6%] py-[5%]">
        <span className="min-w-0 text-start">
          <span className="block truncate text-[clamp(0.55rem,5cqw,0.8rem)] font-bold tracking-wide uppercase">
            {item.name}
          </span>
          <span className="block truncate text-[clamp(0.45rem,4cqw,0.65rem)] text-muted-fg uppercase">
            {item.set || "Pokémon"}
          </span>
        </span>
        <span className="text-end">
          <span className="block text-[clamp(0.5rem,4cqw,0.65rem)] font-bold text-muted-fg">
            {item.grader || "—"}
          </span>
          <span className="block text-[clamp(1rem,11cqw,1.75rem)] leading-none font-bold tabular-nums">
            {item.grade || "—"}
          </span>
        </span>
      </span>
      <span className="mx-auto aspect-[63/88] w-[86%]">
        <CardFace item={item} />
      </span>
    </span>
  )
}

export function SealedBox({ item }: { item: VisualItem }) {
  if (item.imageUrl) {
    return (
      <span className="grid aspect-square w-full place-items-center">
        <img
          src={item.imageUrl}
          alt=""
          loading="lazy"
          draggable={false}
          className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover/tile:-translate-y-1"
        />
      </span>
    )
  }
  return (
    <span className="grid aspect-square w-full place-items-center">
      <span className="relative flex aspect-[4/3] w-[86%] flex-col justify-between overflow-hidden rounded-lg border border-[oklch(1_0_0/12%)] bg-[linear-gradient(150deg,oklch(0.26_0.03_250),oklch(0.14_0.012_250))] p-[7%] text-start shadow-[0_20px_40px_-20px_black] [container-type:inline-size] transition-transform duration-300 group-hover/tile:-translate-y-1">
        <span className="absolute inset-y-0 right-[18%] w-[6%] bg-[oklch(1_0_0/6%)]" />
        <PackageIcon aria-hidden="true" className="size-[16cqw] text-muted-fg" strokeWidth={1.5} />
        <span className="block truncate text-[clamp(0.5rem,5.5cqw,0.8rem)] tracking-wide text-muted-fg uppercase">
          {item.sealedType || "Sealed"}
        </span>
      </span>
    </span>
  )
}

export function ItemVisual({ item }: { item: VisualItem }) {
  if (item.kind === "graded") return <Slab item={item} />
  if (item.kind === "sealed") return <SealedBox item={item} />
  return <Toploader item={item} />
}

export function ItemThumb({ item }: { item: VisualItem }) {
  return (
    <span aria-hidden="true" className="block w-10 shrink-0 [container-type:inline-size]">
      {item.kind === "sealed" ? (
        <span className="grid aspect-square place-items-center rounded-md border border-[oklch(1_0_0/10%)] bg-muted">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <PackageIcon className="size-4 text-muted-fg" />
          )}
        </span>
      ) : item.kind === "graded" && item.imageUrl ? (
        <img src={item.imageUrl} alt="" className="block w-full" />
      ) : (
        <span className="block aspect-[63/88]">
          <CardFace item={item} />
        </span>
      )}
    </span>
  )
}

export function HoloCard({ item }: { item: VisualItem }) {
  const ref = useRef<HTMLDivElement>(null)

  function move(event: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const box = el.getBoundingClientRect()
    const x = (event.clientX - box.left) / box.width
    const y = (event.clientY - box.top) / box.height
    el.dataset.active = ""
    el.style.setProperty("--ry", `${(x - 0.5) * 24}deg`)
    el.style.setProperty("--rx", `${-(y - 0.5) * 24}deg`)
    el.style.setProperty("--px", `${x * 100}%`)
    el.style.setProperty("--py", `${y * 100}%`)
    el.style.setProperty("--glare", "0.6")
    el.style.setProperty("--foil", item.kind === "card" ? "0.45" : "0.2")
  }

  function reset() {
    const el = ref.current
    if (!el) return
    delete el.dataset.active
    for (const name of ["--rx", "--ry", "--px", "--py", "--glare", "--foil"]) {
      el.style.removeProperty(name)
    }
  }

  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={reset}
      onPointerUp={reset}
      onPointerCancel={reset}
      className="holo-card relative w-full touch-none [transform-style:preserve-3d]"
    >
      <div className="relative overflow-hidden rounded-xl shadow-2xl">
        {item.kind === "card" ? (
          <span className="block aspect-[63/88] [container-type:inline-size]">
            <CardFace item={item} />
          </span>
        ) : (
          <ItemVisual item={item} />
        )}
        {item.kind === "card" && (
          <span aria-hidden="true" className="holo-card__foil pointer-events-none absolute inset-0 rounded-[inherit]" />
        )}
        <span aria-hidden="true" className="holo-card__glare pointer-events-none absolute inset-0 rounded-[inherit]" />
      </div>
    </div>
  )
}
