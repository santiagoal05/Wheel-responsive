import { NextResponse } from "next/server"

const ALPACA_BASE_URL = "https://paper-api.alpaca.markets"

export async function GET() {
  try {
    const apiKey = process.env.ALPACA_API_KEY || process.env.NEXT_PUBLIC_ALPACA_API_KEY
    const secretKey = process.env.ALPACA_SECRET_KEY || process.env.NEXT_PUBLIC_ALPACA_SECRET_KEY

    if (!apiKey || !secretKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Alpaca API credentials not configured",
          details: "Missing ALPACA_API_KEY or ALPACA_SECRET_KEY environment variables",
        },
        { status: 400 },
      )
    }

    console.log("🔍 Testing Alpaca connection from server...")
    console.log("API Key:", apiKey.substring(0, 8) + "...")

    const response = await fetch(`${ALPACA_BASE_URL}/v2/account`, {
      method: "GET",
      headers: {
        "APCA-API-KEY-ID": apiKey,
        "APCA-API-SECRET-KEY": secretKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    console.log("📡 Alpaca response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Alpaca API Error:", response.status, response.statusText)
      console.error("❌ Error body:", errorText)

      return NextResponse.json(
        {
          success: false,
          error: `Alpaca API Error: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("✅ Alpaca connection successful")

    return NextResponse.json({
      success: true,
      message: "Connected to Alpaca Markets",
      accountId: data.id,
      accountStatus: data.status,
    })
  } catch (error: any) {
    console.error("❌ Server error testing Alpaca connection:", error)
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
