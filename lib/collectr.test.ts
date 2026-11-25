import { describe, expect, test } from "vitest"
import { importCollectrSealed, sealedTypeOf, setNameOf, type CollectrProduct } from "./collectr"
import { addPortfolio, emptyCollection } from "./collection"

const product = (id: string, name: string, group: string, quantity: string, price: string): CollectrProduct => ({
  product_id: id,
  product_name: `${name} `,
  catalog_group: group,
  image_url: `https://public.getcollectr.com/public-assets/products/product_${id}.png`,
  quantity,
  market_price: price,
  is_card: false,
})

describe("collectr import", () => {
  test("product names map to sealed types", () => {
    expect(sealedTypeOf("151 Ultra-Premium Collection")).toBe("Ultra Premium Collection")
    expect(sealedTypeOf("Mega Charizard X ex Ultra Premium Collection")).toBe("Ultra Premium Collection")
    expect(sealedTypeOf("Black Bolt Pokemon Center Elite Trainer Box (Exclusive)")).toBe("Elite Trainer Box")
    expect(sealedTypeOf("Mega Evolution Enhanced Booster Box")).toBe("Booster Box")
    expect(sealedTypeOf("151 Booster Bundle")).toBe("Booster Bundle")
    expect(sealedTypeOf("Base Set Booster Pack [Unlimited Edition]")).toBe("Booster Pack")
    expect(sealedTypeOf("Prismatic Evolutions Super Premium Collection")).toBe("Collection Box")
    expect(sealedTypeOf("Costco Prismatic Evolutions 8-Pack Mini Tins")).toBe("Tin")
    expect(sealedTypeOf("Costco Ascended Heroes Mega ex Box Bundle")).toBe("Other")
  })

  test("set names drop era prefixes and catch-all groups", () => {
    expect(setNameOf("SV: 151")).toBe("151")
    expect(setNameOf("Destined Rivals")).toBe("Destined Rivals")
    expect(setNameOf("Miscellaneous Cards & Products")).toBe("")
  })

  test("imports into a new top-level Sealed portfolio, and again updates instead of duplicating", () => {
    const c = emptyCollection()
    const first = [
      product("502005", "151 Ultra-Premium Collection", "SV: 151", "1", "840.1400"),
      product("1", "Black Bolt Elite Trainer Box", "Black Bolt", "2", "150.5300"),
    ]
    const now = "2026-11-25T12:00:00.000Z"
    expect(importCollectrSealed(c, first, { portfolioName: "Sealed", now })).toEqual({ portfolioId: "sealed", added: 2, updated: 0 })
    expect(c.portfolios).toMatchObject([{ id: "sealed", name: "Sealed", parentId: null }])
    expect(c.items[0]).toMatchObject({
      id: "collectr-502005",
      portfolioId: "sealed",
      kind: "sealed",
      name: "151 Ultra-Premium Collection",
      set: "151",
      sealedType: "Ultra Premium Collection",
      quantity: 1,
      marketValue: 840.14,
      purchasePrice: null,
      livePrice: false,
    })

    c.items[1].portfolioId = "moved-to-a-bin"
    const again = [{ ...first[1], quantity: "3", market_price: "155.00" }]
    expect(importCollectrSealed(c, again, { portfolioName: "Sealed", now })).toEqual({ portfolioId: "sealed", added: 0, updated: 1 })
    expect(c.items).toHaveLength(2)
    expect(c.items[1]).toMatchObject({ quantity: 3, marketValue: 155, portfolioId: "moved-to-a-bin" })
  })

  test("an existing top-level Sealed portfolio is reused, and a nested one isn't", () => {
    const c = emptyCollection()
    addPortfolio(c, { name: "Closet", description: "", parentId: null }, "closet", "t")
    addPortfolio(c, { name: "Sealed", description: "", parentId: "closet" }, "sealed", "t")
    const result = importCollectrSealed(c, [product("9", "Pitch Black Booster Box", "Pitch Black", "1", "171.17")], {
      portfolioName: "Sealed",
      now: "t",
    })
    expect(result.portfolioId).toBe("sealed-collectr")
    expect(c.portfolios.find((p) => p.id === "sealed-collectr")?.parentId).toBeNull()
  })
})
