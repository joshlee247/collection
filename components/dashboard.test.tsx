import { render, screen, within } from "@testing-library/react"
import { createAgent } from "@ui-sdk/react/agent"
import { expect, test } from "vitest"
import type { LocationBreakdown } from "@/lib/collection"
import type { LocatedItem } from "@/lib/queries"
import type { ItemKind } from "@/lib/types"
import { InventoryTable } from "./inventory-table"
import { LocationChart } from "./location-chart"

const now = "2026-01-01T00:00:00.000Z"

function item(index: number, kind: ItemKind, name: string): LocatedItem {
  return {
    id: `i${index}`,
    portfolioId: "bin-1",
    kind,
    name,
    set: "",
    number: "",
    language: "English",
    quantity: 1,
    condition: "",
    grader: "",
    grade: "",
    certNumber: "",
    sealedType: "",
    purchasePrice: 10,
    marketValue: 20,
    imageUrl: "",
    notes: "",
    createdAt: now,
    updatedAt: now,
    location: "Sealed / Bin 1",
  }
}

const items = [
  ...Array.from({ length: 9 }, (_, i) => item(i, "sealed", `Booster Box ${i + 1}`)),
  item(20, "graded", "Umbreon VMAX"),
  item(21, "card", "Pikachu ex"),
]

const locations: LocationBreakdown[] = [
  {
    id: "bin-1",
    label: "Sealed / Bin 1",
    byKind: {
      card: { value: 0, cost: 0, count: 0 },
      graded: { value: 0, cost: 0, count: 0 },
      sealed: { value: 720, cost: 140, count: 2 },
    },
  },
  {
    id: "slabs",
    label: "Slabs",
    byKind: {
      card: { value: 0, cost: 0, count: 0 },
      graded: { value: 1650, cost: 900, count: 1 },
      sealed: { value: 0, cost: 0, count: 0 },
    },
  },
]

const agent = createAgent()

const rowsShown = () =>
  within(screen.getByRole("table")).getAllByRole("row").length - 1

test("inventory tabs, search and pages narrow the table", async () => {
  render(<InventoryTable items={items} />)
  const labels = agent.snapshot().filter((e) => !e.offPage).map((e) => e.label)
  for (const label of ["Inventory type", "Search inventory", "Inventory pages"]) {
    expect(labels).toContain(label)
  }

  expect(rowsShown()).toBe(8)
  expect(screen.getByText("Showing 1–8 of 11")).toBeTruthy()

  const next = await agent.act({ steps: [{ ref: "Inventory pages", action: "setPage", args: [2] }] })
  expect(next.ok, next.error?.message).toBe(true)
  expect(rowsShown()).toBe(3)

  const graded = await agent.act({ steps: [{ ref: "Inventory type", action: "setValue", args: ["Graded"] }] })
  expect(graded.ok, graded.error?.message).toBe(true)
  expect(rowsShown()).toBe(1)
  expect(screen.getByText("Umbreon VMAX")).toBeTruthy()

  await agent.act({ steps: [{ ref: "Inventory type", action: "setValue", args: ["All items"] }] })
  const search = await agent.act({ steps: [{ ref: "Search inventory", action: "setValue", args: ["pikachu"] }] })
  expect(search.ok, search.error?.message).toBe(true)
  expect(rowsShown()).toBe(1)
  expect(screen.getByText("Pikachu ex")).toBeTruthy()
})

test("the chart switches measure and describes every bar", async () => {
  render(<LocationChart locations={locations} />)
  const bars = screen.getAllByRole("img")
  expect(bars.map((bar) => bar.getAttribute("aria-label"))).toEqual([
    "Slabs: $1,650.00. Graded $1,650.00, Sealed $0.00",
    "Sealed / Bin 1: $720.00. Graded $0.00, Sealed $720.00",
  ])

  const result = await agent.act({ steps: [{ ref: "Measure", action: "setValue", args: ["Items"] }] })
  expect(result.ok, result.error?.message).toBe(true)
  expect(screen.getAllByRole("img")[0].getAttribute("aria-label")).toBe(
    "Sealed / Bin 1: 2. Graded 0, Sealed 2"
  )
})
