import type { PrismaClient } from "@prisma/client"
import { createProviderCallLog } from "@/lib/ingest/provider-call-logger"
import type { JsonData } from "@/lib/ingest/types"

const DEFAULT_TIMEOUT_MS = 15_000
const DEFAULT_RETRIES = 2
const DEFAULT_RETRY_BASE_DELAY_MS = 500

interface ProviderRequestOptions {
  prisma: PrismaClient
  runId: string
  providerKey: string
  endpoint: string
  method?: string
  headers?: Record<string, string>
  requestMeta?: JsonData | null
  timeoutMs?: number
  retries?: number
  retryBaseDelayMs?: number
}

class ProviderHttpError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message)
    this.name = "ProviderHttpError"
  }
}

class ProviderTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Provider request timed out after ${timeoutMs}ms`)
    this.name = "ProviderTimeoutError"
  }
}

function bufferLengthFromText(text: string): number {
  return Buffer.byteLength(text, "utf8")
}

function toErrorInfo(error: Error | string): { type: string; message: string } {
  if (typeof error === "string") {
    return { type: "Error", message: error }
  }
  return { type: error.name || "Error", message: error.message || "Unknown error" }
}

function isAbortLikeError(error: Error): boolean {
  return error.name === "AbortError"
}

function isRetryable(statusCode: number | null, error: Error): boolean {
  if (statusCode !== null && (statusCode === 429 || statusCode >= 500)) {
    return true
  }
  if (error instanceof ProviderTimeoutError) {
    return true
  }
  if (isAbortLikeError(error)) {
    return true
  }
  return !(error instanceof ProviderHttpError)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function fetchProviderJson<T>(
  options: ProviderRequestOptions
): Promise<T> {
  const method = options.method ?? "GET"
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const retries = options.retries ?? DEFAULT_RETRIES
  const retryBaseDelayMs = options.retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS

  let attempt = 0
  let lastError: Error | null = null

  while (attempt <= retries) {
    const requestAt = new Date()
    const responseAtFallback = new Date()
    let statusCode: number | null = null
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
      const response = await fetch(options.endpoint, {
        method,
        headers: options.headers,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const responseAt = new Date()
      statusCode = response.status
      const bodyText = await response.text()
      const responseSizeBytes = bufferLengthFromText(bodyText)

      if (!response.ok) {
        const preview = bodyText.slice(0, 240)
        throw new ProviderHttpError(
          `Provider request failed (${response.status}). Body preview: ${preview}`,
          response.status
        )
      }

      const parsed = JSON.parse(bodyText) as T
      await createProviderCallLog(options.prisma, {
        runId: options.runId,
        providerKey: options.providerKey,
        endpoint: options.endpoint,
        method,
        requestAt,
        responseAt,
        statusCode,
        durationMs: responseAt.getTime() - requestAt.getTime(),
        success: true,
        errorType: null,
        errorMessage: null,
        responseSizeBytes,
        requestMeta: options.requestMeta ?? null,
        responseMeta: null,
      })
      return parsed
    } catch (caughtError) {
      const responseAt = new Date()
      const error =
        caughtError instanceof Error
          ? caughtError.name === "AbortError"
            ? new ProviderTimeoutError(timeoutMs)
            : caughtError
          : new Error(String(caughtError))
      lastError = error
      const errorInfo = toErrorInfo(error)

      await createProviderCallLog(options.prisma, {
        runId: options.runId,
        providerKey: options.providerKey,
        endpoint: options.endpoint,
        method,
        requestAt,
        responseAt,
        statusCode,
        durationMs: responseAt.getTime() - requestAt.getTime(),
        success: false,
        errorType: errorInfo.type,
        errorMessage: errorInfo.message,
        responseSizeBytes: null,
        requestMeta: options.requestMeta ?? null,
        responseMeta: null,
      })

      if (attempt >= retries || !isRetryable(statusCode, error)) {
        throw error
      }

      const backoffMs = retryBaseDelayMs * 2 ** attempt
      await delay(backoffMs)
      attempt += 1
      continue
    }
  }

  if (lastError !== null) {
    throw lastError
  }

  throw new Error("Provider request failed")
}
