"use client"

import { Button } from "@ui-sdk/react/button"
import { FolderPlusIcon, PlusIcon } from "lucide-react"
import { useDialogs } from "./dialogs-context"

export function DashboardActions({ canAddItem }: { canAddItem: boolean }) {
  const dialogs = useDialogs()
  return (
    <div className="flex flex-wrap gap-2">
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
