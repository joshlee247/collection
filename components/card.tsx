type DivProps = React.ComponentProps<"div">

const cx = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ")

export function Card({ className, ...props }: DivProps) {
  return (
    <div
      className={cx("glass flex flex-col gap-5 rounded-[1.75rem] py-6 text-fg", className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: DivProps) {
  return (
    <div
      className={cx(
        "grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-6 has-[[data-card-action]]:grid-cols-[1fr_auto]",
        className
      )}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: DivProps) {
  return (
    <div
      className={cx("font-display text-xl leading-tight font-semibold", className)}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }: DivProps) {
  return <div className={cx("text-sm text-muted-fg", className)} {...props} />
}

export function CardAction({ className, ...props }: DivProps) {
  return (
    <div
      data-card-action=""
      className={cx("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: DivProps) {
  return <div className={cx("px-6", className)} {...props} />
}

export function CardFooter({ className, ...props }: DivProps) {
  return <div className={cx("flex items-center px-6", className)} {...props} />
}

export function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cx(
        "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-full border border-[var(--glass-edge)] bg-[var(--glass-strong)] px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-fg [&>svg]:size-3",
        className
      )}
      {...props}
    />
  )
}

export function TrendPill({ value, className }: { value: number; className?: string }) {
  const up = value >= 0
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
        up
          ? "bg-[color-mix(in_oklab,var(--gain)_16%,transparent)] text-gain"
          : "bg-[color-mix(in_oklab,var(--loss)_14%,transparent)] text-loss",
        className
      )}
    >
      {up ? "↑" : "↓"} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

export { cx }
