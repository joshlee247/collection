import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import { connection } from "next/server"
import { requireSession } from "./auth"
import { emptyCollection, normalizeCollection } from "./collection"
import { neonDb } from "./neon"
import { createPostgresStore } from "./postgres"
import type { Collection } from "./types"

type Store = {
  read(): Promise<Collection>
  mutate<T>(change: (collection: Collection) => T): Promise<T>
}

// The data file lives outside the bundle, so the build shouldn't trace it.
const dataFile = () =>
  process.env.COLLECTION_DATA_FILE ?? path.join(process.cwd(), "data", "collection.json")

function fileStore(): Store {
  let queue: Promise<unknown> = Promise.resolve()
  async function load(): Promise<Collection> {
    try {
      return normalizeCollection(JSON.parse(await readFile(/*turbopackIgnore: true*/ dataFile(), "utf8")))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyCollection()
      throw error
    }
  }
  return {
    async read() {
      await queue
      return load()
    },
    // Writes run one at a time so two phones editing the same bin can't drop each other's change.
    mutate(change) {
      const run = queue.then(async () => {
        const collection = await load()
        const result = change(collection)
        const file = dataFile()
        await mkdir(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true })
        const temp = `${file}.${process.pid}.tmp`
        await writeFile(/*turbopackIgnore: true*/ temp, JSON.stringify(collection, null, 2))
        await rename(/*turbopackIgnore: true*/ temp, file)
        return result
      })
      queue = run.catch(() => {})
      return run
    },
  }
}

let store: Store | null = null

function getStore(): Store {
  if (store) return store
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
  if (url) return (store = createPostgresStore(neonDb(url)))
  if (process.env.VERCEL) {
    throw new Error("No database configured. Connect a Neon Postgres database to this Vercel project.")
  }
  return (store = fileStore())
}

export async function readCollection(): Promise<Collection> {
  await connection()
  await requireSession()
  return getStore().read()
}

export async function mutate<T>(change: (collection: Collection) => T): Promise<T> {
  await requireSession()
  return getStore().mutate(change)
}
