"use client"

import { Button } from "@ui-sdk/react/button"
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@ui-sdk/react/dialog"
import { PencilIcon, Trash2Icon, XIcon } from "lucide-react"
import Link from "next/link"
import { formatMoney, itemDetail, unitValue } from "@/lib/format"
import type { LocatedItem } from "@/lib/queries"
import { KIND_LABELS } from "@/lib/types"
import { Change } from "./card"
import { useDialogs, type ViewerPayload } from "./dialogs-context"
import { removeWithUndo, QuantityStepper } from "./item-row"
import { HoloCard } from "./item-visuals"

function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-fg">{label}</dt>
      <dd className="m-0 text-base font-medium tabular-nums">{children}</dd>
    </div>
  )
}

export function CardViewer({ items }: { items: LocatedItem[] }) {
  const { viewer, item: editor } = useDialogs()

  return (
    <Dialog controller={viewer} presentation="auto">
      <DialogBackdrop />
      <DialogContent<ViewerPayload> keepMounted className="viewer">
        {(state) => {
          const item = items.find((entry) => entry.id === state.payload?.itemId)
          if (!item) {
            return <DialogTitle className="sr-only">Card viewer</DialogTitle>
          }
          const unit = unitValue(item)
          const total = unit * item.quantity
          const cost = item.purchasePrice === null ? null : item.purchasePrice * item.quantity
          const gain = cost === null ? null : total - cost
          return (
            <div className="relative grid md:grid-cols-[minmax(0,22rem)_1fr]">
              <DialogClose
                aria-label="Close"
                data-variant="pill"
                className="viewer-close absolute top-4 right-4 z-10"
              >
                <XIcon aria-hidden="true" />
              </DialogClose>

              <div className="grid place-items-center bg-black/40 px-10 py-10 md:px-8">
                <div className={item.kind === "card" ? "w-full max-w-64" : "w-full max-w-72"}>
                  <HoloCard item={item} />
                </div>
              </div>

              <div className="flex flex-col gap-6 p-6 md:p-8">
                <div className="flex flex-col gap-1 pe-10">
                  <span className="text-xs font-medium tracking-wide text-muted-fg uppercase">
                    {KIND_LABELS[item.kind]}
                    {item.location && (
                      <>
                        {" · "}
                        <Link href={`/p/${item.portfolioId}`} className="text-muted-fg underline-offset-2 hover:text-fg">
                          {item.location}
                        </Link>
                      </>
                    )}
                  </span>
                  <DialogTitle>{item.name}</DialogTitle>
                  <DialogDescription>{itemDetail(item) || "No details yet"}</DialogDescription>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-fg">Market value</span>
                  <span className="text-4xl font-semibold tracking-tight tabular-nums">
                    {formatMoney(total)}
                  </span>
                  <Change
                    className="text-sm"
                    amount={gain === null ? undefined : formatMoney(Math.abs(gain))}
                    percent={gain === null || !cost ? null : (gain / cost) * 100}
                  />
                </div>

                <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-line py-5 sm:grid-cols-3">
                  <Figure label="Market (each)">{item.marketValue === null ? "—" : formatMoney(item.marketValue)}</Figure>
                  <Figure label="Paid (each)">{item.purchasePrice === null ? "—" : formatMoney(item.purchasePrice)}</Figure>
                  <Figure label="Cost basis">{cost === null ? "—" : formatMoney(cost)}</Figure>
                  {item.kind === "graded" && (
                    <Figure label="Grade">{[item.grader, item.grade].filter(Boolean).join(" ") || "—"}</Figure>
                  )}
                  {item.kind === "graded" && item.certNumber && <Figure label="Cert">{item.certNumber}</Figure>}
                  {item.kind === "card" && <Figure label="Condition">{item.condition || "—"}</Figure>}
                  <Figure label="Language">{item.language || "English"}</Figure>
                </dl>

                {item.notes && <p className="m-0 text-sm text-muted-fg">{item.notes}</p>}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                  <QuantityStepper item={item} inViewer />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        viewer.close()
                        editor.open({ payload: { item } })
                      }}
                    >
                      <PencilIcon aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      data-variant="danger"
                      data-agent-confirm={`Removes ${item.name} from your collection`}
                      onClick={() => {
                        viewer.close()
                        return removeWithUndo(item)
                      }}
                    >
                      <Trash2Icon aria-hidden="true" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        }}
      </DialogContent>
    </Dialog>
  )
}
