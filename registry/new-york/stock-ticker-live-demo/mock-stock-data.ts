import type { StockData, StockHistoryPoint } from "@/components/stock-ticker"

type MockStockProfile = {
  symbol: string
  companyName: string
  brandColor: string
  price: number
  deltaPercent: number
  dayRange: [number, number]
  volume: number
  marketCap: number
  peRatio: number
  seed: number
}

const mockProfiles: Record<string, MockStockProfile> = {
  MSFT: {
    symbol: "MSFT",
    companyName: "Microsoft Corp.",
    brandColor: "#5b6270",
    price: 421.18,
    deltaPercent: 1.42,
    dayRange: [418.04, 423.91],
    volume: 21_400_000,
    marketCap: 3_130_000_000_000,
    peRatio: 36.2,
    seed: 11,
  },
  GOOGL: {
    symbol: "GOOGL",
    companyName: "Alphabet Inc. Class A",
    brandColor: "#3a7aa8",
    price: 174.62,
    deltaPercent: 2.18,
    dayRange: [170.91, 175.4],
    volume: 32_800_000,
    marketCap: 2_180_000_000_000,
    peRatio: 27.4,
    seed: 21,
  },
  AAPL: {
    symbol: "AAPL",
    companyName: "Apple Inc.",
    brandColor: "#1f2429",
    price: 188.04,
    deltaPercent: -0.62,
    dayRange: [187.1, 190.55],
    volume: 48_100_000,
    marketCap: 2_860_000_000_000,
    peRatio: 29.7,
    seed: 5,
  },
  NVDA: {
    symbol: "NVDA",
    companyName: "NVIDIA Corp.",
    brandColor: "#1b8054",
    price: 938.41,
    deltaPercent: 4.07,
    dayRange: [905.2, 942.18],
    volume: 55_700_000,
    marketCap: 2_310_000_000_000,
    peRatio: 72.1,
    seed: 33,
  },
  TSLA: {
    symbol: "TSLA",
    companyName: "Tesla, Inc.",
    brandColor: "#c0392b",
    price: 246.91,
    deltaPercent: -1.84,
    dayRange: [244.5, 252.18],
    volume: 67_200_000,
    marketCap: 789_000_000_000,
    peRatio: 62.4,
    seed: 17,
  },
  AMZN: {
    symbol: "AMZN",
    companyName: "Amazon.com, Inc.",
    brandColor: "#a47148",
    price: 198.23,
    deltaPercent: 0.91,
    dayRange: [195.8, 199.4],
    volume: 29_500_000,
    marketCap: 2_070_000_000_000,
    peRatio: 44.8,
    seed: 9,
  },
  META: {
    symbol: "META",
    companyName: "Meta Platforms",
    brandColor: "#3b5da6",
    price: 512.4,
    deltaPercent: -2.31,
    dayRange: [509.2, 521.18],
    volume: 18_600_000,
    marketCap: 1_300_000_000_000,
    peRatio: 26.9,
    seed: 27,
  },
}

const mockStocks = Object.fromEntries(
  Object.entries(mockProfiles).map(([symbol, profile]) => [
    symbol,
    buildMockStock(profile),
  ])
) as Record<string, StockData>

export async function getMockStockData(symbol: string): Promise<StockData> {
  await new Promise((resolve) => window.setTimeout(resolve, 280))

  const normalizedSymbol = symbol.replace(/^\$/, "").trim().toUpperCase()
  const stock = mockStocks[normalizedSymbol]

  if (!stock) {
    throw new Error(`No mock data available for ${normalizedSymbol}.`)
  }

  return stock
}

function buildMockStock(profile: MockStockProfile): StockData {
  const previousClose = profile.price / (1 + profile.deltaPercent / 100)

  return {
    symbol: profile.symbol,
    currency: "USD",
    asOf: "2026-05-07",
    companyName: profile.companyName,
    exchange: "NASDAQ",
    previousClose,
    dayRange: profile.dayRange,
    volume: profile.volume,
    marketCap: profile.marketCap,
    peRatio: profile.peRatio,
    brandColor: profile.brandColor,
    history: buildHistory(profile, previousClose),
  }
}

function buildHistory(
  profile: MockStockProfile,
  previousClose: number
): StockHistoryPoint[] {
  const count = 90
  const values = normalizedWalk(profile.seed, count, profile.deltaPercent >= 0)
  const firstClose =
    previousClose * (profile.deltaPercent >= 0 ? 0.94 : 1.08)
  const asOfDate = new Date("2026-05-07T00:00:00.000Z")

  return values.map((value, index) => {
    const t = index / (count - 1)
    const trend = firstClose + (profile.price - firstClose) * t
    const wave = (value - 0.5) * profile.price * 0.045
    const close = index === count - 1 ? profile.price : roundMoney(trend + wave)
    const open = roundMoney(close * (1 + (value - 0.5) * 0.006))
    const high = roundMoney(Math.max(open, close) * (1 + value * 0.004))
    const low = roundMoney(Math.min(open, close) * (1 - (1 - value) * 0.004))
    const date = new Date(asOfDate)
    date.setUTCDate(asOfDate.getUTCDate() - (count - 1 - index))

    return {
      date: date.toISOString().slice(0, 10),
      open,
      high,
      low,
      close,
      volume: Math.round(profile.volume * (0.72 + value * 0.56)),
    }
  })
}

function normalizedWalk(seed: number, count: number, positiveBias: boolean) {
  let state = seed
  const points: number[] = []

  for (let index = 0; index < count; index += 1) {
    state = (state * 9301 + 49297) % 233280
    const random = state / 233280
    const t = index / (count - 1)
    const trend = (positiveBias ? 1 : -1) * (t - 0.5) * 0.35
    const wave = Math.sin(t * 12 + seed) * 0.24
    points.push(trend + wave + (random - 0.5) * 0.18)
  }

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1

  return points.map((point) => (point - min) / range)
}

function roundMoney(value: number) {
  return Number(value.toFixed(2))
}
