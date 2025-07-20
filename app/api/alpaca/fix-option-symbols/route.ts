import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const ALPACA_DATA_URL = "https://data.alpaca.markets"

// Generate multiple possible option symbol formats and test them
async function findWorkingSymbol(
  underlying: string,
  expirationDate: string,
  optionType: string,
  strikePrice: number,
  apiKey: string,
  secretKey: string,
): Promise<{ symbol: string; price: number } | null> {
  const expiry = new Date(expirationDate)
  const year = expiry.getFullYear().toString().slice(-2)
  const month = (expiry.getMonth() + 1).toString().padStart(2, "0")
  const day = expiry.getDate().toString().padStart(2, "0")
  const typeCode = optionType.toUpperCase() === "PUT" ? "P" : "C"

  // Try different strike price formats
  const strikeFormats = [
    Math.round(strikePrice * 1000)
      .toString()
      .padStart(8, "0"), // Standard: $8.00 -> 00008000
    Math.round(strikePrice * 100)
      .toString()
      .padStart(8, "0"), // Alternative: $8.00 -> 00000800
    Math.round(strikePrice)
      .toString()
      .padStart(8, "0"), // Integer: $8.00 -> 00000008
    Math.round(strikePrice * 10000)
      .toString()
      .padStart(8, "0"), // High precision: $8.00 -> 00080000
  ]

  const symbolVariants = strikeFormats.map(
    (strike) => `${underlying.toUpperCase()}${year}${month}${day}${typeCode}${strike}`,
  )

  console.log(`🔍 Testing ${symbolVariants.length} symbol variants for ${underlying}...`)

  for (const symbol of symbolVariants) {
    try {
      console.log(`🧪 Testing: ${symbol}`)

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

      if (response.ok) {
        const data = await response.json()
        if (data.quotes && data.quotes[symbol]) {
          const quote = data.quotes[symbol]
          const askPrice = quote.ap || quote.ask
          const bidPrice = quote.bp || quote.bid
          const lastPrice = quote.last

          // Calculate mid price
          let midPrice = null
          if (bidPrice && askPrice && bidPrice > 0 && askPrice > 0) {
            midPrice = (bidPrice + askPrice) / 2
          } else if (lastPrice && lastPrice > 0) {
            midPrice = lastPrice
          } else if (askPrice && askPrice > 0) {
            midPrice = askPrice
          } else if (bidPrice && bidPrice > 0) {
            midPrice = bidPrice
          }

          if (midPrice && midPrice > 0) {
            console.log(`✅ Found working symbol: ${symbol} = $${midPrice}`)
            return { symbol, price: midPrice }
          }
        }
      }

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error) {
      console.log(`❌ Error testing ${symbol}:`, error)
      continue
    }
  }

  console.log(`⚠️ No working symbol found for ${underlying}`)
  return null
}

export async function POST() {
  try {
    const apiKey = process.env.ALPACA_API_KEY || process.env.NEXT_PUBLIC_ALPACA_API_KEY
    const secretKey = process.env.ALPACA_SECRET_KEY || process.env.NEXT_PUBLIC_ALPACA_SECRET_KEY

    if (!apiKey || !secretKey) {
      return NextResponse.json({ success: false, error: "Alpaca API credentials not configured" }, { status: 400 })
    }

    console.log("🔧 Starting smart option symbol fix...")

    // Get all open trades without current prices
    const { data: trades, error } = await supabase
      .from("trades")
      .select("*")
      .eq("status", "open")
      .or("current_option_price.is.null,current_option_price.eq.0")

    if (error) {
      return NextResponse.json({ success: false, error: `Database error: ${error.message}` }, { status: 500 })
    }

    if (!trades || trades.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No trades need price updates",
        updated: 0,
        failed: 0,
        details: [],
      })
    }

    console.log(`📊 Found ${trades.length} trades needing price updates`)

    const results = {
      updated: 0,
      failed: 0,
      details: [] as Array<{
        tradeId: string
        symbol: string
        success: boolean
        price?: number
        workingSymbol?: string
        error?: string
      }>,
    }

    // Process each trade with smart symbol detection
    for (const trade of trades) {
      try {
        console.log(`🔍 Processing ${trade.underlying} ${trade.option_type} $${trade.strike_price}`)

        const result = await findWorkingSymbol(
          trade.underlying,
          trade.expiration_date,
          trade.option_type,
          Number.parseFloat(trade.strike_price),
          apiKey,
          secretKey,
        )

        if (result) {
          // Update the trade with the found price and working symbol
          const { error: updateError } = await supabase
            .from("trades")
            .update({
              current_option_price: result.price,
              last_price_update: new Date().toISOString(),
              price_source: "alpaca_smart",
              updated_at: new Date().toISOString(),
            })
            .eq("id", trade.id)

          if (updateError) {
            results.failed++
            results.details.push({
              tradeId: trade.id,
              symbol: trade.underlying,
              success: false,
              error: `Database update failed: ${updateError.message}`,
            })
          } else {
            results.updated++
            results.details.push({
              tradeId: trade.id,
              symbol: trade.underlying,
              success: true,
              price: result.price,
              workingSymbol: result.symbol,
            })
            console.log(`✅ Updated ${trade.underlying}: $${result.price.toFixed(2)} (${result.symbol})`)
          }
        } else {
          results.failed++
          results.details.push({
            tradeId: trade.id,
            symbol: trade.underlying,
            success: false,
            error: "No working symbol format found",
          })
          console.log(`⚠️ Could not find price for ${trade.underlying}`)
        }

        // Delay between trades to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error: any) {
        results.failed++
        results.details.push({
          tradeId: trade.id,
          symbol: trade.underlying,
          success: false,
          error: error.message,
        })
      }
    }

    console.log(`🎯 Smart fix complete: ${results.updated} updated, ${results.failed} failed`)

    return NextResponse.json({
      success: true,
      message: `Smart symbol fix complete`,
      ...results,
    })
  } catch (error: any) {
    console.error("❌ Error in smart symbol fix:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
