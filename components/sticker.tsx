import {
  CoinsIcon,
  CrownIcon,
  DropletIcon,
  FlameIcon,
  GemIcon,
  HeartIcon,
  LeafIcon,
  MoonIcon,
  SparklesIcon,
  StarIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react"
import { cx } from "./card"

export type Tone = {
  name: string
  pocket: string
  tab: string
  sticker: string
}

export const TONES: Tone[] = [
  {
    name: "bubblegum",
    pocket: "from-[oklch(0.93_0.06_350)] to-[oklch(0.88_0.09_10)]",
    tab: "bg-[oklch(0.82_0.11_5)]",
    sticker: "from-[oklch(0.82_0.17_355)] to-[oklch(0.65_0.22_10)]",
  },
  {
    name: "sunny",
    pocket: "from-[oklch(0.96_0.07_95)] to-[oklch(0.9_0.11_75)]",
    tab: "bg-[oklch(0.86_0.13_80)]",
    sticker: "from-[oklch(0.92_0.17_95)] to-[oklch(0.76_0.18_60)]",
  },
  {
    name: "lavender",
    pocket: "from-[oklch(0.93_0.05_300)] to-[oklch(0.86_0.08_290)]",
    tab: "bg-[oklch(0.8_0.1_295)]",
    sticker: "from-[oklch(0.8_0.14_300)] to-[oklch(0.6_0.2_290)]",
  },
  {
    name: "mint",
    pocket: "from-[oklch(0.95_0.05_165)] to-[oklch(0.88_0.08_175)]",
    tab: "bg-[oklch(0.82_0.1_170)]",
    sticker: "from-[oklch(0.88_0.13_165)] to-[oklch(0.66_0.15_180)]",
  },
  {
    name: "peach",
    pocket: "from-[oklch(0.95_0.05_60)] to-[oklch(0.88_0.09_45)]",
    tab: "bg-[oklch(0.83_0.11_45)]",
    sticker: "from-[oklch(0.86_0.14_65)] to-[oklch(0.68_0.19_35)]",
  },
  {
    name: "sky",
    pocket: "from-[oklch(0.94_0.04_230)] to-[oklch(0.87_0.08_240)]",
    tab: "bg-[oklch(0.8_0.1_240)]",
    sticker: "from-[oklch(0.84_0.12_220)] to-[oklch(0.6_0.18_255)]",
  },
]

const ICONS: LucideIcon[] = [
  HeartIcon,
  ZapIcon,
  CrownIcon,
  FlameIcon,
  SparklesIcon,
  MoonIcon,
  StarIcon,
  LeafIcon,
  DropletIcon,
  GemIcon,
  CoinsIcon,
]

function hash(text: string) {
  let h = 0
  for (const char of text) h = (h * 31 + char.charCodeAt(0)) >>> 0
  return h
}

export function toneFor(id: string): Tone {
  return TONES[hash(id) % TONES.length]
}

export function iconsFor(id: string): [LucideIcon, LucideIcon] {
  const h = hash(`${id}:icons`)
  const first = ICONS[h % ICONS.length]
  const second = ICONS[(h >>> 4) % ICONS.length]
  return [first, second === first ? ICONS[(h + 1) % ICONS.length] : second]
}

export function Sticker({
  icon: Icon,
  tone,
  size = "md",
  className,
}: {
  icon: LucideIcon
  tone: Tone
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const box = size === "lg" ? "size-14 rounded-[1.1rem]" : size === "sm" ? "size-8 rounded-[0.6rem]" : "size-10 rounded-xl"
  const glyph = size === "lg" ? "size-7" : size === "sm" ? "size-4" : "size-5"
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-grid shrink-0 place-items-center border-2 border-white bg-linear-to-br text-white shadow-[0_3px_0_var(--sticker-edge),0_6px_14px_-6px_oklch(0.3_0.1_290/0.5)]",
        box,
        tone.sticker,
        className
      )}
    >
      <span className="absolute inset-x-1.5 top-1 h-1/3 rounded-full bg-white/35 blur-[1px]" />
      <Icon className={cx("relative drop-shadow-[0_1px_0_oklch(0.3_0.1_290/0.35)]", glyph)} strokeWidth={2.5} />
    </span>
  )
}
