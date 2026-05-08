import { describe, expect, it } from "vitest"

import { getMockStockData } from "@/lib/mock-stock-data"

describe("getMockStockData", () => {
  it("returns deterministic mock stock data", async () => {
    const data = await getMockStockData("TSLA")

    expect(data.symbol).toBe("TSLA")
    expect(data.currency).toBe("USD")
    expect(data.history.length).toBeGreaterThan(0)
    expect(data.history.at(-1)?.date).toBe(data.asOf)
  })

  it("throws a readable error for unsupported mock symbols", async () => {
    await expect(getMockStockData("SHOP")).rejects.toThrow(
      "No mock data available for SHOP."
    )
  })
})
