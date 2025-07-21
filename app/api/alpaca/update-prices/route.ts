import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST() {
  try {
    console.log("🔄 Starting server-side price update...")

    // Get all open trades from Supabase
    const { data: trades, error } = await supabase.from("trades").select("*").eq("status", "open")

    if (error) {
      return NextResponse.json({ success: false, error: `Database error: ${error.message}` }, { status: 500 })
    }

    if (!trades || trades.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No open trades found",
        updated: 0,
        failed: 0,
        details: [],
      })
    }

    console.log(`📊 Found ${trades.length} open trades to update`)

    const results = {
      updated: 0,
      failed: 0,
      details: [] as Array<{
        symbol: string
        success: boolean
        price?: number
        error?: string
      }>,
    }

    // Process each trade
    for (const trade of trades) {
      try {
        console.log(`🔍 Processing ${trade.underlying} ${trade.option_type} $${trade.strike_price}`)

        // Call our own API route to get the option quote
        const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT || 3002}`

        const quoteResponse = await fetch(`${baseUrl}/api/alpaca/option-quote`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            underlying: trade.underlying,
            expirationDate: trade.expiration_date,
            optionType: trade.option_type,
            strikePrice: Number.parseFloat(trade.strike_price),
          }),
        })

        if (quoteResponse.ok) {
          const quoteData = await quoteResponse.json()

          if (quoteData.success && quoteData.price !== null && quoteData.price !== undefined) {
            // Update the trade in the database
            const { error: updateError } = await supabase
              .from("trades")
              .update({
                current_option_price: quoteData.price,
                last_price_update: new Date().toISOString(),
                price_source: "alpaca",
                updated_at: new Date().toISOString(),
              })
              .eq("id", trade.id)

            if (updateError) {
              results.failed++
              results.details.push({
                symbol: trade.underlying,
                success: false,
                error: `Database update failed: ${updateError.message}`,
              })
            } else {
              results.updated++
              results.details.push({
                symbol: trade.underlying,
                success: true,
                price: quoteData.price,
              })
              console.log(`✅ Updated ${trade.underlying}: $${quoteData.price.toFixed(2)}`)
            }
          } else {
            results.failed++
            results.details.push({
              symbol: trade.underlying,
              success: false,
              error: quoteData.error || "No price data available",
            })
          }
        } else {
          results.failed++
          results.details.push({
            symbol: trade.underlying,
            success: false,
            error: `API call failed: ${quoteResponse.status}`,
          })
        }

        // Add delay between requests to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error: any) {
        results.failed++
        results.details.push({
          symbol: trade.underlying,
          success: false,
          error: error.message,
        })
      }
    }

    console.log(`🎯 Price update complete: ${results.updated} updated, ${results.failed} failed`)

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error: any) {
    console.error("❌ Server error updating prices:", error)
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
