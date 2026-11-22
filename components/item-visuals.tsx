import { AwardIcon, PackageIcon, RectangleVerticalIcon } from "lucide-react"
import { KIND_LABELS, type ItemKind } from "@/lib/types"

const KIND_STYLES: Record<ItemKind, string> = {
  card: "text-kind-card bg-[color-mix(in_oklab,var(--kind-card)_12%,var(--ui-background))]",
  graded:
    "text-kind-graded bg-[color-mix(in_oklab,var(--kind-graded)_14%,var(--ui-background))]",
  sealed:
    "text-kind-sealed bg-[color-mix(in_oklab,var(--kind-sealed)_12%,var(--ui-background))]",
}

const KIND_ICONS: Record<ItemKind, typeof PackageIcon> = {
  card: RectangleVerticalIcon,
  graded: AwardIcon,
  sealed: PackageIcon,
}

export function KindBadge({ kind }: { kind: ItemKind }) {
  return (
    <span
      className={`inline-flex h-5 items-center rounded-full px-2 text-[0.7rem] font-semibold tracking-wide ${KIND_STYLES[kind]}`}
    >
      {KIND_LABELS[kind]}
    </span>
  )
}

export function ItemThumb({
  kind,
  imageUrl,
  size = "md",
}: {
  kind: ItemKind
  imageUrl?: string
  size?: "md" | "lg"
}) {
  const box = size === "lg" ? "h-20 w-14" : "h-14 w-10"
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        className={`${box} shrink-0 rounded-md bg-muted object-contain`}
      />
    )
  }
  const Icon = KIND_ICONS[kind]
  return (
    <span
      aria-hidden="true"
      className={`${box} grid shrink-0 place-items-center rounded-md ${KIND_STYLES[kind]}`}
    >
      <Icon className="size-5" />
    </span>
  )
}
