import type { Collection, Item, Portfolio } from "./types"

export type Queryable = {
  query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>
}

export type Db = Queryable & {
  transaction<T>(work: (tx: Queryable) => Promise<T>): Promise<T>
}

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS portfolios (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  parent_id text REFERENCES portfolios (id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS items (
  id text PRIMARY KEY,
  portfolio_id text NOT NULL REFERENCES portfolios (id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
  kind text NOT NULL CHECK (kind IN ('card', 'graded', 'sealed')),
  name text NOT NULL,
  set_name text NOT NULL DEFAULT '',
  number text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'English',
  quantity integer NOT NULL CHECK (quantity >= 0),
  condition text NOT NULL DEFAULT '',
  grader text NOT NULL DEFAULT '',
  grade text NOT NULL DEFAULT '',
  cert_number text NOT NULL DEFAULT '',
  sealed_type text NOT NULL DEFAULT '',
  purchase_price numeric(12, 2),
  market_value numeric(12, 2),
  image_url text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  card_id text NOT NULL DEFAULT '',
  price_variant text NOT NULL DEFAULT '',
  live_price boolean NOT NULL DEFAULT false,
  market jsonb,
  price_history jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS items_portfolio_id ON items (portfolio_id);
CREATE INDEX IF NOT EXISTS items_card_id ON items (card_id) WHERE card_id <> '';
CREATE TABLE IF NOT EXISTS app_meta (
  key text PRIMARY KEY,
  value text
);
`

// Any constant works; it only has to be the same for every writer.
const WRITE_LOCK = 724_201

const iso = (value: unknown) => (value instanceof Date ? value.toISOString() : String(value))
const money = (value: unknown) => (value === null || value === undefined ? null : Number(value))
const json = <T>(value: unknown, fallback: T): T =>
  value === null || value === undefined ? fallback : typeof value === "string" ? JSON.parse(value) : (value as T)

function toPortfolio(row: Record<string, unknown>): Portfolio {
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description ?? ""),
    parentId: row.parent_id === null ? null : String(row.parent_id),
    createdAt: iso(row.created_at),
  }
}

function toItem(row: Record<string, unknown>): Item {
  return {
    id: String(row.id),
    portfolioId: String(row.portfolio_id),
    kind: row.kind as Item["kind"],
    name: String(row.name),
    set: String(row.set_name),
    number: String(row.number),
    language: String(row.language),
    quantity: Number(row.quantity),
    condition: String(row.condition),
    grader: String(row.grader),
    grade: String(row.grade),
    certNumber: String(row.cert_number),
    sealedType: String(row.sealed_type),
    purchasePrice: money(row.purchase_price),
    marketValue: money(row.market_value),
    imageUrl: String(row.image_url),
    notes: String(row.notes),
    cardId: String(row.card_id),
    priceVariant: String(row.price_variant),
    livePrice: Boolean(row.live_price),
    market: json(row.market, null),
    priceHistory: json(row.price_history, []),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  }
}

export async function loadCollection(db: Queryable): Promise<Collection> {
  const [portfolios, items, meta] = await Promise.all([
    db.query("SELECT * FROM portfolios ORDER BY created_at, id"),
    db.query("SELECT * FROM items ORDER BY created_at, id"),
    db.query("SELECT value FROM app_meta WHERE key = 'prices_refreshed_at'"),
  ])
  return {
    portfolios: portfolios.rows.map(toPortfolio),
    items: items.rows.map(toItem),
    pricesRefreshedAt: meta.rows[0]?.value ? String(meta.rows[0].value) : null,
  }
}

async function upsertPortfolio(db: Queryable, p: Portfolio) {
  await db.query(
    `INSERT INTO portfolios (id, name, description, parent_id, created_at) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, parent_id = EXCLUDED.parent_id`,
    [p.id, p.name, p.description, p.parentId, p.createdAt]
  )
}

async function upsertItem(db: Queryable, i: Item) {
  await db.query(
    `INSERT INTO items (id, portfolio_id, kind, name, set_name, number, language, quantity, condition, grader, grade,
       cert_number, sealed_type, purchase_price, market_value, image_url, notes, card_id, price_variant, live_price,
       market, price_history, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
     ON CONFLICT (id) DO UPDATE SET portfolio_id = EXCLUDED.portfolio_id, kind = EXCLUDED.kind, name = EXCLUDED.name,
       set_name = EXCLUDED.set_name, number = EXCLUDED.number, language = EXCLUDED.language, quantity = EXCLUDED.quantity,
       condition = EXCLUDED.condition, grader = EXCLUDED.grader, grade = EXCLUDED.grade, cert_number = EXCLUDED.cert_number,
       sealed_type = EXCLUDED.sealed_type, purchase_price = EXCLUDED.purchase_price, market_value = EXCLUDED.market_value,
       image_url = EXCLUDED.image_url, notes = EXCLUDED.notes, card_id = EXCLUDED.card_id,
       price_variant = EXCLUDED.price_variant, live_price = EXCLUDED.live_price, market = EXCLUDED.market,
       price_history = EXCLUDED.price_history, updated_at = EXCLUDED.updated_at`,
    [
      i.id, i.portfolioId, i.kind, i.name, i.set, i.number, i.language, i.quantity, i.condition, i.grader, i.grade,
      i.certNumber, i.sealedType, i.purchasePrice, i.marketValue, i.imageUrl, i.notes, i.cardId, i.priceVariant,
      i.livePrice, i.market === null ? null : JSON.stringify(i.market), JSON.stringify(i.priceHistory),
      i.createdAt, i.updatedAt,
    ]
  )
}

function changed<T extends { id: string }>(before: T[], after: T[]) {
  const old = new Map(before.map((row) => [row.id, JSON.stringify(row)]))
  const ids = new Set(after.map((row) => row.id))
  return {
    upserts: after.filter((row) => old.get(row.id) !== JSON.stringify(row)),
    deletes: before.filter((row) => !ids.has(row.id)).map((row) => row.id),
  }
}

export async function writeChanges(db: Queryable, before: Collection, after: Collection) {
  const portfolios = changed(before.portfolios, after.portfolios)
  const items = changed(before.items, after.items)
  if (items.deletes.length) await db.query("DELETE FROM items WHERE id = ANY($1)", [items.deletes])
  if (portfolios.deletes.length) await db.query("DELETE FROM portfolios WHERE id = ANY($1)", [portfolios.deletes])
  for (const portfolio of portfolios.upserts) await upsertPortfolio(db, portfolio)
  for (const item of items.upserts) await upsertItem(db, item)
  if (before.pricesRefreshedAt !== after.pricesRefreshedAt) {
    await db.query(
      `INSERT INTO app_meta (key, value) VALUES ('prices_refreshed_at', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [after.pricesRefreshedAt]
    )
  }
}

export function createPostgresStore(db: Db) {
  let ready: Promise<unknown> | null = null
  const ensureSchema = () => (ready ??= db.query(SCHEMA).catch((error) => {
    ready = null
    throw error
  }))

  return {
    async read(): Promise<Collection> {
      await ensureSchema()
      return loadCollection(db)
    },
    async mutate<T>(change: (collection: Collection) => T): Promise<T> {
      await ensureSchema()
      return db.transaction(async (tx) => {
        await tx.query("SELECT pg_advisory_xact_lock($1)", [WRITE_LOCK])
        const before = await loadCollection(tx)
        const after = structuredClone(before)
        const result = change(after)
        await writeChanges(tx, before, after)
        return result
      })
    },
  }
}
