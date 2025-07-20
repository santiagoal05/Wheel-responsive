import { type NextRequest, NextResponse } from "next/server"

const ALPACA_DATA_URL = "https://data.alpaca.markets"

// Generate multiple possible option symbol formats
function generateOptionSymbolVariants(
  underlying: string,
  expirationDate: string,
  optionType: string,
  strikePrice: number,
): string[] {
  const expiry = new Date(expirationDate)
  const year = expiry.getFullYear().toString().slice(-2)
  const month = (expiry.getMonth() + 1).toString().padStart(2, "0")
  const day = expiry.getDate().toString().padStart(2, "0")
  const typeCode = optionType.toUpperCase() === "PUT" ? "P" : "C"

  // Try different strike price formats
  const strike1 = Math.round(strikePrice * 1000)
    .toString()
    .padStart(8, "0") // Standard format
  const strike2 = Math.round(strikePrice * 100)
    .toString()
    .padStart(8, "0") // Alternative format
  const strike3 = Math.round(strikePrice).toString().padStart(8, "0") // Integer format

  const variants = [
    `${underlying.toUpperCase()}${year}${month}${day}${typeCode}${strike1}`,
    `${underlying.toUpperCase()}${year}${month}${day}${typeCode}${strike2}`,
    `${underlying.toUpperCase()}${year}${month}${day}${typeCode}${strike3}`,
  ]

  // Remove duplicates
  return [...new Set(variants)]
}

// Check if option has expired
function isExpired(expirationDate: string): boolean {
  const expiry = new Date(expirationDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return expiry < today
}

// Get the next Friday (standard option expiration)
function getNextFriday(date: Date): Date {
  const result = new Date(date)
  const dayOfWeek = result.getDay()
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7
  result.setDate(result.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday))
  return result
}

// Suggest alternative expiration dates
function suggestAlternativeExpirations(expirationDate: string): string[] {
  const expiry = new Date(expirationDate)
  const suggestions = []

  // Try the next Friday
  const nextFriday = getNextFriday(expiry)
  suggestions.push(nextFriday.toISOString().split("T")[0])

  // Try third Friday of the month (monthly options)
  const thirdFriday = new Date(expiry.getFullYear(), expiry.getMonth(), 1)
  thirdFriday.setDate(1 + ((5 - thirdFriday.getDay() + 7) % 7) + 14) // Third Friday
  suggestions.push(thirdFriday.toISOString().split("T")[0])

  // Try end of month
  const endOfMonth = new Date(expiry.getFullYear(), expiry.getMonth() + 1, 0)
  suggestions.push(endOfMonth.toISOString().split("T")[0])

  return [...new Set(suggestions)]
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ALPACA_API_KEY || process.env.NEXT_PUBLIC_ALPACA_API_KEY
    const secretKey = process.env.ALPACA_SECRET_KEY || process.env.NEXT_PUBLIC_ALPACA_SECRET_KEY

    if (!apiKey || !secretKey) {
      return NextResponse.json({ success: false, error: "Alpaca API credentials not configured" }, { status: 400 })
    }

    const { underlying, expirationDate, optionType, strikePrice } = await request.json()

    if (!underlying || !expirationDate || !optionType || !strikePrice) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    console.log(`🔍 Smart search for: ${underlying} ${optionType} $${strikePrice} exp ${expirationDate}`)

    const analysis = {
      underlying,
      expirationDate,
      optionType,
      strikePrice,
      isExpired: isExpired(expirationDate),
      daysToExpiry: Math.ceil((new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      symbolVariants: generateOptionSymbolVariants(underlying, expirationDate, optionType, strikePrice),
      alternativeExpirations: suggestAlternativeExpirations(expirationDate),
      testResults: [] as any[],
      recommendations: [] as string[],
    }

    // Test each symbol variant
    for (const symbol of analysis.symbolVariants) {
      console.log(`🧪 Testing symbol variant: ${symbol}`)

      try {
        const url = `${ALPACA_DATA_URL}/v1beta1/options/quotes/latest?symbols=${symbol}`
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "APCA-API-KEY-ID": apiKey,
            "APCA-API-SECRET-KEY": secretKey,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })

        const responseData = response.ok ? await response.json() : null
        const hasQuote = responseData?.quotes && responseData.quotes[symbol]

        analysis.testResults.push({
          symbol,
          status: response.status,
          success: response.ok,
          hasQuote,
          data: hasQuote ? responseData.quotes[symbol] : null,
        })

        if (hasQuote) {
          console.log(`✅ Found quote for ${symbol}`)
          break // Found a working symbol, no need to test others
        }
      } catch (error: any) {
        analysis.testResults.push({
          symbol,
          status: "error",
          success: false,
          error: error.message,
        })
      }
    }

    // Generate recommendations based on analysis
    if (analysis.isExpired) {
      analysis.recommendations.push("⚠️ This option has expired. Consider marking the trade as 'expired' or 'closed'.")
    }

    if (analysis.daysToExpiry < 0) {
      analysis.recommendations.push("📅 This option expired. You should close this position in your tracker.")
    }

    if (analysis.daysToExpiry > 365) {
      analysis.recommendations.push(
        "📅 This option is very far out. Alpaca may not have data for options this far in the future.",
      )
    }

    const hasWorkingQuote = analysis.testResults.some((r) => r.hasQuote)
    if (!hasWorkingQuote) {
      analysis.recommendations.push(
        "🔍 No quotes found for any symbol variant. This option may not exist or may not be actively traded.",
      )
      analysis.recommendations.push(
        "💡 Try checking if the expiration date is a standard option expiration (usually Fridays).",
      )
      analysis.recommendations.push("💡 Consider manually entering the current price if you know it from your broker.")
    }

    // Check if underlying is actively traded
    if (["SOFI", "ASTS"].includes(underlying.toUpperCase())) {
      analysis.recommendations.push("📊 This is a smaller/newer stock. Options data may be limited or delayed.")
    }

    return NextResponse.json({
      success: true,
      analysis,
      foundQuote: hasWorkingQuote,
      workingSymbol: analysis.testResults.find((r) => r.hasQuote)?.symbol,
      price: analysis.testResults.find((r) => r.hasQuote)?.data
        ? (() => {
            const quote = analysis.testResults.find((r) => r.hasQuote)?.data
            const askPrice = quote.ap || quote.ask
            const bidPrice = quote.bp || quote.bid
            const lastPrice = quote.last
            return bidPrice && askPrice ? (bidPrice + askPrice) / 2 : lastPrice || askPrice || bidPrice
          })()
        : null,
    })
  } catch (error: any) {
    console.error("❌ Error in smart option search:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
