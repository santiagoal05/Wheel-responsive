import { NextResponse } from "next/server"

// Configuración de Alpaca Markets
const ALPACA_BASE_URL = process.env.IS_PAPER === 'true' 
  ? "https://paper-api.alpaca.markets" 
  : "https://api.alpaca.markets"

const ALPACA_DATA_URL = "https://data.alpaca.markets"

// Cache para evitar múltiples llamadas
let connectionCache: {
  isValid: boolean
  timestamp: number
  data?: any
  error?: string
} | null = null

const CACHE_TTL = 60000 // 1 minuto

export async function GET() {
  try {
    // Verificar caché primero
    const now = Date.now()
    if (connectionCache && (now - connectionCache.timestamp) < CACHE_TTL) {
      console.log("📋 Usando resultado de conexión desde caché")
      if (connectionCache.isValid) {
        return NextResponse.json({
          success: true,
          message: "Connected to Alpaca Markets (cached)",
          ...connectionCache.data,
          cached: true
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            error: connectionCache.error || "Connection failed (cached)",
            cached: true
          },
          { status: 400 }
        )
      }
    }

    const apiKey = process.env.ALPACA_API_KEY || process.env.NEXT_PUBLIC_ALPACA_API_KEY
    const secretKey = process.env.ALPACA_SECRET_KEY || process.env.NEXT_PUBLIC_ALPACA_SECRET_KEY

    if (!apiKey || !secretKey) {
      const error = "Credenciales de Alpaca API no configuradas"
      connectionCache = {
        isValid: false,
        timestamp: now,
        error
      }
      
      return NextResponse.json(
        {
          success: false,
          error,
          details: "Faltan las variables de entorno ALPACA_API_KEY o ALPACA_SECRET_KEY",
        },
        { status: 400 },
      )
    }

    console.log("🔍 Probando conexión con Alpaca desde el servidor...")
    console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`)
    console.log(`🌐 Entorno: ${process.env.IS_PAPER === 'true' ? 'Paper Trading' : 'Live Trading'}`)
    console.log(`📡 URL Base: ${ALPACA_BASE_URL}`)

    // Configurar timeout para la solicitud
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos

    const response = await fetch(`${ALPACA_BASE_URL}/v2/account`, {
      method: "GET",
      headers: {
        "APCA-API-KEY-ID": apiKey,
        "APCA-API-SECRET-KEY": secretKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    console.log(`📡 Estado de respuesta de Alpaca: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Error de API de Alpaca: ${response.status} ${response.statusText}`)
      console.error("❌ Cuerpo del error:", errorText)

      const errorMessage = `Error de API de Alpaca: ${response.status} ${response.statusText}`
      connectionCache = {
        isValid: false,
        timestamp: now,
        error: errorMessage
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: errorText,
          status: response.status
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("✅ Conexión con Alpaca exitosa")
    console.log(`📊 Cuenta: ${data.id} (${data.status})`)
    console.log(`💰 Poder adquisitivo: $${data.buying_power || 'N/A'}`)
    console.log(`📈 Valor de cartera: $${data.portfolio_value || 'N/A'}`)

    // Guardar en caché el resultado exitoso
    const responseData = {
      accountId: data.id,
      accountStatus: data.status,
      buyingPower: data.buying_power,
      portfolioValue: data.portfolio_value,
      daytradeCount: data.daytrade_count,
      accountType: data.account_type,
      tradingBlocked: data.trading_blocked,
      transfersBlocked: data.transfers_blocked,
      accountBlocked: data.account_blocked,
      createdAt: data.created_at
    }

    connectionCache = {
      isValid: true,
      timestamp: now,
      data: responseData
    }

    return NextResponse.json({
      success: true,
      message: "Conectado a Alpaca Markets",
      environment: process.env.IS_PAPER === 'true' ? 'paper' : 'live',
      ...responseData
    })
  } catch (error: any) {
    console.error("❌ Error del servidor probando conexión con Alpaca:", error)
    
    const errorMessage = error.name === 'AbortError' 
      ? 'Timeout de conexión con Alpaca'
      : 'Error del servidor'
    
    connectionCache = {
      isValid: false,
      timestamp: Date.now(),
      error: errorMessage
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error.message,
      },
      { status: 500 },
    )
  }
}

// Endpoint para limpiar el caché de conexión
export async function DELETE() {
  connectionCache = null
  console.log("🧹 Caché de conexión limpiado")
  
  return NextResponse.json({
    success: true,
    message: "Caché de conexión limpiado"
  })
}
