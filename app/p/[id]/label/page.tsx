import { notFound } from "next/navigation"
import { Suspense } from "react"
import { LabelSheet } from "@/components/label-sheet"
import { PageSkeleton } from "@/components/page-skeleton"
import { getPortfolioView } from "@/lib/queries"

export const metadata = { title: "Print label" }

async function Label({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const view = await getPortfolioView(id)
  if (!view) notFound()
  return (
    <LabelSheet
      id={view.portfolio.id}
      name={view.portfolio.name}
      path={view.trail.map((p) => p.name).join(" / ")}
      count={view.totals.count}
    />
  )
}

export default function Page({ params }: PageProps<"/p/[id]/label">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Label params={params} />
    </Suspense>
  )
}
