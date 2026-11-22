import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import { connection } from "next/server"
import { emptyCollection, normalizeCollection } from "./collection"
import type { Collection } from "./types"

// The data file lives outside the bundle, so the build shouldn't trace it.
const dataFile = () =>
  process.env.COLLECTION_DATA_FILE ??
  path.join(process.cwd(), "data", "collection.json")

async function load(): Promise<Collection> {
  try {
    return normalizeCollection(JSON.parse(await readFile(/*turbopackIgnore: true*/ dataFile(), "utf8")))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return emptyCollection()
    }
    throw error
  }
}

export async function readCollection(): Promise<Collection> {
  await connection()
  await queue
  return load()
}

let queue: Promise<unknown> = Promise.resolve()

// Writes run one at a time so two phones editing the same bin can't drop each other's change.
export function mutate<T>(change: (collection: Collection) => T): Promise<T> {
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
}
