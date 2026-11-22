import { existsSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const file =
  process.env.COLLECTION_DATA_FILE ??
  path.join(process.cwd(), "data", "collection.json")

if (existsSync(file) && !process.argv.includes("--force")) {
  console.log(`${file} already exists. Pass --force to replace it.`)
  process.exit(0)
}

const now = new Date().toISOString()
const portfolio = (id, name, parentId = null, description = "") => ({
  id, name, parentId, description, createdAt: now,
})
const base = {
  set: "", number: "", language: "English", quantity: 1, condition: "",
  grader: "", grade: "", certNumber: "", sealedType: "",
  purchasePrice: null, marketValue: null, imageUrl: "", notes: "",
  createdAt: now, updatedAt: now,
}
let n = 0
const item = (portfolioId, fields) => ({ ...base, id: `demo-${++n}`, portfolioId, ...fields })

const collection = {
  portfolios: [
    portfolio("sealed", "Sealed", null, "Closet shelf, three stacked bins"),
    portfolio("bin-1", "Bin 1", "sealed", "Top bin: booster boxes"),
    portfolio("bin-2", "Bin 2", "sealed", "Middle bin: ETBs and bundles"),
    portfolio("bin-3", "Bin 3", "sealed", "Bottom bin: collection boxes"),
    portfolio("slabs", "Slabs", null, "Graded case on the desk"),
    portfolio("binder", "Main binder", null, "Raw singles"),
  ],
  items: [
    item("bin-1", { kind: "sealed", name: "Evolving Skies", set: "Sword & Shield", sealedType: "Booster Box", quantity: 2, purchasePrice: 140, marketValue: 720 }),
    item("bin-1", { kind: "sealed", name: "Prismatic Evolutions", set: "Scarlet & Violet", sealedType: "Booster Bundle", quantity: 4, purchasePrice: 27, marketValue: 55 }),
    item("bin-1", { kind: "sealed", name: "151", set: "Scarlet & Violet", sealedType: "Booster Box", language: "Japanese", quantity: 3, purchasePrice: 60, marketValue: 135 }),
    item("bin-2", { kind: "sealed", name: "Crown Zenith", set: "Sword & Shield", sealedType: "Elite Trainer Box", quantity: 3, purchasePrice: 50, marketValue: 85 }),
    item("bin-2", { kind: "sealed", name: "Paldean Fates", set: "Scarlet & Violet", sealedType: "Elite Trainer Box", quantity: 2, purchasePrice: 50, marketValue: 70 }),
    item("bin-3", { kind: "sealed", name: "Charizard ex Super Premium", set: "Scarlet & Violet", sealedType: "Collection Box", quantity: 1, purchasePrice: 110, marketValue: 125 }),
    item("slabs", { kind: "graded", name: "Umbreon VMAX", set: "Evolving Skies", number: "215/203", grader: "PSA", grade: "10", certNumber: "73829104", purchasePrice: 900, marketValue: 1650 }),
    item("slabs", { kind: "graded", name: "Charizard", set: "Base Set", number: "4/102", grader: "CGC", grade: "8", purchasePrice: 1200, marketValue: 1450 }),
    item("binder", { kind: "card", name: "Pikachu ex", set: "Surging Sparks", number: "238/191", condition: "Near Mint", quantity: 1, purchasePrice: 180, marketValue: 210 }),
    item("binder", { kind: "card", name: "Mew ex", set: "151", number: "205/165", condition: "Lightly Played", quantity: 2, purchasePrice: 25, marketValue: 30 }),
  ],
}

await mkdir(path.dirname(file), { recursive: true })
await writeFile(file, JSON.stringify(collection, null, 2))
console.log(`Wrote demo collection to ${file}`)
