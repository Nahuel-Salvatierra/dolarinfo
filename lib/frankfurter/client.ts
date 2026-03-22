import {
  ENDPOINTS,
  FRANKFURTER_BASE_URL,
  REVALIDATE_SECONDS,
} from "./constants"
import type { CurrenciesResponse, LatestRatesResponse } from "./types"

async function frankfurterFetch<T>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${FRANKFURTER_BASE_URL}${path}`)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }

  const response = await fetch(url.toString(), {
    next: { revalidate: REVALIDATE_SECONDS },
  })

  if (!response.ok) {
    throw new Error(
      `Error de la API de Frankfurter: ${response.status} ${response.statusText}`
    )
  }

  return response.json() as Promise<T>
}

export async function getLatestRates(
  base: string
): Promise<LatestRatesResponse> {
  return frankfurterFetch<LatestRatesResponse>(ENDPOINTS.LATEST, { base })
}

export async function getCurrencies(): Promise<CurrenciesResponse> {
  return frankfurterFetch<CurrenciesResponse>(ENDPOINTS.CURRENCIES)
}
