"use client"

import { Button } from "@ui-sdk/react/button"
import Link from "next/link"
import { useActionState } from "react"
import { importFromCollectr } from "../actions"

type State = { message: string; error: string; portfolioId: string }

export function ImportButton({ already }: { already: number }) {
  const [state, action, pending] = useActionState(
    async (): Promise<State> => {
      const result = await importFromCollectr()
      if (!result.ok) return { message: "", error: result.error, portfolioId: "" }
      const { added, updated, portfolioId } = result.data
      return { message: `${added} added, ${updated} updated.`, error: "", portfolioId }
    },
    { message: "", error: "", portfolioId: "" }
  )
  return (
    <form action={action} className="flex flex-col gap-3">
      {already > 0 && !state.message ? (
        <p className="m-0 text-sm text-muted-fg">{already} of these are already in your collection.</p>
      ) : null}
      <Button type="submit" data-variant="solid" disabled={pending}>
        {pending ? "Importing…" : already > 0 ? "Import again" : "Import"}
      </Button>
      <p role="status" className="m-0 text-sm text-muted-fg">
        {state.error ? <span className="text-red-400">{state.error}</span> : state.message}
        {state.portfolioId ? (
          <>
            {" "}
            <Link href={`/p/${state.portfolioId}`} className="text-white underline">
              Open Sealed
            </Link>
          </>
        ) : null}
      </p>
    </form>
  )
}
