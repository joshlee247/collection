import { describe, expect, test } from "vitest"
import {
  CollectionError,
  addItem,
  addPortfolio,
  buildTree,
  emptyCollection,
  itemsWithin,
  parseItemInput,
  parsePortfolioInput,
  removePortfolio,
  restoreItem,
  removeItem,
  totalsOf,
} from "./collection"

function sample() {
  const c = emptyCollection()
  const now = "2026-01-01T00:00:00.000Z"
  addPortfolio(c, { name: "Sealed", description: "", parentId: null }, "sealed", now)
  addPortfolio(c, { name: "Bin 2", description: "", parentId: "sealed" }, "bin-2", now)
  addPortfolio(c, { name: "Bin 1", description: "", parentId: "sealed" }, "bin-1", now)
  addPortfolio(c, { name: "Slabs", description: "", parentId: null }, "slabs", now)
  const box = parseItemInput(c, { kind: "sealed", name: "Evolving Skies", portfolioId: "bin-1", quantity: "2", purchasePrice: "140", marketValue: "720" })
  addItem(c, box, "box", now)
  const slab = parseItemInput(c, { kind: "graded", name: "Umbreon VMAX", portfolioId: "slabs", grader: "PSA", grade: "10", purchasePrice: "900" })
  addItem(c, slab, "slab", now)
  return c
}

describe("collection", () => {
  test("totals count quantities and fall back to the price paid", () => {
    const c = sample()
    expect(totalsOf(c.items)).toEqual({
      count: 3,
      cost: 1180,
      value: 2340,
      byKind: { card: 0, graded: 1, sealed: 2 },
    })
  })

  test("a parent portfolio sees the items in its bins", () => {
    const c = sample()
    expect(itemsWithin(c, "sealed", { deep: true }).map((i) => i.id)).toEqual(["box"])
    expect(itemsWithin(c, "sealed", { deep: false })).toEqual([])
  })

  test("the tree nests bins and sorts them naturally", () => {
    const tree = buildTree(sample())
    expect(tree.map((n) => n.name)).toEqual(["Sealed", "Slabs"])
    expect(tree[0].children.map((n) => [n.name, n.count])).toEqual([
      ["Bin 1", 2],
      ["Bin 2", 0],
    ])
  })

  test("item input keeps only the fields for its kind", () => {
    const c = sample()
    const input = parseItemInput(c, {
      kind: "sealed",
      name: "  Crown Zenith ",
      portfolioId: "bin-2",
      grader: "PSA",
      condition: "Mint",
      sealedType: "Not a product",
      purchasePrice: "-5",
      imageUrl: "javascript:alert(1)",
    })
    expect(input).toMatchObject({
      name: "Crown Zenith",
      grader: "",
      condition: "",
      sealedType: "Booster Box",
      purchasePrice: null,
      imageUrl: "",
      quantity: 1,
    })
  })

  test("item input needs a name and a real portfolio", () => {
    const c = sample()
    expect(() => parseItemInput(c, { name: "", portfolioId: "bin-1" })).toThrow(CollectionError)
    expect(() => parseItemInput(c, { name: "x", portfolioId: "nope" })).toThrow("Choose where")
  })

  test("a portfolio can't move inside itself or its bins", () => {
    const c = sample()
    expect(() => parsePortfolioInput(c, { name: "Sealed", parentId: "bin-1" }, "sealed")).toThrow("inside itself")
    expect(() => parsePortfolioInput(c, { name: "Sealed", parentId: "sealed" }, "sealed")).toThrow("inside itself")
    expect(parsePortfolioInput(c, { name: "Sealed", parentId: "root" }, "sealed").parentId).toBeNull()
  })

  test("deleting a portfolio deletes its bins and their items", () => {
    const c = sample()
    removePortfolio(c, "sealed")
    expect(c.portfolios.map((p) => p.id)).toEqual(["slabs"])
    expect(c.items.map((i) => i.id)).toEqual(["slab"])
  })

  test("a removed item can be restored once", () => {
    const c = sample()
    const item = removeItem(c, "box")
    restoreItem(c, item)
    restoreItem(c, item)
    expect(c.items.filter((i) => i.id === "box")).toHaveLength(1)
  })
})
