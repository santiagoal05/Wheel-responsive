"use client"

import TradeDebugPanel from "@/components/trade-debug-panel"
import { Toaster } from "@/components/ui/toaster"

export default function DebugTradesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Trade Debug Panel</h1>
          <p className="text-muted-foreground mt-2">Detailed analysis and testing of trades missing price data</p>
        </div>

        <TradeDebugPanel />
      </div>
      <Toaster />
    </div>
  )
}
