"use client"

import { useAsyncOptions } from "@ui-sdk/react/async-options"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
} from "@ui-sdk/react/combobox"
import { Field, FieldDescription, FieldLabel } from "@ui-sdk/react/field"
import { formatMoney } from "@/lib/format"
import type { CardResult } from "@/lib/pricing"

async function search(query: string, { signal }: { signal: AbortSignal }): Promise<CardResult[]> {
  const response = await fetch(`/api/cards/search?q=${encodeURIComponent(query)}`, { signal })
  const body = await response.json()
  if (!response.ok) throw new Error(body.error ?? "Search failed")
  return body
}

function bestPrice(card: CardResult) {
  return card.variants.find((variant) => variant.market !== null)?.market ?? null
}

export function CardSearch({ onSelect }: { onSelect: (card: CardResult) => void }) {
  const cards = useAsyncOptions<CardResult>(search, { debounce: 350, minLength: 2 })
  const byId = new Map(cards.items.map((card) => [card.id, card]))

  return (
    <Field>
      <FieldLabel>Find card</FieldLabel>
      <Combobox
        items={cards.items.map((card) => ({ value: card.id, label: `${card.name} ${card.setName} ${card.number}` }))}
        filter={false}
        status={cards.status}
        onQueryChange={(query, details) => {
          if (details.reason !== "item-press") cards.setQuery(query)
        }}
        onValueChange={(id) => {
          const card = id ? byId.get(id) : undefined
          if (card) onSelect(card)
        }}
      >
        <ComboboxInput placeholder="Search by name and number, like “mew ex 205”" />
        <ComboboxContent className="max-h-80">
          <ComboboxStatus>
            {(state) =>
              state.status === "error"
                ? "Couldn't reach the card database. Try again in a moment."
                : state.loading
                  ? "Searching…"
                  : `${state.count} ${state.count === 1 ? "card" : "cards"}`
            }
          </ComboboxStatus>
          <ComboboxEmpty>
            {(state) =>
              state.empty && !state.loading && state.query.trim().length >= 2 && cards.status !== "error"
                ? `No cards match “${state.query}”.`
                : null
            }
          </ComboboxEmpty>
          <ComboboxList>
            {(state) =>
              (state.items as { value: string }[]).flatMap(({ value }) => {
                const card = byId.get(value)
                if (!card) return []
                const price = bestPrice(card)
                return (
                  <ComboboxItem key={card.id} value={card.id} label={`${card.name} ${card.setName} ${card.number}`}>
                    <img src={card.image} alt="" loading="lazy" className="h-12 w-auto shrink-0 rounded-[3px]" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">{card.name}</span>
                      <span className="truncate text-xs text-muted-fg">
                        {card.setName} · #{card.number}
                        {card.setTotal ? `/${card.setTotal}` : ""}
                        {card.rarity && ` · ${card.rarity}`}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm tabular-nums">{price === null ? "—" : formatMoney(price)}</span>
                  </ComboboxItem>
                )
              })
            }
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <FieldDescription>
        Fills in the details and tracks the TCGplayer market price.
      </FieldDescription>
    </Field>
  )
}
