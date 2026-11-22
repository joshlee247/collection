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
import { FolderPlusIcon, HouseIcon, LibraryBigIcon, PlusIcon, XIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import type { NavData } from "@/lib/queries"
import type { TreeNode } from "@/lib/types"
import { cx } from "./card"
import { useDialogs } from "./dialogs-context"
import { ItemDialog } from "./item-dialog"
import { PortfolioDialog } from "./portfolio-dialog"
import { PortfolioNav } from "./portfolio-nav"

const MAX_LINKS = 5

function contains(node: TreeNode, id: string): boolean {
  return node.id === id || node.children.some((child) => contains(child, id))
}

function navLink(active: boolean) {
  return cx(
    "rounded-md px-3 py-1.5 text-sm whitespace-nowrap no-underline transition-colors duration-150",
    active ? "bg-muted font-medium text-fg" : "text-muted-fg hover:bg-muted/60 hover:text-fg"
  )
}

export function TopNav({ data }: { data: NavData }) {
  const pathname = usePathname()
  const dialogs = useDialogs()
  const current = pathname.match(/^\/p\/([^/]+)/)?.[1]
  const links = data.tree.slice(0, MAX_LINKS)

  return (
    <>
      <nav
        aria-label="Main"
        className="no-print sticky top-0 z-50 hidden w-full border-b border-line bg-background/80 backdrop-blur-md md:flex"
      >
        <div className="mx-auto flex h-12 w-full max-w-screen-lg items-center gap-1 px-12">
          <Link href="/" className="mr-4 text-sm font-semibold tracking-tight text-fg no-underline">
            vault.
          </Link>
          <div className="ml-2 flex min-w-0 items-center gap-0.5 overflow-x-auto">
            <Link href="/" aria-current={pathname === "/" ? "page" : undefined} className={navLink(pathname === "/")}>
              Overview
            </Link>
            {links.map((node) => {
              const active = Boolean(current && contains(node, current))
              return (
                <Link
                  key={node.id}
                  href={`/p/${node.id}`}
                  aria-current={current === node.id ? "page" : undefined}
                  className={navLink(active)}
                >
                  {node.name}
                </Link>
              )
            })}
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button
              data-variant="ghost"
              aria-label="Create portfolio"
              onClick={() => dialogs.portfolio.open({ payload: { parentId: null } })}
            >
              <FolderPlusIcon aria-hidden="true" />
            </Button>
            <Button
              data-variant="ghost"
              aria-label="Quick add"
              disabled={data.options.length === 0}
              onClick={() => dialogs.item.open({ payload: {} })}
            >
              <PlusIcon aria-hidden="true" />
            </Button>
          </div>
        </div>
      </nav>
      <ItemDialog options={data.options} />
      <PortfolioDialog options={data.options} nested={data.nested} />
    </>
  )
}

export function MobileDock({ data }: { data: NavData }) {
  const [open, setOpen] = useState(false)
  const dialogs = useDialogs()
  const pathname = usePathname()
  const icon = "flex size-10 items-center justify-center rounded-xl transition-colors duration-150"

  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-5 md:hidden">
      <nav
        aria-label="Quick navigation"
        className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-line bg-background/85 p-1.5 shadow-xl shadow-black/40 backdrop-blur-xl"
      >
        <Link
          href="/"
          aria-label="Overview"
          aria-current={pathname === "/" ? "page" : undefined}
          className={cx(icon, pathname === "/" ? "bg-muted text-fg" : "text-muted-fg hover:bg-muted/60 hover:text-fg")}
        >
          <HouseIcon aria-hidden="true" className="size-[18px]" />
        </Link>
        <Drawer open={open} onOpenChange={setOpen} side="bottom">
          <DrawerTrigger aria-label="Portfolios" data-variant="ghost" className="dock-button">
            <LibraryBigIcon aria-hidden="true" />
          </DrawerTrigger>
          <DrawerBackdrop className="bg-black/70" />
          <DrawerContent className="flex max-h-[80dvh] flex-col gap-4 rounded-t-2xl border-line bg-card p-5 pb-8">
            <div className="flex items-center justify-between">
              <DrawerTitle className="m-0 text-base font-semibold">Portfolios</DrawerTitle>
              <DrawerClose aria-label="Close portfolios" data-variant="pill">
                <XIcon aria-hidden="true" />
              </DrawerClose>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <PortfolioNav tree={data.tree} onNavigate={() => setOpen(false)} />
            </div>
            <Button
              onClick={() => {
                setOpen(false)
                dialogs.portfolio.open({ payload: { parentId: null } })
              }}
            >
              <FolderPlusIcon aria-hidden="true" />
              New portfolio
            </Button>
          </DrawerContent>
        </Drawer>
        <Button
          data-variant="ghost"
          aria-label="Add to vault"
          className="dock-button"
          disabled={data.options.length === 0}
          onClick={() => dialogs.item.open({ payload: {} })}
        >
          <PlusIcon aria-hidden="true" />
        </Button>
      </nav>
    </div>
  )
}
