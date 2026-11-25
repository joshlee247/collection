import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import { AppOverlays } from "@/components/app-overlays"
import { DialogsProvider } from "@/components/dialogs-context"
import { MobileDock, TopNav } from "@/components/nav-frame"
import { hasSession } from "@/lib/auth"
import { getNavData } from "@/lib/queries"
import { authConfig } from "@/lib/session"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: { default: "vault.", template: "%s · vault." },
  description: "Pokémon TCG collection, bin by bin.",
}

export const viewport: Viewport = {
  themeColor: "#05070a",
  colorScheme: "dark",
}

async function Navigation() {
  if (!(await hasSession())) return null
  const data = await getNavData()
  return (
    <>
      <TopNav data={data} canSignOut={authConfig().enabled} />
      <MobileDock data={data} />
    </>
  )
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <DialogsProvider>
          <div className="relative flex min-h-screen flex-col">
            <Suspense fallback={<div className="hidden h-12 border-b border-line md:block" />}>
              <Navigation />
            </Suspense>
            <main className="@container/main flex flex-1 flex-col">{children}</main>
          </div>
          <AppOverlays />
        </DialogsProvider>
      </body>
    </html>
  )
}
