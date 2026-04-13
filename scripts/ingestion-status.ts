import { prisma } from "../lib/db/prisma"

const RUN_LIMIT = 10
const CALL_LIMIT_PER_RUN = 5

function formatDate(value: Date | null): string {
  if (value === null) {
    return "-"
  }
  return value.toISOString()
}

function pad(value: string, size: number): string {
  if (value.length >= size) {
    return value
  }
  return `${value}${" ".repeat(size - value.length)}`
}

async function run(): Promise<void> {
  const runs = await prisma.ingestionRun.findMany({
    orderBy: { startedAt: "desc" },
    take: RUN_LIMIT,
    include: {
      providerCalls: {
        orderBy: { requestAt: "desc" },
        take: CALL_LIMIT_PER_RUN,
      },
    },
  })

  if (runs.length === 0) {
    console.info("No ingestion runs found.")
    return
  }

  console.info(
    `${pad("runSlotStart", 24)} ${pad("status", 10)} ${pad("trigger", 10)} ${pad("provider", 12)} ${pad("startedAt", 24)} ${pad("finishedAt", 24)} ${pad("calls", 6)}`
  )

  for (const runEntry of runs) {
    console.info(
      `${pad(runEntry.runSlotStart.toISOString(), 24)} ${pad(runEntry.status, 10)} ${pad(runEntry.trigger, 10)} ${pad(runEntry.providerKey, 12)} ${pad(runEntry.startedAt.toISOString(), 24)} ${pad(formatDate(runEntry.finishedAt), 24)} ${pad(String(runEntry.providerCalls.length), 6)}`
    )

    for (const call of runEntry.providerCalls) {
      const callStatus = call.success
        ? `ok:${call.statusCode ?? "-"}`
        : `err:${call.errorType ?? "Error"}`
      console.info(
        `  - ${call.requestAt.toISOString()} ${call.method} ${call.endpoint} ${callStatus} ${call.durationMs ?? 0}ms`
      )
    }
  }
}

run()
  .catch((caughtError) => {
    const error =
      caughtError instanceof Error
        ? caughtError
        : new Error(String(caughtError))
    process.exitCode = 1
    console.error(error.stack ?? `${error.name}: ${error.message}`)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
