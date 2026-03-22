export interface LatestRatesResponse {
  amount: number
  base: string
  date: string
  rates: Record<string, number>
}

export interface CurrenciesResponse {
  [code: string]: string
}

export interface FrankfurterError {
  message: string
}
