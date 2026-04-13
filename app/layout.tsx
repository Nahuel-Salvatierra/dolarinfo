import type { Metadata } from "next"
import { Poppins, Roboto_Mono } from "next/font/google"
import Script from "next/script"
import { getThemeInitScript } from "@/lib/theme"
import "./globals.css"

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://dolarinfo.com.ar"),
  title: "dolarinfo.com.ar | Dólar hoy: blue, oficial y MEP",
  description:
    "Cotización del dólar blue, oficial y MEP hoy en Argentina, con actualización en tiempo real.",
  keywords: [
    "dólar hoy",
    "dólar blue hoy",
    "dólar oficial hoy",
    "dólar mep hoy",
    "cotización dólar argentina",
    "tipo de cambio",
    "precio del dólar",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "dolarinfo.com.ar | Dólar hoy: blue, oficial y MEP",
    description:
      "Seguimiento del dólar blue, oficial y MEP en Argentina, con cotizaciones en tiempo real.",
    url: "https://dolarinfo.com.ar",
    siteName: "dolarinfo.com.ar",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "dolarinfo.com.ar | Dólar hoy: blue, oficial y MEP",
    description:
      "Cotización del dólar blue, oficial y MEP hoy en Argentina.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${poppins.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: getThemeInitScript() }}
        />
        {children}
      </body>
    </html>
  )
}
