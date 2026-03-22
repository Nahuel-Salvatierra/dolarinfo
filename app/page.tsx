"use client"

import Link from "next/link"
import { Suspense, useMemo } from "react"
import { Calculator } from "lucide-react"
import { FEATURED_CURRENCIES } from "@/lib/frankfurter/constants"
import { Button } from "@/components/ui/button"
import { ArgentinaDollarPanel } from "@/components/argentina-dollar-panel"
import { BaseCurrencyPicker } from "@/components/base-currency-picker"
import { CurrencyRateCard } from "@/components/currency-rate-card"
import { CurrencyRatesTable } from "@/components/currency-rates-table"
import { useArgentinaDollars } from "@/hooks/use-argentina-dollars"
import { useCurrencyDashboard } from "@/hooks/use-currency-dashboard"

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="container mx-auto px-4 py-8 space-y-8">
          <section className="rounded-md border p-6 text-sm text-muted-foreground">
            Cargando panel...
          </section>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const { base, currencies, ratesData, isLoading, error } = useCurrencyDashboard()
  const {
    quotes,
    quoteChangesByCasa,
    referenceQuote,
    arsPerUsd,
    isLoading: isLoadingArgentina,
    error: argentinaError,
  } = useArgentinaDollars()

  const currenciesWithArs = useMemo(() => {
    if (currencies.ARS) {
      return currencies
    }

    return {
      ...currencies,
      ARS: "Peso argentino",
    }
  }, [currencies])

  const ratesWithArs = useMemo(() => {
    if (!ratesData) {
      return null
    }

    if (arsPerUsd === null) {
      return ratesData.rates
    }

    const arsPerBase =
      base === "USD"
        ? arsPerUsd
        : ratesData.rates.USD !== undefined
          ? ratesData.rates.USD * arsPerUsd
          : null

    if (arsPerBase === null) {
      return ratesData.rates
    }

    return {
      ...ratesData.rates,
      ARS: arsPerBase,
    }
  }, [arsPerUsd, base, ratesData])

  const featuredRates = FEATURED_CURRENCIES.filter(
    (code) => code !== base && (ratesData?.rates[code] ?? undefined) !== undefined
  )

  return (
    <main className="container mx-auto px-4 py-8 space-y-8">
      <header className="space-y-2 border-b border-border pb-6">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            dolarinfo.com.ar
          </h1>
          <Button
            asChild
            size="lg"
            className="h-10 shrink-0 border-0 bg-emerald-600 px-4 text-base font-semibold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg focus-visible:ring-emerald-500/40"
          >
            <Link href="/sueldo" className="gap-2 text-white">
              <Calculator className="size-5" aria-hidden />
              Calcular sueldo en dólares
            </Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Dólar blue, oficial y MEP en vivo para Argentina.
        </p>
      </header>

      <ArgentinaDollarPanel
        quotes={quotes}
        quoteChangesByCasa={quoteChangesByCasa}
        referenceQuote={referenceQuote}
        isLoading={isLoadingArgentina}
        error={argentinaError}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {ratesData
            ? `Cotizaciones al ${ratesData.date} · Actualización diaria`
            : "Cargando últimas cotizaciones..."}
        </p>
        <BaseCurrencyPicker currencies={currencies} currentBase={base} />
      </div>

      {error && (
        <section className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm">
          {error}
        </section>
      )}

      {isLoading || !ratesData ? (
        <section className="rounded-md border p-6 text-sm text-muted-foreground">
          Cargando panel...
        </section>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredRates.map((code) => (
              <CurrencyRateCard
                key={code}
                code={code}
                name={currencies[code] ?? code}
                rate={ratesData.rates[code]}
                base={base}
              />
            ))}
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4">Todas las cotizaciones</h2>
            <CurrencyRatesTable
              rates={ratesWithArs ?? ratesData.rates}
              currencies={currenciesWithArs}
              base={base}
            />
          </section>
        </>
      )}
    </main>
  )
}
