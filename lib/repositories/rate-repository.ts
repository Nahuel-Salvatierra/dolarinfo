import type { DailyRate } from "@prisma/client"
import type { DailyRateInput, RateTypeKey } from "@/lib/ingest/types"

export interface RateRepository {
  upsertDailyRate(input: DailyRateInput): Promise<DailyRate>
  upsertManyDailyRates(inputs: DailyRateInput[]): Promise<number>
  getLatestRateByType(rateTypeKey: RateTypeKey): Promise<DailyRate | null>
}
