// Copies a local collection file into the Postgres database at DATABASE_URL.
// Usage: DATABASE_URL=postgres://… npm run db:import -- [data/collection.json]
import { readFile } from "node:fs/promises"
import { Pool } from "@neondatabase/serverless"
import { normalizeCollection } from "../lib/collection"
import { createPostgresStore } from "../lib/postgres"

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
if (!url) {
  console.error("Set DATABASE_URL to the Neon connection string (Vercel → Storage → your database → .env.local).")
  process.exit(1)
}
const file = process.argv[2] ?? "data/collection.json"
const incoming = normalizeCollection(JSON.parse(await readFile(file, "utf8")))

const pool = new Pool({ connectionString: url })
const store = createPostgresStore({
  query: (text, params) => pool.query(text, params),
  async transaction(work) {
    const client = await pool.connect()
    try {
      await client.query("BEGIN")
      const result = await work(client)
      await client.query("COMMIT")
      return result
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  },
})

const existing = await store.read()
if (existing.portfolios.length || existing.items.length) {
  if (!process.argv.includes("--replace")) {
    console.error(`The database already has ${existing.portfolios.length} portfolios and ${existing.items.length} items. Pass --replace to overwrite them.`)
    process.exit(1)
  }
}
await store.mutate((collection) => {
  collection.portfolios = incoming.portfolios
  collection.items = incoming.items
  collection.pricesRefreshedAt = incoming.pricesRefreshedAt
})
console.log(`Imported ${incoming.portfolios.length} portfolios and ${incoming.items.length} items from ${file}.`)
await pool.end()
