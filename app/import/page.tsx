import { Suspense } from "react"
import products from "@/imports/collectr-sealed.json"
import { formatMoney } from "@/lib/format"
import { readCollection } from "@/lib/store"
import { ImportButton } from "./import-button"

export const metadata = { title: "Import from Collectr" }

const sealed = products.filter((p) => !("is_card" in p && p.is_card))
const boxes = sealed.reduce((sum, p) => sum + Number(p.quantity), 0)
const value = sealed.reduce((sum, p) => sum + Number(p.quantity) * Number(p.market_price), 0)

async function Status() {
  const collection = await readCollection()
  const ids = new Set(collection.items.map((item) => item.id))
  const already = sealed.filter((p) => ids.has(`collectr-${p.product_id}`)).length
  return <ImportButton already={already} />
}

export default function Page() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="bento flex w-full max-w-md flex-col gap-6 p-6">
        <div>
          <h1 className="m-0 text-2xl font-semibold tracking-tight text-white">Import from Collectr</h1>
          <p className="m-0 mt-1 text-sm text-muted-fg">
            {sealed.length} sealed products ({boxes} boxes, {formatMoney(value)}) go into a top-level
            “Sealed” portfolio. Importing again updates quantities and prices without duplicating
            anything or moving items out of their bins.
          </p>
        </div>
        <Suspense fallback={<div className="h-10" />}>
          <Status />
        </Suspense>
      </div>
    </div>
  )
}
