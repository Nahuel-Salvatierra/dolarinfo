import { prisma } from "../lib/db/prisma"
import { extractCryptoDailyRates } from "../lib/ingest/historical-fetcher"
import type { DailyRateInput, JsonData } from "../lib/ingest/types"
import { PrismaRateRepository } from "../lib/repositories/prisma-rate-repository"

const HISTORICAL_PAGE_URL = "https://www.dolarito.ar/cotizaciones-historicas/cripto"
const HISTORY_API_URL = "https://api.dolarito.ar/api/frontend/history"

function logInfo(message: string): void {
  console.info(`[ingest-backfill-crypto] ${new Date().toISOString()} ${message}`)
}

function logError(message: string, error: unknown): void {
  const detail =
    error instanceof Error
      ? error.stack ?? `${error.name}: ${error.message}`
      : String(error)
  console.error(`[ingest-backfill-crypto] ${new Date().toISOString()} ${message}\n${detail}`)
}

function normalizeDate(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function parseIsoDate(value: string): Date {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${value}`)
  }
  return normalizeDate(date)
}

function parseDateArgs(): { from: Date; to: Date } {
  const fromArg = process.argv.find((argument) => argument.startsWith("--from="))
  const toArg = process.argv.find((argument) => argument.startsWith("--to="))
  const today = normalizeDate(new Date())
  const defaultFrom = new Date(Date.UTC(today.getUTCFullYear() - 10, today.getUTCMonth(), today.getUTCDate()))
  const from = fromArg ? parseIsoDate(fromArg.replace("--from=", "")) : defaultFrom
  const to = toArg ? parseIsoDate(toArg.replace("--to=", "")) : today

  if (from.getTime() > to.getTime()) {
    throw new Error("Invalid date range: --from must be before --to")
  }

  return { from, to }
}

async function fetchText(url: string, headers: Record<string, string> = {}): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; currency-dashboard-ingest/1.0)",
      ...headers,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Request failed (${response.status}) for ${url}. Body preview: ${body.slice(0, 240)}`)
  }

  return response.text()
}

function extractChunkUrls(html: string): string[] {
  const regex = /<script[^>]+src="([^"]+_next\/static\/chunks\/[^"]+)"/g
  const urls = new Set<string>()
  let match = regex.exec(html)

  while (match !== null) {
    const rawUrl = match[1]
    const absoluteUrl = rawUrl.startsWith("http") ? rawUrl : new URL(rawUrl, HISTORICAL_PAGE_URL).toString()
    urls.add(absoluteUrl)
    match = regex.exec(html)
  }

  return Array.from(urls)
}

function extractAuthClientKey(scriptContent: string): string | null {
  const match = scriptContent.match(/"auth-client":"([^"]+)"/)
  return match ? match[1] : null
}

async function resolveAuthClientKey(): Promise<string> {
  const html = await fetchText(HISTORICAL_PAGE_URL)
  const chunkUrls = extractChunkUrls(html)

  for (const chunkUrl of chunkUrls) {
    const scriptContent = await fetchText(chunkUrl)
    const authClientKey = extractAuthClientKey(scriptContent)
    if (authClientKey !== null) {
      return authClientKey
    }
  }

  throw new Error("Unable to resolve auth-client key from source page")
}

async function fetchHistoricalPayload(authClientKey: string): Promise<JsonData> {
  const response = await fetch(HISTORY_API_URL, {
    headers: {
      accept: "application/json, text/plain, */*",
      origin: "https://www.dolarito.ar",
      referer: HISTORICAL_PAGE_URL,
      "auth-client": authClientKey,
      "user-agent": "Mozilla/5.0 (compatible; currency-dashboard-ingest/1.0)",
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Historical endpoint request failed (${response.status}). Body preview: ${body.slice(0, 240)}`)
  }

  return response.json() as Promise<JsonData>
}

function buildInputs(payload: JsonData, from: Date, to: Date): DailyRateInput[] {
  const extracted = extractCryptoDailyRates(payload)

  return extracted
    .filter((entry) => entry.date.getTime() >= from.getTime() && entry.date.getTime() <= to.getTime())
    .map((entry) => ({
      providerKey: "source_web",
      providerName: "Source Web",
      rateTypeKey: "crypto",
      rateTypeDisplayName: "Dolar Cripto",
      date: entry.date,
      buy: entry.buy,
      sell: entry.sell,
      avg: entry.avg,
      sourceUrl: HISTORICAL_PAGE_URL,
      rawPayload: entry.rawPayload,
    }))
}

async function run(): Promise<void> {
  const { from, to } = parseDateArgs()
  logInfo(`starting backfill from=${from.toISOString().slice(0, 10)} to=${to.toISOString().slice(0, 10)}`)
  const authClientKey = await resolveAuthClientKey()
  logInfo("resolved auth-client token")
  const payload = await fetchHistoricalPayload(authClientKey)
  const repository = new PrismaRateRepository(prisma)
  const inputs = buildInputs(payload, from, to)
  logInfo(`extracted ${inputs.length} crypto rows`)
  if (inputs.length === 0) {
    throw new Error("No crypto rows extracted for provided range")
  }
  await repository.upsertManyDailyRates(inputs)
  logInfo(`upsert completed (${inputs.length} rows)`)
}

run()
  .catch((error: unknown) => {
    process.exitCode = 1
    logError("backfill failed", error)
  })
  .finally(async () => {
    await prisma.$disconnect()
    logInfo("database connection closed")
  })
