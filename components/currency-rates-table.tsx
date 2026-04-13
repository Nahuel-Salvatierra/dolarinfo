import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface CurrencyRatesTableProps {
  rates: Record<string, number>
  currencies: Record<string, string>
  base: string
}

interface CurrencyRateRow {
  code: string
  rate: number
}

interface CurrencyRateColumn {
  id: string
  header: ReactNode
  headerClassName?: string
  cellClassName?: string
  renderCell: (
    row: CurrencyRateRow,
    currencies: Record<string, string>
  ) => ReactNode
}

function buildCurrencyRateColumns(base: string): CurrencyRateColumn[] {
  return [
    {
      id: "code",
      header: "Código",
      renderCell: (row) => (
        <Badge variant="secondary">{row.code}</Badge>
      ),
    },
    {
      id: "name",
      header: "Moneda",
      renderCell: (row, currencies) =>
        <span className="capitalize">

          {currencies[row.code] ?? row.code}
        </span>
    },
    {
      id: "rate",
      header: `Cotización (por 1 ${base})`,
      headerClassName: "text-right",
      cellClassName: "text-right font-mono tabular-nums",
      renderCell: (row) =>
        <span className="font-mono tabular-nums">
          $ {row.rate.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          })}
        </span>
    },
  ]
}

export function CurrencyRatesTable({
  rates,
  currencies,
  base,
}: CurrencyRatesTableProps) {
  const columns = buildCurrencyRateColumns(base)
  const rows: CurrencyRateRow[] = Object.entries(rates)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, rate]) => ({ code, rate }))

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.id} className={col.headerClassName}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.code}>
            {columns.map((col) => (
              <TableCell key={col.id} className={col.cellClassName}>
                {col.renderCell(row, currencies)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
