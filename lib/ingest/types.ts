import type { Prisma } from "@prisma/client"

export type ProviderKey = "source_web" | "dolarapi"

export type RateTypeKey =
  | "crypto"
  | "oficial"
  | "blue"
  | "mep"
  | "ccl"
  | "mayorista"
  | "tarjeta"
  | "bancos"
  | "qatar"
  | "ahorro"

export type JsonData = Prisma.InputJsonValue

export interface DailyRateInput {
  providerKey: ProviderKey
  providerName: string
  rateTypeKey: RateTypeKey
  rateTypeDisplayName: string
  date: Date
  buy: number | null
  sell: number | null
  avg: number | null
  sourceUrl: string | null
  rawPayload: JsonData | null
}

export interface HistoricalRatePoint {
  date: Date
  buy: number | null
  sell: number | null
  avg: number | null
  rawPayload: JsonData | null
}
