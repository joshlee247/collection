import { describe, expect, test } from "vitest"
import { normalizeCollection } from "./collection"
import {
  applyQuote,
  buildSearchQuery,
  isStale,
  periodChange,
  pickVariant,
  quoteFrom,
  type ApiCard,
} from "./pricing"
import type { Item } from "./types"

const card: ApiCard = {
  id: "sv3pt5-151",
  name: "Mew ex",
  number: "151",
  set: { id: "sv3pt5", name: "151", printedTotal: 165 },
  images: { small: "s.png", large: "l.png" },
  tcgplayer: {
    url: "https://prices.pokemontcg.io/tcgplayer/sv3pt5-151",
    updatedAt: "2026/10/15",
    prices: {
      reverseHolofoil: { low: 3, mid: 5, high: 9, market: 4.5 },
      holofoil: { low: 4.44, mid: 8.05, high: 115.15, market: 6.53 },
    },
  },
}

function item(fields: Partial<Item> = {}): Item {
  return normalizeCollection({
    items: [
      {
        id: "a",
        portfolioId: "p",
        kind: "card",
        name: "Mew ex",
        set: "",
        number: "",
        language: "English",
        quantity: 2,
        condition: "Near Mint",
        grader: "",
        grade: "",
        certNumber: "",
        sealedType: "",
        purchasePrice: 5,
        marketValue: 5,
        imageUrl: "",
        notes: "",
        cardId: "sv3pt5-151",
        priceVariant: "",
        livePrice: true,
        market: null,
        priceHistory: [],
        createdAt: "",
        updatedAt: "",
        ...fields,
      } as Item,
    ],
  }).items[0]
}

describe("pricing", () => {
  test("variants prefer the saved one, then the usual order", () => {
    expect(pickVariant(card.tcgplayer!.prices, "")).toBe("holofoil")
    expect(pickVariant(card.tcgplayer!.prices, "reverseHolofoil")).toBe("reverseHolofoil")
    expect(pickVariant(card.tcgplayer!.prices, "1stEditionHolofoil")).toBe("holofoil")
    expect(pickVariant(undefined, "")).toBe("")
  })

  test("a quote carries the chosen variant's prices and the feed date", () => {
    expect(quoteFrom(card, "", "2026-11-22T10:00:00Z")).toEqual({
      source: "tcgplayer",
      variant: "holofoil",
      variants: ["holofoil", "reverseHolofoil"],
      market: 6.53,
      low: 4.44,
      mid: 8.05,
      high: 115.15,
      updatedAt: "2026-10-15",
      fetchedAt: "2026-11-22T10:00:00Z",
      url: "https://prices.pokemontcg.io/tcgplayer/sv3pt5-151",
    })
    expect(quoteFrom({ ...card, tcgplayer: undefined }, "", "now")).toBeNull()
  })

  test("a live raw card takes the market price and records one point a day", () => {
    const mew = item()
    applyQuote(mew, quoteFrom(card, "", "t")!, "2026-11-21")
    applyQuote(mew, quoteFrom(card, "", "t")!, "2026-11-22")
    applyQuote(mew, { ...quoteFrom(card, "", "t")!, market: 7 }, "2026-11-22")
    expect(mew.marketValue).toBe(7)
    expect(mew.priceHistory).toEqual([
      { date: "2026-11-21", market: 6.53 },
      { date: "2026-11-22", market: 7 },
    ])
  })

  test("manual and graded items keep their own value but still get the quote", () => {
    const manual = item({ livePrice: false })
    const slab = item({ kind: "graded", marketValue: 400 })
    applyQuote(manual, quoteFrom(card, "", "t")!, "2026-11-22")
    applyQuote(slab, quoteFrom(card, "", "t")!, "2026-11-22")
    expect(manual.marketValue).toBe(5)
    expect(slab.marketValue).toBe(400)
    expect(slab.market?.market).toBe(6.53)
    expect(slab.priceHistory).toEqual([])
  })

  test("search text becomes a name query with an optional number", () => {
    expect(buildSearchQuery("mew")).toBe("name:mew*")
    expect(buildSearchQuery("mew ex 205")).toBe('name:"mew ex*" number:205')
    expect(buildSearchQuery("charizard 4/102")).toBe("name:charizard* number:4")
    expect(buildSearchQuery('pika"chu)')).toBe("name:pikachu*")
    expect(buildSearchQuery("  ")).toBe("")
  })

  test("the weekly change follows history and quantity", () => {
    const mew = item({
      priceHistory: [
        { date: "2026-11-10", market: 5 },
        { date: "2026-11-15", market: 6 },
        { date: "2026-11-22", market: 8 },
      ],
    })
    expect(periodChange([mew], 7, "2026-11-22")).toBe(4)
    expect(periodChange([item()], 7, "2026-11-22")).toBeNull()
  })

  test("prices go stale after six hours", () => {
    const now = Date.parse("2026-11-22T12:00:00Z")
    expect(isStale(null, now)).toBe(true)
    expect(isStale("2026-11-22T07:00:00Z", now)).toBe(false)
    expect(isStale("2026-11-22T05:00:00Z", now)).toBe(true)
  })

  test("old saved data gains pricing defaults", () => {
    const old = normalizeCollection({ items: [{ id: "x", cardId: undefined } as unknown as Item] })
    expect(old.pricesRefreshedAt).toBeNull()
    expect(old.items[0]).toMatchObject({ cardId: "", livePrice: false, market: null, priceHistory: [] })
  })
})
