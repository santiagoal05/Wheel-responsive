"use client"

import { useTradesData } from "@/hooks/use-trades"
import QuickPriceUpdate from "@/components/quick-price-update"
import { Toaster } from "@/components/ui/toaster"

export default function UpdatePricesPage() {
  const { trades, updateTrade, isLoading, connectionStatus } = useTradesData()

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
          <h1 className="text-3xl font-bold tracking-tight">Quick Price Updates</h1>
          <p className="text-muted-foreground mt-2">Update current option prices for accurate P&L calculations</p>
        </div>

        <QuickPriceUpdate trades={trades} onUpdateTrade={updateTrade} />
      </div>
      <Toaster />
    </div>
  )
}
