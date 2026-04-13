import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getArgentinaQuotesFromDb } from "@/lib/server/argentina-quotes-from-db"

export async function GET() {
  try {
    const quotes = await getArgentinaQuotesFromDb(prisma)
    return NextResponse.json(quotes)
  } catch {
    return NextResponse.json(
      { error: "No se pudieron leer las cotizaciones desde la base de datos" },
      { status: 503 }
    )
  }
}
