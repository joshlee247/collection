"use client"

import { Button } from "@ui-sdk/react/button"
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@ui-sdk/react/dialog"
import { Field, FieldLabel } from "@ui-sdk/react/field"
import { Switch, SwitchThumb } from "@ui-sdk/react/switch"
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "@ui-sdk/react/segmented-control"
import { Textarea } from "@ui-sdk/react/textarea"
import { toast } from "@ui-sdk/react/toast"
import { UnlinkIcon, XIcon } from "lucide-react"
import { useState, useTransition } from "react"
import { saveItem } from "@/app/actions"
import { formatMoney } from "@/lib/format"
import { variantLabel, type CardResult } from "@/lib/pricing"
import type { PortfolioOption } from "@/lib/queries"
import {
  CONDITIONS,
  GRADERS,
  ITEM_KINDS,
  KIND_LABELS,
  SEALED_TYPES,
  type Item,
  type ItemKind,
} from "@/lib/types"
import { CardSearch } from "./card-search"
import { useDialogs, type ItemPayload } from "./dialogs-context"
import { MoneyField, QuantityField, SelectField, TextField } from "./fields"

export function ItemDialog({ options }: { options: PortfolioOption[] }) {
  const { item: controller } = useDialogs()
  const [session, setSession] = useState(0)

  return (
    <Dialog
      controller={controller}
      presentation="auto"
      onOpenChange={(open) => {
        if (open) setSession((value) => value + 1)
      }}
    >
      <DialogBackdrop />
      <DialogContent<ItemPayload> keepMounted className="sm:w-[40rem]">
        {(state) => (
          <ItemForm
            key={session}
            item={state.payload?.item}
            portfolioId={state.payload?.portfolioId ?? options[0]?.value}
            options={options}
            onSaved={() => controller.close()}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

type Linked = {
  id: string
  name: string
  detail: string
  image: string
  variants: { variant: string; market: number | null }[]
}

function linkedFrom(item?: Item): Linked | null {
  if (!item?.cardId) return null
  return {
    id: item.cardId,
    name: item.name,
    detail: [item.set, item.number && `#${item.number}`].filter(Boolean).join(" · "),
    image: item.imageUrl,
    variants: (item.market?.variants ?? []).map((variant) => ({
      variant,
      market: variant === item.market?.variant ? item.market.market : null,
    })),
  }
}

type Prefill = Partial<Pick<Item, "name" | "set" | "number" | "imageUrl" | "marketValue" | "priceVariant">>

export function ItemForm({
  item,
  portfolioId,
  options,
  onSaved,
}: {
  item?: Item
  portfolioId?: string
  options: PortfolioOption[]
  onSaved: () => void
}) {
  const [kind, setKind] = useState<ItemKind>(item?.kind ?? "card")
  const [linked, setLinked] = useState<Linked | null>(() => linkedFrom(item))
  const [live, setLive] = useState(item ? item.livePrice : true)
  const [prefill, setPrefill] = useState<Prefill>({})
  const [fillKey, setFillKey] = useState(0)
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  const editing = Boolean(item)
  const value = <K extends keyof Prefill>(key: K) => (key in prefill ? prefill[key] : item?.[key])
  const followsLive = kind === "card" && Boolean(linked) && live

  function link(card: CardResult) {
    const best = card.variants.find((entry) => entry.market !== null) ?? card.variants[0]
    setLinked({
      id: card.id,
      name: card.name,
      detail: `${card.setName} · #${card.number}${card.setTotal ? `/${card.setTotal}` : ""}`,
      image: card.image,
      variants: card.variants,
    })
    setPrefill({
      name: card.name,
      set: card.setName,
      number: card.setTotal ? `${card.number}/${card.setTotal}` : card.number,
      imageUrl: card.imageLarge,
      priceVariant: best?.variant ?? "",
      ...(kind === "card" && best?.market != null ? { marketValue: best.market } : {}),
    })
    setFillKey((key) => key + 1)
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    data.set("kind", kind)
    startTransition(async () => {
      const result = await saveItem(data)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setError("")
      if (result.data.warning) {
        toast.warning(result.data.name, { description: result.data.warning })
      } else {
        toast.success(editing ? "Item updated" : "Item added", { description: result.data.name })
      }
      onSaved()
    })
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <DialogTitle>{editing ? `Edit ${item!.name}` : "Add to collection"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the details, quantity or where it's stored."
              : "A raw card, a graded slab or a sealed product."}
          </DialogDescription>
        </div>
        <DialogClose aria-label="Close" className="shrink-0">
          <XIcon aria-hidden="true" />
        </DialogClose>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        {item && <input type="hidden" name="id" value={item.id} />}
        {linked && kind !== "sealed" && <input type="hidden" name="cardId" value={linked.id} />}

        <Field>
          <FieldLabel>Type</FieldLabel>
          <SegmentedControl
            value={kind}
            onValueChange={(value) => value && setKind(value as ItemKind)}
            className="w-full"
          >
            <SegmentedControlIndicator />
            {ITEM_KINDS.map((value) => (
              <SegmentedControlItem key={value} value={value}>
                {KIND_LABELS[value]}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </Field>

        {kind !== "sealed" &&
          (linked ? (
            <div className="bento flex items-center gap-3 p-3">
              {linked.image && <img src={linked.image} alt="" className="h-14 w-auto rounded-[3px]" />}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{linked.name}</div>
                <div className="truncate text-xs text-muted-fg">{linked.detail}</div>
                <div className="text-xs text-gain">Linked to TCGplayer prices</div>
              </div>
              <Button data-variant="ghost" onClick={() => setLinked(null)}>
                <UnlinkIcon aria-hidden="true" />
                Unlink card
              </Button>
            </div>
          ) : (
            <CardSearch onSelect={link} />
          ))}

        <div key={fillKey} className="flex flex-col gap-4">
          <TextField
            label="Card or product name"
            name="name"
            defaultValue={value("name")}
            placeholder={kind === "sealed" ? "Evolving Skies" : "Charizard ex"}
            required
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_8rem]">
            <TextField
              label="Set"
              name="set"
              defaultValue={value("set")}
              placeholder={kind === "sealed" ? "Sword & Shield" : "Obsidian Flames"}
            />
            {kind !== "sealed" && (
              <TextField label="Card number" name="number" defaultValue={value("number")} placeholder="125/197" />
            )}
          </div>

          {linked && kind !== "sealed" && linked.variants.length > 1 && (
            <SelectField
              label="Price variant"
              name="priceVariant"
              options={linked.variants.map((entry) => ({
                value: entry.variant,
                label: `${variantLabel(entry.variant)}${entry.market === null ? "" : ` · ${formatMoney(entry.market)}`}`,
              }))}
              defaultValue={value("priceVariant") || linked.variants[0].variant}
            />
          )}

          {kind === "card" && (
            <SelectField
              label="Condition"
              name="condition"
              options={CONDITIONS}
              defaultValue={item?.condition || "Near Mint"}
            />
          )}

          {kind === "graded" && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-[1fr_6rem_1fr]">
              <SelectField
                label="Grading company"
                name="grader"
                options={GRADERS}
                defaultValue={item?.grader || "PSA"}
              />
              <TextField label="Grade" name="grade" defaultValue={item?.grade} placeholder="10" />
              <div className="col-span-2 sm:col-span-1">
                <TextField label="Cert number" name="certNumber" defaultValue={item?.certNumber} />
              </div>
            </div>
          )}

          {kind === "sealed" && (
            <SelectField
              label="Product type"
              name="sealedType"
              options={SEALED_TYPES}
              defaultValue={item?.sealedType || "Booster Box"}
            />
          )}

          {kind === "card" && linked && (
            <Field className="flex-row items-center gap-2">
              <Switch name="livePrice" checked={live} onCheckedChange={setLive}>
                <SwitchThumb />
              </Switch>
              <FieldLabel>Use live market price</FieldLabel>
            </Field>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <QuantityField defaultValue={item?.quantity ?? 1} />
            <MoneyField label="Paid (each)" name="purchasePrice" defaultValue={item?.purchasePrice ?? null} />
            <MoneyField
              label="Market value (each)"
              name="marketValue"
              defaultValue={value("marketValue") ?? null}
              readOnly={followsLive}
              description={
                followsLive
                  ? "Updates from TCGplayer"
                  : kind === "graded" && linked
                    ? "Slab value; TCGplayer shows the raw card"
                    : undefined
              }
            />
          </div>

          <SelectField
            label="Stored in"
            name="portfolioId"
            options={options}
            defaultValue={item?.portfolioId ?? portfolioId}
            required
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_10rem]">
            <TextField
              label="Image URL"
              name="imageUrl"
              type="url"
              defaultValue={value("imageUrl")}
              placeholder="https://…"
            />
            <TextField label="Language" name="language" defaultValue={item?.language ?? "English"} />
          </div>
        </div>

        <Field>
          <FieldLabel>Notes</FieldLabel>
          <Textarea name="notes" defaultValue={item?.notes} />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-loss">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DialogClose>Cancel</DialogClose>
          <Button type="submit" data-variant="solid" disabled={pending}>
            {pending ? "Saving…" : editing ? "Save changes" : "Save item"}
          </Button>
        </div>
      </form>
    </>
  )
}
