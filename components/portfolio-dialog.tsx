"use client"

import { Button } from "@ui-sdk/react/button"
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@ui-sdk/react/dialog"
import { Field, FieldLabel } from "@ui-sdk/react/field"
import { Textarea } from "@ui-sdk/react/textarea"
import { toast } from "@ui-sdk/react/toast"
import { XIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { savePortfolio } from "@/app/actions"
import type { PortfolioOption } from "@/lib/queries"
import type { Portfolio } from "@/lib/types"
import { useDialogs, type PortfolioPayload } from "./dialogs-context"
import { SelectField, TextField } from "./fields"

export function PortfolioDialog({
  options,
  nested,
}: {
  options: PortfolioOption[]
  nested: Record<string, string[]>
}) {
  const { portfolio: controller } = useDialogs()
  const [session, setSession] = useState(0)

  return (
    <Dialog
      controller={controller}
      presentation="auto"
      onOpenChange={(open) => {
        if (open) setSession((value) => value + 1)
      }}
    >
      <DialogBackdrop />
      <DialogContent<PortfolioPayload> keepMounted className="sm:w-[28rem]">
        {(state) => (
          <PortfolioForm
            key={session}
            portfolio={state.payload?.portfolio}
            parentId={state.payload?.parentId ?? null}
            options={options.filter((option) => {
              const self = state.payload?.portfolio?.id
              return (
                !self ||
                (option.value !== self && !nested[self]?.includes(option.value))
              )
            })}
            onSaved={() => controller.close()}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

export function PortfolioForm({
  portfolio,
  parentId,
  options,
  onSaved,
}: {
  portfolio?: Portfolio
  parentId: string | null
  options: PortfolioOption[]
  onSaved: () => void
}) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  const editing = Boolean(portfolio)

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await savePortfolio(data)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success(editing ? "Portfolio updated" : "Portfolio created", {
        description: result.data.name,
      })
      onSaved()
      if (!editing) router.push(`/p/${result.data.id}`)
    })
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <DialogTitle>
            {editing ? `Edit ${portfolio!.name}` : "New portfolio"}
          </DialogTitle>
          <DialogDescription>
            A bin, binder, shelf or any group. Portfolios can hold other
            portfolios.
          </DialogDescription>
        </div>
        <DialogClose aria-label="Close" className="shrink-0">
          <XIcon aria-hidden="true" />
        </DialogClose>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {portfolio && <input type="hidden" name="id" value={portfolio.id} />}
        <TextField
          label="Portfolio name"
          name="name"
          defaultValue={portfolio?.name}
          placeholder="Bin 1"
          required
        />
        <SelectField
          label="Inside"
          name="parentId"
          options={[{ value: "root", label: "Top level" }, ...options]}
          defaultValue={(portfolio ? portfolio.parentId : parentId) ?? "root"}
        />
        <Field>
          <FieldLabel>Description</FieldLabel>
          <Textarea
            name="description"
            defaultValue={portfolio?.description}
            placeholder="Top shelf, left side of the closet"
          />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-loss">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DialogClose>Cancel</DialogClose>
          <Button type="submit" data-variant="solid" disabled={pending}>
            {pending ? "Saving…" : editing ? "Save changes" : "Create portfolio"}
          </Button>
        </div>
      </form>
    </>
  )
}
