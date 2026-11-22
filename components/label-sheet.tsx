"use client"

import { Button } from "@ui-sdk/react/button"
import { ArrowLeftIcon, PrinterIcon } from "lucide-react"
import Link from "next/link"
import { QrCode, usePortfolioUrl } from "./qr"

export function LabelSheet({
  id,
  name,
  path,
  count,
}: {
  id: string
  name: string
  path: string
  count: number
}) {
  const url = usePortfolioUrl(id)
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-10">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Button render={<Link href={`/p/${id}`} />}>
          <ArrowLeftIcon aria-hidden="true" />
          Back to {name}
        </Button>
        <Button data-variant="solid" onClick={() => window.print()}>
          <PrinterIcon aria-hidden="true" />
          Print
        </Button>
      </div>
      <p className="no-print m-0 text-sm text-muted-fg">
        Print at 100% scale and tape it to the front of the bin. The label is
        about 3.5 × 2 inches.
      </p>

      <div className="flex w-[3.5in] max-w-full items-center gap-4 rounded-xl border-2 border-[#14131f] bg-white p-3 text-[#14131f] print:rounded-none">
        <QrCode
          value={url}
          label={`QR code linking to ${name}`}
          className="w-[1.6in] shrink-0"
        />
        <div className="flex min-w-0 flex-col gap-1">
          {path && (
            <span className="truncate text-[0.7rem] font-medium tracking-wide text-[#55536a] uppercase">
              {path}
            </span>
          )}
          <span className="text-xl leading-tight font-bold break-words">
            {name}
          </span>
          <span className="text-xs text-[#55536a]">
            {count} item{count === 1 ? "" : "s"} when printed
          </span>
          <span className="mt-1 text-[0.65rem] text-[#55536a]">
            Scan to add or remove
          </span>
        </div>
      </div>
    </div>
  )
}
