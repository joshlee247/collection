"use client"

import { Button } from "@ui-sdk/react/button"
import { FolderPlusIcon, PlusIcon } from "lucide-react"
import { useDialogs } from "./dialogs-context"

export function DashboardActions({ canAddItem }: { canAddItem: boolean }) {
  const dialogs = useDialogs()
  return (
    <div className="hidden flex-wrap gap-2 lg:flex">
      <Button onClick={() => dialogs.portfolio.open({ payload: { parentId: null } })}>
        <FolderPlusIcon aria-hidden="true" />
        Add portfolio
      </Button>
      {canAddItem && (
        <Button data-variant="solid" onClick={() => dialogs.item.open({ payload: {} })}>
          <PlusIcon aria-hidden="true" />
          Add item
        </Button>
      )}
    </div>
  )
}

export function NewPortfolioTile({ parentId = null }: { parentId?: string | null }) {
  const dialogs = useDialogs()
  return (
    <Button
      onClick={() => dialogs.portfolio.open({ payload: { parentId } })}
      className="ghost-tile"
    >
      <span className="grid size-12 place-items-center rounded-full bg-[var(--glass-strong)] shadow-[var(--glass-shadow)]">
        <FolderPlusIcon aria-hidden="true" className="size-5" />
      </span>
      {parentId ? "New portfolio inside" : "New portfolio"}
    </Button>
  )
}
