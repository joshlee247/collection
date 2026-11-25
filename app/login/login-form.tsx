"use client"

import { Button } from "@ui-sdk/react/button"
import { Field, FieldError, FieldLabel } from "@ui-sdk/react/field"
import { PasswordInput, PasswordInputControl, PasswordInputToggle } from "@ui-sdk/react/password-input"
import { useActionState } from "react"
import { login } from "./actions"

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, { error: "" })
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Field invalid={state.error ? true : undefined}>
        <FieldLabel>Passcode</FieldLabel>
        <PasswordInput name="passcode" required>
          <PasswordInputControl autoFocus />
          <PasswordInputToggle />
        </PasswordInput>
        <FieldError>{(fieldState) => state.error || fieldState.message}</FieldError>
      </Field>
      <Button type="submit" data-variant="solid" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  )
}
