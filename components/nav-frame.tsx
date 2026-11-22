"use client"

import { Button } from "@ui-sdk/react/button"
import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@ui-sdk/react/drawer"
import { LayoutGridIcon, MenuIcon, PlusIcon, XIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import type { NavData } from "@/lib/queries"
import { useDialogs } from "./dialogs-context"
import { ItemDialog } from "./item-dialog"
import { PortfolioDialog } from "./portfolio-dialog"
import { PortfolioNav } from "./portfolio-nav"

export function Brand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-lg px-1 text-fg no-underline"
    >
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center rounded-lg bg-[image:var(--holo)] shadow-sm"
      >
        <span className="size-3.5 rounded-full border-2 border-white/90 bg-white/40" />
      </span>
      <span className="text-[0.95rem] font-semibold tracking-tight">
        Card Vault
      </span>
    </Link>
  )
}

function OverviewLink({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <Link
      href="/"
      onClick={onNavigate}
      aria-current={pathname === "/" ? "page" : undefined}
      className="flex h-9 items-center gap-2 rounded-[var(--ui-radius)] px-2 text-fg no-underline hover:bg-muted aria-[current=page]:bg-[color-mix(in_oklab,var(--ui-primary)_14%,var(--app-sidebar))] aria-[current=page]:font-semibold"
    >
      <LayoutGridIcon aria-hidden="true" className="size-4 text-muted-fg" />
      Overview
    </Link>
  )
}

function NavBody({
  data,
  onNavigate,
}: {
  data: NavData
  onNavigate?: () => void
}) {
  const { portfolio } = useDialogs()
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <OverviewLink onNavigate={onNavigate} />
      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xs font-semibold tracking-wide text-muted-fg uppercase">
            Portfolios
          </h2>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <PortfolioNav tree={data.tree} onNavigate={onNavigate} />
        </div>
      </div>
      <Button
        className="w-full"
        onClick={() => {
          onNavigate?.()
          portfolio.open({ payload: { parentId: null } })
        }}
      >
        <PlusIcon aria-hidden="true" />
        New portfolio
      </Button>
    </div>
  )
}

export function NavFrame({ data }: { data: NavData }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <aside className="no-print sticky top-0 hidden h-dvh w-72 shrink-0 flex-col gap-6 border-e border-line bg-sidebar p-4 lg:flex">
        <Brand />
        <NavBody data={data} />
      </aside>

      <header className="no-print sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-[color-mix(in_oklab,var(--app-canvas)_85%,transparent)] px-4 backdrop-blur lg:hidden">
        <Brand />
        <Drawer open={open} onOpenChange={setOpen} side="left">
          <DrawerTrigger aria-label="Open navigation">
            <MenuIcon aria-hidden="true" />
          </DrawerTrigger>
          <DrawerBackdrop className="bg-black/30" />
          <DrawerContent className="flex h-full w-[min(20rem,85vw)] flex-col gap-4 rounded-e-2xl bg-sidebar p-4">
            <div className="flex items-center justify-between">
              <DrawerTitle className="m-0 text-base font-semibold">
                Navigation
              </DrawerTitle>
              <DrawerClose aria-label="Close navigation">
                <XIcon aria-hidden="true" />
              </DrawerClose>
            </div>
            <NavBody data={data} onNavigate={() => setOpen(false)} />
          </DrawerContent>
        </Drawer>
      </header>

      <ItemDialog options={data.options} />
      <PortfolioDialog options={data.options} nested={data.nested} />
    </>
  )
}
