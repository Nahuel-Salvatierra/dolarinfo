import type { DolarQuote } from "./types"

const DOLAR_API_URL = "https://dolarapi.com/v1/dolares"

export async function getDolarQuotes(): Promise<DolarQuote[]> {
  const response = await fetch(DOLAR_API_URL)

  if (!response.ok) {
    throw new Error(`Error de DolarAPI: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<DolarQuote[]>
}
