import React from 'react'
import { useAuth } from '@/hooks/useAuth'

export const ClientHomePage: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="mx-auto w-full max-w-4xl p-8">
      <h1 className="mb-6 text-3xl font-bold">Välkommen, {user?.name}</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-sidebar p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Dagens Assistans</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Här kommer du kunna se vem som arbetar hos dig idag och när passet börjar.
          </p>
          <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-secondary p-4 text-sm text-muted-foreground">
            Inget schema tillgängligt just nu
          </div>
        </div>
        <div className="rounded-xl border border-border bg-sidebar p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Meddelanden</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Om du behöver nå din samordnare eller chef kan du skicka ett säkert meddelande i
            inkorgen.
          </p>
          <a
            href="/inbox"
            className="mt-2 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Gå till Inkorgen
          </a>
        </div>
      </div>
    </div>
  )
}
