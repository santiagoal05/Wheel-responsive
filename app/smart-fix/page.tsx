"use client"

import SmartPriceFixer from "@/components/smart-price-fixer"
import { Toaster } from "@/components/ui/toaster"

export default function SmartFixPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Smart Price Fixer</h1>
          <p className="text-muted-foreground mt-2">
            Intelligent option price updates using multiple symbol format testing and automatic detection
          </p>
        </div>

        <SmartPriceFixer />
      </div>
      <Toaster />
    </div>
  )
}
