import type { HistoricalRatePoint, JsonData } from "@/lib/ingest/types"

const DATE_KEYS = ["fecha", "date", "x"]
const BUY_KEYS = ["compra", "buy", "bid", "c"]
const SELL_KEYS = ["venta", "sell", "ask", "v", "y"]

type JsonObject = { [key: string]: JsonData }

function isJsonObject(value: JsonData): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeDate(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function parseNumber(value: JsonData): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string") {
    const normalized = Number(value.replace(",", "."))
    if (Number.isFinite(normalized)) {
      return normalized
    }
  }
  return null
}

function parseDate(value: JsonData): Date | null {
  if (typeof value === "string") {
    const timestamp = Date.parse(value)
    if (Number.isFinite(timestamp)) {
      return new Date(timestamp)
    }
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const milliseconds = value > 10_000_000_000 ? value : value * 1000
    return new Date(milliseconds)
  }
  return null
}

function parseDateFromPath(path: string[]): Date | null {
  for (const segment of path) {
    const match = segment.match(/^(\d{2})-(\d{2})-(\d{2})$/)
    if (!match) {
      continue
    }
    const day = Number(match[1])
    const month = Number(match[2])
    const year = 2000 + Number(match[3])
    const date = new Date(Date.UTC(year, month - 1, day))
    if (!Number.isNaN(date.getTime())) {
      return date
    }
  }
  return null
}

function getObjectValueByKeys(object: JsonObject, keys: string[]): JsonData | null {
  for (const key of keys) {
    if (object[key] !== undefined) {
      return object[key]
    }
  }
  return null
}

function hasCryptoKey(path: string[]): boolean {
  return path.some((segment) => segment.includes("cripto") || segment.includes("crypto"))
}

function hasBuyHint(path: string[]): boolean {
  return path.some((segment) => segment.includes("compra") || segment.includes("buy"))
}

function hasSellHint(path: string[]): boolean {
  return path.some((segment) => segment.includes("venta") || segment.includes("sell"))
}

function mergePoint(
  pointsByDate: Map<string, HistoricalRatePoint>,
  date: Date,
  buy: number | null,
  sell: number | null,
  rawPayload: JsonData
): void {
  const normalizedDate = normalizeDate(date)
  const key = normalizedDate.toISOString().slice(0, 10)
  const existing = pointsByDate.get(key)
  const mergedBuy = buy ?? existing?.buy ?? null
  const mergedSell = sell ?? existing?.sell ?? null
  const avg =
    mergedBuy !== null && mergedSell !== null ? (mergedBuy + mergedSell) / 2 : mergedSell ?? mergedBuy

  pointsByDate.set(key, {
    date: normalizedDate,
    buy: mergedBuy,
    sell: mergedSell,
    avg,
    rawPayload,
  })
}

export function extractCryptoDailyRates(payload: JsonData): HistoricalRatePoint[] {
  const pointsByDate = new Map<string, HistoricalRatePoint>()

  const walk = (node: JsonData, path: string[]): void => {
    if (!hasCryptoKey(path) && path.length > 0) {
      if (isJsonObject(node)) {
        for (const [key, value] of Object.entries(node)) {
          walk(value, [...path, key.toLowerCase()])
        }
      } else if (Array.isArray(node)) {
        for (const item of node) {
          walk(item, path)
        }
      }
      return
    }

    if (isJsonObject(node)) {
      const dateValue = getObjectValueByKeys(node, DATE_KEYS)
      const parsedDate = dateValue === null ? parseDateFromPath(path) : parseDate(dateValue)
      if (parsedDate !== null) {
        const buyValue = getObjectValueByKeys(node, BUY_KEYS)
        const sellValue = getObjectValueByKeys(node, SELL_KEYS)
        const buy = buyValue === null ? null : parseNumber(buyValue)
        const sell = sellValue === null ? null : parseNumber(sellValue)
        if (buy !== null || sell !== null) {
          mergePoint(pointsByDate, parsedDate, buy, sell, node)
        }
      }

      for (const [key, value] of Object.entries(node)) {
        walk(value, [...path, key.toLowerCase()])
      }
      return
    }

    if (Array.isArray(node)) {
      if (node.length >= 2) {
        const parsedDate = parseDate(node[0])
        const parsedValue = parseNumber(node[1])
        if (parsedDate !== null && parsedValue !== null) {
          const buy = hasBuyHint(path) ? parsedValue : null
          const sell = hasSellHint(path) ? parsedValue : hasBuyHint(path) ? null : parsedValue
          mergePoint(pointsByDate, parsedDate, buy, sell, node)
        }
      }

      for (const item of node) {
        walk(item, path)
      }
    }
  }

  walk(payload, [])

  return Array.from(pointsByDate.values()).sort((a, b) => a.date.getTime() - b.date.getTime())
}
