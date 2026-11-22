import Link from "next/link"
import { Suspense } from "react"
import { DashboardActions } from "@/components/dashboard-actions"
import { ItemThumb, KindBadge } from "@/components/item-visuals"
import { PageSkeleton } from "@/components/page-skeleton"
import { PortfolioCard } from "@/components/portfolio-card"
import { StatGrid } from "@/components/stats"
import { formatMoney, itemDetail, unitValue } from "@/lib/format"
import { getDashboard } from "@/lib/queries"

async function Dashboard() {
  const { totals, portfolios, recent } = await getDashboard()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6 sm:px-6 lg:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="m-0 text-sm font-semibold tracking-wide text-primary uppercase">
            Your collection
          </p>
          <h1 className="m-0 text-3xl font-semibold tracking-tight sm:text-4xl">
            Overview
          </h1>
        </div>
        <DashboardActions canAddItem={portfolios.length > 0} />
      </header>

      <StatGrid totals={totals} />

      <section aria-labelledby="portfolios-heading" className="flex flex-col gap-3">
        <h2 id="portfolios-heading" className="m-0 text-lg font-semibold tracking-tight">
          Portfolios
        </h2>
        {portfolios.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
            <p className="m-0 text-base font-semibold">Start with your storage</p>
            <p className="m-0 max-w-md text-sm text-muted-fg">
              Make a portfolio for each bin, binder or shelf. Group them, like
              Bin 1, 2 and 3 inside Sealed, then print a QR label for each one.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {portfolios.map((portfolio) => (
              <PortfolioCard key={portfolio.id} portfolio={portfolio} />
            ))}
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section aria-labelledby="recent-heading" className="flex flex-col gap-3">
          <h2 id="recent-heading" className="m-0 text-lg font-semibold tracking-tight">
            Recently updated
          </h2>
          <ul className="m-0 flex list-none flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface p-0">
            {recent.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/p/${item.portfolioId}`}
                  className="flex items-center gap-3 px-4 py-3 text-fg no-underline hover:bg-muted"
                >
                  <ItemThumb kind={item.kind} imageUrl={item.imageUrl} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium">{item.name}</span>
                      <KindBadge kind={item.kind} />
                    </span>
                    <span className="truncate text-sm text-muted-fg">
                      {[itemDetail(item), item.location].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="text-end">
                    <span className="block font-semibold tabular-nums">
                      {formatMoney(unitValue(item) * item.quantity)}
                    </span>
                    <span className="block text-xs text-muted-fg">× {item.quantity}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
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
