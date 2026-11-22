"use client"

import { createDialogController } from "@ui-sdk/react/dialog"
import { createContext, use, useState } from "react"
import type { Item, Portfolio } from "@/lib/types"

export type ItemPayload = { item?: Item; portfolioId?: string }
export type PortfolioPayload = { portfolio?: Portfolio; parentId?: string | null }
export type ViewerPayload = { itemId: string }

function createControllers() {
  return {
    item: createDialogController<ItemPayload>(),
    portfolio: createDialogController<PortfolioPayload>(),
    viewer: createDialogController<ViewerPayload>(),
  }
}

type Controllers = ReturnType<typeof createControllers>

const DialogsContext = createContext<Controllers | null>(null)

export function DialogsProvider({ children }: { children: React.ReactNode }) {
  const [controllers] = useState(createControllers)
  return <DialogsContext value={controllers}>{children}</DialogsContext>
}

export function useDialogs(): Controllers {
  const controllers = use(DialogsContext)
  if (!controllers) throw new Error("useDialogs needs a DialogsProvider")
  return controllers
}
