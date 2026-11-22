import { render, screen, waitFor } from "@testing-library/react"
import { createAgent } from "@ui-sdk/react/agent"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import type { CardResult } from "@/lib/pricing"
import { DialogsProvider, useDialogs } from "./dialogs-context"
import { ItemDialog } from "./item-dialog"

const actions = vi.hoisted(() => ({ saveItem: vi.fn() }))
vi.mock("@/app/actions", () => actions)

const rayquaza: CardResult = {
  id: "swsh7-218",
  name: "Rayquaza VMAX",
  number: "218",
  setName: "Evolving Skies",
  setTotal: 203,
  rarity: "Rare Rainbow",
  image: "https://images.pokemontcg.io/swsh7/218.png",
  imageLarge: "https://images.pokemontcg.io/swsh7/218_hires.png",
  releaseDate: "2021-08-27",
  variants: [{ variant: "holofoil", market: 1278.52 }],
}

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(new Response(JSON.stringify([rayquaza]), { status: 200 }))
  vi.stubGlobal("fetch", fetchMock)
  actions.saveItem.mockReset()
  actions.saveItem.mockResolvedValue({ ok: true, data: { id: "new", name: "Rayquaza VMAX", warning: "" } })
})

afterEach(() => vi.unstubAllGlobals())

const agent = createAgent()

function Opener() {
  const { item } = useDialogs()
  return <button onClick={() => item.open({ payload: { portfolioId: "binder" } })}>open</button>
}

test("searching links a card and saves it with a live price", async () => {
  render(
    <DialogsProvider>
      <Opener />
      <ItemDialog options={[{ value: "binder", label: "Main binder", depth: 0 }]} />
    </DialogsProvider>
  )
  screen.getByText("open").click()
  await screen.findByRole("dialog", { name: "Add to collection" })
  const search = await agent.act({ steps: [{ ref: "Find card", action: "setQuery", args: ["rayquaza vmax 218"] }] })
  expect(search.ok, search.error?.message).toBe(true)
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/cards/search?q=rayquaza%20vmax%20218", expect.anything()))
  await agent.act({ steps: [{ ref: "Find card", action: "setOpen", args: [true] }] })
  expect(await screen.findByRole("option", { name: /Rayquaza VMAX/ })).toBeTruthy()

  const pick = await agent.act({ steps: [{ ref: "Find card", action: "setValue", args: ["Rayquaza VMAX Evolving Skies 218"] }] })
  expect(pick.ok, pick.error?.message).toBe(true)
  await screen.findByText("Linked to TCGplayer prices")
  expect(screen.getByLabelText<HTMLInputElement>("Card or product name").value).toBe("Rayquaza VMAX")
  expect(screen.getByLabelText<HTMLInputElement>("Card number").value).toBe("218/203")
  expect(screen.getByRole("switch", { name: "Use live market price" }).getAttribute("aria-checked")).toBe("true")

  const paid = await agent.act({ steps: [{ ref: "Paid (each)", action: "setValue", args: [150] }] })
  expect(paid.ok, paid.error?.message).toBe(true)
  const save = await agent.act({ steps: [{ ref: "Save item", action: "press" }] })
  expect(save.ok, save.error?.message).toBe(true)

  await waitFor(() => expect(actions.saveItem).toHaveBeenCalled())
  const data = Object.fromEntries(actions.saveItem.mock.calls[0][0] as FormData)
  expect(data).toMatchObject({
    cardId: "swsh7-218",
    livePrice: "on",
    name: "Rayquaza VMAX",
    set: "Evolving Skies",
    number: "218/203",
    marketValue: "1278.52",
    purchasePrice: "150",
    imageUrl: "https://images.pokemontcg.io/swsh7/218_hires.png",
    portfolioId: "binder",
  })
})

test("a failed search says so instead of showing no results", async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: "down" }), { status: 502 }))
  render(
    <DialogsProvider>
      <Opener />
      <ItemDialog options={[{ value: "binder", label: "Main binder", depth: 0 }]} />
    </DialogsProvider>
  )
  screen.getByText("open").click()
  await screen.findByRole("dialog", { name: "Add to collection" })
  const combobox = agent.snapshot().find((entry) => entry.label === "Find card" && !entry.offPage)!
  await agent.act({ steps: [{ ref: combobox.ref, action: "setQuery", args: ["mew"] }] })
  await waitFor(() => expect(fetchMock).toHaveBeenCalled())
  await agent.act({ steps: [{ ref: combobox.ref, action: "setOpen", args: [true] }] })
  expect(await screen.findByText("Couldn't reach the card database. Try again in a moment.")).toBeTruthy()
})
