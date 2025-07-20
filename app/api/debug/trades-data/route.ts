import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("🔍 Debugging trades data flow...")

    // Get raw data from database
    const { data: rawTrades, error } = await supabase.from("trades").select("*").eq("status", "open")

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Analyze the data structure
    const analysis = {
      totalTrades: rawTrades?.length || 0,
      rawSample: rawTrades?.[0] || null,
      fieldAnalysis: {},
      transformationTest: null,
    }

    if (rawTrades && rawTrades.length > 0) {
      // Analyze each field
      const sampleTrade = rawTrades[0]
      analysis.fieldAnalysis = {
        current_option_price: {
          value: sampleTrade.current_option_price,
          type: typeof sampleTrade.current_option_price,
          isNull: sampleTrade.current_option_price === null,
          isUndefined: sampleTrade.current_option_price === undefined,
          isZero: sampleTrade.current_option_price === 0,
          stringValue: String(sampleTrade.current_option_price),
        },
        strike_price: {
          value: sampleTrade.strike_price,
          type: typeof sampleTrade.strike_price,
          parsed: Number.parseFloat(sampleTrade.strike_price),
        },
        premium_received: {
          value: sampleTrade.premium_received,
          type: typeof sampleTrade.premium_received,
          parsed: Number.parseFloat(sampleTrade.premium_received),
        },
      }

      // Test the transformation that happens in useTradesData
      try {
        const transformedTrade = {
          id: sampleTrade.id,
          underlying: sampleTrade.underlying,
          optionType: sampleTrade.option_type,
          strikePrice: Number.parseFloat(sampleTrade.strike_price),
          expirationDate: sampleTrade.expiration_date,
          premiumReceived: Number.parseFloat(sampleTrade.premium_received),
          dateSold: sampleTrade.date_sold,
          quantity: sampleTrade.quantity,
          status: sampleTrade.status,
          currentPrice: Number.parseFloat(sampleTrade.current_price || "0"),
          currentOptionPrice: sampleTrade.current_option_price
            ? Number.parseFloat(sampleTrade.current_option_price)
            : undefined,
          profitLoss: sampleTrade.profit_loss ? Number.parseFloat(sampleTrade.profit_loss) : undefined,
        }

        analysis.transformationTest = {
          original: {
            current_option_price: sampleTrade.current_option_price,
            current_price: sampleTrade.current_price,
          },
          transformed: {
            currentOptionPrice: transformedTrade.currentOptionPrice,
            currentPrice: transformedTrade.currentPrice,
          },
          checks: {
            currentOptionPriceExists: transformedTrade.currentOptionPrice !== undefined,
            currentOptionPriceIsNumber: typeof transformedTrade.currentOptionPrice === "number",
            currentOptionPriceValue: transformedTrade.currentOptionPrice,
          },
        }
      } catch (transformError: any) {
        analysis.transformationTest = { error: transformError.message }
      }
    }

    // Get trades with missing prices specifically
    const tradesWithMissingPrices = rawTrades?.filter(
      (trade) => trade.current_option_price === null || trade.current_option_price === undefined,
    )

    const tradesWithPrices = rawTrades?.filter(
      (trade) => trade.current_option_price !== null && trade.current_option_price !== undefined,
    )

    return NextResponse.json({
      success: true,
      analysis,
      summary: {
        total: rawTrades?.length || 0,
        withPrices: tradesWithPrices?.length || 0,
        missingPrices: tradesWithMissingPrices?.length || 0,
      },
      tradesWithPrices: tradesWithPrices?.map((t) => ({
        id: t.id,
        underlying: t.underlying,
        current_option_price: t.current_option_price,
        type_of_price: typeof t.current_option_price,
        last_update: t.last_price_update,
      })),
      tradesWithMissingPrices: tradesWithMissingPrices?.map((t) => ({
        id: t.id,
        underlying: t.underlying,
        current_option_price: t.current_option_price,
        type_of_price: typeof t.current_option_price,
      })),
    })
  } catch (error: any) {
    console.error("❌ Error debugging trades data:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
