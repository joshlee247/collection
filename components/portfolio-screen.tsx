"use client"

import { confirm } from "@ui-sdk/react/alert-dialog"
import { Button } from "@ui-sdk/react/button"
import { Field, FieldLabel } from "@ui-sdk/react/field"
import { Input, InputClear, InputGroup } from "@ui-sdk/react/input"
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@ui-sdk/react/menu"
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "@ui-sdk/react/segmented-control"
import { Switch, SwitchThumb } from "@ui-sdk/react/switch"
import { toast } from "@ui-sdk/react/toast"
import {
  EllipsisIcon,
  FolderPlusIcon,
  PencilIcon,
  PlusIcon,
  PrinterIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { deletePortfolio } from "@/app/actions"
import { formatCount } from "@/lib/format"
import type { PortfolioView } from "@/lib/queries"
import { ITEM_KINDS, KIND_LABELS, type ItemKind } from "@/lib/types"
import { useDialogs } from "./dialogs-context"
import { ItemRow } from "./item-row"
import { NewPortfolioTile } from "./dashboard-actions"
import { PortfolioCard } from "./portfolio-card"
import { QrDialog } from "./qr-dialog"
import { StatGrid } from "./stats"

type Filter = "all" | ItemKind

export function PortfolioScreen({ view }: { view: PortfolioView }) {
  const { portfolio, trail, children, items, totals } = view
  const dialogs = useDialogs()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [includeNested, setIncludeNested] = useState(true)
  const path = [...trail.map((p) => p.name), portfolio.name].join(" / ")

  const visible = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    return items.filter((item) => {
      if (!includeNested && item.portfolioId !== portfolio.id) return false
      if (filter !== "all" && item.kind !== filter) return false
      const haystack = [item.name, item.set, item.number, item.grader, item.grade, item.sealedType, item.certNumber, item.notes]
        .join(" ")
        .toLowerCase()
      return words.every((word) => haystack.includes(word))
    })
  }, [items, query, filter, includeNested, portfolio.id])

  async function remove() {
    const nestedCount = view.nestedIds.length
    const agreed = await confirm({
      title: `Delete ${portfolio.name}?`,
      description: `This deletes ${formatCount(totals.count, "item")}${
        nestedCount ? ` and ${formatCount(nestedCount, "sub-portfolio")}` : ""
      } inside it. Printed QR codes for it will stop working.`,
      confirmLabel: "Delete forever",
      cancelLabel: "Keep it",
    })
    if (!agreed) return
    const result = await deletePortfolio(portfolio.id)
    if (!result.ok) {
      toast.error("Couldn't delete it", { description: result.error })
      return
    }
    toast(`Deleted ${portfolio.name}`)
    router.push(result.data.parentId ? `/p/${result.data.parentId}` : "/")
  }

  const addItem = () =>
    dialogs.item.open({ payload: { portfolioId: portfolio.id } })

  return (
    <div className="flex flex-col gap-8 px-4 py-4 lg:px-8 lg:py-6">
      <header>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display m-0 text-4xl font-semibold tracking-tight sm:text-5xl">{portfolio.name}</h1>
            <p className="m-0 mt-2 max-w-prose text-base text-muted-fg">
              {portfolio.description || `${formatCount(totals.count, "item")} stored here`}
            </p>
          </div>
          <div className="no-print flex flex-wrap items-center gap-2">
            <QrDialog portfolio={portfolio} path={path} />
            <Menu
              onAction={(action) => {
                if (action === "edit") dialogs.portfolio.open({ payload: { portfolio } })
                if (action === "child") dialogs.portfolio.open({ payload: { parentId: portfolio.id } })
                if (action === "label") router.push(`/p/${portfolio.id}/label`)
                if (action === "delete") return remove()
              }}
            >
              <MenuTrigger aria-label={`More actions for ${portfolio.name}`}>
                <EllipsisIcon aria-hidden="true" />
              </MenuTrigger>
              <MenuContent align="end">
                <MenuItem value="edit">
                  <PencilIcon aria-hidden="true" />
                  Edit portfolio
                </MenuItem>
                <MenuItem value="child">
                  <FolderPlusIcon aria-hidden="true" />
                  New portfolio inside
                </MenuItem>
                <MenuItem value="label">
                  <PrinterIcon aria-hidden="true" />
                  Print QR label
                </MenuItem>
                <MenuSeparator />
                <MenuItem
                  value="delete"
                  className="text-loss"
                  data-agent-confirm={`Deletes ${portfolio.name} and everything in it`}
                >
                  <Trash2Icon aria-hidden="true" />
                  Delete portfolio
                </MenuItem>
              </MenuContent>
            </Menu>
            <Button data-variant="solid" onClick={addItem} className="grow sm:grow-0">
              <PlusIcon aria-hidden="true" />
              Add item
            </Button>
          </div>
        </div>
      </header>

      <StatGrid totals={totals} insights={view.insights} scope={portfolio.name} />

      {children.length > 0 && (
        <section aria-labelledby="inside-heading" className="flex flex-col gap-4">
          <h2 id="inside-heading" className="font-display m-0 text-2xl font-semibold">
            Inside {portfolio.name}
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 @2xl/main:grid-cols-3 @5xl/main:grid-cols-4">
            {children.map((child) => (
              <PortfolioCard key={child.id} portfolio={child} />
            ))}
            <NewPortfolioTile parentId={portfolio.id} />
          </div>
        </section>
      )}

      <section aria-labelledby="items-heading" className="glass flex flex-col gap-4 rounded-[1.75rem] p-4 sm:p-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="items-heading" className="font-display m-0 text-2xl font-semibold">
              Items
            </h2>
            <span className="text-sm text-muted-fg">
              {visible.length === items.length
                ? formatCount(items.length, "entry", "entries")
                : `${visible.length} of ${items.length}`}
            </span>
          </div>
          {items.length > 0 && (
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <InputGroup className="pill md:max-w-xs md:flex-1">
                <SearchIcon aria-hidden="true" className="ms-2.5 text-muted-fg" />
                <Input
                  type="search"
                  aria-label="Search items"
                  placeholder="Search name, set, grade…"
                  value={query}
                  onValueChange={setQuery}
                />
                <InputClear aria-label="Clear search" />
              </InputGroup>
              <SegmentedControl
                aria-label="Show"
                value={filter}
                onValueChange={(value) => value && setFilter(value as Filter)}
                className="w-full md:w-auto"
              >
                <SegmentedControlIndicator />
                <SegmentedControlItem value="all">All</SegmentedControlItem>
                {ITEM_KINDS.map((kind) => (
                  <SegmentedControlItem key={kind} value={kind}>
                    {KIND_LABELS[kind]}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
              {children.length > 0 && (
                <Field className="flex-row! items-center gap-2 md:ms-auto">
                  <Switch checked={includeNested} onCheckedChange={setIncludeNested}>
                    <SwitchThumb />
                  </Switch>
                  <FieldLabel>Include items in sub-portfolios</FieldLabel>
                </Field>
              )}
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center">
            <p className="m-0 text-base font-semibold">Nothing in {portfolio.name} yet</p>
            <p className="m-0 max-w-sm text-sm text-muted-fg">
              Add the cards, slabs and sealed product stored here. You can
              adjust quantities right from this list later.
            </p>
            <Button data-variant="solid" onClick={addItem}>
              <PlusIcon aria-hidden="true" />
              Add the first item
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <p className="m-0 rounded-xl border border-dashed border-line px-6 py-10 text-center text-sm text-muted-fg">
            No items match those filters.
          </p>
        ) : (
          <ul aria-label={`Items in ${portfolio.name}`} className="m-0 flex list-none flex-col gap-2 p-0">
            {visible.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
