import type { Metadata } from "next"
import { Suspense } from "react"
import { SalaryCalculator } from "@/components/salary-calculator"

export const metadata: Metadata = {
  metadataBase: new URL("https://dolarinfo.com.ar"),
  title: "Calculadora de sueldo en dólares | dolarinfo.com.ar",
  description:
    "Calculá cuánto es tu sueldo en dólares según el dólar blue, oficial, MEP y cripto en Argentina. Ingresá pesos o dólares y compará al instante.",
  keywords: [
    "sueldo en dólares",
    "salario en dólares argentina",
    "cuánto es mi sueldo en dólares",
    "calculadora sueldo dólar blue",
    "pesos a dólares sueldo",
    "dólar mep sueldo",
    "dólar oficial sueldo",
    "dólar cripto sueldo",
    "dolarinfo",
  ],
  alternates: {
    canonical: "/sueldo",
  },
  openGraph: {
    title: "Calculadora de sueldo en dólares | dolarinfo.com.ar",
    description:
      "Tu sueldo en pesos según dólar blue, oficial, MEP y cripto. También de USD a pesos.",
    url: "https://dolarinfo.com.ar/sueldo",
    siteName: "dolarinfo.com.ar",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Calculadora de sueldo en dólares | dolarinfo.com.ar",
    description:
      "Calculá tu sueldo argentino en dólar blue, oficial, MEP y cripto.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function SueldoPage() {
  return (
    <Suspense
      fallback={
        <main className="container mx-auto px-4 py-8">
          <p className="text-sm text-muted-foreground">Cargando calculadora...</p>
        </main>
      }
    >
      <SalaryCalculator />
    </Suspense>
  )
}
