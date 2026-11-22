"use client"

import { confirm } from "@ui-sdk/react/alert-dialog"
import { Button } from "@ui-sdk/react/button"
import { Field, FieldLabel } from "@ui-sdk/react/field"
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@ui-sdk/react/menu"
import { Switch, SwitchThumb } from "@ui-sdk/react/switch"
import { toast } from "@ui-sdk/react/toast"
import {
  ChevronLeftIcon,
  EllipsisIcon,
  FolderPlusIcon,
  PencilIcon,
  PlusIcon,
  PrinterIcon,
  Trash2Icon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { deletePortfolio } from "@/app/actions"
import { formatCount } from "@/lib/format"
import type { PortfolioView } from "@/lib/queries"
import { SectionTitle } from "./card"
import { CardViewer } from "./card-viewer"
import { CollectionGrid } from "./collection-grid"
import { useDialogs } from "./dialogs-context"
import { PortfolioCard } from "./portfolio-card"
import { QrDialog } from "./qr-dialog"
import { StatGrid } from "./stats"

export function PortfolioScreen({ view }: { view: PortfolioView }) {
  const { portfolio, trail, children, items, totals } = view
  const dialogs = useDialogs()
  const router = useRouter()
  const [includeNested, setIncludeNested] = useState(true)
  const path = [...trail.map((p) => p.name), portfolio.name].join(" / ")
  const parent = trail.at(-1)
  const shown = includeNested ? items : items.filter((item) => item.portfolioId === portfolio.id)

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

  const addItem = () => dialogs.item.open({ payload: { portfolioId: portfolio.id } })

  return (
    <div className="flex flex-col gap-16 px-6 pt-8 pb-32 md:px-10 md:pt-12 md:pb-16">
      <header className="flex flex-col gap-6">
        <Link
          href={parent ? `/p/${parent.id}` : "/"}
          className="no-print flex w-fit items-center gap-1 text-sm text-muted-fg no-underline hover:text-fg"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-4" />
          {parent ? parent.name : "Collection"}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="m-0 text-2xl font-semibold tracking-tight text-white">{portfolio.name}</h1>
            <p className="m-0 mt-0.5 text-sm text-muted-fg">
              {path} · {formatCount(totals.count, "item")}
              {portfolio.description && ` · ${portfolio.description}`}
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
            <Button data-variant="solid" onClick={addItem}>
              <PlusIcon aria-hidden="true" />
              Add item
            </Button>
          </div>
        </div>
      </header>

      <StatGrid totals={totals} insights={view.insights} scope={portfolio.name} />

      {children.length > 0 && (
        <section aria-labelledby="inside-heading" className="flex flex-col gap-6">
          <SectionTitle id="inside-heading">Inside {portfolio.name}</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <PortfolioCard key={child.id} portfolio={child} />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="items-heading" className="flex flex-col gap-6">
        <SectionTitle
          id="items-heading"
          action={
            children.length > 0 && (
              <Field className="flex-row items-center gap-2">
                <Switch checked={includeNested} onCheckedChange={setIncludeNested}>
                  <SwitchThumb />
                </Switch>
                <FieldLabel>Include items in sub-portfolios</FieldLabel>
              </Field>
            )
          }
        >
          In this {children.length > 0 ? "portfolio" : "bin"}
        </SectionTitle>
        {items.length === 0 ? (
          <div className="bento flex flex-col items-center gap-3 px-6 py-14 text-center">
            <p className="m-0 font-semibold">Nothing in {portfolio.name} yet</p>
            <p className="m-0 max-w-sm text-sm text-muted-fg">
              Add the cards, slabs and sealed product stored here. Scan this bin&apos;s QR code later
              to update it from your phone.
            </p>
            <Button data-variant="solid" onClick={addItem}>
              <PlusIcon aria-hidden="true" />
              Add the first item
            </Button>
          </div>
        ) : (
          <CollectionGrid items={shown} defaultView="list" label={`Items in ${portfolio.name}`} />
        )}
      </section>

      <CardViewer items={items} />
    </div>
  )
}
