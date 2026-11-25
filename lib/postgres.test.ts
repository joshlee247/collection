// @vitest-environment node
import { PGlite } from "@electric-sql/pglite"
import { beforeEach, describe, expect, test } from "vitest"
import { addItem, addPortfolio, parseItemInput, removePortfolio, setQuantity } from "./collection"
import { createPostgresStore, type Db, type Queryable } from "./postgres"
import { applyQuote } from "./pricing"

function pgliteDb(pg: PGlite): Db {
  const wrap = (q: { query: PGlite["query"] }): Queryable => ({
    query: async (text, params) => {
      if (!params && text.includes(";")) {
        await pg.exec(text)
        return { rows: [] }
      }
      const result = await q.query<Record<string, unknown>>(text, params as unknown[])
      return { rows: result.rows }
    },
  })
  return { ...wrap(pg), transaction: (work) => pg.transaction((tx) => work(wrap(tx))) }
}

const now = "2026-11-25T10:00:00.000Z"
let store: ReturnType<typeof createPostgresStore>

beforeEach(async () => {
  store = createPostgresStore(pgliteDb(new PGlite()))
  await store.mutate((c) => {
    addPortfolio(c, { name: "Sealed", description: "Closet", parentId: null }, "sealed", now)
    addPortfolio(c, { name: "Bin 1", description: "", parentId: "sealed" }, "bin-1", now)
    addItem(
      c,
      parseItemInput(c, {
        kind: "card",
        name: "Umbreon VMAX",
        portfolioId: "bin-1",
        quantity: "2",
        purchasePrice: "1650",
        cardId: "swsh7-215",
        livePrice: "on",
      }),
      "umbreon",
      now
    )
  })
})

describe("postgres store", () => {
  test("creates the schema and reads back what was written", async () => {
    const c = await store.read()
    expect(c.portfolios.map((p) => [p.id, p.parentId, p.createdAt])).toEqual([
      ["bin-1", "sealed", now],
      ["sealed", null, now],
    ])
    expect(c.items[0]).toMatchObject({
      id: "umbreon",
      quantity: 2,
      purchasePrice: 1650,
      marketValue: null,
      cardId: "swsh7-215",
      livePrice: true,
      market: null,
      priceHistory: [],
      createdAt: now,
    })
    expect(c.pricesRefreshedAt).toBeNull()
  })

  test("quotes, history and the refresh time survive a round trip", async () => {
    await store.mutate((c) => {
      applyQuote(
        c.items[0],
        {
          source: "tcgplayer",
          variant: "holofoil",
          variants: ["holofoil"],
          market: 2264.7,
          low: 1699.99,
          mid: 2264.7,
          high: 24381.45,
          updatedAt: "2026-10-15",
          fetchedAt: now,
          url: "https://prices.pokemontcg.io/tcgplayer/swsh7-215",
        },
        "2026-11-25"
      )
      c.pricesRefreshedAt = now
    })
    const c = await store.read()
    expect(c.items[0].marketValue).toBe(2264.7)
    expect(c.items[0].market?.high).toBe(24381.45)
    expect(c.items[0].priceHistory).toEqual([{ date: "2026-11-25", market: 2264.7 }])
    expect(c.pricesRefreshedAt).toBe(now)
  })

  test("deleting a portfolio deletes its bins and their items", async () => {
    await store.mutate((c) => removePortfolio(c, "sealed"))
    const c = await store.read()
    expect(c.portfolios).toEqual([])
    expect(c.items).toEqual([])
  })

  test("a change that throws leaves the database untouched", async () => {
    await expect(
      store.mutate((c) => {
        setQuantity(c, "umbreon", 5, now)
        throw new Error("nope")
      })
    ).rejects.toThrow("nope")
    expect((await store.read()).items[0].quantity).toBe(2)
  })

  test("concurrent saves both land", async () => {
    await Promise.all([
      store.mutate((c) => setQuantity(c, "umbreon", c.items[0].quantity + 1, now)),
      store.mutate((c) => setQuantity(c, "umbreon", c.items[0].quantity + 1, now)),
      store.mutate((c) => addPortfolio(c, { name: "Bin 2", description: "", parentId: "sealed" }, "bin-2", now)),
    ])
    const c = await store.read()
    expect(c.items[0].quantity).toBe(4)
    expect(c.portfolios.map((p) => p.id).sort()).toEqual(["bin-1", "bin-2", "sealed"])
  })

  test("the database rejects data the app should never write", async () => {
    await expect(
      store.mutate((c) => {
        c.items[0].quantity = -1
      })
    ).rejects.toThrow()
    await expect(
      store.mutate((c) => {
        c.items[0].portfolioId = "missing"
      })
    ).rejects.toThrow()
    expect((await store.read()).items[0]).toMatchObject({ quantity: 2, portfolioId: "bin-1" })
  })
})
