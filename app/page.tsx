import { Suspense } from "react"
import { SectionTitle } from "@/components/card"
import { CardViewer } from "@/components/card-viewer"
import { CollectionGrid } from "@/components/collection-grid"
import { DashboardActions } from "@/components/dashboard-actions"
import { LocationChart } from "@/components/location-chart"
import { PageSkeleton } from "@/components/page-skeleton"
import { PortfolioCard } from "@/components/portfolio-card"
import { StatGrid } from "@/components/stats"
import { formatCount } from "@/lib/format"
import { getDashboard } from "@/lib/queries"

export const metadata = { title: "Collection" }

async function Dashboard() {
  const { totals, insights, portfolios, portfolioCount, items, locations } = await getDashboard()

  return (
    <div className="flex flex-col gap-16 px-6 pt-12 pb-32 md:px-10 md:pb-16">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-semibold tracking-tight text-white">Collection</h1>
          <p className="m-0 mt-0.5 text-sm text-muted-fg">
            Pokémon TCG · {formatCount(totals.count, "item")} · {formatCount(portfolioCount, "portfolio")}
          </p>
        </div>
        <DashboardActions canAddItem={portfolioCount > 0} />
      </header>

      <StatGrid totals={totals} insights={insights} scope="all" />

      <section aria-labelledby="portfolios-heading" className="flex flex-col gap-6">
        <SectionTitle id="portfolios-heading">Portfolios</SectionTitle>
        {portfolios.length === 0 ? (
          <p className="m-0 text-sm text-muted-fg">
            Make a portfolio for each bin, binder or shelf. Group bins inside a parent, like Bin 1–3 inside Sealed.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {portfolios.map((portfolio) => (
              <PortfolioCard key={portfolio.id} portfolio={portfolio} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="market-heading" className="flex flex-col gap-6">
        <SectionTitle id="market-heading">Market</SectionTitle>
        <LocationChart locations={locations} />
      </section>

      <section aria-labelledby="collection-heading" className="flex flex-col gap-6">
        <SectionTitle id="collection-heading">Personal collection</SectionTitle>
        <CollectionGrid items={items} label="Personal collection" />
      </section>

      <CardViewer items={items} />
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
