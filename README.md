# Stock Ticker Registry

Standalone shadcn registry project for an inline stock ticker component with a
hover chart preview and click-to-open chart modal.

## Run the Demo

```bash
npm run dev -- --port 5173
```

Then open:

```txt
http://127.0.0.1:5173
```

Do not open the project root `index.html` with `file://`; Vite source files need
the dev server to resolve TSX, aliases, and Tailwind.

The demo uses deterministic mock data, so it works offline and does not require
an API key.

## Build

```bash
npm run test
npm run build
npm run registry:build
```

The registry JSON is generated under `public/r`.

## Deploy to GitHub Pages

This project includes a GitHub Actions workflow at `.github/workflows/pages.yml`.
In the GitHub repository, set **Settings -> Pages -> Build and deployment ->
Source** to **GitHub Actions**, then run the workflow or push to `main`.

The workflow runs:

```bash
npm ci
npm run test
npm run registry:build
npm run build
```

It publishes `dist`. The registry install URLs use the repository Pages URL:

```bash
npx shadcn@latest add https://zahlekhan.github.io/ticker-text/r/stock-ticker.json
npx shadcn@latest add https://zahlekhan.github.io/ticker-text/r/stock-ticker-live-demo.json
```

## Install from a deployed registry

```bash
npx shadcn@latest add https://zahlekhan.github.io/ticker-text/r/stock-ticker.json
```

The mock demo item can be installed with:

```bash
npx shadcn@latest add https://zahlekhan.github.io/ticker-text/r/stock-ticker-live-demo.json
```

## Connect a Stock API

`StockTicker` does not know about any provider. You pass a function through
`getStockData`, and that function returns the normalized `StockData` shape:

```tsx
<StockTicker symbol="TSLA" getStockData={getStockData} />
```

```ts
import type { StockData } from "@/components/stock-ticker"

async function getStockData(symbol: string): Promise<StockData> {
  const response = await fetch(`/your-stock-endpoint?symbol=${symbol}`)
  return response.json()
}
```

For a no-backend demo with Twelve Data, call their browser-accessible
`time_series` endpoint from the client with a disposable public key:

```ts
import type { StockData, StockHistoryPoint } from "@/components/stock-ticker"

export function createTwelveDataStockFetcher(apiKey: string | undefined) {
  return async function getStockData(symbol: string): Promise<StockData> {
    if (!apiKey) {
      throw new Error("Missing Twelve Data API key.")
    }

    const url = new URL("https://api.twelvedata.com/time_series")
    url.searchParams.set("symbol", symbol)
    url.searchParams.set("interval", "1day")
    url.searchParams.set("outputsize", "30")
    url.searchParams.set("apikey", apiKey)

    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok || data.status === "error") {
      throw new Error(data.message ?? "Unable to load stock data.")
    }

    const history = data.values
      .map((point: Record<string, string>): StockHistoryPoint => ({
        date: point.datetime,
        close: Number(point.close),
        open: Number(point.open),
        high: Number(point.high),
        low: Number(point.low),
        volume: Number(point.volume),
      }))
      .reverse()

    return {
      symbol: data.meta?.symbol ?? symbol.toUpperCase(),
      currency: data.meta?.currency ?? "USD",
      history,
      asOf: history.at(-1)?.date,
    }
  }
}
```

Use it in Vite like this:

```tsx
const getStockData = createTwelveDataStockFetcher(
  import.meta.env.VITE_TWELVE_DATA_API_KEY
)
```

For production, prefer a backend route so API keys, rate limits, retries, and
market-data licensing are controlled server-side.
