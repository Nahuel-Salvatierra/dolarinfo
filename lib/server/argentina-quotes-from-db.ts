import type { PrismaClient } from "@prisma/client"
import type { DolarQuote } from "@/lib/dolarapi/types"

const PROVIDER_KEY = "dolarapi" as const

function decimalToNumber(value: { toNumber: () => number } | null): number {
  if (value === null) {
    return 0
  }
  return value.toNumber()
}

function rateTypeKeyToCasa(key: string): string {
  if (key === "crypto") {
    return "cripto"
  }
  return key
}

function dailyRowToQuote(
  row: {
    date: Date
    buy: { toNumber: () => number } | null
    sell: { toNumber: () => number } | null
    updatedAt: Date
  },
  displayName: string,
  casa: string
): DolarQuote {
  const compra = decimalToNumber(row.buy)
  const venta = decimalToNumber(row.sell)
  return {
    moneda: "USD",
    casa,
    nombre: displayName,
    compra,
    venta,
    fechaActualizacion: row.date.toISOString(),
  }
}

export async function getArgentinaQuotesFromDb(
  prisma: PrismaClient
): Promise<DolarQuote[]> {
  const provider = await prisma.rateProvider.findUnique({
    where: { key: PROVIDER_KEY },
  })

  if (!provider) {
    return []
  }

  const rows = await prisma.dailyRate.findMany({
    where: { providerId: provider.id },
    include: { rateType: true },
    orderBy: { date: "desc" },
  })

  const latestByTypeId = new Map<
    string,
    (typeof rows)[number]
  >()

  for (const row of rows) {
    if (!latestByTypeId.has(row.rateTypeId)) {
      latestByTypeId.set(row.rateTypeId, row)
    }
  }

  const quotes: DolarQuote[] = []

  for (const row of latestByTypeId.values()) {
    const key = row.rateType.key
    const casa = rateTypeKeyToCasa(key)
    quotes.push(
      dailyRowToQuote(row, row.rateType.displayName, casa)
    )
  }

  return quotes.sort((a, b) => a.casa.localeCompare(b.casa))
}
