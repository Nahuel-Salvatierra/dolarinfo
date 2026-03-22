"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { getCurrencies, getLatestRates } from "@/lib/frankfurter/client"
import { DEFAULT_BASE_CURRENCY } from "@/lib/frankfurter/constants"
import {
  detectCountryFromNavigatorLanguages,
  getCurrencyForCountry,
} from "@/lib/frankfurter/locale"
import type {
  CurrenciesResponse,
  LatestRatesResponse,
} from "@/lib/frankfurter/types"

interface UseCurrencyDashboardResult {
  base: string
  currencies: CurrenciesResponse
  ratesData: LatestRatesResponse | null
  isLoading: boolean
  error: string | null
}

function localizeCurrencyNames(currencies: CurrenciesResponse): CurrenciesResponse {
  try {
    const currencyDisplayNames = new Intl.DisplayNames(["es"], {
      type: "currency",
    })

    return Object.fromEntries(
      Object.entries(currencies).map(([code, fallbackName]) => [
        code,
        currencyDisplayNames.of(code) ?? fallbackName,
      ])
    )
  } catch {
    return currencies
  }
}

export function useCurrencyDashboard(): UseCurrencyDashboardResult {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [currencies, setCurrencies] = useState<CurrenciesResponse>({})
  const [ratesData, setRatesData] = useState<LatestRatesResponse | null>(null)
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true)
  const [isLoadingRates, setIsLoadingRates] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasTriedAutoDetect = useRef(false)

  const baseParam = searchParams.get("base")?.toUpperCase()
  const hasBaseParam = Boolean(baseParam)

  useEffect(() => {
    let isCancelled = false

    async function loadCurrencies() {
      setIsLoadingCurrencies(true)
      try {
        const data = await getCurrencies()
        if (isCancelled) {
          return
        }
        setCurrencies(localizeCurrencyNames(data))
        setError(null)
      } catch (fetchError) {
        if (isCancelled) {
          return
        }
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "No se pudieron obtener las monedas"
        )
      } finally {
        if (!isCancelled) {
          setIsLoadingCurrencies(false)
        }
      }
    }

    loadCurrencies()
    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    if (hasBaseParam || hasTriedAutoDetect.current) {
      return
    }

    if (Object.keys(currencies).length === 0) {
      return
    }

    hasTriedAutoDetect.current = true

    const localeCandidates = navigator.languages.length
      ? navigator.languages
      : [navigator.language]
    const country = detectCountryFromNavigatorLanguages(localeCandidates)
    if (!country) {
      return
    }

    const detectedBase = getCurrencyForCountry(country)
    if (!detectedBase || !currencies[detectedBase]) {
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    params.set("base", detectedBase)
    router.replace(`${pathname}?${params.toString()}`)
  }, [currencies, hasBaseParam, pathname, router, searchParams])

  const base = useMemo(() => {
    if (!baseParam) {
      return DEFAULT_BASE_CURRENCY
    }

    if (Object.keys(currencies).length === 0) {
      return baseParam
    }

    return currencies[baseParam] ? baseParam : DEFAULT_BASE_CURRENCY
  }, [baseParam, currencies])

  useEffect(() => {
    let isCancelled = false

    async function loadRates() {
      setIsLoadingRates(true)
      try {
        const data = await getLatestRates(base)
        if (isCancelled) {
          return
        }
        setRatesData(data)
        setError(null)
      } catch (fetchError) {
        if (isCancelled) {
          return
        }
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "No se pudieron obtener las cotizaciones"
        )
      } finally {
        if (!isCancelled) {
          setIsLoadingRates(false)
        }
      }
    }

    loadRates()
    return () => {
      isCancelled = true
    }
  }, [base])

  return {
    base,
    currencies,
    ratesData,
    isLoading: isLoadingCurrencies || isLoadingRates,
    error,
  }
}
