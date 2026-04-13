import { Prisma } from "@prisma/client"
import type { PrismaClient } from "@prisma/client"
import type { JsonData } from "@/lib/ingest/types"

interface ProviderCallLogInput {
  runId: string
  providerKey: string
  endpoint: string
  method: string
  requestAt: Date
  responseAt: Date
  statusCode: number | null
  durationMs: number
  success: boolean
  errorType: string | null
  errorMessage: string | null
  responseSizeBytes: number | null
  requestMeta: JsonData | null
  responseMeta: JsonData | null
}

function normalizeJson(value: JsonData | null): JsonData | Prisma.NullTypes.JsonNull {
  return value === null ? Prisma.JsonNull : value
}

export async function createProviderCallLog(
  prisma: PrismaClient,
  input: ProviderCallLogInput
): Promise<void> {
  await prisma.providerCallLog.create({
    data: {
      runId: input.runId,
      providerKey: input.providerKey,
      endpoint: input.endpoint,
      method: input.method,
      requestAt: input.requestAt,
      responseAt: input.responseAt,
      statusCode: input.statusCode,
      durationMs: input.durationMs,
      success: input.success,
      errorType: input.errorType,
      errorMessage: input.errorMessage,
      responseSizeBytes: input.responseSizeBytes,
      requestMeta: normalizeJson(input.requestMeta),
      responseMeta: normalizeJson(input.responseMeta),
    },
  })
}
