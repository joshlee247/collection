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
import {
  ChevronRightIcon,
  FolderPlusIcon,
  HouseIcon,
  LibraryBigIcon,
  PlusIcon,
  XIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import type { NavData } from "@/lib/queries"
import type { TreeNode } from "@/lib/types"
import { useDialogs } from "./dialogs-context"
import { ItemDialog } from "./item-dialog"
import { PortfolioDialog } from "./portfolio-dialog"
import { PortfolioNav } from "./portfolio-nav"

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-full px-1 text-fg no-underline">
      <span
        aria-hidden="true"
        className="grid size-9 -rotate-6 place-items-center rounded-xl border-2 border-white bg-[conic-gradient(from_200deg,oklch(0.82_0.15_330),oklch(0.9_0.14_90),oklch(0.85_0.13_165),oklch(0.75_0.15_255),oklch(0.82_0.15_330))] shadow-[0_3px_0_var(--sticker-edge)]"
      >
        <svg viewBox="0 0 24 24" className="size-5 text-white drop-shadow" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="8" />
          <path d="M4 12h16" />
          <circle cx="12" cy="12" r="2.6" fill="currentColor" />
        </svg>
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">Card Vault</span>
    </Link>
  )
}

function SidebarBody({ data, onNavigate }: { data: NavData; onNavigate?: () => void }) {
  const dialogs = useDialogs()
  const pathname = usePathname()
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="flex items-center gap-2">
        <Button
          data-variant="solid"
          className="flex-1"
          disabled={data.options.length === 0}
          onClick={() => {
            onNavigate?.()
            dialogs.item.open({ payload: {} })
          }}
        >
          <PlusIcon aria-hidden="true" />
          Quick create
        </Button>
        <Button
          aria-label="Create portfolio"
          onClick={() => {
            onNavigate?.()
            dialogs.portfolio.open({ payload: { parentId: null } })
          }}
        >
          <FolderPlusIcon aria-hidden="true" />
        </Button>
      </div>
      <Link
        href="/"
        onClick={onNavigate}
        aria-current={pathname === "/" ? "page" : undefined}
        className="flex h-9 items-center gap-2 rounded-full px-3 font-medium text-fg no-underline hover:bg-[var(--glass-strong)] aria-[current=page]:bg-surface aria-[current=page]:font-semibold aria-[current=page]:shadow-[0_1px_3px_oklch(0.3_0.08_290/0.16)]"
      >
        <HouseIcon aria-hidden="true" className="size-4" />
        Dashboard
      </Link>
      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <h2 className="m-0 px-3 pb-1 text-xs font-semibold tracking-[0.14em] text-muted-fg uppercase">
          Portfolios
        </h2>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <PortfolioNav tree={data.tree} onNavigate={onNavigate} />
        </div>
      </div>
      <p className="m-0 rounded-2xl border border-dashed border-[var(--ui-input)] px-3 py-2.5 text-xs text-muted-fg">
        Tip: print a QR label for each bin, then scan it to update the bin from your phone.
      </p>
    </div>
  )
}

export function AppSidebar({ data }: { data: NavData }) {
  return (
    <>
      <aside className="no-print glass sticky top-3 m-3 me-0 hidden h-[calc(100dvh-1.5rem)] w-72 shrink-0 flex-col gap-6 rounded-[2rem] p-4 lg:flex">
        <Brand />
        <SidebarBody data={data} />
      </aside>
      <ItemDialog options={data.options} />
      <PortfolioDialog options={data.options} nested={data.nested} />
    </>
  )
}

function findTrail(nodes: TreeNode[], id: string): TreeNode[] | null {
  for (const node of nodes) {
    if (node.id === id) return [node]
    const below = findTrail(node.children, id)
    if (below) return [node, ...below]
  }
  return null
}

function Crumbs({ tree }: { tree: TreeNode[] }) {
  const pathname = usePathname()
  const match = pathname.match(/^\/p\/([^/]+)(\/label)?/)
  if (!match) return null
  const trail = findTrail(tree, match[1]) ?? []
  const crumbs = [
    { href: "/", label: "Dashboard" },
    ...trail.map((node) => ({ href: `/p/${node.id}`, label: node.name })),
    ...(match[2] ? [{ href: pathname, label: "Print label" }] : []),
  ]
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="m-0 flex list-none items-center gap-1 p-0 text-sm">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1
          return (
            <li key={crumb.href} className={`flex min-w-0 items-center gap-1 ${!last && index > 0 ? "max-sm:hidden" : ""}`}>
              {index > 0 && <ChevronRightIcon aria-hidden="true" className="size-3.5 shrink-0 text-muted-fg" />}
              {last ? (
                <span aria-current="page" className="truncate rounded-full bg-[var(--glass-strong)] px-3 py-1 font-semibold">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="truncate rounded-full px-2 py-1 text-muted-fg no-underline hover:text-fg">
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function SiteHeader({ data }: { data: NavData }) {
  return (
    <header className="no-print flex min-h-14 shrink-0 items-center gap-3 px-4 pt-3 lg:px-8 lg:pt-5">
      <div className="lg:hidden">
        <Brand />
      </div>
      <div className="max-lg:ms-auto">
        <Crumbs tree={data.tree} />
      </div>
    </header>
  )
}

export function TabBar({ data }: { data: NavData }) {
  const [open, setOpen] = useState(false)
  const dialogs = useDialogs()
  const pathname = usePathname()
  const tab =
    "flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[0.7rem] font-semibold text-muted-fg no-underline"
  return (
    <nav
      aria-label="Main"
      className="no-print glass fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex items-center gap-1 rounded-full p-1.5 lg:hidden"
    >
      <Link
        href="/"
        aria-current={pathname === "/" ? "page" : undefined}
        className={`${tab} aria-[current=page]:bg-surface aria-[current=page]:text-primary aria-[current=page]:shadow-[0_1px_3px_oklch(0.3_0.08_290/0.16)]`}
      >
        <HouseIcon aria-hidden="true" className="size-5" />
        Home
      </Link>
      <Button
        data-variant="solid"
        aria-label="Quick add"
        className="fab"
        disabled={data.options.length === 0}
        onClick={() => dialogs.item.open({ payload: {} })}
      >
        <PlusIcon aria-hidden="true" className="size-6" />
      </Button>
      <Drawer open={open} onOpenChange={setOpen} side="bottom">
        <DrawerTrigger className={`${tab} tab`}>
          <LibraryBigIcon aria-hidden="true" className="size-5" />
          Portfolios
        </DrawerTrigger>
        <DrawerBackdrop className="bg-[var(--ui-overlay)]" />
        <DrawerContent className="glass flex max-h-[85dvh] flex-col gap-4 rounded-t-[2rem] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between">
            <DrawerTitle className="font-display m-0 text-2xl font-semibold">Your vault</DrawerTitle>
            <DrawerClose aria-label="Close portfolios">
              <XIcon aria-hidden="true" />
            </DrawerClose>
          </div>
          <SidebarBody data={data} onNavigate={() => setOpen(false)} />
        </DrawerContent>
      </Drawer>
    </nav>
  )
}
