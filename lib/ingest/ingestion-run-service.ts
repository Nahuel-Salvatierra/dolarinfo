import { Prisma } from "@prisma/client"
import type { PrismaClient } from "@prisma/client"

export type IngestionRunStatus = "running" | "completed" | "failed" | "skipped"
export type IngestionRunTrigger = "startup" | "scheduler" | "manual"

export interface StartScheduledRunInput {
  jobKey: string
  providerKey: string
  slotMinutes: number
  trigger: IngestionRunTrigger
  instanceId: string | null
  now?: Date
}

export interface StartScheduledRunResult {
  acquired: boolean
  runId: string | null
  runSlotStart: Date
}

function truncateToSlot(date: Date, slotMinutes: number): Date {
  const minutes = date.getUTCMinutes()
  const slottedMinutes = Math.floor(minutes / slotMinutes) * slotMinutes
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      slottedMinutes,
      0,
      0
    )
  )
}

function isUniqueConstraintError(error: Error): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  )
}

export async function startScheduledRun(
  prisma: PrismaClient,
  input: StartScheduledRunInput
): Promise<StartScheduledRunResult> {
  const now = input.now ?? new Date()
  const runSlotStart = truncateToSlot(now, input.slotMinutes)

  try {
    const run = await prisma.ingestionRun.create({
      data: {
        jobKey: input.jobKey,
        providerKey: input.providerKey,
        runSlotStart,
        slotMinutes: input.slotMinutes,
        status: "running",
        trigger: input.trigger,
        instanceId: input.instanceId,
      },
      select: { id: true },
    })

    return { acquired: true, runId: run.id, runSlotStart }
  } catch (caughtError) {
    const error =
      caughtError instanceof Error
        ? caughtError
        : new Error(String(caughtError))
    if (!isUniqueConstraintError(error)) {
      throw error
    }

    return { acquired: false, runId: null, runSlotStart }
  }
}

export async function finishRun(
  prisma: PrismaClient,
  runId: string,
  status: IngestionRunStatus,
  errorMessage: string | null
): Promise<void> {
  await prisma.ingestionRun.update({
    where: { id: runId },
    data: {
      status,
      errorMessage,
      finishedAt: new Date(),
    },
  })
}
