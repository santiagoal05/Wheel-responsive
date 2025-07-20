// Alpaca Markets API client for options data - Client-side wrapper for server API calls

class AlpacaClient {
  constructor() {
    console.log("✅ Alpaca client initialized (using server-side API)")
  }

  // Test connection via our server-side API
  async testConnection(): Promise<boolean> {
    try {
      console.log("🔍 Testing Alpaca connection via server API...")

      const response = await fetch("/api/alpaca/test-connection", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      console.log("📡 Server response:", data)

      if (data.success) {
        console.log("✅ Alpaca connection successful via server")
        return true
      } else {
        console.error("❌ Alpaca connection failed:", data.error)
        console.error("❌ Details:", data.details)
        return false
      }
    } catch (error: any) {
      console.error("❌ Error testing Alpaca connection:", error)
      return false
    }
  }

  // Get option quote via our server-side API
  async getOptionQuote(
    underlying: string,
    expirationDate: string,
    optionType: string,
    strikePrice: number,
  ): Promise<number | null> {
    try {
      console.log(`🔍 Getting option quote for: ${underlying} ${optionType} $${strikePrice}`)

      const response = await fetch("/api/alpaca/option-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          underlying,
          expirationDate,
          optionType,
          strikePrice,
        }),
      })

      const data = await response.json()
      console.log("📊 Quote response:", data)

      if (data.success && data.price !== null && data.price !== undefined) {
        console.log(`✅ Got option price: $${data.price}`)
        return data.price
      } else {
        console.log(`⚠️ No price available: ${data.error}`)
        return null
      }
    } catch (error: any) {
      console.error("❌ Error fetching option quote:", error)
      return null
    }
  }

  // Get multiple option quotes (sequential to avoid rate limits)
  async getMultipleOptionQuotes(
    trades: Array<{
      underlying: string
      expirationDate: string
      optionType: string
      strikePrice: number
    }>,
  ): Promise<{ [key: string]: number }> {
    const results: { [key: string]: number } = {}

    console.log(`🔄 Fetching quotes for ${trades.length} trades...`)

    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i]
      console.log(`📊 Processing trade ${i + 1}/${trades.length}: ${trade.underlying}`)

      try {
        const price = await this.getOptionQuote(
          trade.underlying,
          trade.expirationDate,
          trade.optionType,
          trade.strikePrice,
        )

        const key = `${trade.underlying}_${trade.optionType}_${trade.strikePrice}_${trade.expirationDate}`

        if (price !== null) {
          results[key] = price
          console.log(`✅ ${trade.underlying}: $${price}`)
        } else {
          console.log(`⚠️ ${trade.underlying}: No price available`)
        }

        // Add delay between requests
        if (i < trades.length - 1) {
          console.log("⏳ Waiting 1 second before next request...")
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      } catch (error: any) {
        console.error(`❌ Error processing ${trade.underlying}:`, error)
        continue
      }
    }

    console.log(`🎯 Completed: ${Object.keys(results).length}/${trades.length} quotes retrieved`)
    return results
  }
}

export const alpacaClient = new AlpacaClient()
