import { Suspense } from "react"
import { DashboardActions, NewPortfolioTile } from "@/components/dashboard-actions"
import { InventoryTable } from "@/components/inventory-table"
import { LocationChart } from "@/components/location-chart"
import { PageSkeleton } from "@/components/page-skeleton"
import { PortfolioCard } from "@/components/portfolio-card"
import { StatGrid, Summary } from "@/components/stats"
import { getDashboard } from "@/lib/queries"

export const metadata = { title: "Dashboard" }

async function Dashboard() {
  const { totals, insights, portfolios, portfolioCount, items, locations } = await getDashboard()

  return (
    <div className="flex flex-col gap-8 px-4 py-4 lg:px-8 lg:py-6">
      <section aria-labelledby="dashboard-heading" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1
            id="dashboard-heading"
            className="m-0 text-xs font-semibold tracking-[0.16em] text-muted-fg uppercase"
          >
            Your collection
          </h1>
          <DashboardActions canAddItem={portfolioCount > 0} />
        </div>
        <Summary totals={totals} insights={insights} portfolioCount={portfolioCount} />
      </section>

      <StatGrid totals={totals} insights={insights} scope="your vault" />

      <section aria-labelledby="portfolios-heading" className="flex flex-col gap-4">
        <h2 id="portfolios-heading" className="font-display m-0 text-2xl font-semibold">
          Portfolios
        </h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 @2xl/main:grid-cols-3 @5xl/main:grid-cols-4">
          {portfolios.map((portfolio) => (
            <PortfolioCard key={portfolio.id} portfolio={portfolio} />
          ))}
          <NewPortfolioTile />
        </div>
      </section>

      <LocationChart locations={locations} />

      <InventoryTable items={items} />
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Dashboard />
    </Suspense>
  )
}
