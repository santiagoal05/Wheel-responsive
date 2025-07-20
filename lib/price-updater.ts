interface PriceUpdateResult {
  updated: number
  failed: number
  errors: string[]
  details: Array<{
    symbol: string
    success: boolean
    price?: number
    error?: string
  }>
}

export class PriceUpdater {
  private isUpdating = false

  async updateAllOptionPrices(): Promise<PriceUpdateResult> {
    if (this.isUpdating) {
      console.log("Price update already in progress")
      return { updated: 0, failed: 0, errors: ["Update already in progress"], details: [] }
    }

    this.isUpdating = true

    try {
      console.log("🔄 Starting price update via server API...")

      const response = await fetch("/api/alpaca/update-prices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()
      console.log("📊 Update result:", result)

      if (result.success) {
        console.log(`🎯 Price update complete: ${result.updated} updated, ${result.failed} failed`)
        return {
          updated: result.updated,
          failed: result.failed,
          errors: [],
          details: result.details || [],
        }
      } else {
        console.error("❌ Price update failed:", result.error)
        return {
          updated: 0,
          failed: 0,
          errors: [result.error],
          details: [],
        }
      }
    } catch (error: any) {
      console.error("❌ Error updating prices:", error)
      return {
        updated: 0,
        failed: 0,
        errors: [error.message],
        details: [],
      }
    } finally {
      this.isUpdating = false
    }
  }

  async updateSingleTrade(tradeId: string): Promise<boolean> {
    try {
      console.log(`🔄 Updating single trade: ${tradeId}`)

      // For now, we'll use the bulk update API
      // In the future, we could create a specific single-trade endpoint
      const result = await this.updateAllOptionPrices()
      return result.updated > 0
    } catch (error) {
      console.error("Error updating single trade:", error)
      return false
    }
  }

  // Schedule automatic updates
  startAutoUpdates(intervalMinutes = 60) {
    console.log(`🕐 Starting automatic price updates every ${intervalMinutes} minutes`)

    // Run immediately
    this.updateAllOptionPrices()

    // Then run on interval
    setInterval(
      () => {
        this.updateAllOptionPrices()
      },
      intervalMinutes * 60 * 1000,
    )
  }
}

export const priceUpdater = new PriceUpdater()
