export function PageSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6 sm:px-6 lg:py-10"
    >
      <div className="h-10 w-56 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="h-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
