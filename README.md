# vault.

Track a Pokémon card collection by where it's physically stored. Raw cards,
graded slabs and sealed product live in **portfolios** (a bin, binder or
shelf), and portfolios can hold other portfolios, like `Sealed → Bin 1, 2, 3`.
Every portfolio has a QR code: stick it on the bin, scan it with your phone,
and tap − or + to update what's inside.

Built with Next.js 16 and [ui-sdk](https://ui-sdk.dev) components, styled to
match the cards page on joshtlee.com.

## Getting started

```bash
npm install
npm run seed   # optional: demo data (placeholder prices) with Sealed → Bin 1–3, slabs and a binder
npm run dev
```

Open http://localhost:3000.

## Using it

- **Portfolios**: create one with "New portfolio" on the Collection page (or the folder icon in the top bar). Choose "Inside" to nest it
  under another. A parent's page totals everything in its sub-portfolios, and
  can list their items too.
- **Images**: paste a card, slab or product image URL (or a path under
  `public/`, like `/images/slabs/…`) into an item. Raw cards show in a
  toploader, slabs and sealed product show as their photo. Click any card to
  open it with a holo tilt and its market data.
- **Live prices**: in "Add item", search "Find card" (like `mew ex 205`) to
  link a raw card to the [Pokémon TCG API](https://pokemontcg.io). It fills in
  the details and image, and its market value follows the TCGplayer market
  price for the variant you pick. Prices refresh when you open the app and
  they're over 6 hours old, or with "Refresh prices". Each refresh keeps one
  price per day, so the card viewer can chart history and the panel can show
  the change over the past 7 days.
- **What isn't live**: the API has no prices for graded slabs or sealed
  product, so you set those values yourself. A linked slab still shows its
  raw card's price as a reference. TCGplayer's market price is for near mint
  copies, whatever condition you record.
- **Items**: "Add item" on a portfolio page. Pick Raw card, Graded or Sealed;
  the form shows the fields for that type (condition, grading company and
  grade, or product type). Use "Edit or move" in an item's ⋯ menu to change it
  or move it to another bin.
- **Quick changes**: the − and + steppers save after a short pause. Taking the
  last one out removes the item, with Undo in the toast that appears.
- **QR labels**: "QR code" on a portfolio shows the code, lets you copy the
  link or download an SVG, and "Print label" opens a 3.5 × 2 in label.

## Scanning from your phone

The QR code holds the address you opened the app at. For a phone to reach it,
run the app somewhere your phone can see (your computer's LAN address, or a
deployment) and set the public address before printing labels:

```bash
NEXT_PUBLIC_APP_URL=http://192.168.1.20:3000 npm run dev
```

## Pricing API

The app calls `api.pokemontcg.io` from the server. It works without a key at
lower rate limits; for more, get a free key at https://dev.pokemontcg.io and
set it:

```bash
POKEMONTCG_API_KEY=your-key npm run dev
```

The API sometimes answers with server errors; requests are retried, and if
prices can't be fetched, the last known values are kept.

## Deploying to Vercel

1. In Vercel, **Add New → Project**, import `joshlee247/collection` and deploy. The
   first deploy shows the login page and won't let anyone in yet; that's expected.
2. **Storage → Create Database → Neon (Postgres)**, and connect it to this project.
   That sets `DATABASE_URL`. The app creates its tables on first use.
3. **Settings → Environment Variables**: add `APP_PASSCODE` (your passcode) and
   `SESSION_SECRET` (any long random string), then redeploy.
4. Open the site, sign in, and print fresh QR labels from it, since labels
   carry the address they were printed from.

To copy an existing local collection into the database, pull the connection
string (Vercel → Storage → your database → `.env.local`) and run:

```bash
DATABASE_URL="postgres://…" npm run db:import -- data/collection.json
```

Without a passcode a deployment stays locked. Locally, the app runs without a
login unless you set `APP_PASSCODE`.

## Data

Deployed, everything is stored in Postgres (`DATABASE_URL`). Locally, without
a database, it's stored in `data/collection.json` (ignored by git). Set
`COLLECTION_DATA_FILE` to keep it elsewhere, and back that file up. Signing in
with `APP_PASSCODE` keeps a device signed in for 180 days.

## Scripts

| Command             | What it does                         |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Development server                   |
| `npm run build`     | Production build                     |
| `npm start`         | Serve the production build           |
| `npm test`          | Unit and interface tests (Vitest)    |
| `npm run typecheck` | TypeScript                           |
| `npm run seed`      | Write demo data (`--force` replaces) |
