"use client"

import { useState, useEffect } from "react"
import { supabase, hasSupabase } from "@/lib/supabase"
import type { Trade } from "@/types/trading"

// Mock data for fallback
const mockTrades: Trade[] = [
  {
    id: "1",
    underlying: "AAPL",
    optionType: "put",
    strikePrice: 180,
    expirationDate: "2024-02-16",
    premiumReceived: 3.5,
    dateSold: "2024-01-15",
    quantity: 2,
    status: "open",
    currentPrice: 185.5,
    currentOptionPrice: 1.25,
  },
  {
    id: "2",
    underlying: "MSFT",
    optionType: "call",
    strikePrice: 420,
    expirationDate: "2024-02-09",
    premiumReceived: 2.8,
    dateSold: "2024-01-10",
    quantity: 1,
    status: "open",
    currentPrice: 415.2,
    currentOptionPrice: 0.85,
  },
]

export function useTradesData() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<string>("Checking...")

  useEffect(() => {
    loadTrades()
  }, [])

  const loadTrades = async () => {
    setIsLoading(true)
    setError(null)

    console.log("🔄 Starting to load trades...")
    console.log("hasSupabase:", hasSupabase)
    console.log("supabase client:", supabase ? "Available" : "Not available")

    if (hasSupabase && supabase) {
      try {
        setConnectionStatus("Connecting to Supabase...")
        console.log("🔗 Attempting to connect to Supabase...")

        // Test basic connection first
        const { data: testData, error: testError } = await supabase
          .from("trades")
          .select("count", { count: "exact", head: true })

        if (testError) {
          console.error("❌ Supabase connection test failed:", testError)
          setConnectionStatus(`Connection failed: ${testError.message}`)
          throw testError
        }

        console.log("✅ Supabase connection test successful")
        setConnectionStatus("Connected to Supabase")

        // Now try to fetch actual data
        console.log("📊 Fetching trades from Supabase...")
        const { data, error } = await supabase.from("trades").select("*").order("date_sold", { ascending: false })

        if (error) {
          console.error("❌ Error fetching trades:", error)
          setConnectionStatus(`Data fetch failed: ${error.message}`)
          throw error
        }

        if (data) {
          console.log("✅ Successfully fetched trades from Supabase:", data.length)
          console.log("🔍 Raw data sample:", data[0])
          setConnectionStatus(`Loaded ${data.length} trades from Supabase`)

          // Transform data to match our Trade interface with detailed logging
          const transformedTrades: Trade[] = data.map((row: any) => {
            console.log(`🔄 Transforming trade ${row.id}:`, {
              underlying: row.underlying,
              current_option_price: row.current_option_price,
              current_option_price_type: typeof row.current_option_price,
              current_price: row.current_price,
            })

            // Handle currentOptionPrice transformation carefully
            let currentOptionPrice: number | undefined = undefined
            if (row.current_option_price !== null && row.current_option_price !== undefined) {
              const parsed = Number.parseFloat(String(row.current_option_price))
              if (!Number.isNaN(parsed)) {
                currentOptionPrice = parsed
                console.log(`✅ Parsed currentOptionPrice for ${row.underlying}: ${currentOptionPrice}`)
              } else {
                console.warn(`⚠️ Failed to parse currentOptionPrice for ${row.underlying}:`, row.current_option_price)
              }
            } else {
              console.log(`⚠️ No currentOptionPrice for ${row.underlying}`)
            }

            const transformed: Trade = {
              id: row.id,
              underlying: row.underlying,
              optionType: row.option_type,
              strikePrice: Number.parseFloat(row.strike_price),
              expirationDate: row.expiration_date,
              premiumReceived: Number.parseFloat(row.premium_received),
              dateSold: row.date_sold,
              quantity: row.quantity,
              status: row.status,
              currentPrice: Number.parseFloat(row.current_price || "0"),
              currentOptionPrice: currentOptionPrice, // This is the key field
              profitLoss: row.profit_loss ? Number.parseFloat(row.profit_loss) : undefined,
              assignmentPrice: row.assignment_price ? Number.parseFloat(row.assignment_price) : undefined,
              costBasis: row.cost_basis ? Number.parseFloat(row.cost_basis) : undefined,
            }

            console.log(`✅ Transformed trade ${row.underlying}:`, {
              currentOptionPrice: transformed.currentOptionPrice,
              currentOptionPriceType: typeof transformed.currentOptionPrice,
              hasCurrentOptionPrice: transformed.currentOptionPrice !== undefined,
            })

            return transformed
          })

          console.log("🎯 Final transformed trades:", transformedTrades.length)
          console.log("🔍 First transformed trade:", transformedTrades[0])

          setTrades(transformedTrades)
          setIsLoading(false)
          return
        }
      } catch (error: any) {
        console.error("❌ Supabase error:", error)
        setError(`Supabase error: ${error.message}`)
        setConnectionStatus(`Error: ${error.message}`)
      }
    } else {
      console.log("⚠️ Supabase not available, using fallback")
      setConnectionStatus("Supabase not configured")
    }

    // Fallback to localStorage or mock data
    try {
      if (typeof window !== "undefined") {
        console.log("💾 Trying localStorage...")
        const stored = localStorage.getItem("options-trades")
        if (stored) {
          const parsedTrades = JSON.parse(stored)
          setTrades(parsedTrades)
          setConnectionStatus(`Loaded ${parsedTrades.length} trades from localStorage`)
          console.log("✅ Loaded trades from localStorage:", parsedTrades.length)
        } else {
          console.log("📝 Using mock data...")
          setTrades(mockTrades)
          localStorage.setItem("options-trades", JSON.stringify(mockTrades))
          setConnectionStatus(`Using ${mockTrades.length} sample trades`)
          console.log("✅ Using mock data")
        }
      } else {
        // Server-side rendering fallback
        setTrades(mockTrades)
        setConnectionStatus("Server-side rendering")
      }
    } catch (error: any) {
      console.error("❌ Error with fallback:", error)
      setTrades(mockTrades)
      setError(`Storage error: ${error.message}`)
      setConnectionStatus("Using fallback data")
    }

    setIsLoading(false)
  }

  // Transform Trade to database format
  const transformToDbFormat = (trade: Trade) => ({
    id: trade.id,
    underlying: trade.underlying,
    option_type: trade.optionType,
    strike_price: trade.strikePrice,
    expiration_date: trade.expirationDate,
    premium_received: trade.premiumReceived,
    date_sold: trade.dateSold,
    quantity: trade.quantity,
    status: trade.status,
    current_price: trade.currentPrice,
    current_option_price: trade.currentOptionPrice || null, // Ensure null instead of undefined
    profit_loss: trade.profitLoss || null,
    assignment_price: trade.assignmentPrice || null,
    cost_basis: trade.costBasis || null,
  })

  // Add a new trade
  const addTrade = async (newTrade: Omit<Trade, "id">) => {
    console.log("➕ Adding new trade:", newTrade)

    if (hasSupabase && supabase) {
      try {
        const dbTrade = transformToDbFormat({ ...newTrade, id: "" })
        delete dbTrade.id // Let Supabase generate the ID

        const { data, error } = await supabase.from("trades").insert(dbTrade).select().single()

        if (error) {
          console.error("❌ Error adding trade to Supabase:", error)
          throw error
        }

        if (data) {
          console.log("✅ Trade added to Supabase:", data.id)
          // Reload trades to get the updated list
          await loadTrades()
          return data.id
        }
      } catch (error: any) {
        console.error("❌ Failed to add trade to Supabase:", error)
        setError(`Add error: ${error.message}`)
        throw error
      }
    } else {
      // Fallback to localStorage
      const tradeWithId = { ...newTrade, id: Date.now().toString() }
      const updatedTrades = [...trades, tradeWithId]
      setTrades(updatedTrades)

      if (typeof window !== "undefined") {
        localStorage.setItem("options-trades", JSON.stringify(updatedTrades))
      }
      return tradeWithId.id
    }
  }

  // Update an existing trade
  const updateTrade = async (updatedTrade: Trade) => {
    console.log("✏️ Updating trade:", updatedTrade.id)
    console.log("✏️ Updated currentOptionPrice:", updatedTrade.currentOptionPrice)

    if (hasSupabase && supabase) {
      try {
        const dbTrade = transformToDbFormat(updatedTrade)
        console.log("✏️ DB format:", dbTrade)

        const { data, error } = await supabase
          .from("trades")
          .update(dbTrade)
          .eq("id", updatedTrade.id)
          .select()
          .single()

        if (error) {
          console.error("❌ Error updating trade in Supabase:", error)
          throw error
        }

        if (data) {
          console.log("✅ Trade updated in Supabase:", data.id)
          console.log("✅ Updated current_option_price:", data.current_option_price)
          // Reload trades to get the updated list
          await loadTrades()
        }
      } catch (error: any) {
        console.error("❌ Failed to update trade in Supabase:", error)
        setError(`Update error: ${error.message}`)
        throw error
      }
    } else {
      // Fallback to localStorage
      const updatedTrades = trades.map((trade) => (trade.id === updatedTrade.id ? updatedTrade : trade))
      setTrades(updatedTrades)

      if (typeof window !== "undefined") {
        localStorage.setItem("options-trades", JSON.stringify(updatedTrades))
      }
    }
  }

  // Delete a trade
  const deleteTrade = async (tradeId: string) => {
    console.log("🗑️ Deleting trade:", tradeId)

    if (hasSupabase && supabase) {
      try {
        const { error } = await supabase.from("trades").delete().eq("id", tradeId)

        if (error) {
          console.error("❌ Error deleting trade from Supabase:", error)
          throw error
        }

        console.log("✅ Trade deleted from Supabase:", tradeId)
        // Reload trades to get the updated list
        await loadTrades()
      } catch (error: any) {
        console.error("❌ Failed to delete trade from Supabase:", error)
        setError(`Delete error: ${error.message}`)
        throw error
      }
    } else {
      // Fallback to localStorage
      const updatedTrades = trades.filter((trade) => trade.id !== tradeId)
      setTrades(updatedTrades)

      if (typeof window !== "undefined") {
        localStorage.setItem("options-trades", JSON.stringify(updatedTrades))
      }
    }
  }

  // Legacy method for backward compatibility
  const saveTrades = async (newTrades: Trade[]) => {
    console.log("⚠️ Using legacy saveTrades method. Consider using individual CRUD operations.")
    setTrades(newTrades)

    // Always save to localStorage as backup (only in browser)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("options-trades", JSON.stringify(newTrades))
        console.log("✅ Saved to localStorage")
      } catch (error: any) {
        console.error("❌ Error saving to localStorage:", error)
        setError(`Storage error: ${error.message}`)
      }
    }
  }

  return {
    trades,
    setTrades: saveTrades, // Keep for backward compatibility
    addTrade,
    updateTrade,
    deleteTrade,
    isLoading,
    error,
    hasSupabase,
    connectionStatus,
    refreshTrades: loadTrades,
  }
}
