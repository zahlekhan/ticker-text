"use client"

import type * as React from "react"
import { Code2, Database, PackageCheck, ShieldCheck } from "lucide-react"

import { StockTicker } from "@/components/stock-ticker"
import { getMockStockData } from "@/lib/mock-stock-data"

const watchlist = ["NVDA", "AAPL", "TSLA", "META", "AMZN", "MSFT", "GOOGL"]

export function StockTickerLiveDemo() {
  return (
    <article className="mx-auto max-w-[980px] px-0 pb-24 pt-4 sm:pt-8">
      <header className="mb-12 border-b border-[#e7e6e1] pb-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2.5 text-sm font-semibold text-[#14181c]">
            <span className="grid size-[22px] place-items-center rounded-md bg-[#14181c] font-mono text-[11px] font-semibold text-white">
              $
            </span>
            <span>Stock Ticker Registry</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.08em] text-[#8a929b]">
            <span className="inline-flex items-center gap-2 text-[#1b8054]">
              <span className="size-[7px] rounded-full bg-[#1b8054] shadow-[0_0_0_5px_rgba(27,128,84,0.08)]" />
              Static registry
            </span>
            <span>shadcn/ui</span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#8a929b]">
              <PackageCheck className="size-3.5" aria-hidden="true" />
              Registry block / inline market data
            </p>
            <h1 className="max-w-4xl font-serif text-[clamp(40px,6vw,72px)] font-normal leading-[1.02] tracking-normal text-[#14181c]">
              Inline stock tickers for financial writing.
            </h1>
            <p className="mt-6 max-w-[64ch] text-lg leading-7 text-[#4a5159]">
              A shadcn-compatible component that turns symbols like{" "}
              <StockTicker
                symbol="NVDA"
                getStockData={getMockStockData}
                hoverDelayMs={80}
              />{" "}
              into a compact market preview with a hover card, sparkline, stats,
              and click-through chart dialog.
            </p>
          </div>

          <div className="rounded-[14px] border border-[#e7e6e1] bg-white p-4 shadow-[0_1px_0_rgba(20,24,28,0.04),0_1px_2px_rgba(20,24,28,0.04)]">
            <p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#8a929b]">
              <Code2 className="size-3.5" aria-hidden="true" />
              Install
            </p>
            <pre className="overflow-x-auto rounded-[10px] bg-[#14181c] p-4 font-mono text-xs leading-6 text-[#d6e6dd]">
              {`npx shadcn@latest add \\
https://<user>.github.io/<repo>/r/stock-ticker.json`}
            </pre>
            <p className="mt-3 text-[13px] leading-5 text-[#4a5159]">
              The public landing page and registry demo are the same route, so
              visitors can evaluate the component before installing it.
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-[18px] border border-[#e7e6e1] bg-white px-6 py-7 shadow-[0_1px_0_rgba(20,24,28,0.04),0_1px_2px_rgba(20,24,28,0.04)] sm:px-12 sm:py-11">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.1em] text-[#8a929b]">
          <span className="inline-flex items-center gap-2">
            <Database className="size-3.5" aria-hidden="true" />
            Live component demo / mock data
          </span>
          <span className="inline-flex items-center gap-2 normal-case tracking-normal text-[#4a5159] [font-family:var(--font-sans)]">
            Hover, focus, or click a ticker
          </span>
        </div>

        <div className="max-w-[60ch] space-y-4 text-[22px] leading-[1.55] tracking-normal text-[#14181c]">
          <p>
            Last quarter&apos;s narrative belonged to the cloud cohort:{" "}
            <StockTicker symbol="MSFT" getStockData={getMockStockData} /> defended
            its lead while{" "}
            <StockTicker symbol="GOOGL" getStockData={getMockStockData} /> leaned
            harder into agentic tooling and quietly outpaced consensus on
            services revenue.
          </p>
          <p>
            Hardware told a different story.{" "}
            <StockTicker symbol="AAPL" getStockData={getMockStockData} /> guided
            cautiously into the holiday window,{" "}
            <StockTicker symbol="NVDA" getStockData={getMockStockData} /> kept
            printing outsized gross margins, and{" "}
            <StockTicker symbol="TSLA" getStockData={getMockStockData} /> finally
            shipped the refresh analysts had been asking about for two years.
          </p>
          <p>
            Tucked underneath: a slow rotation back into{" "}
            <StockTicker symbol="AMZN" getStockData={getMockStockData} /> as
            logistics costs eased, with{" "}
            <StockTicker symbol="META" getStockData={getMockStockData} /> trading
            like a hardware company on the back of Reality Labs guidance.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-[#e7e6e1] pt-7">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#8a929b]">
            Watchlist
          </span>
          <div className="flex flex-wrap gap-1.5">
            {watchlist.map((symbol) => (
              <StockTicker
                key={symbol}
                symbol={symbol}
                getStockData={getMockStockData}
                hoverDelayMs={80}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <InfoPanel
          icon={<ShieldCheck className="size-3.5" aria-hidden="true" />}
          eyebrow="Reusable API"
          title="Bring your own market data."
        >
          <p>
            The registry component ships without a provider lock-in. Pass
            `getStockData`, return the `StockData` shape, and the component owns
            caching, loading states, hover previews, and chart rendering.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-[10px] bg-[#14181c] p-4 font-mono text-xs leading-6 text-[#d6e6dd]">
            {`<StockTicker
  symbol="NVDA"
  getStockData={getStockData}
/>`}
          </pre>
        </InfoPanel>

        <InfoPanel
          icon={<PackageCheck className="size-3.5" aria-hidden="true" />}
          eyebrow="Included"
          title="One block, two registry entries."
        >
          <div className="mt-4 space-y-3">
            <Feature
              number="01"
              text={
                <>
                  <strong>stock-ticker</strong> installs the reusable component.
                </>
              }
            />
            <Feature
              number="02"
              text={
                <>
                  <strong>stock-ticker-live-demo</strong> installs this landing
                  page demo plus deterministic mock data.
                </>
              }
            />
            <Feature
              number="03"
              text={
                <>
                  <strong>Dependencies</strong> are declared for `recharts`,
                  `hover-card`, `dialog`, and `skeleton`.
                </>
              }
            />
          </div>
        </InfoPanel>
      </section>
    </article>
  )
}

function InfoPanel({
  children,
  eyebrow,
  icon,
  title,
}: {
  children: React.ReactNode
  eyebrow: string
  icon: React.ReactNode
  title: string
}) {
  return (
    <div className="rounded-[14px] border border-[#e7e6e1] bg-white px-6 py-6">
      <p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#8a929b]">
        {icon}
        {eyebrow}
      </p>
      <h2 className="font-serif text-2xl font-normal tracking-normal text-[#14181c]">
        {title}
      </h2>
      <div className="mt-2 text-[13.5px] leading-6 text-[#4a5159]">
        {children}
      </div>
    </div>
  )
}

function Feature({
  number,
  text,
}: {
  number: string
  text: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 text-[13px] leading-6 text-[#4a5159]">
      <span className="pt-0.5 font-mono text-[10px] tracking-[0.08em] text-[#8a929b]">
        {number}
      </span>
      <span className="[&_strong]:font-medium [&_strong]:text-[#14181c]">
        {text}
      </span>
    </div>
  )
}
