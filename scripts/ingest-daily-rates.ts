import type { DolarQuote } from "../lib/dolarapi/types"
import { prisma } from "../lib/db/prisma"
import { fetchProviderJson } from "../lib/ingest/provider-client"
import {
  finishRun,
  startScheduledRun,
  type IngestionRunTrigger,
} from "../lib/ingest/ingestion-run-service"
import type { DailyRateInput, RateTypeKey } from "../lib/ingest/types"
import { PrismaRateRepository } from "../lib/repositories/prisma-rate-repository"

const DOLAR_API_URL = "https://dolarapi.com/v1/dolares"
const SLOT_MINUTES = 10
const JOB_KEY = "dolarapi-rates"

function logInfo(message: string): void {
  console.info(`[ingest-daily-rates] ${new Date().toISOString()} ${message}`)
}

function logError(message: string, error: Error | string): void {
  const detail =
    typeof error === "string"
      ? error
      : error.stack ?? `${error.name}: ${error.message}`
  console.error(`[ingest-daily-rates] ${new Date().toISOString()} ${message}\n${detail}`)
}

const RATE_TYPE_DISPLAY_BY_KEY: Record<RateTypeKey, string> = {
  crypto: "Dolar Cripto",
  oficial: "Dolar Oficial",
  blue: "Dolar Blue",
  mep: "Dolar MEP",
  ccl: "Dolar CCL",
  mayorista: "Dolar Mayorista",
  tarjeta: "Dolar Tarjeta",
  bancos: "Dolar Bancos",
  qatar: "Dolar Qatar",
  ahorro: "Dolar Ahorro",
}

function normalizeDate(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function normalizeToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

function mapRateTypeKey(quote: DolarQuote): RateTypeKey | null {
  const normalizedCasa = normalizeToken(quote.casa)
  const normalizedNombre = normalizeToken(quote.nombre)
  const full = `${normalizedCasa}${normalizedNombre}`

  if (full.includes("oficial")) {
    return "oficial"
  }
  if (full.includes("blue")) {
    return "blue"
  }
  if (full.includes("bolsa") || full.includes("mep")) {
    return "mep"
  }
  if (full.includes("contadoconliqui") || full.includes("ccl")) {
    return "ccl"
  }
  if (full.includes("mayorista")) {
    return "mayorista"
  }
  if (full.includes("tarjeta")) {
    return "tarjeta"
  }
  if (full.includes("cripto")) {
    return "crypto"
  }
  if (full.includes("banco")) {
    return "bancos"
  }
  if (full.includes("qatar")) {
    return "qatar"
  }
  if (full.includes("ahorro") || full.includes("solidario")) {
    return "ahorro"
  }
  return null
}

function buildInput(quote: DolarQuote): DailyRateInput | null {
  const rateTypeKey = mapRateTypeKey(quote)
  if (rateTypeKey === null) {
    return null
  }

  const dateValue = new Date(quote.fechaActualizacion)
  const date = Number.isNaN(dateValue.getTime()) ? normalizeDate(new Date()) : normalizeDate(dateValue)
  const buy = Number.isFinite(quote.compra) ? quote.compra : null
  const sell = Number.isFinite(quote.venta) ? quote.venta : null
  const avg = buy !== null && sell !== null ? (buy + sell) / 2 : sell ?? buy

  return {
    providerKey: "dolarapi",
    providerName: "DolarAPI",
    rateTypeKey,
    rateTypeDisplayName: RATE_TYPE_DISPLAY_BY_KEY[rateTypeKey],
    date,
    buy,
    sell,
    avg,
    sourceUrl: DOLAR_API_URL,
    rawPayload: {
      moneda: quote.moneda,
      casa: quote.casa,
      nombre: quote.nombre,
      compra: quote.compra,
      venta: quote.venta,
      fechaActualizacion: quote.fechaActualizacion,
      variacion: quote.variacion ?? null,
    },
  }
}

function parseTrigger(): IngestionRunTrigger {
  const triggerArg = process.argv.find((argument) =>
    argument.startsWith("--trigger=")
  )
  const value = triggerArg ? triggerArg.replace("--trigger=", "") : "scheduler"
  if (value === "startup" || value === "manual" || value === "scheduler") {
    return value
  }
  return "scheduler"
}

function getInstanceId(): string {
  return process.env.HOSTNAME ?? `pid-${process.pid}`
}

async function fetchDolarApiQuotes(runId: string): Promise<DolarQuote[]> {
  return fetchProviderJson<DolarQuote[]>({
    prisma,
    runId,
    providerKey: "dolarapi",
    endpoint: DOLAR_API_URL,
    headers: {
      accept: "application/json",
      "user-agent": "Mozilla/5.0 (compatible; currency-dashboard-ingest/1.0)",
    },
    timeoutMs: 15_000,
    retries: 2,
    retryBaseDelayMs: 600,
    requestMeta: {
      jobKey: JOB_KEY,
      slotMinutes: SLOT_MINUTES,
      script: "ingest-daily-rates",
    },
  })
}

async function run(): Promise<void> {
  const trigger = parseTrigger()
  logInfo(`starting scheduled ingestion (trigger=${trigger})`)
  const runStart = await startScheduledRun(prisma, {
    jobKey: JOB_KEY,
    providerKey: "dolarapi",
    slotMinutes: SLOT_MINUTES,
    trigger,
    instanceId: getInstanceId(),
  })

  if (!runStart.acquired || runStart.runId === null) {
    logInfo(
      `skipped ingestion for slot ${runStart.runSlotStart.toISOString()} because a run already exists`
    )
    return
  }

  const runId = runStart.runId

  try {
    const quotes = await fetchDolarApiQuotes(runId)
    logInfo(`received ${quotes.length} quotes from source`)
    const inputs = quotes
      .map(buildInput)
      .filter((input): input is DailyRateInput => input !== null)
    if (inputs.length === 0) {
      throw new Error("No supported rate types found in source payload")
    }
    const skippedCount = quotes.length - inputs.length
    if (skippedCount > 0) {
      logInfo(`skipped ${skippedCount} quotes because no type mapping was found`)
    }
    const repository = new PrismaRateRepository(prisma)
    await repository.upsertManyDailyRates(inputs)
    logInfo(`upsert completed (${inputs.length} rows)`)
    await finishRun(prisma, runId, "completed", null)
  } catch (caughtError) {
    const error =
      caughtError instanceof Error
        ? caughtError
        : new Error(String(caughtError))
    await finishRun(prisma, runId, "failed", error.message)
    throw error
  }
}

run()
  .catch((caughtError) => {
    const error =
      caughtError instanceof Error
        ? caughtError
        : new Error(String(caughtError))
    process.exitCode = 1
    logError("daily ingestion failed", error)
  })
  .finally(async () => {
    await prisma.$disconnect()
    logInfo("database connection closed")
  })
