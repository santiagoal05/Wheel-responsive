"use client"

import PriceSyncStatus from "@/components/price-sync-status"
import { Toaster } from "@/components/ui/toaster"

export default function PriceSyncPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Live Price Sync</h1>
          <p className="text-muted-foreground mt-2">Automatic option price updates using Alpaca Markets API</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <PriceSyncStatus />
        </div>
      </div>
      <Toaster />
    </div>
  )
}
