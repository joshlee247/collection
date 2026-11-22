import type { Metadata, Viewport } from "next"
import { Fraunces, Geist, Geist_Mono } from "next/font/google"
import { Suspense } from "react"
import { AppOverlays } from "@/components/app-overlays"
import { DialogsProvider } from "@/components/dialogs-context"
import { AppSidebar, Brand, SiteHeader, TabBar } from "@/components/nav-frame"
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

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
})

export const metadata: Metadata = {
  title: { default: "Card Vault", template: "%s · Card Vault" },
  description: "Track your Pokémon card collection, bin by bin.",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3effb" },
    { media: "(prefers-color-scheme: dark)", color: "#14121f" },
  ],
}

async function Navigation() {
  const data = await getNavData()
  return (
    <>
      <AppSidebar data={data} />
      <TabBar data={data} />
    </>
  )
}

async function Header() {
  return <SiteHeader data={await getNavData()} />
}

function NavigationFallback() {
  return (
    <aside className="no-print glass sticky top-3 m-3 me-0 hidden h-[calc(100dvh-1.5rem)] w-72 shrink-0 flex-col gap-6 rounded-[2rem] p-4 lg:flex">
      <Brand />
      <div className="flex flex-col gap-2" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="h-9 animate-pulse rounded-full bg-[var(--glass-strong)]" />
        ))}
      </div>
    </aside>
  )
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}
    >
      <body>
        <DialogsProvider>
          <div className="flex min-h-dvh">
            <Suspense fallback={<NavigationFallback />}>
              <Navigation />
            </Suspense>
            <div className="flex min-w-0 flex-1 flex-col pb-28 lg:pb-6">
              <Suspense fallback={<div className="h-14" />}>
                <Header />
              </Suspense>
              <main className="@container/main flex flex-1 flex-col">{children}</main>
            </div>
          </div>
          <AppOverlays />
        </DialogsProvider>
      </body>
    </html>
  )
}
