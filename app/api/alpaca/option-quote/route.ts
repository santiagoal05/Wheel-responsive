import { type NextRequest, NextResponse } from "next/server"

const ALPACA_DATA_URL = "https://data.alpaca.markets"

// Format option symbol for Alpaca (e.g., AAPL240216P00180000)
function formatOptionSymbol(
  underlying: string,
  expirationDate: string,
  optionType: string,
  strikePrice: number,
): string {
  const expiry = new Date(expirationDate)
  const year = expiry.getFullYear().toString().slice(-2)
  const month = (expiry.getMonth() + 1).toString().padStart(2, "0")
  const day = expiry.getDate().toString().padStart(2, "0")

  const typeCode = optionType.toUpperCase() === "PUT" ? "P" : "C"
  const strike = Math.round(strikePrice * 1000)
    .toString()
    .padStart(8, "0")

  return `${underlying.toUpperCase()}${year}${month}${day}${typeCode}${strike}`
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

    const optionSymbol = formatOptionSymbol(underlying, expirationDate, optionType, strikePrice)
    console.log(`🔍 Fetching quote for: ${optionSymbol}`)

    // Try the latest quotes endpoint
    const url = `${ALPACA_DATA_URL}/v1beta1/options/quotes/latest?symbols=${optionSymbol}`
    console.log(`📡 Request URL: ${url}`)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "APCA-API-KEY-ID": apiKey,
        "APCA-API-SECRET-KEY": secretKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    console.log(`📡 Response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Alpaca API error: ${response.status} ${response.statusText}`)
      console.error(`❌ Error body:`, errorText)

      // Try alternative endpoint if the first one fails
      if (response.status === 404 || response.status === 400) {
        console.log("🔄 Trying alternative endpoint...")
        const altUrl = `${ALPACA_DATA_URL}/v2/options/quotes/latest?symbols=${optionSymbol}`

        const altResponse = await fetch(altUrl, {
          method: "GET",
          headers: {
            "APCA-API-KEY-ID": apiKey,
            "APCA-API-SECRET-KEY": secretKey,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })

        if (!altResponse.ok) {
          return NextResponse.json(
            {
              success: false,
              error: `Both endpoints failed: ${response.status} and ${altResponse.status}`,
              symbol: optionSymbol,
            },
            { status: 404 },
          )
        }

        const altData = await altResponse.json()
        console.log("📊 Alternative response data:", JSON.stringify(altData, null, 2))

        if (altData.quotes && altData.quotes[optionSymbol]) {
          const quote = altData.quotes[optionSymbol]
          // Calculate mid price from bid/ask, fallback to last price
          const midPrice = quote.bp && quote.ap ? (quote.bp + quote.ap) / 2 : quote.last || quote.ap || quote.bp

          if (midPrice && midPrice > 0) {
            console.log(`✅ Got price from alt endpoint: $${midPrice}`)
            return NextResponse.json({
              success: true,
              symbol: optionSymbol,
              price: midPrice,
              bid: quote.bp,
              ask: quote.ap,
              last: quote.last,
              source: "v2",
            })
          }
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: `API Error: ${response.status}`,
          details: errorText,
          symbol: optionSymbol,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("📊 Response data:", JSON.stringify(data, null, 2))

    if (data.quotes && data.quotes[optionSymbol]) {
      const quote = data.quotes[optionSymbol]
      console.log(`📊 Quote details:`, JSON.stringify(quote, null, 2))

      // Extract price data - Alpaca uses different field names
      // ap = ask price, bp = bid price, last = last trade price
      const askPrice = quote.ap || quote.ask
      const bidPrice = quote.bp || quote.bid
      const lastPrice = quote.last

      // Calculate mid price from bid/ask, fallback to last price
      let midPrice = null

      if (bidPrice && askPrice && bidPrice > 0 && askPrice > 0) {
        midPrice = (bidPrice + askPrice) / 2
        console.log(`💰 Calculated mid price from bid ($${bidPrice}) and ask ($${askPrice}): $${midPrice}`)
      } else if (lastPrice && lastPrice > 0) {
        midPrice = lastPrice
        console.log(`💰 Using last price: $${midPrice}`)
      } else if (askPrice && askPrice > 0) {
        midPrice = askPrice
        console.log(`💰 Using ask price: $${midPrice}`)
      } else if (bidPrice && bidPrice > 0) {
        midPrice = bidPrice
        console.log(`💰 Using bid price: $${midPrice}`)
      }

      if (midPrice && midPrice > 0) {
        console.log(`✅ Final price for ${optionSymbol}: $${midPrice}`)
        return NextResponse.json({
          success: true,
          symbol: optionSymbol,
          price: midPrice,
          bid: bidPrice,
          ask: askPrice,
          last: lastPrice,
          source: "v1beta1",
        })
      } else {
        console.log(`⚠️ No valid price found in quote data:`, quote)
        return NextResponse.json(
          {
            success: false,
            error: "No valid price data in quote",
            symbol: optionSymbol,
            quoteData: quote,
          },
          { status: 404 },
        )
      }
    }

    console.log(`⚠️ No quote data found for ${optionSymbol}`)
    return NextResponse.json(
      {
        success: false,
        error: "No quote data found",
        symbol: optionSymbol,
        responseData: data,
      },
      { status: 404 },
    )
  } catch (error: any) {
    console.error("❌ Server error fetching option quote:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
