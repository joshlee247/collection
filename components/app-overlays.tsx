"use client"

import { OverlayHost } from "@ui-sdk/react/overlays"

export function AppOverlays() {
  return <OverlayHost toast={{ side: "top", align: "center" }} />
}
