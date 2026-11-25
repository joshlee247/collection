"use client"

import { PackageIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
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

type VisualItem = Pick<Item, "kind" | "name" | "set" | "number" | "imageUrl" | "grader" | "grade" | "certNumber" | "sealedType">

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

const GRADE_NAMES: [number, string][] = [
  [10, "Gem Mint"],
  [9.5, "Gem Mint"],
  [9, "Mint"],
  [8, "NM-MT"],
  [7, "Near Mint"],
  [6, "EX-MT"],
  [5, "Excellent"],
  [4, "VG-EX"],
  [3, "Very Good"],
  [2, "Good"],
  [1.5, "Fair"],
  [1, "Poor"],
]

export function gradeName(grader: string, grade: string) {
  const value = Number(grade)
  if (!grade || !Number.isFinite(value)) return ""
  if (grader === "PSA" && value === 10) return "Gem Mt"
  if (grader === "BGS" && value === 10) return "Pristine"
  return GRADE_NAMES.find(([min]) => value >= min)?.[1] ?? ""
}

// Deterministic, so the server and client draw the same barcode.
function hashBits(text: string, count: number) {
  let h = 2166136261
  for (const ch of text || "vault") h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return Array.from({ length: count }, (_, i) => {
    h = Math.imul(h ^ (h >>> 13) ^ i, 1274126177)
    return (h >>> 7) & 3
  })
}

function Barcode({ seed, className }: { seed: string; className?: string }) {
  return (
    <span aria-hidden="true" className={cx("flex items-stretch gap-[0.6cqw]", className)}>
      {hashBits(seed, 30).map((bits, i) => (
        <span key={i} className="bg-current" style={{ width: `${0.35 + bits * 0.3}cqw` }} />
      ))}
    </span>
  )
}

function DotCode({ seed }: { seed: string }) {
  return (
    <span
      aria-hidden="true"
      className="grid aspect-square w-full grid-cols-7 gap-[0.4cqw] bg-white p-[0.8cqw]"
    >
      {hashBits(seed, 49).map((bits, i) => {
        const row = Math.floor(i / 7)
        const col = i % 7
        const finder = (row < 2 && col < 2) || (row < 2 && col > 4) || (row > 4 && col < 2)
        return <span key={i} className={finder || bits > 1 ? "bg-black" : ""} />
      })}
    </span>
  )
}

// A photo of the whole slab is taller than a bare card (about 3:5 against 63:88), so it shows as is.
function useIsSlabPhoto(url: string) {
  const [shape, setShape] = useState<{ url: string; photo: boolean } | null>(null)
  useEffect(() => {
    if (!url) return
    let active = true
    const image = new Image()
    image.onload = () => {
      if (active && image.naturalHeight) setShape({ url, photo: image.naturalWidth / image.naturalHeight < 0.66 })
    }
    image.src = url
    return () => {
      active = false
    }
  }, [url])
  if (!url) return false
  return shape?.url === url ? shape.photo : /slab/i.test(url)
}

type SlabStyle = "psa" | "tag" | "clear"
const slabStyle = (grader: string): SlabStyle => (grader === "PSA" ? "psa" : grader === "TAG" ? "tag" : "clear")

function SlabLabel({ item, style }: { item: VisualItem; style: SlabStyle }) {
  const grader = item.grader && item.grader !== "Other" ? item.grader : "Graded"
  const name = gradeName(item.grader, item.grade)
  const number = item.number ? `#${item.number.split("/")[0]}` : ""
  const lines = [item.set ? `Pokémon ${item.set}` : "Pokémon", item.name].filter(Boolean)
  const seed = item.certNumber || `${item.name}${item.set}${item.number}`

  if (style === "tag") {
    return (
      <span className="relative block border-[0.5cqw] border-[oklch(0.75_0_0)] bg-black px-[4cqw] pt-[5cqw] pb-[3.5cqw] text-white">
        <span className="absolute -top-[2.6cqw] left-1/2 -translate-x-1/2 bg-black px-[2cqw] text-[3.6cqw] leading-none font-black tracking-[0.18em] text-[oklch(0.9_0_0)] [font-family:Georgia,serif]">
          {grader}
        </span>
        <span className="flex items-center gap-[3cqw]">
          <span className="min-w-0 flex-1 text-[3.1cqw] leading-[1.3] font-semibold uppercase">
            {lines.map((line) => (
              <span key={line} className="line-clamp-2">
                {line}
              </span>
            ))}
            {number && <span className="block truncate">{number}</span>}
          </span>
          <span className="w-[12cqw] shrink-0">
            <DotCode seed={seed} />
          </span>
          {item.certNumber && (
            <span className="shrink-0 text-[2cqw] leading-none font-medium text-[oklch(0.7_0_0)] [writing-mode:vertical-rl] rotate-180">
              {item.certNumber}
            </span>
          )}
          <span className="flex shrink-0 flex-col items-center">
            <span className="text-[13cqw] leading-[0.9] font-bold tabular-nums">{item.grade || "—"}</span>
            {name && <span className="text-[2.4cqw] font-bold whitespace-nowrap uppercase">{name}</span>}
          </span>
        </span>
      </span>
    )
  }

  const psa = style === "psa"
  return (
    <span
      className={cx(
        "flex flex-col gap-[2cqw] border-[2cqw] px-[3cqw] pt-[2cqw] pb-[1.5cqw] text-black",
        psa ? "border-[oklch(0.55_0.21_27)] bg-white" : "border-[oklch(0.86_0_0)] bg-[oklch(0.97_0_0)]"
      )}
    >
      <span className="flex gap-[3cqw] text-[3.6cqw] leading-[1.25] uppercase">
        <span className="min-w-0 flex-1">
          {lines.map((line) => (
            <span key={line} className="line-clamp-2">
              {line}
            </span>
          ))}
        </span>
        <span className="shrink-0 text-end">
          <span className="block">{number || "\u00a0"}</span>
          <span className="block whitespace-nowrap">{name || "\u00a0"}</span>
          <span className="block font-medium tabular-nums">{item.grade || "—"}</span>
        </span>
      </span>
      <span className="flex items-end justify-between gap-[3cqw]">
        <span className="flex min-w-0 flex-col gap-[0.6cqw]">
          <Barcode seed={seed} className="h-[3.4cqw]" />
          {item.certNumber && <span className="truncate text-[2.2cqw] leading-none tabular-nums">{item.certNumber}</span>}
        </span>
        <span
          className={cx(
            "-mb-[1.5cqw] px-[2cqw] py-[0.6cqw] text-[3.6cqw] leading-none font-black tracking-tight italic",
            psa ? "bg-[oklch(0.94_0_0)] text-[oklch(0.42_0.17_260)]" : "bg-black text-white not-italic"
          )}
        >
          {grader}
        </span>
      </span>
    </span>
  )
}

export function Slab({ item }: { item: VisualItem }) {
  const photo = useIsSlabPhoto(item.imageUrl)
  if (photo) {
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
  const style = slabStyle(item.grader)
  return (
    <span className="block w-full [container-type:inline-size]">
      <span
        className={cx(
          "relative flex w-full flex-col gap-[5cqw] rounded-[4cqw] p-[4cqw] pb-[7cqw] transition-transform duration-300 group-hover/tile:-translate-y-1",
          style === "tag"
            ? "bg-[linear-gradient(160deg,oklch(0.24_0_0),oklch(0.1_0_0)_45%,oklch(0.17_0_0))] shadow-[inset_0_0_0_0.6cqw_oklch(0.4_0_0),inset_0_0_0_2.2cqw_oklch(0.14_0_0),inset_0_0_0_2.6cqw_oklch(0.32_0_0)]"
            : "bg-[linear-gradient(160deg,oklch(0.98_0_0),oklch(0.88_0_0)_50%,oklch(0.95_0_0))] shadow-[inset_0_0_0_0.6cqw_oklch(1_0_0),inset_0_0_0_2.2cqw_oklch(0.9_0_0),inset_0_0_0_2.6cqw_oklch(0.78_0_0)]"
        )}
      >
        <SlabLabel item={item} style={style} />
        <span
          className={cx(
            "relative mx-auto w-[92%] rounded-[2cqw] p-[2.5cqw]",
            style === "tag" ? "bg-black/60 shadow-[inset_0_0_0_0.5cqw_oklch(0.3_0_0)]" : "bg-white/70 shadow-[inset_0_0_0_0.5cqw_oklch(0.85_0_0)]"
          )}
        >
          <span className="block aspect-[63/88] [container-type:inline-size]">
            <CardFace item={item} />
          </span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(125deg,oklch(1_0_0/18%),transparent_30%,transparent_70%,oklch(1_0_0/8%))]"
          />
        </span>
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
      ) : item.kind === "graded" ? (
        <Slab item={item} />
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
