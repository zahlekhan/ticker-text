# Ticker Text

Inline stock tickers for prose. Built as a shadcn registry component with a
hover preview card, sparkline, stats, and click-through chart dialog.

## Install

```bash
npx shadcn@latest add https://zahlekhan.github.io/ticker-text/r/stock-ticker.json
```

To install the demo page and mock data:

```bash
npx shadcn@latest add https://zahlekhan.github.io/ticker-text/r/stock-ticker-live-demo.json
```

## Usage

```tsx
import { StockTicker, type StockData } from "@/components/stock-ticker"

async function getStockData(symbol: string): Promise<StockData> {
  const response = await fetch(`/api/stocks?symbol=${symbol}`)
  return response.json()
}

export function Article() {
  return (
    <p>
      Semiconductors led the move with{" "}
      <StockTicker symbol="NVDA" getStockData={getStockData} /> extending gains.
    </p>
  )
}
```

## Data Contract

`StockTicker` is provider-agnostic. Pass a `getStockData(symbol)` function that
returns this shape:

```ts
type StockData = {
  symbol: string
  currency?: string
  history: Array<{
    date: string
    close: number
    open?: number
    high?: number
    low?: number
    volume?: number
  }>
  asOf?: string
  companyName?: string
  exchange?: string
  previousClose?: number
  dayRange?: [number, number]
  volume?: number
  marketCap?: number
  peRatio?: number
  brandColor?: string
}
```

Minimum useful payload:

```ts
{
  symbol: "NVDA",
  currency: "USD",
  history: [
    { date: "2026-05-06", close: 141.2 },
    { date: "2026-05-07", close: 143.34 },
  ],
}
```

For production, prefer calling your own backend route so API keys, retries,
rate limits, and market-data licensing stay server-side.

## Registry Items

- `stock-ticker`: reusable component only
- `stock-ticker-live-demo`: component, demo page, and deterministic mock data

The deployed registry files live at:

```txt
https://zahlekhan.github.io/ticker-text/r/stock-ticker.json
https://zahlekhan.github.io/ticker-text/r/stock-ticker-live-demo.json
```

## Development

Local demo:

```bash
npm install
npm run dev -- --port 5173
```

Then open:

```txt
http://127.0.0.1:5173
```

Checks:

```bash
npm run test
npm run build
npm run registry:build
```

`npm run registry:build` generates registry JSON under `public/r`.

## Deployment

GitHub Pages is configured in `.github/workflows/pages.yml`.

On push to `main`, the workflow runs tests, builds the registry files, builds
the Vite app, and deploys `dist`.
