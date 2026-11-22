import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Suspense } from "react"
import { AppOverlays } from "@/components/app-overlays"
import { DialogsProvider } from "@/components/dialogs-context"
import { Brand, NavFrame } from "@/components/nav-frame"
import { getNavData } from "@/lib/queries"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: { default: "Card Vault", template: "%s · Card Vault" },
  description: "Track your Pokémon card collection, bin by bin.",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1016" },
  ],
}

async function Navigation() {
  return <NavFrame data={await getNavData()} />
}

function NavigationFallback() {
  return (
    <>
      <aside className="no-print sticky top-0 hidden h-dvh w-72 shrink-0 flex-col gap-6 border-e border-line bg-sidebar p-4 lg:flex">
        <Brand />
        <div className="flex flex-col gap-2" aria-hidden="true">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="h-8 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </aside>
      <header className="no-print flex h-14 items-center border-b border-line px-4 lg:hidden">
        <Brand />
      </header>
    </>
  )
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body>
        <DialogsProvider>
          <div className="flex min-h-dvh flex-col lg:flex-row">
            <Suspense fallback={<NavigationFallback />}>
              <Navigation />
            </Suspense>
            <main className="min-w-0 flex-1">{children}</main>
          </div>
          <AppOverlays />
        </DialogsProvider>
      </body>
    </html>
  )
}
