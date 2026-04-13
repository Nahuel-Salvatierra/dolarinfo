# Currency dashboard

Panel de cotizaciones y calculadora relacionada. La app combina tipos de cambio internacionales con cotizaciones del dólar en Argentina.

## Requisitos

- Node.js y npm
- Base SQLite gestionada con Prisma (`DATABASE_URL` en `.env`; ver [Prisma](https://www.prisma.io/docs))

## Arranque

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Origen de los datos

### Tipos de cambio internacionales (divisas vs. moneda base)

- **Proveedor:** [Frankfurter](https://www.frankfurter.app/) (`https://api.frankfurter.dev/v1`).
- **Cómo:** el cliente llama desde el navegador a `getCurrencies()` y `getLatestRates(base)` en `lib/frankfurter/client.ts`. Las peticiones usan `fetch` de Next.js con revalidación en caché (`REVALIDATE_SECONDS`, 1 hora).
- **Uso en la UI:** el hook `useCurrencyDashboard` carga lista de monedas y últimos tipos respecto a la moneda base (query `base`, por defecto USD).

### Cotizaciones del dólar en Argentina (blue, oficial, MEP, etc.)

- **Proveedor externo de referencia:** [DolarAPI](https://dolarapi.com/) — endpoint JSON `https://dolarapi.com/v1/dolares`.
- **Cómo llega a la app:** no se llama a DolarAPI directamente desde el navegador en cada visita. Un script de ingesta (`npm run ingest:daily`, `scripts/ingest-daily-rates.ts`) descarga ese JSON, mapea cada cotización a un tipo interno (oficial, blue, MEP, CCL, cripto, etc.) y persiste filas en SQLite vía Prisma (`DailyRate`, proveedor `dolarapi`).
- **Frecuencia y anti-duplicación:** la ingesta está preparada para ejecución periódica cada 10 minutos. Antes de correr, toma un lock lógico por ventana de 10 minutos (`IngestionRun`), por lo que múltiples disparos/reinicios en el mismo bloque no duplican llamadas ni escrituras.
- **Registro de llamadas:** cada intento de request al proveedor se guarda en `ProviderCallLog` con latencia, estado HTTP, éxito/error y metadatos básicos.
- **Lectura en runtime:** la ruta `GET /api/argentina-quotes` lee la base con `getArgentinaQuotesFromDb` (`lib/server/argentina-quotes-from-db.ts`): para cada tipo de cotización toma el registro más reciente y lo expone en el formato esperado por la UI. El hook `useArgentinaDollars` hace `fetch("/api/argentina-quotes")` y, en cliente, guarda un snapshot en `localStorage` para calcular variaciones respecto a la última visita.

### Histórico opcional de dólar cripto

- **Script:** `npm run ingest:backfill:crypto` (`scripts/ingest-backfill-crypto.ts`).
- **Origen:** sitio y API de Dolarito (`dolarito.ar` / `api.dolarito.ar`) para rellenar histórico; es independiente del flujo diario principal de DolarAPI.

### Calculadora de sueldo (`/sueldo`)

- **Cotizaciones:** las mismas que el dashboard argentino (vía `useArgentinaDollars` → `/api/argentina-quotes` → datos ya ingeridos).
- **Montos e historial:** solo en el navegador (`localStorage`), no se envían a un servidor.

## Scripts útiles

| Comando | Descripción |
|--------|-------------|
| `npm run db:generate` | Genera el cliente Prisma |
| `npm run db:migrate` | Aplica migraciones |
| `npm run ingest:daily` | Ejecuta la ingesta de DolarAPI (idempotente por ventana de 10 min) |
| `npm run ingest:startup` | Fuerza trigger de arranque (`--trigger=startup`) |
| `npm run ingest:scheduler` | Trigger scheduler (`--trigger=scheduler`) |
| `npm run ingestion:status` | Muestra últimas corridas y llamadas registradas |
| `npm run ingest:backfill:crypto` | Backfill histórico cripto (Dolarito) |

Para ver cotizaciones argentinas actualizadas en la UI, la base debe tener datos; en desarrollo conviene ejecutar `ingest:daily` cuando haga falta (o automatizarlo en el entorno que uses).

## Scheduler en Docker Compose (cada 10 minutos)

Hay un ejemplo en `docker-compose.ingest.yml` con un servicio `ingest-scheduler` que:

- ejecuta una corrida al iniciar (`npm run ingest:startup`),
- programa corridas cada 10 minutos con cron (`npm run ingest:scheduler`),
- evita duplicados por ventana gracias al lock en base (`IngestionRun`).

## Stack

Next.js (App Router), React, Tailwind CSS, Prisma + SQLite.
