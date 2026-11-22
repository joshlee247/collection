"use client"

import { Button } from "@ui-sdk/react/button"
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@ui-sdk/react/dialog"
import { toast } from "@ui-sdk/react/toast"
import { CopyIcon, DownloadIcon, PrinterIcon, QrCodeIcon, XIcon } from "lucide-react"
import Link from "next/link"
import type { Portfolio } from "@/lib/types"
import { QrCode, qrSvg, usePortfolioUrl } from "./qr"

export function QrDialog({ portfolio, path }: { portfolio: Portfolio; path: string }) {
  const url = usePortfolioUrl(portfolio.id)

  async function download() {
    if (!url) return
    const blob = new Blob([await qrSvg(url)], { type: "image/svg+xml" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${portfolio.name.replace(/[^\w-]+/g, "-")}-qr.svg`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  async function copy() {
    if (!url) return
    await navigator.clipboard.writeText(url)
    toast.success("Link copied")
  }

  return (
    <Dialog presentation="auto">
      <DialogTrigger>
        <QrCodeIcon aria-hidden="true" />
        QR code
      </DialogTrigger>
      <DialogBackdrop />
      <DialogContent className="sm:w-[24rem]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <DialogTitle>QR code for {portfolio.name}</DialogTitle>
            <DialogDescription>
              Stick it on the bin. Scanning it opens this portfolio, ready to
              add or remove items.
            </DialogDescription>
          </div>
          <DialogClose aria-label="Close" className="shrink-0">
            <XIcon aria-hidden="true" />
          </DialogClose>
        </div>
        <div className="mx-auto w-full max-w-64 rounded-2xl border border-line bg-white p-4 shadow-sm">
          <QrCode value={url} label={`QR code linking to ${portfolio.name}`} />
          <p className="m-0 mt-3 text-center text-sm font-semibold text-[#14131f]">
            {portfolio.name}
          </p>
          {path !== portfolio.name && (
            <p className="m-0 text-center text-xs text-[#55536a]">{path}</p>
          )}
        </div>
        <p className="m-0 truncate text-center font-mono text-xs text-muted-fg">
          {url}
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button onClick={copy}>
            <CopyIcon aria-hidden="true" />
            Copy link
          </Button>
          <Button onClick={download}>
            <DownloadIcon aria-hidden="true" />
            Download
          </Button>
          <Button
            data-variant="solid"
            render={<Link href={`/p/${portfolio.id}/label`} />}
          >
            <PrinterIcon aria-hidden="true" />
            Print label
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
