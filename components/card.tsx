type DivProps = React.ComponentProps<"div">

const cx = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ")

export function Card({ className, ...props }: DivProps) {
  return <div className={cx("bento flex flex-col gap-5 py-5 text-fg", className)} {...props} />
}

export function CardHeader({ className, ...props }: DivProps) {
  return <div className={cx("flex flex-col gap-1 px-5", className)} {...props} />
}

export function CardTitle({ className, ...props }: DivProps) {
  return (
    <div
      className={cx("text-sm font-semibold tracking-wide text-fg uppercase", className)}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }: DivProps) {
  return <div className={cx("text-sm text-muted-fg", className)} {...props} />
}

export function CardContent({ className, ...props }: DivProps) {
  return <div className={cx("px-5", className)} {...props} />
}

export function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cx(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md border border-[oklch(1_0_0/12%)] px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-muted-fg",
        className
      )}
      {...props}
    />
  )
}

export function Change({
  amount,
  percent,
  className,
}: {
  amount?: string
  percent: number | null
  className?: string
}) {
  if (percent === null) return null
  const up = percent >= 0
  return (
    <span className={cx("tabular-nums", up ? "text-gain" : "text-loss", className)}>
      {up ? "▲" : "▼"} {amount && `${amount} `}
      {amount ? `(${Math.abs(percent).toFixed(1)}%)` : `${Math.abs(percent).toFixed(1)}%`}
    </span>
  )
}

export function SectionTitle({
  children,
  id,
  action,
}: {
  children: React.ReactNode
  id?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h2 id={id} className="m-0 text-2xl font-semibold tracking-tight uppercase">
        {children}
      </h2>
      {action}
    </div>
  )
}

export { cx }
