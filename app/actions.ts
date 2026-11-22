"use server"

import { refresh } from "next/cache"
import {
  CollectionError,
  addItem,
  addPortfolio,
  parseItemInput,
  parsePortfolioInput,
  removeItem,
  removePortfolio,
  restoreItem,
  setQuantity,
  updateItem,
  updatePortfolio,
} from "@/lib/collection"
import { mutate } from "@/lib/store"
import type { Item } from "@/lib/types"

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string }

async function run<T>(work: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await work()
    refresh()
    return { ok: true, data }
  } catch (error) {
    if (error instanceof CollectionError) {
      return { ok: false, error: error.message }
    }
    console.error(error)
    return { ok: false, error: "Something went wrong. Try again." }
  }
}

const now = () => new Date().toISOString()

export async function saveItem(
  formData: FormData
): Promise<ActionResult<{ id: string; name: string }>> {
  const raw = Object.fromEntries(formData)
  const id = typeof raw.id === "string" && raw.id ? raw.id : null
  return run(() =>
    mutate((collection) => {
      const input = parseItemInput(collection, raw)
      const item = id
        ? updateItem(collection, id, input, now())
        : addItem(collection, input, crypto.randomUUID(), now())
      return { id: item.id, name: item.name }
    })
  )
}

export async function setItemQuantity(
  id: string,
  quantity: number
): Promise<ActionResult<{ quantity: number }>> {
  return run(() =>
    mutate((collection) => ({
      quantity: setQuantity(collection, id, quantity, now()).quantity,
    }))
  )
}

export async function deleteItem(id: string): Promise<ActionResult<Item>> {
  return run(() => mutate((collection) => removeItem(collection, id)))
}

export async function undoDeleteItem(item: Item): Promise<ActionResult> {
  return run(() =>
    mutate((collection) => {
      const input = parseItemInput(collection, { ...item })
      restoreItem(collection, {
        ...input,
        id: String(item.id),
        createdAt: String(item.createdAt),
        updatedAt: now(),
      })
      return undefined
    })
  )
}

export async function savePortfolio(
  formData: FormData
): Promise<ActionResult<{ id: string; name: string }>> {
  const raw = Object.fromEntries(formData)
  const id = typeof raw.id === "string" && raw.id ? raw.id : null
  return run(() =>
    mutate((collection) => {
      const input = parsePortfolioInput(collection, raw, id ?? undefined)
      const portfolio = id
        ? updatePortfolio(collection, id, input)
        : addPortfolio(collection, input, crypto.randomUUID().slice(0, 8), now())
      return { id: portfolio.id, name: portfolio.name }
    })
  )
}

export async function deletePortfolio(
  id: string
): Promise<ActionResult<{ parentId: string | null }>> {
  return run(() =>
    mutate((collection) => ({
      parentId: removePortfolio(collection, id).parentId,
    }))
  )
}
