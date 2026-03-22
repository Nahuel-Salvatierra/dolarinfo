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

export function CurrencyRatesTable({
  rates,
  currencies,
  base,
}: CurrencyRatesTableProps) {
  const rows = Object.entries(rates).sort(([a], [b]) => a.localeCompare(b))

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Moneda</TableHead>
          <TableHead className="text-right">Cotización (por 1 {base})</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(([code, rate]) => (
          <TableRow key={code}>
            <TableCell>
              <Badge variant="secondary">{code}</Badge>
            </TableCell>
            <TableCell>{currencies[code] ?? code}</TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {rate.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
