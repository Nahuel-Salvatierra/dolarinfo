"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useArgentinaDollars } from "@/hooks/use-argentina-dollars"
import type { DolarQuote } from "@/lib/dolarapi/types"

const SALARY_INPUTS_KEY = "salary-inputs"
const SALARY_HISTORY_KEY = "salary-history"

interface SalaryInputsStored {
  amountArs: number | null
  amountUsd: number | null
}

interface SalaryDaySnapshot {
  amountArs: number | null
  amountUsd: number | null
}

type SalaryHistoryStored = Record<string, SalaryDaySnapshot>

export interface SalaryQuoteResults {
  blue: number | null
  oficial: number | null
  mep: number | null
  cripto: number | null
}

export interface UseSalaryCalculatorResult {
  amountArsInput: string
  setAmountArsInput: (value: string) => void
  amountUsdInput: string
  setAmountUsdInput: (value: string) => void
  arsToUsd: SalaryQuoteResults
  usdToArs: SalaryQuoteResults
  isLoadingQuotes: boolean
  quotesError: string | null
}

function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function readSalaryInputs(): SalaryInputsStored {
  const raw = window.localStorage.getItem(SALARY_INPUTS_KEY)
  if (!raw) {
    return { amountArs: null, amountUsd: null }
  }
  try {
    const parsed = JSON.parse(raw) as SalaryInputsStored
    return {
      amountArs:
        typeof parsed.amountArs === "number" && Number.isFinite(parsed.amountArs)
          ? parsed.amountArs
          : null,
      amountUsd:
        typeof parsed.amountUsd === "number" && Number.isFinite(parsed.amountUsd)
          ? parsed.amountUsd
          : null,
    }
  } catch {
    return { amountArs: null, amountUsd: null }
  }
}

function readSalaryHistory(): SalaryHistoryStored {
  const raw = window.localStorage.getItem(SALARY_HISTORY_KEY)
  if (!raw) {
    return {}
  }
  try {
    const parsed = JSON.parse(raw) as SalaryHistoryStored
    return typeof parsed === "object" && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

function persistSalaryData(
  amountArs: number | null,
  amountUsd: number | null
): void {
  const payload: SalaryInputsStored = { amountArs, amountUsd }
  window.localStorage.setItem(SALARY_INPUTS_KEY, JSON.stringify(payload))

  const today = formatLocalDateKey(new Date())
  const history = readSalaryHistory()
  history[today] = { amountArs, amountUsd }
  window.localStorage.setItem(SALARY_HISTORY_KEY, JSON.stringify(history))
}

function parseInputToNumber(value: string): number | null {
  const trimmed = value.trim().replace(/\s/g, "").replace(",", ".")
  if (trimmed === "") {
    return null
  }
  const n = Number(trimmed)
  return Number.isFinite(n) && n >= 0 ? n : null
}

function numberToInputString(n: number | null): string {
  if (n === null) {
    return ""
  }
  return String(n)
}

function pickKeyQuotes(quotes: DolarQuote[]): {
  blue: DolarQuote | null
  oficial: DolarQuote | null
  mep: DolarQuote | null
  cripto: DolarQuote | null
} {
  const blue = quotes.find((q) => q.casa === "blue") ?? null
  const oficial = quotes.find((q) => q.casa === "oficial") ?? null
  const bolsa = quotes.find((q) => q.casa === "bolsa") ?? null
  const hasExplicitMep = quotes.some((q) => q.casa === "mep")
  const mep = quotes.find((q) => q.casa === "mep") ?? bolsa
  const cripto = quotes.find((q) => q.casa === "cripto") ?? null

  return {
    blue,
    oficial,
    mep: hasExplicitMep ? mep : bolsa ?? mep,
    cripto,
  }
}

function buildArsToUsd(
  amountArs: number | null,
  blue: DolarQuote | null,
  oficial: DolarQuote | null,
  mep: DolarQuote | null,
  cripto: DolarQuote | null
): SalaryQuoteResults {
  const toUsd = (ars: number, venta: number) =>
    venta > 0 ? ars / venta : null

  return {
    blue:
      amountArs !== null && blue && blue.venta > 0
        ? toUsd(amountArs, blue.venta)
        : null,
    oficial:
      amountArs !== null && oficial && oficial.venta > 0
        ? toUsd(amountArs, oficial.venta)
        : null,
    mep:
      amountArs !== null && mep && mep.venta > 0
        ? toUsd(amountArs, mep.venta)
        : null,
    cripto:
      amountArs !== null && cripto && cripto.venta > 0
        ? toUsd(amountArs, cripto.venta)
        : null,
  }
}

function buildUsdToArs(
  amountUsd: number | null,
  blue: DolarQuote | null,
  oficial: DolarQuote | null,
  mep: DolarQuote | null,
  cripto: DolarQuote | null
): SalaryQuoteResults {
  const toArs = (usd: number, venta: number) =>
    venta > 0 ? usd * venta : null

  return {
    blue:
      amountUsd !== null && blue && blue.venta > 0
        ? toArs(amountUsd, blue.venta)
        : null,
    oficial:
      amountUsd !== null && oficial && oficial.venta > 0
        ? toArs(amountUsd, oficial.venta)
        : null,
    mep:
      amountUsd !== null && mep && mep.venta > 0
        ? toArs(amountUsd, mep.venta)
        : null,
    cripto:
      amountUsd !== null && cripto && cripto.venta > 0
        ? toArs(amountUsd, cripto.venta)
        : null,
  }
}

export function useSalaryCalculator(): UseSalaryCalculatorResult {
  const { quotes, isLoading, error } = useArgentinaDollars()
  const [amountArsInput, setAmountArsInputState] = useState("")
  const [amountUsdInput, setAmountUsdInputState] = useState("")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = readSalaryInputs()
    setAmountArsInputState(numberToInputString(stored.amountArs))
    setAmountUsdInputState(numberToInputString(stored.amountUsd))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) {
      return
    }
    const ars = parseInputToNumber(amountArsInput)
    const usd = parseInputToNumber(amountUsdInput)
    persistSalaryData(ars, usd)
  }, [hydrated, amountArsInput, amountUsdInput])

  const setAmountArsInput = useCallback((value: string) => {
    setAmountArsInputState(value)
  }, [])

  const setAmountUsdInput = useCallback((value: string) => {
    setAmountUsdInputState(value)
  }, [])

  const { blue, oficial, mep, cripto } = useMemo(
    () => pickKeyQuotes(quotes),
    [quotes]
  )

  const amountArs = useMemo(
    () => parseInputToNumber(amountArsInput),
    [amountArsInput]
  )
  const amountUsd = useMemo(
    () => parseInputToNumber(amountUsdInput),
    [amountUsdInput]
  )

  const arsToUsd = useMemo(
    () => buildArsToUsd(amountArs, blue, oficial, mep, cripto),
    [amountArs, blue, oficial, mep, cripto]
  )

  const usdToArs = useMemo(
    () => buildUsdToArs(amountUsd, blue, oficial, mep, cripto),
    [amountUsd, blue, oficial, mep, cripto]
  )

  return {
    amountArsInput,
    setAmountArsInput,
    amountUsdInput,
    setAmountUsdInput,
    arsToUsd,
    usdToArs,
    isLoadingQuotes: isLoading,
    quotesError: error,
  }
}
