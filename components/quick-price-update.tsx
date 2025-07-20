"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Edit, DollarSign, TrendingUp } from "lucide-react"
import type { Trade } from "@/types/trading"

interface QuickPriceUpdateProps {
  trades: Trade[]
  onUpdateTrade: (trade: Trade) => Promise<void>
}

export default function QuickPriceUpdate({ trades, onUpdateTrade }: QuickPriceUpdateProps) {
  const [updatingTrade, setUpdatingTrade] = useState<string | null>(null)
  const [priceInputs, setPriceInputs] = useState<{ [key: string]: string }>({})
  const { toast } = useToast()

  // Find SOFI trades or trades missing prices
  const tradesNeedingPrices = trades.filter((trade) => {
    return (
      trade.status === "open" &&
      (trade.currentOptionPrice === undefined || trade.currentOptionPrice === null || trade.underlying === "SOFI")
    )
  })

  const handlePriceChange = (tradeId: string, price: string) => {
    setPriceInputs((prev) => ({ ...prev, [tradeId]: price }))
  }

  const handleUpdatePrice = async (trade: Trade) => {
    const newPrice = priceInputs[trade.id]
    if (!newPrice) {
      toast({
        title: "Error",
        description: "Please enter a price",
        variant: "destructive",
      })
      return
    }

    setUpdatingTrade(trade.id)

    try {
      const updatedTrade = {
        ...trade,
        currentOptionPrice: Number.parseFloat(newPrice),
      }

      await onUpdateTrade(updatedTrade)

      // Calculate P&L for display
      const pnl = (trade.premiumReceived - Number.parseFloat(newPrice)) * trade.quantity * 100

      toast({
        title: "Price Updated! 🎯",
        description: `${trade.underlying} ${trade.optionType} updated to $${newPrice}. P&L: ${pnl >= 0 ? "+" : ""}$${pnl.toLocaleString()}`,
      })

      // Clear the input
      setPriceInputs((prev) => {
        const newInputs = { ...prev }
        delete newInputs[trade.id]
        return newInputs
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update price",
        variant: "destructive",
      })
    } finally {
      setUpdatingTrade(null)
    }
  }

  if (tradesNeedingPrices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            All Prices Updated!
          </CardTitle>
          <CardDescription>All your open trades have current option prices</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5" />
          Quick Price Updates
        </CardTitle>
        <CardDescription>Update current option prices for accurate P&L calculations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tradesNeedingPrices.map((trade) => {
          const currentInput = priceInputs[trade.id] || ""
          const estimatedPL = currentInput
            ? (trade.premiumReceived - Number.parseFloat(currentInput)) * trade.quantity * 100
            : trade.premiumReceived * trade.quantity * 100

          return (
            <div key={trade.id} className="border rounded-lg p-4 space-y-3">
              {/* Trade Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={trade.optionType === "put" ? "destructive" : "default"}>
                    {trade.optionType.toUpperCase()}
                  </Badge>
                  <div>
                    <h3 className="font-medium">{trade.underlying}</h3>
                    <p className="text-sm text-muted-foreground">
                      ${trade.strikePrice} • Exp: {new Date(trade.expirationDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Premium Received</p>
                  <p className="font-medium text-green-600">
                    ${(trade.premiumReceived * trade.quantity * 100).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Price Input */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="space-y-2">
                  <Label htmlFor={`price-${trade.id}`}>Current Option Price</Label>
                  <Input
                    id={`price-${trade.id}`}
                    type="number"
                    step="0.01"
                    placeholder={trade.underlying === "SOFI" ? "0.00" : "1.07"}
                    value={currentInput}
                    onChange={(e) => handlePriceChange(trade.id, e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estimated P&L</Label>
                  <div className={`text-lg font-medium ${estimatedPL >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {estimatedPL >= 0 ? "+" : ""}${estimatedPL.toLocaleString()}
                  </div>
                </div>

                <Button
                  onClick={() => handleUpdatePrice(trade)}
                  disabled={!currentInput || updatingTrade === trade.id}
                  className="w-full"
                >
                  {updatingTrade === trade.id ? "Updating..." : "Update Price"}
                </Button>
              </div>

              {/* Quick Suggestions for SOFI */}
              {trade.underlying === "SOFI" && (
                <div className="flex gap-2 pt-2">
                  <p className="text-sm text-muted-foreground">Quick fill:</p>
                  <Button variant="outline" size="sm" onClick={() => handlePriceChange(trade.id, "0.00")}>
                    $0.00 (Expired)
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handlePriceChange(trade.id, "0.01")}>
                    $0.01 (Nearly Expired)
                  </Button>
                </div>
              )}
            </div>
          )
        })}

        {/* Summary */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4" />
            <h4 className="font-medium">Update Summary</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {tradesNeedingPrices.length} trade{tradesNeedingPrices.length > 1 ? "s" : ""} need
            {tradesNeedingPrices.length === 1 ? "s" : ""} price updates. Total premium at risk: $
            {tradesNeedingPrices
              .reduce((sum, trade) => sum + trade.premiumReceived * trade.quantity * 100, 0)
              .toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
