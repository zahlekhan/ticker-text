"use client"

import * as React from "react"
import { flushSync } from "react-dom"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export type StockHistoryPoint = {
  date: string
  close: number
  open?: number
  high?: number
  low?: number
  volume?: number
}

export type StockData = {
  symbol: string
  currency?: string
  history: StockHistoryPoint[]
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

export type StockTickerProps = {
  symbol: string
  children?: React.ReactNode
  getStockData: (symbol: string) => Promise<StockData>
  cacheTtlMs?: number
  hoverDelayMs?: number
  className?: string
}

type CacheEntry = {
  expiresAt: number
  data?: StockData
  promise?: Promise<StockData>
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (
    updateCallback: () => void
  ) => {
    finished: Promise<void>
    ready: Promise<void>
    skipTransition: () => void
  }
}

type RangeKey = "1D" | "5D" | "1M" | "YTD" | "1Y"

const stockCache = new Map<string, CacheEntry>()
const DEFAULT_CACHE_TTL_MS = 15 * 60 * 1000
const DEFAULT_HOVER_DELAY_MS = 150
const RANGE_OPTIONS: RangeKey[] = ["1D", "5D", "1M", "YTD", "1Y"]
const CHART_COLORS = {
  up: "#1b8054",
  down: "#c0392b",
  ink: "#14181c",
  muted: "#8a929b",
  line: "#e7e6e1",
  paper: "#ffffff",
}

export function StockTicker({
  symbol,
  children,
  getStockData,
  cacheTtlMs = DEFAULT_CACHE_TTL_MS,
  hoverDelayMs = DEFAULT_HOVER_DELAY_MS,
  className,
}: StockTickerProps) {
  const normalizedSymbol = normalizeSymbol(symbol)
  const transitionId = React.useId()
  const transitionName = `stock-ticker-${transitionId.replace(/:/g, "")}`
  const [data, setData] = React.useState<StockData | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isHoverOpen, setIsHoverOpen] = React.useState(false)
  const hoverTimerRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    return () => {
      if (hoverTimerRef.current !== null) {
        window.clearTimeout(hoverTimerRef.current)
      }
    }
  }, [])

  const loadStockData = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const nextData = await readStockData(
        normalizedSymbol,
        getStockData,
        cacheTtlMs
      )
      setData(nextData)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load stock data."
      )
    } finally {
      setIsLoading(false)
    }
  }, [cacheTtlMs, getStockData, normalizedSymbol])

  const scheduleHoverLoad = React.useCallback(() => {
    if (data || isLoading) {
      return
    }

    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current)
    }

    hoverTimerRef.current = window.setTimeout(() => {
      void loadStockData()
    }, hoverDelayMs)
  }, [data, hoverDelayMs, isLoading, loadStockData])

  const cancelHoverLoad = React.useCallback(() => {
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }, [])

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      setIsDialogOpen(open)
      if (open) {
        setIsHoverOpen(false)
      }
      if (open && !data && !isLoading) {
        void loadStockData()
      }
    },
    [data, isLoading, loadStockData]
  )

  const animateOpenChange = React.useCallback(
    (open: boolean) => {
      const transitionDocument = document as ViewTransitionDocument

      if (
        typeof window === "undefined" ||
        !transitionDocument.startViewTransition ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        handleOpenChange(open)
        return
      }

      transitionDocument.startViewTransition(() => {
        flushSync(() => handleOpenChange(open))
      })
    },
    [handleOpenChange]
  )

  const summary = data && data.history.length > 0 ? getStockSummary(data) : null
  const tone = summary && summary.change < 0 ? "down" : "up"
  const label = children ?? normalizedSymbol

  return (
    <Dialog open={isDialogOpen} onOpenChange={animateOpenChange}>
      <StockTickerStyle transitionName={transitionName} />
      <HoverCard
        open={isHoverOpen && !isDialogOpen}
        onOpenChange={setIsHoverOpen}
        openDelay={hoverDelayMs}
        closeDelay={120}
      >
        <HoverCardTrigger asChild>
          <button
            type="button"
            aria-label={children ? undefined : `$${normalizedSymbol}`}
            style={{
              viewTransitionName: isDialogOpen ? "none" : transitionName,
            }}
            className={cn(
              "stock-ticker-pill relative inline-flex min-h-[1.55em] items-baseline gap-1 overflow-hidden rounded-md border border-[#e2e1d9] bg-[#f3f2ec] px-2 py-px align-baseline font-mono text-[0.82em] font-medium leading-[1.3] text-[#14181c] tabular-nums no-underline shadow-none transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#1b8054] hover:bg-white hover:text-[#1b8054] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b8054] focus-visible:ring-offset-2 data-[tone=down]:hover:border-[#c0392b] data-[tone=down]:hover:text-[#c0392b]",
              className
            )}
            data-tone={tone}
            onClick={() => {
              setIsHoverOpen(false)
              animateOpenChange(true)
            }}
            onFocus={scheduleHoverLoad}
            onMouseEnter={scheduleHoverLoad}
            onMouseLeave={cancelHoverLoad}
          >
            <span className="text-[#8a929b]">$</span>
            <span>{label}</span>
            {summary ? (
              <span
                className={cn(
                  "ml-1 text-[0.85em] font-medium",
                  tone === "down" ? "text-[#c0392b]" : "text-[#1b8054]"
                )}
                aria-hidden="true"
              >
                {formatSignedPercent(summary.changePercent)}
              </span>
            ) : null}
            {isLoading ? (
              <span
                className="mb-0.5 ml-0.5 size-1.5 rounded-full bg-current opacity-55 motion-safe:animate-pulse"
                aria-hidden="true"
              />
            ) : null}
          </button>
        </HoverCardTrigger>
        <HoverCardContent
          align="center"
          sideOffset={12}
          className="w-80 rounded-[14px] border-[#d5d4cd] bg-white p-0 shadow-[0_1px_1px_rgba(20,24,28,0.04),0_6px_18px_-6px_rgba(20,24,28,0.1),0_24px_48px_-16px_rgba(20,24,28,0.18)]"
        >
          {!isDialogOpen ? (
            <StockPreview
              data={data}
              error={error}
              isLoading={isLoading}
              symbol={normalizedSymbol}
            />
          ) : null}
        </HoverCardContent>
      </HoverCard>
      <DialogContent
        style={{
          viewTransitionName: isDialogOpen ? transitionName : "none",
        }}
        className="max-h-[calc(100vh-2rem)] max-w-3xl overflow-hidden border-[#d5d4cd] bg-white p-0 shadow-[0_34px_110px_rgba(20,24,28,0.25)]"
      >
        <DialogHeader className="border-b border-[#e7e6e1] bg-[#faf9f5] px-5 py-5 text-left sm:px-6">
          <div className="flex flex-col gap-4 pr-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <StockGlyph data={data} symbol={normalizedSymbol} />
              <div className="min-w-0 space-y-1">
                <DialogTitle className="truncate text-xl font-semibold tabular-nums text-[#14181c]">
                  {normalizedSymbol} price history
                </DialogTitle>
                <DialogDescription className="truncate text-[#4a5159]">
                  {data?.companyName ?? "Daily close prices"}
                  {data?.currency ? ` in ${data.currency}` : ""}.
                </DialogDescription>
              </div>
            </div>
            {summary ? (
              <div className="text-left sm:text-right">
                <p className="text-2xl font-semibold tabular-nums text-[#14181c]">
                  {formatCurrency(summary.latest.close, data?.currency)}
                </p>
                <p
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    summary.change >= 0 ? "text-[#1b8054]" : "text-[#c0392b]"
                  )}
                >
                  {formatSignedCurrency(summary.change, data?.currency)} (
                  {formatSignedPercent(summary.changePercent)})
                </p>
              </div>
            ) : null}
          </div>
        </DialogHeader>
        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
          <StockChartPanel
            data={data}
            error={error}
            isLoading={isLoading}
            symbol={normalizedSymbol}
            tone={tone}
            variant="modal"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StockTickerStyle({ transitionName }: { transitionName: string }) {
  return (
    <style>
      {`
        @media (prefers-reduced-motion: no-preference) {
          ::view-transition-group(${transitionName}) {
            animation-duration: 420ms;
            animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
          }

          ::view-transition-old(${transitionName}),
          ::view-transition-new(${transitionName}) {
            border-radius: 0.5rem;
            height: 100%;
            overflow: clip;
          }

          .stock-ticker-preview > * {
            animation: stockTickerCardIn 320ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
          }

          .stock-ticker-preview > *:nth-child(2) {
            animation-delay: 45ms;
          }

          .stock-ticker-preview > *:nth-child(3) {
            animation-delay: 90ms;
          }

          .stock-ticker-preview > *:nth-child(4) {
            animation-delay: 130ms;
          }

          .stock-ticker-preview > *:nth-child(5) {
            animation-delay: 170ms;
          }

          .stock-ticker-spark-line {
            stroke-dasharray: 520;
            stroke-dashoffset: 520;
            animation: stockTickerDraw 760ms cubic-bezier(0.65, 0, 0.35, 1) 120ms forwards;
          }

          .stock-ticker-spark-tip {
            opacity: 0;
            animation: stockTickerTip 1.6s ease-in-out 880ms infinite;
          }
        }

        @keyframes stockTickerCardIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes stockTickerDraw {
          to { stroke-dashoffset: 0; }
        }

        @keyframes stockTickerTip {
          0% { opacity: 1; r: 3.2; }
          50% { opacity: 1; r: 4; }
          100% { opacity: 1; r: 3.2; }
        }
      `}
    </style>
  )
}

async function readStockData(
  symbol: string,
  getStockData: (symbol: string) => Promise<StockData>,
  cacheTtlMs: number
) {
  const now = Date.now()
  const existing = stockCache.get(symbol)

  if (existing?.data && existing.expiresAt > now) {
    return existing.data
  }

  if (existing?.promise) {
    return existing.promise
  }

  const promise = getStockData(symbol)
    .then((data) => {
      stockCache.set(symbol, {
        data,
        expiresAt: Date.now() + cacheTtlMs,
      })
      return data
    })
    .catch((error) => {
      stockCache.delete(symbol)
      throw error
    })

  stockCache.set(symbol, {
    promise,
    expiresAt: now + cacheTtlMs,
  })

  return promise
}

function StockPreview({
  data,
  error,
  isLoading,
  symbol,
}: {
  data: StockData | null
  error: string | null
  isLoading: boolean
  symbol: string
}) {
  const [range, setRange] = React.useState<RangeKey>("1D")
  const summary = data && data.history.length > 0 ? getStockSummary(data) : null
  const tone = summary && summary.change < 0 ? "down" : "up"
  const visibleHistory = data ? getRangeHistory(data.history, range) : []

  return (
    <div className="stock-ticker-preview overflow-hidden rounded-[14px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <StockGlyph data={data} symbol={symbol} />
          <div className="min-w-0">
            <p className="font-mono text-[13px] font-semibold tracking-[0.02em] text-[#14181c]">
              {symbol}
            </p>
            <p className="max-w-[190px] truncate text-[11.5px] text-[#8a929b]">
              {data?.companyName ?? "Live preview surface"}
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 pt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#8a929b]">
          <span className="size-1.5 rounded-full bg-[#1b8054] shadow-[0_0_0_4px_rgba(27,128,84,0.08)]" />
          Live
        </div>
      </div>

      {summary ? (
        <div className="mt-3 flex items-baseline gap-3">
          <p className="text-[28px] font-semibold leading-none tracking-normal text-[#14181c] tabular-nums">
            {formatCurrency(summary.latest.close, data?.currency)}
          </p>
          <p
            className={cn(
              "inline-flex items-center gap-1 font-mono text-xs font-medium tabular-nums",
              tone === "down" ? "text-[#c0392b]" : "text-[#1b8054]"
            )}
          >
            <span aria-hidden="true">{tone === "down" ? "v" : "^"}</span>
            {formatSignedPercent(summary.changePercent)}
            <span className="ml-1 text-[#8a929b]">today</span>
          </p>
        </div>
      ) : null}

      <StockChartPanel
        data={
          data
            ? {
                ...data,
                history: visibleHistory,
              }
            : null
        }
        error={error}
        isLoading={isLoading}
        symbol={symbol}
        variant="preview"
        tone={tone}
      />

      {data && data.history.length > 0 ? (
        <>
          <div className="grid grid-cols-4 border-t border-[#e7e6e1] pt-3">
            <PreviewMetric
              label="Range"
              value={formatDayRange(data, data.currency)}
            />
            <PreviewMetric label="Vol" value={formatCompactNumber(data.volume)} />
            <PreviewMetric label="M Cap" value={formatCompactNumber(data.marketCap)} />
            <PreviewMetric label="P/E" value={formatRatio(data.peRatio)} />
          </div>
          <div
            className="mt-3 flex gap-0.5 rounded-lg border border-[#e7e6e1] bg-[#faf9f5] p-0.5"
            role="tablist"
            aria-label={`${symbol} chart range`}
          >
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={range === option}
                className={cn(
                  "flex-1 rounded-[5px] px-0 py-1.5 font-mono text-[10px] font-medium tracking-[0.06em] text-[#8a929b] transition hover:text-[#14181c]",
                  range === option &&
                    "bg-white text-[#14181c] shadow-[0_1px_0_rgba(20,24,28,0.06),0_1px_2px_rgba(20,24,28,0.05)]"
                )}
                onClick={(event) => {
                  event.stopPropagation()
                  setRange(option)
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {!data && !isLoading && !error ? (
        <p className="mt-3 rounded-md border border-dashed border-[#d5d4cd] bg-[#faf9f5] p-3 text-sm leading-6 text-[#4a5159]">
          Hover or click to load {symbol}.
        </p>
      ) : null}
    </div>
  )
}

function StockChartPanel({
  data,
  error,
  isLoading,
  symbol,
  tone = "up",
  variant,
}: {
  data: StockData | null
  error: string | null
  isLoading: boolean
  symbol: string
  tone?: "up" | "down"
  variant: "preview" | "modal"
}) {
  const heightClass = variant === "modal" ? "h-72 sm:h-80" : "h-[88px]"
  const compact = variant === "preview"

  if (isLoading) {
    return (
      <div
        className={cn(
          "mt-3 space-y-3 rounded-md border border-[#e7e6e1] bg-[#faf9f5] p-3",
          heightClass
        )}
        aria-label="Loading chart"
      >
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-[calc(100%-1.75rem)] w-full rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={cn(
          "mt-3 flex items-center rounded-md border border-[#efb3aa] bg-[#fbece9] p-4 text-sm leading-6 text-[#9d2f24]",
          heightClass
        )}
        role="alert"
      >
        {error}
      </div>
    )
  }

  if (!data || data.history.length === 0) {
    return compact ? null : (
      <div
        className={cn(
          "mt-4 flex items-center rounded-md border border-dashed border-[#d5d4cd] bg-[#faf9f5] p-4 text-sm leading-6 text-[#4a5159]",
          heightClass
        )}
      >
        No chart data available for {symbol}.
      </div>
    )
  }

  const { first, latest, change, high, low } = getStockSummary(data)
  const resolvedTone = change < 0 ? "down" : tone
  const chartColor = resolvedTone === "down" ? CHART_COLORS.down : CHART_COLORS.up

  if (compact) {
    return (
      <div className="my-3">
        <SparkPreviewSvg color={chartColor} history={data.history} />
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <QuoteMetric label="Start" value={formatCurrency(first.close, data.currency)} />
          <QuoteMetric label="High" value={formatCurrency(high, data.currency)} />
          <QuoteMetric label="Low" value={formatCurrency(low, data.currency)} />
          <QuoteMetric label="As of" value={data.asOf ?? latest.date} />
        </div>
      </div>
      <div
        className={cn(
          "overflow-hidden rounded-md border border-[#d5d4cd] bg-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]",
          heightClass
        )}
      >
        <MeasuredStockChart
          color={chartColor}
          currency={data.currency}
          data={data.history}
          showAxes
          symbol={symbol}
        />
      </div>
    </div>
  )
}

function MeasuredStockChart({
  color,
  currency,
  data,
  showAxes,
  symbol,
}: {
  color: string
  currency: string | undefined
  data: StockHistoryPoint[]
  showAxes: boolean
  symbol: string
}) {
  const chartId = React.useId()
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [size, setSize] = React.useState({ width: 0, height: 0 })

  React.useLayoutEffect(() => {
    const element = containerRef.current

    if (!element) {
      return
    }

    const setMeasuredSize = () => {
      const rect = element.getBoundingClientRect()
      setSize({
        width: Math.floor(rect.width),
        height: Math.floor(rect.height),
      })
    }

    setMeasuredSize()

    if (typeof ResizeObserver === "undefined") {
      return
    }

    const observer = new ResizeObserver(setMeasuredSize)
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  const reduceMotion = usePrefersReducedMotion()
  const width = size.width > 0 ? size.width : 320
  const height = size.height > 0 ? size.height : 320
  const gradientId = `stock-fill-${symbol}-${chartId.replace(/:/g, "")}`

  return (
    <div ref={containerRef} className="h-full min-h-0 w-full min-w-0">
      <AreaChart
        width={width}
        height={height}
        data={data}
        margin={{ left: 0, right: 4, top: 8, bottom: 0 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.24} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          hide={!showAxes}
          tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
          tickLine={false}
          axisLine={false}
          minTickGap={18}
        />
        <YAxis
          domain={["dataMin", "dataMax"]}
          hide={!showAxes}
          tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        {showAxes ? (
          <CartesianGrid
            stroke={CHART_COLORS.line}
            strokeDasharray="3 6"
            vertical={false}
          />
        ) : null}
        <Tooltip
          content={(props) => (
            <StockChartTooltip
              active={props.active}
              currency={currency}
              label={props.label}
              payload={props.payload}
            />
          )}
          cursor={<StockChartCursor color={color} />}
        />
        <Area
          type="monotone"
          dataKey="close"
          stroke={color}
          strokeWidth={2.4}
          fill={`url(#${gradientId})`}
          isAnimationActive={!reduceMotion}
          animationDuration={760}
          animationEasing="ease-out"
          activeDot={{
            r: 5,
            fill: color,
            stroke: CHART_COLORS.paper,
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </div>
  )
}

function SparkPreviewSvg({
  color,
  history,
}: {
  color: string
  history: StockHistoryPoint[]
}) {
  const spark = getSparkPreviewPath(history, 288, 78)
  const gradientId = React.useId()

  if (!spark) {
    return null
  }

  return (
    <svg
      className="h-[88px] w-full overflow-visible"
      viewBox="0 0 288 78"
      preserveAspectRatio="none"
      fill="none"
      focusable="false"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line
        x1="0"
        x2="288"
        y1="39"
        y2="39"
        stroke="#e7e6e1"
        strokeDasharray="2 3"
      />
      <path d={spark.fillD} fill={`url(#${gradientId})`} opacity="0.2" />
      <path
        className="stock-ticker-spark-line"
        d={spark.d}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <circle
        className="stock-ticker-spark-tip"
        cx={spark.last[0]}
        cy={spark.last[1]}
        r="3.2"
        fill="white"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  )
}

function StockChartCursor({
  color,
  height,
  points,
}: {
  color?: string
  height?: number
  points?: ReadonlyArray<{ x?: number; y?: number }>
}) {
  const x = points?.[0]?.x

  if (typeof x !== "number" || typeof height !== "number") {
    return null
  }

  return (
    <g aria-hidden="true">
      <line
        x1={x}
        x2={x}
        y1={8}
        y2={height}
        stroke={color ?? CHART_COLORS.muted}
        strokeDasharray="4 5"
        strokeOpacity={0.72}
      />
      <rect
        x={x - 1}
        y={8}
        width={2}
        height={height - 8}
        fill={color ?? CHART_COLORS.muted}
        opacity={0.12}
      />
    </g>
  )
}

function StockGlyph({
  data,
  symbol,
}: {
  data: StockData | null
  symbol: string
}) {
  return (
    <div
      className="grid size-[30px] shrink-0 place-items-center rounded-lg font-mono text-xs font-semibold tracking-[0.02em] text-white"
      style={{
        background: data?.brandColor ?? fallbackColorForSymbol(symbol),
      }}
      aria-hidden="true"
    >
      {symbol.slice(0, 2)}
    </div>
  )
}

function QuoteMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#e7e6e1] bg-white px-3 py-2">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#8a929b]">
        {label}
      </p>
      <p className="mt-1 font-semibold tabular-nums text-[#14181c]">{value}</p>
    </div>
  )
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-dashed border-[#e7e6e1] px-2 first:pl-0 last:border-r-0 last:pr-0">
      <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#8a929b]">
        {label}
      </p>
      <p className="mt-0.5 truncate font-mono text-[11px] font-medium tabular-nums text-[#14181c]">
        {value}
      </p>
    </div>
  )
}

function StockChartTooltip({
  active,
  currency,
  label,
  payload,
}: {
  active?: boolean
  currency: string | undefined
  label?: string | number
  payload?: ReadonlyArray<{ value?: number | string | ReadonlyArray<number | string> }>
}) {
  if (!active || !payload?.length) {
    return null
  }

  const value = payload[0]?.value

  return (
    <div className="rounded-md border border-[#d5d4cd] bg-white px-3 py-2 text-xs shadow-[0_14px_44px_rgba(20,24,28,0.18)]">
      <p className="font-medium text-[#14181c]">{label}</p>
      <p className="mt-1 tabular-nums text-[#4a5159]">
        {formatTooltipValue(value, currency)}
      </p>
    </div>
  )
}

function usePrefersReducedMotion() {
  const [reduceMotion, setReduceMotion] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updateReduceMotion = () => setReduceMotion(mediaQuery.matches)

    updateReduceMotion()
    mediaQuery.addEventListener("change", updateReduceMotion)

    return () => mediaQuery.removeEventListener("change", updateReduceMotion)
  }, [])

  return reduceMotion
}

function getStockSummary(data: StockData) {
  const first = data.history[0]
  const latest = data.history[data.history.length - 1]
  const closes = data.history.map((point) => point.close)
  const high = Math.max(...closes)
  const low = Math.min(...closes)
  const baseline = data.previousClose ?? first.close
  const change = latest.close - baseline
  const changePercent = baseline === 0 ? 0 : (change / baseline) * 100

  return {
    history: data.history,
    first,
    latest,
    change,
    changePercent,
    high,
    low,
  }
}

function getRangeHistory(history: StockHistoryPoint[], range: RangeKey) {
  if (history.length <= 2) {
    return history
  }

  const countByRange: Record<RangeKey, number> = {
    "1D": 60,
    "5D": 50,
    "1M": 40,
    YTD: 50,
    "1Y": 60,
  }
  const count = countByRange[range]

  if (history.length <= count) {
    return history
  }

  return history.slice(-count)
}

function getSparkPreviewPath(
  history: StockHistoryPoint[],
  width: number,
  height: number
) {
  if (history.length < 2) {
    return null
  }

  const closes = history.map((point) => point.close)
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const range = max - min || 1
  const padX = 4
  const padY = 8
  const stepX = (width - padX * 2) / (history.length - 1)
  const innerHeight = height - padY * 2
  const points = history.map((point, index): [number, number] => [
    padX + index * stepX,
    padY + (1 - (point.close - min) / range) * innerHeight,
  ])

  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`

  for (let index = 1; index < points.length; index += 1) {
    const [x0, y0] = points[index - 1]
    const [x1, y1] = points[index]
    const cx = (x0 + x1) / 2
    d += ` C ${cx.toFixed(2)} ${y0.toFixed(2)}, ${cx.toFixed(2)} ${y1.toFixed(
      2
    )}, ${x1.toFixed(2)} ${y1.toFixed(2)}`
  }

  const first = points[0]
  const last = points[points.length - 1]
  const fillD = `${d} L ${last[0].toFixed(2)} ${height} L ${first[0].toFixed(
    2
  )} ${height} Z`

  return {
    d,
    fillD,
    last,
  }
}

function formatTooltipValue(
  value: number | string | ReadonlyArray<number | string> | undefined,
  currency: string | undefined
) {
  if (typeof value === "number") {
    return formatCurrency(value, currency)
  }

  if (Array.isArray(value)) {
    return value.join(" - ")
  }

  return value
}

function normalizeSymbol(symbol: string) {
  return symbol.replace(/^\$/, "").trim().toUpperCase()
}

function fallbackColorForSymbol(symbol: string) {
  const palette = ["#5b6270", "#3a7aa8", "#1f2429", "#1b8054", "#c0392b", "#a47148"]
  const charTotal = symbol
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0)
  return palette[charTotal % palette.length]
}

function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: Math.abs(value) >= 100 ? 2 : 4,
  }).format(value)
}

function formatCompactNumber(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "N/A"
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function formatDayRange(data: StockData, currency = "USD") {
  const range = data.dayRange

  if (range) {
    return `${formatPlainCurrency(range[0], currency)}-${formatPlainCurrency(
      range[1],
      currency
    )}`
  }

  if (data.history.length === 0) {
    return "N/A"
  }

  const { high, low } = getStockSummary(data)
  return `${formatPlainCurrency(low, currency)}-${formatPlainCurrency(high, currency)}`
}

function formatPlainCurrency(value: number, currency = "USD") {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: Math.abs(value) >= 100 ? 2 : 4,
  }).format(value)

  return formatted.replace(/^[A-Z]{2,3}\s?/, "")
}

function formatRatio(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(1)
    : "N/A"
}

function formatSignedCurrency(value: number, currency = "USD") {
  const formatted = formatCurrency(Math.abs(value), currency)
  return `${value >= 0 ? "+" : "-"}${formatted}`
}

function formatSignedPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}
