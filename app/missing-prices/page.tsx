"use client"

import { useState } from "react"
import { useTradesData } from "@/hooks/use-trades"
import MissingPricesReport from "@/components/missing-prices-report"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import type { Trade } from "@/types/trading"

export default function MissingPricesPage() {
  const { trades, updateTrade, refreshTrades, isLoading, connectionStatus } = useTradesData()
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null)
  const [currentOptionPrice, setCurrentOptionPrice] = useState("")
  const { toast } = useToast()

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade)
    setCurrentOptionPrice(trade.currentOptionPrice?.toString() || "")
  }

  const handleUpdatePrice = async () => {
    if (!editingTrade) return

    try {
      const updatedTrade = {
        ...editingTrade,
        currentOptionPrice: Number.parseFloat(currentOptionPrice),
      }

      await updateTrade(updatedTrade)

      toast({
        title: "Price Updated",
        description: `Successfully updated ${editingTrade.underlying} option price to $${currentOptionPrice}`,
      })

      setEditingTrade(null)
      setCurrentOptionPrice("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update price",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading trades...</p>
          <p className="text-sm text-muted-foreground mt-2">{connectionStatus}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Missing Price Data Report</h1>
          <p className="text-muted-foreground mt-2">
            Identify and update trades missing current option prices for accurate P&L calculations
          </p>
        </div>

        <MissingPricesReport trades={trades} onEditTrade={handleEditTrade} onRefreshTrades={refreshTrades} />

        {/* Edit Price Dialog */}
        <Dialog open={!!editingTrade} onOpenChange={() => setEditingTrade(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Option Price</DialogTitle>
              <DialogDescription>
                Enter the current market price for {editingTrade?.underlying} {editingTrade?.optionType} $
                {editingTrade?.strikePrice}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Symbol:</span>
                  <p className="font-medium">{editingTrade?.underlying}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-medium">{editingTrade?.optionType?.toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Strike:</span>
                  <p className="font-medium">${editingTrade?.strikePrice}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Expiration:</span>
                  <p className="font-medium">
                    {editingTrade?.expirationDate ? new Date(editingTrade.expirationDate).toLocaleDateString() : ""}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Premium Received:</span>
                  <p className="font-medium text-green-600">${editingTrade?.premiumReceived}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Quantity:</span>
                  <p className="font-medium">{editingTrade?.quantity} contracts</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentOptionPrice">Current Option Price</Label>
                <Input
                  id="currentOptionPrice"
                  type="number"
                  step="0.01"
                  placeholder="1.07"
                  value={currentOptionPrice}
                  onChange={(e) => setCurrentOptionPrice(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">Enter the current market price of this option contract</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingTrade(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdatePrice} disabled={!currentOptionPrice}>
                  Update Price
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Toaster />
    </div>
  )
}
