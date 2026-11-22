"use client"

import { Button } from "@ui-sdk/react/button"
import { toast } from "@ui-sdk/react/toast"
import { RefreshCwIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { refreshPrices } from "@/app/actions"
import { isStale } from "@/lib/pricing"
import type { PricingState } from "@/lib/queries"

function ago(iso: string, now: number) {
  const minutes = Math.round((now - Date.parse(iso)) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function PriceRefresh({ pricing }: { pricing: PricingState }) {
  const [now, setNow] = useState<number | null>(null)
  const started = useRef(false)

  async function run(automatic: boolean) {
    const result = await refreshPrices()
    if (!result.ok) {
      if (!automatic) toast.error("Prices not updated", { description: result.error })
      return
    }
    const { updated, failed } = result.data
    if (!automatic || failed) {
      toast(failed ? `Updated ${updated} prices, ${failed} couldn't be fetched` : `Updated ${updated} prices`, {
        id: "prices",
      })
    }
  }

  useEffect(() => {
    const tick = () => setNow(Date.now())
    tick()
    const timer = setInterval(tick, 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (started.current || pricing.linked === 0 || !isStale(pricing.refreshedAt, Date.now())) return
    started.current = true
    void run(true)
  }, [pricing.linked, pricing.refreshedAt])

  if (pricing.linked === 0) return null

  return (
    <div className="flex items-center gap-2 text-xs text-muted-fg">
      <span>
        TCGplayer prices
        {pricing.refreshedAt && now !== null && ` · updated ${ago(pricing.refreshedAt, now)}`}
      </span>
      <Button data-variant="ghost" onClick={() => run(false)} pendingAnnouncement="Refreshing prices">
        {(state) => (
          <>
            <RefreshCwIcon aria-hidden="true" className={state.pending ? "animate-spin" : undefined} />
            Refresh prices
          </>
        )}
      </Button>
    </div>
  )
}
