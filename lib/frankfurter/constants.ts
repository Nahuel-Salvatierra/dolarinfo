export const FRANKFURTER_BASE_URL = "https://api.frankfurter.dev/v1" as const

export const ENDPOINTS = {
  LATEST: "/latest",
  CURRENCIES: "/currencies",
} as const

export const DEFAULT_BASE_CURRENCY = "USD" as const

export const FEATURED_CURRENCIES = ["EUR", "GBP", "JPY", "CHF"] as const

export const REVALIDATE_SECONDS = 3600
