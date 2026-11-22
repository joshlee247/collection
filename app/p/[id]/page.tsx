import { notFound } from "next/navigation"
import { Suspense } from "react"
import { PortfolioScreen } from "@/components/portfolio-screen"
import { PageSkeleton } from "@/components/page-skeleton"
import { getPortfolioView } from "@/lib/queries"

async function Portfolio({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const view = await getPortfolioView(id)
  if (!view) notFound()
  return <PortfolioScreen view={view} />
}

export default function Page({ params }: PageProps<"/p/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Portfolio params={params} />
    </Suspense>
  )
}
