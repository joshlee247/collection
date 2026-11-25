import { Pool } from "@neondatabase/serverless"
import type { Db } from "./postgres"

export function neonDb(connectionString: string): Db & { end(): Promise<void> } {
  const pool = new Pool({ connectionString, max: 4 })
  return {
    query: (text, params) => pool.query(text, params),
    async transaction(work) {
      const client = await pool.connect()
      try {
        await client.query("BEGIN")
        const result = await work(client)
        await client.query("COMMIT")
        return result
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {})
        throw error
      } finally {
        client.release()
      }
    },
    end: () => pool.end(),
  }
}
