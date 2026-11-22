"use client"

import QRCode from "qrcode"
import { useEffect, useState, useSyncExternalStore } from "react"

const noSubscribe = () => () => {}

export function usePortfolioUrl(id: string): string | null {
  const origin = useSyncExternalStore(
    noSubscribe,
    () => process.env.NEXT_PUBLIC_APP_URL || window.location.origin,
    () => null
  )
  return origin ? `${origin.replace(/\/$/, "")}/p/${id}` : null
}

export function QrCode({
  value,
  label,
  className,
}: {
  value: string | null
  label: string
  className?: string
}) {
  const [svg, setSvg] = useState("")

  useEffect(() => {
    if (!value) return
    let active = true
    QRCode.toString(value, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#14131f", light: "#ffffff" },
    }).then((markup) => {
      if (active) setSvg(markup)
    })
    return () => {
      active = false
    }
  }, [value])

  return (
    <div
      role="img"
      aria-label={label}
      className={`aspect-square bg-white [&>svg]:block [&>svg]:size-full ${className ?? ""}`}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  )
}

export async function qrSvg(value: string): Promise<string> {
  return QRCode.toString(value, { type: "svg", margin: 2, errorCorrectionLevel: "M" })
}
