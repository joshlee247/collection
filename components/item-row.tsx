"use client"

import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@ui-sdk/react/menu"
import {
  NumberInput,
  NumberInputControl,
  NumberInputDecrement,
  NumberInputGroup,
  NumberInputIncrement,
} from "@ui-sdk/react/number-input"
import { toast } from "@ui-sdk/react/toast"
import {
  EllipsisIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  ScanEyeIcon,
  Trash2Icon,
} from "lucide-react"
import { useEffect, useRef, useState, useTransition } from "react"
import {
  deleteItem,
  setItemQuantity,
  undoDeleteItem,
} from "@/app/actions"
import { formatMoney, itemDetail, unitValue } from "@/lib/format"
import type { LocatedItem } from "@/lib/queries"
import type { Item } from "@/lib/types"
import { useDialogs } from "./dialogs-context"
import { followsMarket } from "@/lib/pricing"
import { Badge, Change } from "./card"
import { ItemThumb, KindBadge } from "./item-visuals"

export async function removeWithUndo(item: Item) {
  const result = await deleteItem(item.id)
  if (!result.ok) {
    toast.error("Couldn't remove it", { description: result.error })
    return
  }
  toast(`Removed ${item.name}`, {
    id: `item-${item.id}`,
    duration: 8000,
    action: {
      label: "Undo",
      onAction: async () => {
        const undo = await undoDeleteItem(result.data)
        if (!undo.ok) toast.error("Couldn't undo", { description: undo.error })
      },
    },
  })
}

const STEP_REASONS = new Set([
  "increment-press",
  "decrement-press",
  "step-key",
  "wheel",
  "imperative",
])

export function QuantityStepper({ item, inViewer = false }: { item: Item; inViewer?: boolean }) {
  const [value, setValue] = useState<number | null>(item.quantity)
  const [synced, setSynced] = useState(item.quantity)
  const saved = useRef(item.quantity)
  const undoTo = useRef<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [, startTransition] = useTransition()

  if (item.quantity !== synced) {
    setSynced(item.quantity)
    setValue(item.quantity)
  }

  useEffect(() => {
    saved.current = item.quantity
  }, [item.quantity])

  useEffect(() => () => clearTimeout(timer.current), [])

  function commit(next: number | null) {
    clearTimeout(timer.current)
    if (next === null || next === saved.current) return
    const previous = undoTo.current ?? saved.current
    saved.current = next
    startTransition(async () => {
      if (next === 0) {
        await removeWithUndo({ ...item, quantity: previous })
        return
      }
      const result = await setItemQuantity(item.id, next)
      if (!result.ok) {
        toast.error("Couldn't update quantity", { description: result.error })
        saved.current = previous
        setValue(previous)
        return
      }
      undoTo.current = previous
      toast(`${item.name}: ${next} in this spot`, {
        id: `item-${item.id}`,
        duration: 5000,
        onDismiss: () => {
          undoTo.current = null
        },
        action: {
          label: "Undo",
          onAction: async () => {
            undoTo.current = null
            await setItemQuantity(item.id, previous)
          },
        },
      })
    })
  }

  return (
    <NumberInput
      value={value}
      onValueChange={(next, details) => {
        setValue(next)
        // Touch releases don't always reach onValueCommit, so steps save after a short pause instead.
        if (STEP_REASONS.has(details.reason)) {
          clearTimeout(timer.current)
          timer.current = setTimeout(() => commit(next), 600)
        }
      }}
      onValueCommit={(next, details) => {
        if (details.reason === "input-commit") commit(next)
      }}
      min={0}
      max={99999}
    >
      <NumberInputGroup className="qty">
        <NumberInputDecrement aria-label={inViewer ? `Remove a copy of ${item.name}` : `Remove one ${item.name}`}>
          <MinusIcon aria-hidden="true" />
        </NumberInputDecrement>
        <NumberInputControl aria-label={inViewer ? `Copies of ${item.name}` : `Quantity of ${item.name}`} />
        <NumberInputIncrement aria-label={inViewer ? `Add a copy of ${item.name}` : `Add one ${item.name}`}>
          <PlusIcon aria-hidden="true" />
        </NumberInputIncrement>
      </NumberInputGroup>
    </NumberInput>
  )
}

export function ItemRow({ item }: { item: LocatedItem }) {
  const dialogs = useDialogs()
  const value = unitValue(item)
  const detail = itemDetail(item)
  const change =
    item.purchasePrice && item.marketValue !== null
      ? ((item.marketValue - item.purchasePrice) / item.purchasePrice) * 100
      : null

  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-3 border-b border-line py-3 last:border-0 sm:grid-cols-[auto_1fr_auto_auto_auto]">
      <ItemThumb item={item} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate font-medium">{item.name}</span>
          <KindBadge kind={item.kind} />
          {followsMarket(item) && (
            <Badge className="text-gain">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-gain" />
              Live
            </Badge>
          )}
        </div>
        {detail && <p className="m-0 truncate text-sm text-muted-fg">{detail}</p>}
        {item.location && <p className="m-0 truncate text-xs text-muted-fg">in {item.location}</p>}
      </div>

      <div className="text-end">
        <div className="font-semibold tabular-nums">{formatMoney(value * item.quantity)}</div>
        <div className="flex items-center justify-end gap-2 text-xs text-muted-fg">
          {item.quantity > 1 && value > 0 && <span className="tabular-nums">{formatMoney(value)} ea</span>}
          <Change percent={change} />
        </div>
      </div>

      <div className="col-span-2 sm:col-span-1">
        <QuantityStepper item={item} />
      </div>

      <div className="justify-self-end">
        <Menu
          onAction={(action) => {
            if (action === "view") dialogs.viewer.open({ payload: { itemId: item.id } })
            if (action === "edit") dialogs.item.open({ payload: { item } })
            if (action === "delete") return removeWithUndo(item)
          }}
        >
          <MenuTrigger aria-label={`Actions for ${item.name}`}>
            <EllipsisIcon aria-hidden="true" />
          </MenuTrigger>
          <MenuContent align="end">
            <MenuItem value="view">
              <ScanEyeIcon aria-hidden="true" />
              View card
            </MenuItem>
            <MenuItem value="edit">
              <PencilIcon aria-hidden="true" />
              Edit or move
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              value="delete"
              className="text-loss"
              data-agent-confirm={`Removes ${item.name} from your collection`}
            >
              <Trash2Icon aria-hidden="true" />
              Remove from collection
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>
    </li>
  )
}
