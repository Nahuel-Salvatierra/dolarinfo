import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import type { QuoteChange } from "@/hooks/use-argentina-dollars"
import type { DolarQuote } from "@/lib/dolarapi/types"

interface ArgentinaDollarPanelProps {
  quotes: DolarQuote[]
  quoteChangesByCasa: Record<string, QuoteChange>
  referenceQuote: DolarQuote | null
  isLoading: boolean
  error: string | null
}

interface HighlightCardData {
  key: string
  title: string
  quote: DolarQuote | null
  quoteChange: QuoteChange | null
  subtleSuffix?: string
  cardClassName: string
}

function formatArs(value: number): string {
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function ArgentinaDollarPanel({
  quotes,
  quoteChangesByCasa,
  referenceQuote,
  isLoading,
  error,
}: ArgentinaDollarPanelProps) {
  const sortedQuotes = [...quotes].sort((a, b) => a.venta - b.venta)
  const blueQuote = quotes.find((quote) => quote.casa === "blue") ?? null
  const officialQuote = quotes.find((quote) => quote.casa === "oficial") ?? null
  const bolsaQuote = quotes.find((quote) => quote.casa === "bolsa") ?? null
  const mepQuote = quotes.find((quote) => quote.casa === "mep") ?? bolsaQuote
  const hasExplicitMep = quotes.some((quote) => quote.casa === "mep")

  const highlightCards: HighlightCardData[] = [
    {
      key: "blue",
      title: "Dólar Blue",
      quote: blueQuote,
      quoteChange: quoteChangesByCasa.blue ?? null,
      cardClassName:
        "border-cyan-300/80 bg-gradient-to-br from-cyan-500 to-sky-600 shadow-cyan-900/40",
    },
    {
      key: "oficial",
      title: "Dólar Oficial",
      quote: officialQuote,
      quoteChange: quoteChangesByCasa.oficial ?? null,
      cardClassName:
        "border-blue-300/80 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-indigo-900/40",
    },
    {
      key: "mep",
      title: "Dólar MEP",
      quote: mepQuote,
      quoteChange:
        quoteChangesByCasa.mep ??
        (mepQuote?.casa === "bolsa" ? quoteChangesByCasa.bolsa : undefined) ??
        null,
      subtleSuffix: !hasExplicitMep && bolsaQuote ? "(bolsa)" : undefined,
      cardClassName:
        "border-violet-300/80 bg-gradient-to-br from-violet-500 to-purple-600 shadow-purple-900/40",
    },
  ]

  return (
    <section className="rounded-md border p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Cotizaciones del dólar en Argentina</h2>
        <p className="text-sm text-muted-foreground">
          Blue, oficial y MEP en tiempo real.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
          {error}
        </div>
      )}

      {!error && isLoading && (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          Cargando cotizaciones de Argentina...
        </div>
      )}

      {!error && !isLoading && quotes.length > 0 && (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {highlightCards.map((item) => (
              <Card
                key={item.key}
                className={`relative isolate border-2 shadow-lg ${item.cardClassName}`}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-2 right-2 bottom-2 bg-[url('/benjamin-franklin-dolar.png')] bg-contain bg-right bg-no-repeat opacity-20"
                />
                <CardHeader className="relative z-10 pb-1">
                  <CardTitle className="text-lg font-bold text-white drop-shadow-sm">
                    {item.title}
                    {item.subtleSuffix && (
                      <span className="ml-1 text-xs font-normal text-white/75 drop-shadow-sm">
                        {item.subtleSuffix}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 space-y-2">
                  <p className="text-xs uppercase tracking-wide text-white/80 drop-shadow-sm">
                    Compra
                  </p>
                  <p className="text-3xl font-bold tabular-nums leading-none text-white drop-shadow-sm">
                    {item.quote ? formatArs(item.quote.compra) : "N/D"}
                  </p>
                  {item.quoteChange && (
                    <p
                      className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        item.quoteChange.direction === "up"
                          ? "bg-emerald-500/20 text-emerald-100"
                          : item.quoteChange.direction === "down"
                            ? "bg-rose-500/20 text-rose-100"
                            : "bg-white/20 text-white"
                      }`}
                    >
                      {item.quoteChange.direction === "up" ? (
                        <ArrowUpRight className="size-3" />
                      ) : item.quoteChange.direction === "down" ? (
                        <ArrowDownRight className="size-3" />
                      ) : (
                        <Minus className="size-3" />
                      )}
                      {item.quoteChange.direction === "up"
                        ? "+"
                        : item.quoteChange.direction === "down"
                          ? "-"
                          : ""}
                      {formatArs(Math.abs(item.quoteChange.amount))}
                    </p>
                  )}
                  <p className="text-xs text-white/75 tabular-nums drop-shadow-sm">
                    Venta: {item.quote ? formatArs(item.quote.venta) : "N/D"}
                  </p>
                  <p className="text-xs text-white/75 drop-shadow-sm">
                    {item.quote
                      ? new Date(item.quote.fechaActualizacion).toLocaleString("es-AR")
                      : "Sin datos en la API"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mercado</TableHead>
                <TableHead className="text-right">Compra</TableHead>
                <TableHead className="text-right">Venta</TableHead>
                <TableHead className="text-right">Brecha</TableHead>
                <TableHead className="text-right">Actualización</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedQuotes.map((quote) => (
                <TableRow key={quote.casa}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>
                        {quote.casa === "bolsa" && !hasExplicitMep
                          ? "MEP"
                          : quote.nombre}
                      </span>
                      {referenceQuote?.casa === quote.casa && (
                        <Badge variant="default">referencia</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatArs(quote.compra)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatArs(quote.venta)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatArs(quote.venta - quote.compra)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {new Date(quote.fechaActualizacion).toLocaleString("es-AR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {!error && !isLoading && quotes.length === 0 && (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          No hay cotizaciones disponibles en este momento.
        </div>
      )}
    </section>
  )
}
