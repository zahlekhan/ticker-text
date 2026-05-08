"use client"

import * as React from "react"
import { Check, Code2, PackageCheck } from "lucide-react"

import { StockTicker } from "@/components/stock-ticker"
import { getMockStockData } from "@/lib/mock-stock-data"

const watchlist = ["NVDA", "AAPL", "TSLA", "META", "AMZN", "MSFT", "GOOGL"]
const installCommand =
  "npx shadcn@latest add https://zahlekhan.github.io/ticker-text/r/stock-ticker.json"

type DemoToken =
  | {
      type: "text"
      value: string
    }
  | {
      type: "ticker"
      symbol: string
    }

const demoParagraphs: DemoToken[][] = [
  [
    { type: "text", value: "Cloud names moved first: " },
    { type: "ticker", symbol: "MSFT" },
    { type: "text", value: " held its lead while " },
    { type: "ticker", symbol: "GOOGL" },
    { type: "text", value: " gained on services revenue." },
  ],
  [
    { type: "text", value: "Hardware was mixed. " },
    { type: "ticker", symbol: "AAPL" },
    { type: "text", value: " guided cautiously, " },
    { type: "ticker", symbol: "NVDA" },
    { type: "text", value: " kept margins high, and " },
    { type: "ticker", symbol: "TSLA" },
    { type: "text", value: " traded lower after delivery updates." },
  ],
]

const demoTokenCount = demoParagraphs.reduce(
  (total, paragraph) => total + paragraph.length,
  0
)

export function StockTickerLiveDemo() {
  return (
    <article className="mx-auto max-w-[920px] pb-16 pt-4 sm:pt-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-[#e7e6e1] pb-5">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-[#14181c]">
          <span className="grid size-[22px] place-items-center rounded-md bg-[#14181c] font-mono text-[11px] text-white">
            $
          </span>
          <span>Ticker Text</span>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#8a929b]">
          shadcn registry
        </span>
      </header>

      <section className="mb-8">
        <div className="max-w-[58ch]">
          <p className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#8a929b]">
            <PackageCheck className="size-3.5" aria-hidden="true" />
            Inline market component
          </p>
          <h1 className="font-serif text-[clamp(34px,5vw,52px)] font-normal leading-[1.04] tracking-normal text-[#14181c]">
            Ticker Text
          </h1>
          <p className="mt-4 text-base leading-7 text-[#4a5159]">
            Add stock tickers inside prose. Hover or click{" "}
            <StockTicker
              symbol="NVDA"
              getStockData={getMockStockData}
              hoverDelayMs={80}
            />{" "}
            to see the preview card and chart dialog.
          </p>
        </div>

        <InstallCard />
      </section>

      <section className="rounded-[18px] border border-[#e7e6e1] bg-white px-6 py-7 shadow-[0_1px_0_rgba(20,24,28,0.04),0_1px_2px_rgba(20,24,28,0.04)] sm:px-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#8a929b]">
            Demo
          </h2>
          <span className="text-sm text-[#4a5159]">
            Streaming generated text with inline tickers.
          </span>
        </div>

        <StreamedMarketBrief />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-[#e7e6e1] pt-6">
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

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-[14px] border border-[#e7e6e1] bg-white p-5">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#8a929b]">
            Usage
          </h2>
          <pre className="mt-3 overflow-x-auto rounded-[10px] bg-[#14181c] p-4 font-mono text-xs leading-6 text-[#d6e6dd]">
            {`<StockTicker
  symbol="NVDA"
  getStockData={getStockData}
/>`}
          </pre>
        </div>

        <div className="rounded-[14px] border border-[#e7e6e1] bg-white p-5">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#8a929b]">
            Data
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#4a5159]">
            Pass `getStockData(symbol)`. Return symbol, currency, history, and
            optional stats like volume, market cap, P/E, and day range.
          </p>
        </div>
      </section>
    </article>
  )
}

function StreamedMarketBrief() {
  const [visibleTokens, setVisibleTokens] = React.useState(0)

  React.useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    if (reduceMotion) {
      setVisibleTokens(demoTokenCount)
      return
    }

    setVisibleTokens(0)

    const timer = window.setInterval(() => {
      setVisibleTokens((current) => {
        if (current >= demoTokenCount) {
          window.clearInterval(timer)
          return current
        }

        return current + 1
      })
    }, 220)

    return () => window.clearInterval(timer)
  }, [])

  let consumedTokens = 0
  const isStreaming = visibleTokens < demoTokenCount

  return (
    <div className="max-w-[62ch] space-y-4 text-[18px] leading-8 tracking-normal text-[#14181c]">
      {demoParagraphs.map((paragraph, paragraphIndex) => {
        const availableTokens = Math.max(0, visibleTokens - consumedTokens)
        const paragraphTokens = paragraph.slice(0, availableTokens)
        consumedTokens += paragraph.length

        if (paragraphTokens.length === 0) {
          return null
        }

        const isLastVisibleParagraph =
          isStreaming && availableTokens > 0 && availableTokens <= paragraph.length

        return (
          <p key={paragraphIndex}>
            {paragraphTokens.map((token, tokenIndex) =>
              token.type === "text" ? (
                <span key={tokenIndex}>{token.value}</span>
              ) : (
                <StockTicker
                  key={tokenIndex}
                  symbol={token.symbol}
                  getStockData={getMockStockData}
                />
              )
            )}
            {isLastVisibleParagraph ? (
              <span className="ml-1 inline-block h-5 w-1 translate-y-1 rounded-full bg-[#14181c] motion-safe:animate-pulse" />
            ) : null}
          </p>
        )
      })}
    </div>
  )
}

function InstallCard() {
  const [copied, setCopied] = React.useState(false)

  async function copyInstallCommand() {
    await navigator.clipboard.writeText(installCommand)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="relative mx-auto mt-7 w-full max-w-3xl rounded-[14px] border border-[#e7e6e1] bg-white p-4">
      <div className="mb-3 flex items-center justify-center">
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#8a929b]">
          <Code2 className="size-3.5" aria-hidden="true" />
          Click command to copy
        </p>
      </div>
      <button
        type="button"
        className="block w-full overflow-x-auto rounded-[10px] bg-[#14181c] p-4 text-center font-mono text-[11px] leading-6 text-[#d6e6dd] transition hover:bg-[#1d2329] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14181c] focus-visible:ring-offset-2"
        onClick={() => void copyInstallCommand()}
      >
        <code>{installCommand}</code>
      </button>
      <div
        className={[
          "pointer-events-none absolute left-1/2 top-full mt-3 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#14181c] px-3 py-2 text-xs font-medium text-white shadow-[0_12px_28px_rgba(20,24,28,0.18)] transition",
          copied ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
        ].join(" ")}
        role="status"
        aria-live="polite"
      >
        <Check className="size-3.5" aria-hidden="true" />
        Copied
      </div>
    </div>
  )
}
