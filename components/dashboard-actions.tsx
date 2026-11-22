"use client"

import { Button } from "@ui-sdk/react/button"
import { ArrowRightIcon, FolderPlusIcon } from "lucide-react"
import { useDialogs } from "./dialogs-context"

export function DashboardActions({ canAddItem }: { canAddItem: boolean }) {
  const dialogs = useDialogs()
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => dialogs.portfolio.open({ payload: { parentId: null } })}>
        <FolderPlusIcon aria-hidden="true" />
        New portfolio
      </Button>
      {canAddItem && (
        <Button onClick={() => dialogs.item.open({ payload: {} })}>
          Add item
          <ArrowRightIcon aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}
