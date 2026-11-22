import { render, screen, within } from "@testing-library/react"
import { createAgent } from "@ui-sdk/react/agent"
import { expect, test, vi } from "vitest"
import type { LocationBreakdown } from "@/lib/collection"
import type { LocatedItem } from "@/lib/queries"
import type { ItemKind } from "@/lib/types"
import { CardViewer } from "./card-viewer"
import { CollectionGrid } from "./collection-grid"
import { DialogsProvider } from "./dialogs-context"
import { LocationChart } from "./location-chart"

vi.mock("@/app/actions", () => ({
  setItemQuantity: vi.fn(),
  deleteItem: vi.fn(),
  undoDeleteItem: vi.fn(),
}))

const now = "2026-01-01T00:00:00.000Z"

function item(index: number, kind: ItemKind, name: string, extra: Partial<LocatedItem> = {}): LocatedItem {
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
    ...extra,
  }
}

const items = [
  item(1, "sealed", "Evolving Skies", { sealedType: "Booster Box" }),
  item(2, "sealed", "Crown Zenith", { sealedType: "Elite Trainer Box" }),
  item(3, "graded", "Umbreon VMAX", { grader: "PSA", grade: "10", purchasePrice: 900, marketValue: 1650 }),
  item(4, "card", "Pikachu ex"),
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

function renderGrid() {
  return render(
    <DialogsProvider>
      <CollectionGrid items={items} label="Personal collection" />
      <CardViewer items={items} />
    </DialogsProvider>
  )
}

test("the collection groups items and filters by type and search", async () => {
  renderGrid()
  const labels = agent.snapshot().filter((e) => !e.offPage).map((e) => e.label)
  for (const label of ["Show", "Search collection", "Layout", "Card viewer", "View Umbreon VMAX"]) {
    expect(labels).toContain(label)
  }
  expect(screen.getByRole("region", { name: "Slabs in Personal collection" })).toBeTruthy()
  expect(screen.getByRole("region", { name: "Sealed in Personal collection" })).toBeTruthy()

  const graded = await agent.act({ steps: [{ ref: "Show", action: "setValue", args: ["Graded"] }] })
  expect(graded.ok, graded.error?.message).toBe(true)
  expect(screen.queryByRole("button", { name: "View Crown Zenith" })).toBeNull()
  expect(screen.getByRole("button", { name: "View Umbreon VMAX" })).toBeTruthy()

  await agent.act({ steps: [{ ref: "Show", action: "setValue", args: ["All"] }] })
  const search = await agent.act({ steps: [{ ref: "Search collection", action: "setValue", args: ["zenith"] }] })
  expect(search.ok, search.error?.message).toBe(true)
  expect(screen.getAllByRole("button", { name: /^View / })).toHaveLength(1)

  const list = await agent.act({ steps: [{ ref: "Layout", action: "setValue", args: ["List"] }] })
  expect(list.ok, list.error?.message).toBe(true)
  expect(within(screen.getByRole("list", { name: "Personal collection" })).getAllByRole("listitem")).toHaveLength(1)
})

test("a card opens the viewer with its market data", async () => {
  renderGrid()
  const open = await agent.act({ steps: [{ ref: "View Umbreon VMAX", action: "press" }] })
  expect(open.ok, open.error?.message).toBe(true)
  const dialog = await screen.findByRole("dialog", { name: "Umbreon VMAX" })
  expect(within(dialog).getByText("$1,650.00", { selector: "span" })).toBeTruthy()
  expect(within(dialog).getByText(/\$750\.00 \(83\.3%\)/)).toBeTruthy()
  expect(within(dialog).getAllByText("PSA 10").length).toBeGreaterThan(0)
  expect(within(dialog).getByLabelText("Copies of Umbreon VMAX")).toBeTruthy()
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
