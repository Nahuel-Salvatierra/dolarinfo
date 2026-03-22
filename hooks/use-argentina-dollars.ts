"use client"

import { useEffect, useMemo, useState } from "react"
import { getDolarQuotes } from "@/lib/dolarapi/client"
import type { DolarQuote } from "@/lib/dolarapi/types"

const LAST_QUOTES_STORAGE_KEY = "dolarapi-last-quotes"

export interface QuoteChange {
  amount: number
  direction: "up" | "down" | "flat"
}

interface StoredQuotesSnapshot {
  quotes: DolarQuote[]
}

interface UseArgentinaDollarsResult {
  quotes: DolarQuote[]
  referenceQuote: DolarQuote | null
  arsPerUsd: number | null
  quoteChangesByCasa: Record<string, QuoteChange>
  isLoading: boolean
  error: string | null
}

function readStoredQuotesSnapshot(): StoredQuotesSnapshot | null {
  const rawValue = window.localStorage.getItem(LAST_QUOTES_STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as { quotes?: DolarQuote[] }
    if (!Array.isArray(parsed.quotes)) {
      return null
    }
    return { quotes: parsed.quotes }
  } catch {
    return null
  }
}

function buildQuoteChanges(
  currentQuotes: DolarQuote[],
  previousQuotes: DolarQuote[]
): Record<string, QuoteChange> {
  const previousByCasa = new Map(
    previousQuotes.map((quote) => [quote.casa, quote.compra] as const)
  )

  return Object.fromEntries(
    currentQuotes
      .map((quote) => {
        const previousCompra = previousByCasa.get(quote.casa)
        if (previousCompra === undefined) {
          return null
        }

        const amount = quote.compra - previousCompra
        const direction: QuoteChange["direction"] =
          amount > 0 ? "up" : amount < 0 ? "down" : "flat"

        return [quote.casa, { amount, direction }] as const
      })
      .filter(isDolarQuoteChangeEntry)
  )
}

function isDolarQuoteChangeEntry(
  value: readonly [string, QuoteChange] | null
): value is readonly [string, QuoteChange] {
  return value !== null
}

export function useArgentinaDollars(): UseArgentinaDollarsResult {
  const [quotes, setQuotes] = useState<DolarQuote[]>([])
  const [quoteChangesByCasa, setQuoteChangesByCasa] = useState<
    Record<string, QuoteChange>
  >({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function loadQuotes() {
      setIsLoading(true)
      try {
        const data = await getDolarQuotes()
        if (isCancelled) {
          return
        }

        const storedSnapshot = readStoredQuotesSnapshot()
        const quoteChanges = storedSnapshot
          ? buildQuoteChanges(data, storedSnapshot.quotes)
          : {}

        setQuotes(data)
        setQuoteChangesByCasa(quoteChanges)
        setError(null)
        window.localStorage.setItem(
          LAST_QUOTES_STORAGE_KEY,
          JSON.stringify({ quotes: data })
        )
      } catch (fetchError) {
        if (isCancelled) {
          return
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "No se pudieron obtener las cotizaciones del dólar en Argentina"
        )
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadQuotes()

    return () => {
      isCancelled = true
    }
  }, [])

  const referenceQuote = useMemo(() => {
    if (quotes.length === 0) {
      return null
    }

    return quotes.find((quote) => quote.casa === "oficial") ?? quotes[0]
  }, [quotes])

  const arsPerUsd = referenceQuote?.venta ?? null

  return {
    quotes,
    referenceQuote,
    arsPerUsd,
    quoteChangesByCasa,
    isLoading,
    error,
  }
}
