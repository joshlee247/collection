import { Suspense } from "react"
import { safeNext } from "@/lib/session"
import { LoginForm } from "./login-form"

export const metadata = { title: "Sign in" }

async function Form({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return <LoginForm next={safeNext(next)} />
}

export default function Page({ searchParams }: PageProps<"/login">) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="bento flex w-full max-w-sm flex-col gap-6 p-6">
        <div>
          <h1 className="m-0 text-2xl font-semibold tracking-tight text-white">vault.</h1>
          <p className="m-0 mt-1 text-sm text-muted-fg">Enter your passcode to open your collection.</p>
        </div>
        <Suspense fallback={<div className="h-28" />}>
          <Form searchParams={searchParams as Promise<{ next?: string }>} />
        </Suspense>
      </div>
    </div>
  )
}
