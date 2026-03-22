"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useSalaryCalculator } from "@/hooks/use-salary-calculator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function formatUsd(value: number | null): string {
  if (value === null) {
    return "—"
  }
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatArs(value: number | null): string {
  if (value === null) {
    return "—"
  }
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

interface ResultRowProps {
  label: string
  value: string
}

function ResultRow({ label, value }: ResultRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium tabular-nums">{value}</span>
    </div>
  )
}

export function SalaryCalculator() {
  const {
    amountArsInput,
    setAmountArsInput,
    amountUsdInput,
    setAmountUsdInput,
    arsToUsd,
    usdToArs,
    isLoadingQuotes,
    quotesError,
  } = useSalaryCalculator()

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-primary/35 bg-primary/8 px-3 py-2 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-primary/15 hover:border-primary/55 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          Volver al inicio
        </Link>
        <h1 className="text-2xl font-bold">Calculadora de sueldo en dólares</h1>
        <p className="text-sm text-muted-foreground">
          Ingresá tu sueldo en pesos o en dólares y compará el equivalente según
          dólar blue, oficial, MEP y cripto (cotización de venta).
        </p>
      </div>

      {quotesError && (
        <section className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm">
          {quotesError}
        </section>
      )}

      {isLoadingQuotes && !quotesError && (
        <p className="text-sm text-muted-foreground">
          Cargando cotizaciones del dólar...
        </p>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pesos argentinos → dólares</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Tu sueldo en pesos</span>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={amountArsInput}
                onChange={(e) => setAmountArsInput(e.target.value)}
                placeholder="Ej: 500000"
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </label>
            <div className="rounded-md border bg-muted/30 px-3">
              <ResultRow label="Dólar Blue" value={formatUsd(arsToUsd.blue)} />
              <ResultRow
                label="Dólar Oficial"
                value={formatUsd(arsToUsd.oficial)}
              />
              <ResultRow label="Dólar MEP" value={formatUsd(arsToUsd.mep)} />
              <ResultRow
                label="Dólar Cripto"
                value={formatUsd(arsToUsd.cripto)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dólares → pesos argentinos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Tu sueldo en dólares</span>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={amountUsdInput}
                onChange={(e) => setAmountUsdInput(e.target.value)}
                placeholder="Ej: 1200"
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </label>
            <div className="rounded-md border bg-muted/30 px-3">
              <ResultRow label="Dólar Blue" value={formatArs(usdToArs.blue)} />
              <ResultRow
                label="Dólar Oficial"
                value={formatArs(usdToArs.oficial)}
              />
              <ResultRow label="Dólar MEP" value={formatArs(usdToArs.mep)} />
              <ResultRow
                label="Dólar Cripto"
                value={formatArs(usdToArs.cripto)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Los montos se guardan en tu navegador para la próxima visita. También
        registramos un registro por día para posibles funciones futuras. Datos
        de cotización según DolarAPI.
      </p>
    </main>
  )
}
