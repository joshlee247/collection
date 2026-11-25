import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"
import { gradeName, Slab } from "./item-visuals"

const slab = {
  kind: "graded" as const,
  name: "Mew ex",
  set: "151",
  number: "205/165",
  imageUrl: "https://images.pokemontcg.io/sv3pt5/205_hires.png",
  grader: "PSA",
  grade: "10",
  certNumber: "98765432",
  sealedType: "",
}

describe("slabs", () => {
  test("grades read like the label on a real slab", () => {
    expect(gradeName("PSA", "10")).toBe("Gem Mt")
    expect(gradeName("TAG", "10")).toBe("Gem Mint")
    expect(gradeName("TAG", "9.5")).toBe("Gem Mint")
    expect(gradeName("PSA", "8")).toBe("NM-MT")
    expect(gradeName("CGC", "")).toBe("")
  })

  test("a graded card is drawn inside a slab with its label", () => {
    const { container } = render(<Slab item={slab} />)
    expect(screen.getByText("PSA")).toBeTruthy()
    expect(screen.getByText("Gem Mt")).toBeTruthy()
    expect(screen.getByText("98765432")).toBeTruthy()
    expect(container.querySelector(`img[src="${slab.imageUrl}"]`)).toBeTruthy()
  })

  test("a photo of a slab is shown as it is", () => {
    render(<Slab item={{ ...slab, imageUrl: "/images/slabs/mew_ex_cn_psa_10.webp" }} />)
    expect(screen.queryByText("PSA")).toBeNull()
  })
})
