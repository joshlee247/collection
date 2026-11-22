"use client"

import { Input, InputClear, InputGroup } from "@ui-sdk/react/input"
import {
  Pagination,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
} from "@ui-sdk/react/pagination"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@ui-sdk/react/tabs"
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { formatMoney, itemDetail, unitValue } from "@/lib/format"
import type { LocatedItem } from "@/lib/queries"
import { ITEM_KINDS, type ItemKind } from "@/lib/types"
import { Card } from "./card"
import { ItemThumb, KindBadge } from "./item-visuals"

type Tab = "all" | ItemKind

const PAGE_SIZE = 8

const TAB_LABELS: Record<Tab, string> = {
  all: "All items",
  card: "Raw cards",
  graded: "Graded",
  sealed: "Sealed",
}

export function InventoryTable({ items }: { items: LocatedItem[] }) {
  const [tab, setTab] = useState<Tab>("all")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)

  const counts = useMemo(() => {
    const result: Record<Tab, number> = { all: items.length, card: 0, graded: 0, sealed: 0 }
    for (const item of items) result[item.kind] += 1
    return result
  }, [items])

  const rows = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    return items.filter((item) => {
      if (tab !== "all" && item.kind !== tab) return false
      const text = [item.name, item.set, item.number, item.location, item.grader, item.grade, item.sealedType]
        .join(" ")
        .toLowerCase()
      return words.every((word) => text.includes(word))
    })
  }, [items, tab, query])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const shown = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  return (
    <Card className="gap-0 px-4 py-5 sm:px-6">
    <Tabs
      value={tab}
      onValueChange={(value) => {
        if (!value) return
        setTab(value as Tab)
        setPage(1)
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-3 @4xl/main:flex-row @4xl/main:items-center @4xl/main:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <h2 className="font-display m-0 text-2xl font-semibold">Inventory</h2>
          <TabsList aria-label="Inventory type" className="w-fit max-w-full overflow-x-auto">
            {(["all", ...ITEM_KINDS] as Tab[]).map((value) => (
              <TabsTab key={value} value={value} className="gap-1.5">
                {TAB_LABELS[value]}
                <span aria-hidden="true" className="grid h-5 min-w-5 place-items-center rounded-full bg-[color-mix(in_oklab,var(--ui-muted-foreground)_18%,transparent)] px-1.5 text-xs tabular-nums">
                  {counts[value]}
                </span>
              </TabsTab>
            ))}
          </TabsList>
        </div>
        <InputGroup className="pill @4xl/main:w-72">
          <SearchIcon aria-hidden="true" className="ms-2.5 text-muted-fg" />
          <Input
            type="search"
            aria-label="Search inventory"
            placeholder="Search name, set, location…"
            value={query}
            onValueChange={(value) => {
              setQuery(value)
              setPage(1)
            }}
          />
          <InputClear aria-label="Clear inventory search" />
        </InputGroup>
      </div>

      {(["all", ...ITEM_KINDS] as Tab[]).map((value) => (
        <TabsPanel key={value} value={value} className="flex flex-col gap-4 outline-none">
          {value === tab && (
            <>
              <div className="-mx-2 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full @3xl/main:min-w-[44rem] text-sm">
                    <caption className="sr-only">{TAB_LABELS[tab]}</caption>
                    <thead>
                      <tr className="border-b border-line text-xs tracking-wide text-muted-fg uppercase">
                        <th scope="col" className="h-10 px-3 text-start font-semibold">Item</th>
                        <th scope="col" className="hidden h-10 px-3 text-start font-semibold @3xl/main:table-cell">Type</th>
                        <th scope="col" className="hidden h-10 px-3 text-start font-semibold @3xl/main:table-cell">Location</th>
                        <th scope="col" className="h-10 px-3 text-end font-semibold">Qty</th>
                        <th scope="col" className="hidden h-10 px-3 text-end font-semibold @3xl/main:table-cell">Paid</th>
                        <th scope="col" className="h-10 px-3 text-end font-semibold">Value</th>
                        <th scope="col" className="hidden h-10 px-3 text-end font-semibold @3xl/main:table-cell">Gain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="h-24 text-center text-muted-fg">
                            {items.length === 0 ? "No items yet." : "No items match."}
                          </td>
                        </tr>
                      ) : (
                        shown.map((item) => <InventoryRow key={item.id} item={item} />)
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
                <p className="m-0 text-sm text-muted-fg">
                  {rows.length === 0
                    ? "0 items"
                    : `Showing ${(current - 1) * PAGE_SIZE + 1}–${Math.min(current * PAGE_SIZE, rows.length)} of ${rows.length}`}
                </p>
                {pageCount > 1 && (
                  <Pagination aria-label="Inventory pages" pageCount={pageCount} page={current} onPageChange={setPage}>
                    <PaginationList className="m-0 flex list-none items-center gap-1 p-0">
                      {({ items: pages }) => (
                        <>
                          <PaginationItem>
                            <PaginationPrevious aria-label="Previous page">
                              <ChevronLeftIcon aria-hidden="true" />
                            </PaginationPrevious>
                          </PaginationItem>
                          {pages.map((entry) => (
                            <PaginationItem key={entry}>
                              {typeof entry === "number" ? <PaginationLink page={entry} /> : <PaginationEllipsis />}
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext aria-label="Next page">
                              <ChevronRightIcon aria-hidden="true" />
                            </PaginationNext>
                          </PaginationItem>
                        </>
                      )}
                    </PaginationList>
                  </Pagination>
                )}
              </div>
            </>
          )}
        </TabsPanel>
      ))}
    </Tabs>
    </Card>
  )
}

function InventoryRow({ item }: { item: LocatedItem }) {
  const value = unitValue(item) * item.quantity
  const cost = item.purchasePrice === null ? null : item.purchasePrice * item.quantity
  const gain = cost === null ? null : value - cost
  return (
    <tr className="border-b border-line/70 transition-colors last:border-0 hover:bg-[var(--glass-strong)]">
      <td className="w-full max-w-0 px-3 py-2 @3xl/main:w-auto @3xl/main:max-w-none">
        <div className="flex items-center gap-3">
          <ItemThumb kind={item.kind} imageUrl={item.imageUrl} size="sm" />
          <div className="min-w-0">
            <div className="truncate font-medium">{item.name}</div>
            <div className="truncate text-xs text-muted-fg">{itemDetail(item) || "—"}</div>
            <div className="truncate text-xs text-muted-fg @3xl/main:hidden">{item.location}</div>
          </div>
        </div>
      </td>
      <td className="hidden px-3 py-2 @3xl/main:table-cell">
        <KindBadge kind={item.kind} />
      </td>
      <td className="hidden px-3 py-2 @3xl/main:table-cell">
        <Link href={`/p/${item.portfolioId}`} className="text-fg">
          {item.location}
        </Link>
      </td>
      <td className="px-3 py-2 text-end tabular-nums">{item.quantity}</td>
      <td className="hidden px-3 py-2 text-end text-muted-fg tabular-nums @3xl/main:table-cell">
        {cost === null ? "—" : formatMoney(cost)}
      </td>
      <td className="font-display px-3 py-2 text-end text-base font-semibold tabular-nums">{formatMoney(value)}</td>
      <td
        className={`hidden px-3 py-2 text-end tabular-nums @3xl/main:table-cell ${gain === null ? "text-muted-fg" : gain >= 0 ? "text-gain" : "text-loss"}`}
      >
        {gain === null ? "—" : `${gain >= 0 ? "+" : "−"}${formatMoney(Math.abs(gain))}`}
      </td>
    </tr>
  )
}
