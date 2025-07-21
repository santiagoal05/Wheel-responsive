import { type NextRequest, NextResponse } from "next/server"

const ALPACA_DATA_URL = "https://data.alpaca.markets"

// Cache para cotizaciones
interface QuoteCache {
  [symbol: string]: {
    price: number
    bid?: number
    ask?: number
    last?: number
    timestamp: number
    source: string
  }
}

let quoteCache: QuoteCache = {}
const QUOTE_CACHE_TTL = 30000 // 30 segundos

// Límites de rate limiting
const RATE_LIMIT = {
  maxRequests: 200, // por minuto
  window: 60000, // 1 minuto
  requests: [] as number[]
}

// Verificar rate limiting
function checkRateLimit(): boolean {
  const now = Date.now()
  
  // Limpiar solicitudes antiguas
  RATE_LIMIT.requests = RATE_LIMIT.requests.filter(
    timestamp => now - timestamp < RATE_LIMIT.window
  )
  
  // Verificar si se excede el límite
  if (RATE_LIMIT.requests.length >= RATE_LIMIT.maxRequests) {
    return false
  }
  
  // Agregar la solicitud actual
  RATE_LIMIT.requests.push(now)
  return true
}

// Validar parámetros de entrada
function validateQuoteParams(params: any): { isValid: boolean; error?: string } {
  const { underlying, expirationDate, optionType, strikePrice } = params
  
  if (!underlying || typeof underlying !== 'string' || underlying.length === 0) {
    return { isValid: false, error: 'Símbolo subyacente requerido y debe ser una cadena válida' }
  }
  
  if (underlying.length > 10) {
    return { isValid: false, error: 'Símbolo subyacente demasiado largo (máximo 10 caracteres)' }
  }
  
  if (!expirationDate || isNaN(Date.parse(expirationDate))) {
    return { isValid: false, error: 'Fecha de expiración inválida (formato: YYYY-MM-DD)' }
  }
  
  const expiry = new Date(expirationDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (expiry <= today) {
    return { isValid: false, error: 'La fecha de expiración debe ser futura' }
  }
  
  // Verificar que no sea más de 2 años en el futuro
  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() + 2)
  if (expiry > maxDate) {
    return { isValid: false, error: 'La fecha de expiración no puede ser más de 2 años en el futuro' }
  }
  
  if (!optionType || !['CALL', 'PUT', 'call', 'put'].includes(optionType)) {
    return { isValid: false, error: 'Tipo de opción debe ser CALL o PUT' }
  }
  
  if (!strikePrice || typeof strikePrice !== 'number' || strikePrice <= 0) {
    return { isValid: false, error: 'Precio de ejercicio debe ser un número mayor a 0' }
  }
  
  if (strikePrice > 10000) {
    return { isValid: false, error: 'Precio de ejercicio demasiado alto (máximo $10,000)' }
  }
  
  return { isValid: true }
}

// Formatear símbolo de opción para Alpaca (ej: AAPL240216P00180000)
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

// Limpiar caché expirado
function cleanExpiredCache(): void {
  const now = Date.now()
  Object.keys(quoteCache).forEach(symbol => {
    if (now - quoteCache[symbol].timestamp > QUOTE_CACHE_TTL) {
      delete quoteCache[symbol]
    }
  })
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verificar rate limiting
    if (!checkRateLimit()) {
      console.warn("⚠️ Rate limit excedido")
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit excedido. Máximo 200 solicitudes por minuto.",
          retryAfter: 60
        },
        { status: 429 }
      )
    }

    // Limpiar caché expirado
    cleanExpiredCache()

    const apiKey = process.env.ALPACA_API_KEY || process.env.NEXT_PUBLIC_ALPACA_API_KEY
    const secretKey = process.env.ALPACA_SECRET_KEY || process.env.NEXT_PUBLIC_ALPACA_SECRET_KEY

    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Credenciales de Alpaca API no configuradas" 
        }, 
        { status: 400 }
      )
    }

    const requestBody = await request.json()
    
    // Validar parámetros
    const validation = validateQuoteParams(requestBody)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          code: "INVALID_PARAMS"
        },
        { status: 400 }
      )
    }

    const { underlying, expirationDate, optionType, strikePrice } = requestBody
    const optionSymbol = formatOptionSymbol(underlying, expirationDate, optionType, strikePrice)
    
    console.log(`🔍 Obteniendo cotización para: ${optionSymbol}`)
    console.log(`📊 Parámetros: ${underlying} ${optionType.toUpperCase()} $${strikePrice} exp: ${expirationDate}`)

    // Verificar caché primero
    const cached = quoteCache[optionSymbol]
    if (cached && (Date.now() - cached.timestamp) < QUOTE_CACHE_TTL) {
      const age = Math.round((Date.now() - cached.timestamp) / 1000)
      console.log(`📋 Usando precio desde caché: $${cached.price} (${age}s de antigüedad)`)
      
      return NextResponse.json({
        success: true,
        symbol: optionSymbol,
        price: cached.price,
        bid: cached.bid,
        ask: cached.ask,
        last: cached.last,
        source: cached.source,
        cached: true,
        age,
        processingTime: Date.now() - startTime
      })
    }

    // Endpoints a probar en orden de preferencia
    const endpoints = [
      {
        url: `${ALPACA_DATA_URL}/v1beta1/options/quotes/latest?symbols=${optionSymbol}`,
        version: "v1beta1"
      },
      {
        url: `${ALPACA_DATA_URL}/v2/options/quotes/latest?symbols=${optionSymbol}`,
        version: "v2"
      }
    ]

    let lastError = null
    
    for (const endpoint of endpoints) {
      try {
        console.log(`📡 Probando endpoint ${endpoint.version}: ${endpoint.url}`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 segundos
        
        const response = await fetch(endpoint.url, {
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
        console.log(`📡 Estado de respuesta ${endpoint.version}: ${response.status}`)

        if (!response.ok) {
          const errorText = await response.text()
          console.warn(`⚠️ Endpoint ${endpoint.version} falló: ${response.status} ${response.statusText}`)
          lastError = { status: response.status, message: errorText, endpoint: endpoint.version }
          continue
        }

        const data = await response.json()
        console.log(`📊 Datos de respuesta ${endpoint.version}:`, JSON.stringify(data, null, 2))

        if (data.quotes && data.quotes[optionSymbol]) {
          const quote = data.quotes[optionSymbol]
          console.log(`📊 Detalles de cotización:`, JSON.stringify(quote, null, 2))

          // Extraer datos de precio - Alpaca usa diferentes nombres de campo
          const askPrice = quote.ap || quote.ask
          const bidPrice = quote.bp || quote.bid
          const lastPrice = quote.last

          // Calcular precio medio desde bid/ask, fallback a último precio
          let finalPrice = null
          let priceSource = ""

          if (bidPrice && askPrice && bidPrice > 0 && askPrice > 0) {
            finalPrice = (bidPrice + askPrice) / 2
            priceSource = "mid"
            console.log(`💰 Precio medio calculado desde bid ($${bidPrice}) y ask ($${askPrice}): $${finalPrice}`)
          } else if (lastPrice && lastPrice > 0) {
            finalPrice = lastPrice
            priceSource = "last"
            console.log(`💰 Usando último precio: $${finalPrice}`)
          } else if (askPrice && askPrice > 0) {
            finalPrice = askPrice
            priceSource = "ask"
            console.log(`💰 Usando precio ask: $${finalPrice}`)
          } else if (bidPrice && bidPrice > 0) {
            finalPrice = bidPrice
            priceSource = "bid"
            console.log(`💰 Usando precio bid: $${finalPrice}`)
          }

          if (finalPrice && finalPrice > 0) {
            // Guardar en caché
            quoteCache[optionSymbol] = {
              price: finalPrice,
              bid: bidPrice,
              ask: askPrice,
              last: lastPrice,
              timestamp: Date.now(),
              source: endpoint.version
            }
            
            const processingTime = Date.now() - startTime
            console.log(`✅ Precio final para ${optionSymbol}: $${finalPrice} (${processingTime}ms)`)
            
            return NextResponse.json({
              success: true,
              symbol: optionSymbol,
              price: finalPrice,
              bid: bidPrice,
              ask: askPrice,
              last: lastPrice,
              source: endpoint.version,
              priceSource,
              spread: bidPrice && askPrice ? Number((askPrice - bidPrice).toFixed(4)) : null,
              cached: false,
              processingTime
            })
          } else {
            console.warn(`⚠️ No se encontró precio válido en datos de cotización:`, quote)
            lastError = { 
              status: 404, 
              message: "No hay datos de precio válidos en la cotización", 
              endpoint: endpoint.version,
              quoteData: quote 
            }
          }
        } else {
          console.warn(`⚠️ No se encontraron datos de cotización para ${optionSymbol} en ${endpoint.version}`)
          lastError = { 
            status: 404, 
            message: "No se encontraron datos de cotización", 
            endpoint: endpoint.version,
            responseData: data 
          }
        }
      } catch (error: any) {
        console.error(`❌ Error en endpoint ${endpoint.version}:`, error.message)
        lastError = { 
          status: 500, 
          message: error.name === 'AbortError' ? 'Timeout de solicitud' : error.message, 
          endpoint: endpoint.version 
        }
      }
    }

    // Si llegamos aquí, todos los endpoints fallaron
    console.error(`❌ Todos los endpoints fallaron para ${optionSymbol}`)
    return NextResponse.json(
      {
        success: false,
        error: "No se pudo obtener cotización desde ningún endpoint",
        symbol: optionSymbol,
        lastError,
        processingTime: Date.now() - startTime
      },
      { status: lastError?.status || 404 }
    )
    
  } catch (error: any) {
    console.error("❌ Error del servidor obteniendo cotización de opción:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error del servidor",
        details: error.message,
        processingTime: Date.now() - startTime
      },
      { status: 500 }
    )
  }
}

// Endpoint para limpiar el caché de cotizaciones
export async function DELETE() {
  const cacheSize = Object.keys(quoteCache).length
  quoteCache = {}
  RATE_LIMIT.requests = []
  
  console.log(`🧹 Caché de cotizaciones limpiado (${cacheSize} entradas eliminadas)`)
  
  return NextResponse.json({
    success: true,
    message: `Caché de cotizaciones limpiado (${cacheSize} entradas eliminadas)`,
    rateLimitReset: true
  })
}

// Endpoint para obtener estadísticas del caché
export async function GET() {
  cleanExpiredCache()
  
  const now = Date.now()
  const cacheEntries = Object.entries(quoteCache).map(([symbol, data]) => ({
    symbol,
    price: data.price,
    age: Math.round((now - data.timestamp) / 1000),
    source: data.source
  }))
  
  const rateLimitInfo = {
    currentRequests: RATE_LIMIT.requests.length,
    maxRequests: RATE_LIMIT.maxRequests,
    windowMs: RATE_LIMIT.window,
    remaining: RATE_LIMIT.maxRequests - RATE_LIMIT.requests.length
  }
  
  return NextResponse.json({
    success: true,
    cache: {
      size: cacheEntries.length,
      ttl: QUOTE_CACHE_TTL,
      entries: cacheEntries.sort((a, b) => a.age - b.age)
    },
    rateLimit: rateLimitInfo
  })
}
