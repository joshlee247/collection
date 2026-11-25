// Adds Collectr sealed products to a top-level portfolio (default "Sealed").
// Writes to Postgres when DATABASE_URL is set, otherwise to the local data file.
// Usage: npm run import:collectr -- imports/collectr-sealed.json [--portfolio "Sealed"]
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { importCollectrSealed, type CollectrProduct } from "../lib/collectr"
import { emptyCollection, normalizeCollection } from "../lib/collection"
import { neonDb } from "../lib/neon"
import { createPostgresStore } from "../lib/postgres"
import type { Collection } from "../lib/types"

const args = process.argv.slice(2)
const file = args.find((arg) => !arg.startsWith("--") && args[args.indexOf(arg) - 1] !== "--portfolio")
const flag = args.indexOf("--portfolio")
const portfolioName = flag >= 0 ? args[flag + 1] : "Sealed"
if (!file) {
  console.error("Pass the Collectr products file, like imports/collectr-sealed.json")
  process.exit(1)
}
const products: CollectrProduct[] = JSON.parse(await readFile(file, "utf8"))
const now = new Date().toISOString()
const run = (collection: Collection) => importCollectrSealed(collection, products, { portfolioName, now })

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
let result: ReturnType<typeof run>
if (url) {
  const db = neonDb(url)
  result = await createPostgresStore(db).mutate(run)
  await db.end()
  console.log("Wrote to the Postgres database.")
} else {
  const dataFile = process.env.COLLECTION_DATA_FILE ?? path.join(process.cwd(), "data", "collection.json")
  let collection = emptyCollection()
  try {
    collection = normalizeCollection(JSON.parse(await readFile(dataFile, "utf8")))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
  }
  result = run(collection)
  await mkdir(path.dirname(dataFile), { recursive: true })
  await writeFile(dataFile, JSON.stringify(collection, null, 2))
  console.log(`Wrote to ${dataFile}.`)
}
console.log(`"${portfolioName}" (${result.portfolioId}): ${result.added} added, ${result.updated} updated.`)
