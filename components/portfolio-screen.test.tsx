import { act, render, screen, waitFor, within } from "@testing-library/react"
import { createAgent } from "@ui-sdk/react/agent"
import { beforeEach, expect, test, vi } from "vitest"
import type { PortfolioView } from "@/lib/queries"
import type { Item } from "@/lib/types"
import { DialogsProvider } from "./dialogs-context"
import { ItemDialog } from "./item-dialog"
import { PortfolioScreen } from "./portfolio-screen"

const actions = vi.hoisted(() => ({
  saveItem: vi.fn(),
  setItemQuantity: vi.fn(),
  deleteItem: vi.fn(),
  undoDeleteItem: vi.fn(),
  deletePortfolio: vi.fn(),
  savePortfolio: vi.fn(),
}))

vi.mock("@/app/actions", () => actions)
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/p/sealed",
}))

const now = "2026-01-01T00:00:00.000Z"

function item(fields: Partial<Item>): Item {
  return {
    id: "x",
    portfolioId: "bin-1",
    kind: "sealed",
    name: "",
    set: "",
    number: "",
    language: "English",
    quantity: 1,
    condition: "",
    grader: "",
    grade: "",
    certNumber: "",
    sealedType: "Booster Box",
    purchasePrice: null,
    marketValue: null,
    imageUrl: "",
    notes: "",
    createdAt: now,
    updatedAt: now,
    ...fields,
  }
}

const view: PortfolioView = {
  portfolio: { id: "sealed", name: "Sealed", description: "Closet", parentId: null, createdAt: now },
  trail: [],
  children: [
    {
      id: "bin-1",
      name: "Bin 1",
      description: "",
      parentId: "sealed",
      createdAt: now,
      childCount: 0,
      totals: { count: 3, cost: 0, value: 0, byKind: { card: 0, graded: 0, sealed: 3 } },
    },
  ],
  items: [
    { ...item({ id: "box", name: "Evolving Skies", quantity: 2, marketValue: 720 }), location: "Bin 1" },
    { ...item({ id: "etb", name: "Crown Zenith", sealedType: "Elite Trainer Box" }), location: "Bin 1" },
  ],
  totals: { count: 3, cost: 0, value: 1440, byKind: { card: 0, graded: 0, sealed: 3 } },
  options: [
    { value: "sealed", label: "Sealed", depth: 0 },
    { value: "bin-1", label: "Sealed / Bin 1", depth: 1 },
  ],
  nestedIds: ["bin-1"],
}

let approve = false
const agent = createAgent({ allow: (step) => !step.confirm || approve })

function renderScreen() {
  return render(
    <DialogsProvider>
      <PortfolioScreen view={view} />
      <ItemDialog options={view.options} />
    </DialogsProvider>
  )
}

beforeEach(() => {
  approve = false
  for (const fn of Object.values(actions)) fn.mockReset()
  actions.setItemQuantity.mockResolvedValue({ ok: true, data: { quantity: 3 } })
  actions.saveItem.mockResolvedValue({ ok: true, data: { id: "new", name: "Paldean Fates" } })
  actions.deleteItem.mockResolvedValue({ ok: true, data: view.items[1] })
})

test("an agent can find every control on a bin's page", () => {
  renderScreen()
  const components = agent
    .snapshot()
    .filter((entry) => !entry.offPage && entry.component !== "more")
  for (const entry of components) {
    expect(entry.label, `${entry.component} ${entry.ref} has no name`).toBeTruthy()
  }
  const labels = components.map((entry) => entry.label)
  for (const label of [
    "Add item",
    "Search items",
    "Show",
    "Include items in sub-portfolios",
    "Quantity of Evolving Skies",
    "Actions for Evolving Skies",
    "More actions for Sealed",
    "QR code",
  ]) {
    expect(labels, `${label} is missing from the snapshot`).toContain(label)
  }
})

test("search, kind filter and the sub-portfolio switch narrow the list", async () => {
  renderScreen()
  const list = () => screen.getByRole("list", { name: "Items in Sealed" })

  const search = await agent.act({ steps: [{ ref: "Search items", action: "setValue", args: ["zenith"] }] })
  expect(search.ok, search.error?.message).toBe(true)
  expect(within(list()).getAllByRole("listitem")).toHaveLength(1)
  expect(within(list()).getByText("Crown Zenith")).toBeTruthy()

  await agent.act({ steps: [{ ref: "Search items", action: "setValue", args: [""] }] })
  const raw = await agent.act({ steps: [{ ref: "Show", action: "setValue", args: ["Raw card"] }] })
  expect(raw.ok, raw.error?.message).toBe(true)
  expect(screen.getByText("No items match those filters.")).toBeTruthy()

  await agent.act({ steps: [{ ref: "Show", action: "setValue", args: ["All"] }] })
  const nested = await agent.act({
    steps: [{ ref: "Include items in sub-portfolios", action: "toggle" }],
  })
  expect(nested.ok, nested.error?.message).toBe(true)
  expect(screen.getByText("No items match those filters.")).toBeTruthy()
})

test("stepping a quantity saves it once the taps stop", async () => {
  renderScreen()
  const result = await agent.act({
    steps: [{ ref: "Quantity of Evolving Skies", action: "increment" }],
  })
  expect(result.ok, result.error?.message).toBe(true)
  expect(screen.getByLabelText<HTMLInputElement>("Quantity of Evolving Skies").value).toBe("3")
  await waitFor(() => expect(actions.setItemQuantity).toHaveBeenCalledWith("box", 3), {
    timeout: 2000,
  })
  expect(actions.setItemQuantity).toHaveBeenCalledTimes(1)
})

test("removing an item needs a person to agree", async () => {
  renderScreen()
  const remove = {
    steps: [
      {
        ref: "Actions for Crown Zenith",
        action: "press",
        args: ["Remove from collection"],
      },
    ],
  }
  expect((await agent.act(remove)).ok).toBe(false)
  expect(actions.deleteItem).not.toHaveBeenCalled()
  approve = true
  const result = await agent.act(remove)
  expect(result.ok, result.error?.message).toBe(true)
  await waitFor(() => expect(actions.deleteItem).toHaveBeenCalledWith("etb"))
})

test("adding an item submits the form to the bin it was opened from", async () => {
  renderScreen()
  const open = await agent.act({ steps: [{ ref: "Add item", action: "press" }] })
  expect(open.ok, open.error?.message).toBe(true)

  const dialog = await screen.findByRole("dialog")
  const filled = await agent.act({
    steps: [
      { ref: "Type", action: "setValue", args: ["Sealed"] },
      { ref: "Card or product name", action: "setValue", args: ["Paldean Fates"] },
      { ref: "Set", action: "setValue", args: ["Scarlet & Violet"] },
      { ref: "Product type", action: "setValue", args: ["Elite Trainer Box"] },
      { ref: "How many", action: "setValue", args: [3] },
      { ref: "Paid (each)", action: "setValue", args: [49.99] },
      { ref: "Stored in", action: "setValue", args: ["Sealed / Bin 1"] },
    ],
  })
  expect(filled.ok, filled.error?.message).toBe(true)

  await act(async () => {
    within(dialog).getByRole("button", { name: "Save item" }).click()
  })
  await waitFor(() => expect(actions.saveItem).toHaveBeenCalled())
  const data = Object.fromEntries(actions.saveItem.mock.calls[0][0] as FormData)
  expect(data).toMatchObject({
    kind: "sealed",
    name: "Paldean Fates",
    set: "Scarlet & Violet",
    sealedType: "Elite Trainer Box",
    quantity: "3",
    purchasePrice: "49.99",
    portfolioId: "bin-1",
  })
})
