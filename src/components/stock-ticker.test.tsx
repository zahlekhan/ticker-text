import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { StockTicker, type StockData } from "@/components/stock-ticker"

function makeStockData(symbol: string): StockData {
  return {
    symbol,
    currency: "USD",
    asOf: "2026-05-07",
    history: [
      { date: "2026-05-06", close: 100 },
      { date: "2026-05-07", close: 110 },
    ],
  }
}

describe("StockTicker", () => {
  it("loads data on hover", async () => {
    const getStockData = vi.fn().mockResolvedValue(makeStockData("TSLA"))

    render(
      <StockTicker
        symbol="TSLA"
        getStockData={getStockData}
        hoverDelayMs={0}
        cacheTtlMs={1}
      />
    )

    await userEvent.hover(screen.getByRole("button", { name: "$TSLA" }))

    await waitFor(() => {
      expect(getStockData).toHaveBeenCalledWith("TSLA")
    })
  })

  it("opens a modal on click and reuses cached data", async () => {
    const getStockData = vi.fn().mockResolvedValue(makeStockData("AAPL"))

    render(
      <StockTicker
        symbol="AAPL"
        getStockData={getStockData}
        hoverDelayMs={0}
        cacheTtlMs={60_000}
      />
    )

    const button = screen.getByRole("button", { name: "$AAPL" })
    await userEvent.hover(button)

    await waitFor(() => {
      expect(getStockData).toHaveBeenCalledTimes(1)
    })

    await userEvent.click(button)

    expect(
      await screen.findByRole("dialog", { name: "AAPL price history" })
    ).toBeInTheDocument()
    expect(getStockData).toHaveBeenCalledTimes(1)
  })

  it("renders an error state without crashing", async () => {
    const getStockData = vi.fn().mockRejectedValue(new Error("No API key"))

    render(
      <StockTicker
        symbol="MSFT"
        getStockData={getStockData}
        hoverDelayMs={0}
        cacheTtlMs={1}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "$MSFT" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("No API key")
  })
})
