import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("🔍 Debugging trades without prices...")

    // Get all open trades
    const { data: trades, error } = await supabase.from("trades").select("*").eq("status", "open")

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!trades || trades.length === 0) {
      return NextResponse.json({ success: true, message: "No open trades found", trades: [] })
    }

    // Analyze each trade
    const tradeAnalysis = trades.map((trade) => {
      const hasPrice = trade.current_option_price !== null && trade.current_option_price !== undefined

      // Format option symbol for debugging
      const expiry = new Date(trade.expiration_date)
      const year = expiry.getFullYear().toString().slice(-2)
      const month = (expiry.getMonth() + 1).toString().padStart(2, "0")
      const day = expiry.getDate().toString().padStart(2, "0")
      const typeCode = trade.option_type.toUpperCase() === "PUT" ? "P" : "C"
      const strike = Math.round(Number.parseFloat(trade.strike_price) * 1000)
        .toString()
        .padStart(8, "0")
      const optionSymbol = `${trade.underlying}${year}${month}${day}${typeCode}${strike}`

      return {
        id: trade.id,
        underlying: trade.underlying,
        optionType: trade.option_type,
        strikePrice: trade.strike_price,
        expirationDate: trade.expiration_date,
        currentPrice: trade.current_option_price,
        hasPrice: hasPrice,
        lastUpdate: trade.last_price_update,
        optionSymbol: optionSymbol,
        daysToExpiry: Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      }
    })

    const missingPrices = tradeAnalysis.filter((t) => !t.hasPrice)
    const withPrices = tradeAnalysis.filter((t) => t.hasPrice)

    return NextResponse.json({
      success: true,
      summary: {
        total: trades.length,
        withPrices: withPrices.length,
        missingPrices: missingPrices.length,
      },
      trades: tradeAnalysis,
      missingPricesTrades: missingPrices,
    })
  } catch (error: any) {
    console.error("❌ Error debugging trades:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
