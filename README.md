# Card Vault

Track a Pokémon card collection by where it's physically stored. Raw cards,
graded slabs and sealed product live in **portfolios** (a bin, binder or
shelf), and portfolios can hold other portfolios, like `Sealed → Bin 1, 2, 3`.
Every portfolio has a QR code: stick it on the bin, scan it with your phone,
and tap − or + to update what's inside.

Built with Next.js 16 and [ui-sdk](https://ui-sdk.dev) components.

## Getting started

```bash
npm install
npm run seed   # optional: demo data with Sealed → Bin 1–3, slabs and a binder
npm run dev
```

Open http://localhost:3000.

## Using it

- **Portfolios**: create one from the sidebar. Choose "Inside" to nest it
  under another. A parent's page totals everything in its sub-portfolios, and
  can list their items too.
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

## Data

Everything is stored in `data/collection.json` (ignored by git). Set
`COLLECTION_DATA_FILE` to keep it elsewhere, and back that file up. The app
has no sign-in: anyone who can reach it can edit the collection, so keep it on
your home network or add authentication before putting it on the internet.

## Scripts

| Command             | What it does                         |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Development server                   |
| `npm run build`     | Production build                     |
| `npm start`         | Serve the production build           |
| `npm test`          | Unit and interface tests (Vitest)    |
| `npm run typecheck` | TypeScript                           |
| `npm run seed`      | Write demo data (`--force` replaces) |
