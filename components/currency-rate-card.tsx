import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface CurrencyRateCardProps {
  code: string
  name: string
  rate: number
  base: string
}

export function CurrencyRateCard({
  code,
  name,
  rate,
  base,
}: CurrencyRateCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{name}</CardTitle>
          <Badge variant="outline">{code}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">
          {rate.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          })}
        </p>
        <p className="text-sm text-muted-foreground mt-1">por 1 {base}</p>
      </CardContent>
    </Card>
  )
}
