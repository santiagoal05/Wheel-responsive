// Alpaca Markets API client mejorado para datos de opciones
// Cliente del lado del cliente con funcionalidades avanzadas

interface AlpacaConfig {
  maxRetries: number
  retryDelay: number
  requestTimeout: number
  cacheEnabled: boolean
  cacheTTL: number
}

interface QuoteCache {
  [key: string]: {
    price: number
    timestamp: number
    bid?: number
    ask?: number
    last?: number
  }
}

interface ConnectionStatus {
  isConnected: boolean
  lastChecked: number
  accountId?: string
  accountStatus?: string
  error?: string
}

class AlpacaClient {
  private config: AlpacaConfig
  private cache: QuoteCache = {}
  private connectionStatus: ConnectionStatus = {
    isConnected: false,
    lastChecked: 0
  }

  constructor(config?: Partial<AlpacaConfig>) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      requestTimeout: 10000,
      cacheEnabled: true,
      cacheTTL: 30000, // 30 segundos
      ...config
    }
    console.log("✅ Cliente Alpaca mejorado inicializado")
    console.log("⚙️ Configuración:", this.config)
  }

  // Obtener estado de conexión desde caché
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus }
  }

  // Limpiar caché de conexión
  clearConnectionCache(): void {
    this.connectionStatus = {
      isConnected: false,
      lastChecked: 0
    }
    console.log("🧹 Caché de conexión limpiado")
  }

  // Prueba de conexión mejorada con caché y reintentos
  async testConnection(forceRefresh = false): Promise<boolean> {
    const now = Date.now()
    const cacheAge = now - this.connectionStatus.lastChecked
    
    // Usar caché si es reciente y no se fuerza la actualización
    if (!forceRefresh && cacheAge < this.config.cacheTTL && this.connectionStatus.lastChecked > 0) {
      console.log("📋 Usando estado de conexión desde caché")
      return this.connectionStatus.isConnected
    }

    console.log("🔍 Probando conexión con Alpaca Markets...")
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`🔄 Intento ${attempt}/${this.config.maxRetries}`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout)
        
        const response = await fetch("/api/alpaca/test-connection", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        const data = await response.json()
        
        if (data.success) {
          this.connectionStatus = {
            isConnected: true,
            lastChecked: now,
            accountId: data.accountId,
            accountStatus: data.accountStatus
          }
          console.log("✅ Conexión exitosa con Alpaca")
          console.log(`📊 Cuenta: ${data.accountId} (${data.accountStatus})`)
          return true
        } else {
          console.warn(`⚠️ Intento ${attempt} falló:`, data.error)
          if (attempt === this.config.maxRetries) {
            this.connectionStatus = {
              isConnected: false,
              lastChecked: now,
              error: data.error
            }
          }
        }
      } catch (error: any) {
        console.warn(`⚠️ Error en intento ${attempt}:`, error.message)
        if (attempt === this.config.maxRetries) {
          this.connectionStatus = {
            isConnected: false,
            lastChecked: now,
            error: error.message
          }
        }
      }
      
      // Esperar antes del siguiente intento
      if (attempt < this.config.maxRetries) {
        console.log(`⏳ Esperando ${this.config.retryDelay}ms antes del siguiente intento...`)
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay))
      }
    }
    
    console.error("❌ Todos los intentos de conexión fallaron")
    return false
  }

  // Generar clave de caché para una cotización
  private generateCacheKey(
    underlying: string,
    expirationDate: string,
    optionType: string,
    strikePrice: number
  ): string {
    return `${underlying.toUpperCase()}_${optionType.toUpperCase()}_${strikePrice}_${expirationDate}`
  }

  // Validar parámetros de entrada
  private validateQuoteParams(
    underlying: string,
    expirationDate: string,
    optionType: string,
    strikePrice: number
  ): { isValid: boolean; error?: string } {
    if (!underlying || typeof underlying !== 'string') {
      return { isValid: false, error: 'Símbolo subyacente inválido' }
    }
    
    if (!expirationDate || isNaN(Date.parse(expirationDate))) {
      return { isValid: false, error: 'Fecha de expiración inválida' }
    }
    
    if (!['CALL', 'PUT', 'call', 'put'].includes(optionType)) {
      return { isValid: false, error: 'Tipo de opción debe ser CALL o PUT' }
    }
    
    if (!strikePrice || strikePrice <= 0) {
      return { isValid: false, error: 'Precio de ejercicio debe ser mayor a 0' }
    }
    
    const expiry = new Date(expirationDate)
    if (expiry <= new Date()) {
      return { isValid: false, error: 'La fecha de expiración debe ser futura' }
    }
    
    return { isValid: true }
  }

  // Limpiar caché de cotizaciones
  clearQuoteCache(): void {
    this.cache = {}
    console.log("🧹 Caché de cotizaciones limpiado")
  }

  // Obtener cotización de opción mejorada con caché y validación
  async getOptionQuote(
    underlying: string,
    expirationDate: string,
    optionType: string,
    strikePrice: number,
    useCache = true
  ): Promise<number | null> {
    // Validar parámetros
    const validation = this.validateQuoteParams(underlying, expirationDate, optionType, strikePrice)
    if (!validation.isValid) {
      console.error(`❌ Parámetros inválidos: ${validation.error}`)
      return null
    }

    const cacheKey = this.generateCacheKey(underlying, expirationDate, optionType, strikePrice)
    const now = Date.now()
    
    // Verificar caché si está habilitado
    if (this.config.cacheEnabled && useCache && this.cache[cacheKey]) {
      const cached = this.cache[cacheKey]
      const age = now - cached.timestamp
      
      if (age < this.config.cacheTTL) {
        console.log(`📋 Usando precio desde caché: $${cached.price} (${Math.round(age/1000)}s)`)
        return cached.price
      } else {
        console.log(`🕐 Caché expirado para ${cacheKey}, obteniendo precio actualizado`)
        delete this.cache[cacheKey]
      }
    }

    console.log(`🔍 Obteniendo cotización: ${underlying} ${optionType.toUpperCase()} $${strikePrice}`)
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`🔄 Intento ${attempt}/${this.config.maxRetries}`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout)
        
        const response = await fetch("/api/alpaca/option-quote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            underlying: underlying.toUpperCase(),
            expirationDate,
            optionType: optionType.toUpperCase(),
            strikePrice,
          }),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        const data = await response.json()
        
        if (data.success && data.price !== null && data.price !== undefined && data.price > 0) {
          // Guardar en caché
          if (this.config.cacheEnabled) {
            this.cache[cacheKey] = {
              price: data.price,
              timestamp: now,
              bid: data.bid,
              ask: data.ask,
              last: data.last
            }
          }
          
          console.log(`✅ Precio obtenido: $${data.price}`)
          if (data.bid && data.ask) {
            console.log(`📊 Bid: $${data.bid}, Ask: $${data.ask}, Spread: $${(data.ask - data.bid).toFixed(4)}`)
          }
          return data.price
        } else {
          console.warn(`⚠️ Intento ${attempt} - Sin precio disponible: ${data.error}`)
          if (attempt === this.config.maxRetries) {
            return null
          }
        }
      } catch (error: any) {
        console.warn(`⚠️ Error en intento ${attempt}:`, error.message)
        if (attempt === this.config.maxRetries) {
          return null
        }
      }
      
      // Esperar antes del siguiente intento
      if (attempt < this.config.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay))
      }
    }
    
    console.error(`❌ No se pudo obtener precio para ${cacheKey}`)
    return null
  }

  // Obtener estadísticas del caché
  getCacheStats(): { size: number; entries: Array<{ key: string; age: number; price: number }> } {
    const now = Date.now()
    const entries = Object.entries(this.cache).map(([key, data]) => ({
      key,
      age: Math.round((now - data.timestamp) / 1000),
      price: data.price
    }))
    
    return {
      size: entries.length,
      entries: entries.sort((a, b) => a.age - b.age)
    }
  }

  // Obtener cotizaciones múltiples con procesamiento optimizado
  async getMultipleOptionQuotes(
    trades: Array<{
      underlying: string
      expirationDate: string
      optionType: string
      strikePrice: number
    }>,
    options: {
      parallel?: boolean
      batchSize?: number
      delayBetweenBatches?: number
    } = {}
  ): Promise<{ 
    results: { [key: string]: number }
    summary: {
      total: number
      successful: number
      failed: number
      fromCache: number
      duration: number
    }
  }> {
    const startTime = Date.now()
    const {
      parallel = false,
      batchSize = 5,
      delayBetweenBatches = 1000
    } = options

    const results: { [key: string]: number } = {}
    let successful = 0
    let failed = 0
    let fromCache = 0

    console.log(`🔄 Obteniendo ${trades.length} cotizaciones...`)
    console.log(`⚙️ Modo: ${parallel ? 'Paralelo' : 'Secuencial'}, Lote: ${batchSize}`)

    if (parallel) {
      // Procesamiento en paralelo por lotes
      const batches = []
      for (let i = 0; i < trades.length; i += batchSize) {
        batches.push(trades.slice(i, i + batchSize))
      }

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex]
        console.log(`📦 Procesando lote ${batchIndex + 1}/${batches.length} (${batch.length} elementos)`)

        const batchPromises = batch.map(async (trade, index) => {
          const cacheKey = this.generateCacheKey(
            trade.underlying,
            trade.expirationDate,
            trade.optionType,
            trade.strikePrice
          )

          // Verificar caché primero
          const now = Date.now()
          if (this.config.cacheEnabled && this.cache[cacheKey]) {
            const cached = this.cache[cacheKey]
            const age = now - cached.timestamp
            if (age < this.config.cacheTTL) {
              fromCache++
              return { key: cacheKey, price: cached.price, fromCache: true }
            }
          }

          try {
            const price = await this.getOptionQuote(
              trade.underlying,
              trade.expirationDate,
              trade.optionType,
              trade.strikePrice,
              false // No usar caché interno ya que lo verificamos arriba
            )
            return { key: cacheKey, price, fromCache: false }
          } catch (error) {
            console.error(`❌ Error en ${trade.underlying}:`, error)
            return { key: cacheKey, price: null, fromCache: false }
          }
        })

        const batchResults = await Promise.allSettled(batchPromises)
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.price !== null) {
            results[result.value.key] = result.value.price
            successful++
            if (!result.value.fromCache) {
              console.log(`✅ ${batch[index].underlying}: $${result.value.price}`)
            }
          } else {
            failed++
            console.log(`⚠️ ${batch[index].underlying}: Sin precio disponible`)
          }
        })

        // Esperar entre lotes
        if (batchIndex < batches.length - 1) {
          console.log(`⏳ Esperando ${delayBetweenBatches}ms antes del siguiente lote...`)
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
        }
      }
    } else {
      // Procesamiento secuencial
      for (let i = 0; i < trades.length; i++) {
        const trade = trades[i]
        console.log(`📊 Procesando ${i + 1}/${trades.length}: ${trade.underlying}`)

        const cacheKey = this.generateCacheKey(
          trade.underlying,
          trade.expirationDate,
          trade.optionType,
          trade.strikePrice
        )

        try {
          const price = await this.getOptionQuote(
            trade.underlying,
            trade.expirationDate,
            trade.optionType,
            trade.strikePrice
          )

          if (price !== null) {
            results[cacheKey] = price
            successful++
            console.log(`✅ ${trade.underlying}: $${price}`)
          } else {
            failed++
            console.log(`⚠️ ${trade.underlying}: Sin precio disponible`)
          }

          // Esperar entre solicitudes secuenciales
          if (i < trades.length - 1) {
            await new Promise(resolve => setTimeout(resolve, this.config.retryDelay))
          }
        } catch (error: any) {
          failed++
          console.error(`❌ Error procesando ${trade.underlying}:`, error)
        }
      }
    }

    const duration = Date.now() - startTime
    const summary = {
      total: trades.length,
      successful,
      failed,
      fromCache,
      duration
    }

    console.log(`🎯 Completado en ${duration}ms:`)
    console.log(`   ✅ Exitosos: ${successful}/${trades.length}`)
    console.log(`   ❌ Fallidos: ${failed}/${trades.length}`)
    console.log(`   📋 Desde caché: ${fromCache}/${trades.length}`)
    console.log(`   ⚡ Promedio: ${Math.round(duration/trades.length)}ms por cotización`)

    return { results, summary }
  }
  // Método para obtener información detallada de una cotización desde caché
  getQuoteFromCache(
    underlying: string,
    expirationDate: string,
    optionType: string,
    strikePrice: number
  ): { price: number; bid?: number; ask?: number; last?: number; age: number } | null {
    const cacheKey = this.generateCacheKey(underlying, expirationDate, optionType, strikePrice)
    const cached = this.cache[cacheKey]
    
    if (!cached) return null
    
    const age = Date.now() - cached.timestamp
    if (age > this.config.cacheTTL) {
      delete this.cache[cacheKey]
      return null
    }
    
    return {
      price: cached.price,
      bid: cached.bid,
      ask: cached.ask,
      last: cached.last,
      age: Math.round(age / 1000)
    }
  }

  // Método para configurar el cliente en tiempo de ejecución
  updateConfig(newConfig: Partial<AlpacaConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log("⚙️ Configuración actualizada:", this.config)
  }

  // Método para obtener la configuración actual
  getConfig(): AlpacaConfig {
    return { ...this.config }
  }

  // Método para limpiar todo el caché
  clearAllCache(): void {
    this.clearQuoteCache()
    this.clearConnectionCache()
    console.log("🧹 Todo el caché ha sido limpiado")
  }

  // Método para verificar la salud del cliente
  async healthCheck(): Promise<{
    connection: boolean
    cacheSize: number
    config: AlpacaConfig
    lastConnectionCheck: number
    errors: string[]
  }> {
    const errors: string[] = []
    
    // Verificar conexión
    const isConnected = await this.testConnection()
    if (!isConnected && this.connectionStatus.error) {
      errors.push(`Conexión: ${this.connectionStatus.error}`)
    }
    
    // Verificar configuración
    if (this.config.maxRetries < 1) {
      errors.push("maxRetries debe ser al menos 1")
    }
    if (this.config.retryDelay < 0) {
      errors.push("retryDelay no puede ser negativo")
    }
    if (this.config.requestTimeout < 1000) {
      errors.push("requestTimeout debería ser al menos 1000ms")
    }
    
    return {
      connection: isConnected,
      cacheSize: Object.keys(this.cache).length,
      config: this.getConfig(),
      lastConnectionCheck: this.connectionStatus.lastChecked,
      errors
    }
  }
}

// Crear instancia con configuración optimizada para producción
export const alpacaClient = new AlpacaClient({
  maxRetries: 3,
  retryDelay: 1500,
  requestTimeout: 15000,
  cacheEnabled: true,
  cacheTTL: 30000
})

// Exportar también la clase para crear instancias personalizadas
export { AlpacaClient }

// Exportar tipos para uso en otros archivos
export type { AlpacaConfig, QuoteCache, ConnectionStatus }
