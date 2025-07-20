import { type NextRequest, NextResponse } from "next/server"

const ALPACA_DATA_URL = "https://data.alpaca.markets"

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ALPACA_API_KEY || process.env.NEXT_PUBLIC_ALPACA_API_KEY
    const secretKey = process.env.ALPACA_SECRET_KEY || process.env.NEXT_PUBLIC_ALPACA_SECRET_KEY

    if (!apiKey || !secretKey) {
      return NextResponse.json({ success: false, error: "Alpaca API credentials not configured" }, { status: 400 })
    }

    const { optionSymbol } = await request.json()

    if (!optionSymbol) {
      return NextResponse.json({ success: false, error: "Missing optionSymbol parameter" }, { status: 400 })
    }

    console.log(`🔍 Testing specific option symbol: ${optionSymbol}`)

    // Test multiple endpoints
    const endpoints = [
      `${ALPACA_DATA_URL}/v1beta1/options/quotes/latest?symbols=${optionSymbol}`,
      `${ALPACA_DATA_URL}/v2/options/quotes/latest?symbols=${optionSymbol}`,
    ]

    const results = []

    for (let i = 0; i < endpoints.length; i++) {
      const url = endpoints[i]
      console.log(`📡 Testing endpoint ${i + 1}: ${url}`)

      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "APCA-API-KEY-ID": apiKey,
            "APCA-API-SECRET-KEY": secretKey,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })

        const responseText = await response.text()
        let responseData = null

        try {
          responseData = JSON.parse(responseText)
        } catch {
          responseData = responseText
        }

        results.push({
          endpoint: `v${i === 0 ? "1beta1" : "2"}`,
          url: url,
          status: response.status,
          success: response.ok,
          data: responseData,
          hasQuote: responseData?.quotes && responseData.quotes[optionSymbol] ? true : false,
        })

        console.log(`📊 Endpoint ${i + 1} result:`, {
          status: response.status,
          hasData: !!responseData,
          hasQuote: responseData?.quotes && responseData.quotes[optionSymbol] ? true : false,
        })
      } catch (error: any) {
        results.push({
          endpoint: `v${i === 0 ? "1beta1" : "2"}`,
          url: url,
          status: "error",
          success: false,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      optionSymbol: optionSymbol,
      results: results,
    })
  } catch (error: any) {
    console.error("❌ Error testing specific quote:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
