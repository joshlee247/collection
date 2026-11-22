import { AwardIcon, PackageIcon, SparklesIcon } from "lucide-react"
import { KIND_LABELS, type ItemKind } from "@/lib/types"
import { Badge } from "./card"

export const KIND_DOT: Record<ItemKind, string> = {
  card: "bg-kind-card",
  graded: "bg-kind-graded",
  sealed: "bg-kind-sealed",
}

const KIND_ART: Record<ItemKind, string> = {
  card: "bg-[conic-gradient(from_210deg,oklch(0.84_0.13_330),oklch(0.9_0.12_85),oklch(0.86_0.12_170),oklch(0.8_0.13_255),oklch(0.84_0.13_330))]",
  graded: "bg-[linear-gradient(160deg,oklch(0.93_0.09_90),oklch(0.78_0.14_70))]",
  sealed: "bg-[linear-gradient(160deg,oklch(0.9_0.1_170),oklch(0.72_0.14_200))]",
}

const KIND_ICONS: Record<ItemKind, typeof PackageIcon> = {
  card: SparklesIcon,
  graded: AwardIcon,
  sealed: PackageIcon,
}

export function KindBadge({ kind }: { kind: ItemKind }) {
  return (
    <Badge className="px-2 text-muted-fg">
      <span aria-hidden="true" className={`size-1.5 rounded-full ${KIND_DOT[kind]}`} />
      {KIND_LABELS[kind]}
    </Badge>
  )
}

export function ItemThumb({
  kind,
  imageUrl,
  size = "md",
}: {
  kind: ItemKind
  imageUrl?: string
  size?: "sm" | "md"
}) {
  const box = size === "sm" ? "h-11 w-8" : "h-16 w-12"
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        className={`${box} shrink-0 rotate-[-3deg] rounded-md object-contain shadow-[0_4px_10px_-4px_oklch(0.3_0.1_290/0.5)]`}
      />
    )
  }
  const Icon = KIND_ICONS[kind]
  return (
    <span
      aria-hidden="true"
      className={`${box} relative grid shrink-0 rotate-[-3deg] place-items-center rounded-md border-2 border-white text-white shadow-[0_4px_10px_-4px_oklch(0.3_0.1_290/0.55)] ${KIND_ART[kind]}`}
    >
      {kind === "graded" && (
        <span className="absolute inset-x-0.5 top-0.5 h-2 rounded-sm bg-white/80" />
      )}
      <Icon className="size-4 drop-shadow-[0_1px_0_oklch(0.3_0.1_290/0.4)]" strokeWidth={2.5} />
    </span>
  )
}
