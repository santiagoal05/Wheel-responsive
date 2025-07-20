"use client"

import AlpacaTest from "@/components/alpaca-test"
import { Toaster } from "@/components/ui/toaster"

export default function AlpacaTestPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Alpaca API Test</h1>
          <p className="text-muted-foreground mt-2">Test your Alpaca Markets integration and option price retrieval</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <AlpacaTest />
        </div>
      </div>
      <Toaster />
    </div>
  )
}
