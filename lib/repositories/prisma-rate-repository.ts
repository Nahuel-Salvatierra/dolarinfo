import { Prisma } from "@prisma/client"
import type { DailyRate, PrismaClient } from "@prisma/client"
import type { DailyRateInput, RateTypeKey } from "@/lib/ingest/types"
import type { RateRepository } from "@/lib/repositories/rate-repository"

function normalizeDate(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export class PrismaRateRepository implements RateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertDailyRate(input: DailyRateInput): Promise<DailyRate> {
    const normalizedDate = normalizeDate(input.date)
    const provider = await this.prisma.rateProvider.upsert({
      where: { key: input.providerKey },
      update: { name: input.providerName },
      create: { key: input.providerKey, name: input.providerName },
    })

    const rateType = await this.prisma.rateType.upsert({
      where: { key: input.rateTypeKey },
      update: { displayName: input.rateTypeDisplayName },
      create: { key: input.rateTypeKey, displayName: input.rateTypeDisplayName },
    })

    const rawPayload = input.rawPayload === null ? Prisma.JsonNull : input.rawPayload

    return this.prisma.dailyRate.upsert({
      where: {
        date_providerId_rateTypeId: {
          date: normalizedDate,
          providerId: provider.id,
          rateTypeId: rateType.id,
        },
      },
      update: {
        buy: input.buy,
        sell: input.sell,
        avg: input.avg,
        sourceUrl: input.sourceUrl,
        rawPayload,
      },
      create: {
        date: normalizedDate,
        buy: input.buy,
        sell: input.sell,
        avg: input.avg,
        sourceUrl: input.sourceUrl,
        rawPayload,
        providerId: provider.id,
        rateTypeId: rateType.id,
      },
    })
  }

  async upsertManyDailyRates(inputs: DailyRateInput[]): Promise<number> {
    for (const input of inputs) {
      await this.upsertDailyRate(input)
    }
    return inputs.length
  }

  async getLatestRateByType(rateTypeKey: RateTypeKey): Promise<DailyRate | null> {
    return this.prisma.dailyRate.findFirst({
      where: { rateType: { key: rateTypeKey } },
      orderBy: { date: "desc" },
    })
  }
}
