"use client"

import { Button } from "@ui-sdk/react/button"
import { Input, InputClear, InputGroup } from "@ui-sdk/react/input"
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "@ui-sdk/react/segmented-control"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@ui-sdk/react/tabs"
import { LayoutGridIcon, ListIcon, SearchIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { formatMoney, unitValue } from "@/lib/format"
import type { LocatedItem } from "@/lib/queries"
import { ITEM_KINDS, type ItemKind } from "@/lib/types"
import { Change } from "./card"
import { useDialogs } from "./dialogs-context"
import { ItemRow } from "./item-row"
import { ItemVisual } from "./item-visuals"

type Tab = "all" | ItemKind
type View = "grid" | "list"

const TAB_LABELS: Record<Tab, string> = {
  all: "All",
  card: "Raw",
  graded: "Graded",
  sealed: "Sealed",
}

const SECTION_LABELS: Record<ItemKind, string> = {
  graded: "Slabs",
  card: "Cards",
  sealed: "Sealed",
}

function Tile({ item }: { item: LocatedItem }) {
  const { viewer } = useDialogs()
  const total = unitValue(item) * item.quantity
  const change =
    item.purchasePrice && item.marketValue !== null
      ? ((item.marketValue - item.purchasePrice) / item.purchasePrice) * 100
      : null
  return (
    <Button
      onClick={() => viewer.open({ payload: { itemId: item.id } })}
      data-variant="bare"
      aria-label={`View ${item.name}`}
      className="group/tile"
    >
      <ItemVisual item={item} />
      <span className="flex flex-col gap-0.5 px-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium">{item.name}</span>
          {item.quantity > 1 && (
            <span className="shrink-0 text-xs text-muted-fg tabular-nums">×{item.quantity}</span>
          )}
        </span>
        <span className="flex items-baseline justify-between gap-2 text-sm">
          <span className="font-semibold tabular-nums">{formatMoney(total)}</span>
          <Change percent={change} className="text-xs" />
        </span>
      </span>
    </Button>
  )
}

const GRID: Record<ItemKind, string> = {
  graded: "grid grid-flow-col auto-cols-[14rem] gap-8 overflow-x-auto pb-4 sm:auto-cols-[16rem] lg:auto-cols-[18rem]",
  card: "grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:gap-x-10 lg:grid-cols-4",
  sealed: "grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:gap-x-10 lg:grid-cols-4",
}

export function CollectionGrid({
  items,
  defaultView = "grid",
  label,
}: {
  items: LocatedItem[]
  defaultView?: View
  label: string
}) {
  const [tab, setTab] = useState<Tab>("all")
  const [view, setView] = useState<View>(defaultView)
  const [query, setQuery] = useState("")

  const rows = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    return items.filter((item) => {
      if (tab !== "all" && item.kind !== tab) return false
      const text = [item.name, item.set, item.number, item.location, item.grader, item.grade, item.sealedType, item.certNumber]
        .join(" ")
        .toLowerCase()
      return words.every((word) => text.includes(word))
    })
  }, [items, tab, query])

  const groups = (["graded", "card", "sealed"] as ItemKind[])
    .map((kind) => ({ kind, items: rows.filter((item) => item.kind === kind) }))
    .filter((group) => group.items.length > 0)

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => value && setTab(value as Tab)}
      className="flex flex-col gap-8"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <TabsList aria-label="Show" className="w-fit max-w-full overflow-x-auto">
          {(["all", ...ITEM_KINDS] as Tab[]).map((value) => (
            <TabsTab key={value} value={value}>
              {TAB_LABELS[value]}
            </TabsTab>
          ))}
        </TabsList>
        <div className="flex items-center gap-2">
          <InputGroup className="pill min-w-0 flex-1 md:w-64 md:flex-none">
            <SearchIcon aria-hidden="true" className="ms-2.5 text-muted-fg" />
            <Input
              type="search"
              aria-label="Search collection"
              placeholder="Search"
              value={query}
              onValueChange={setQuery}
            />
            <InputClear aria-label="Clear search" />
          </InputGroup>
          <SegmentedControl
            aria-label="Layout"
            value={view}
            onValueChange={(value) => value && setView(value as View)}
          >
            <SegmentedControlIndicator />
            <SegmentedControlItem value="grid">
              <LayoutGridIcon aria-hidden="true" className="size-4" />
              <span className="sr-only">Grid</span>
            </SegmentedControlItem>
            <SegmentedControlItem value="list">
              <ListIcon aria-hidden="true" className="size-4" />
              <span className="sr-only">List</span>
            </SegmentedControlItem>
          </SegmentedControl>
        </div>
      </div>

      {(["all", ...ITEM_KINDS] as Tab[]).map((value) => (
        <TabsPanel key={value} value={value} className="outline-none">
          {value === tab &&
            (rows.length === 0 ? (
              <p className="m-0 py-16 text-center text-sm text-muted-fg">
                {items.length === 0 ? "Nothing here yet." : "No matches."}
              </p>
            ) : view === "list" ? (
              <ul aria-label={label} className="m-0 list-none p-0">
                {rows.map((item) => (
                  <ItemRow key={item.id} item={item} />
                ))}
              </ul>
            ) : (
              <div className="flex flex-col gap-12">
                {groups.map((group) => (
                  <section key={group.kind} aria-label={`${SECTION_LABELS[group.kind]} in ${label}`} className="flex flex-col gap-5">
                    {tab === "all" && (
                      <h3 className="m-0 text-xs font-medium tracking-[0.18em] text-muted-fg uppercase">
                        {SECTION_LABELS[group.kind]} · {group.items.length}
                      </h3>
                    )}
                    <div className={GRID[group.kind]}>
                      {group.items.map((item) => (
                        <Tile key={item.id} item={item} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ))}
        </TabsPanel>
      ))}
    </Tabs>
  )
}
