"use client"

import DebugCenter from "@/components/debug-center"
import { Toaster } from "@/components/ui/toaster"

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Debug Center</h1>
          <p className="text-muted-foreground mt-2">
            Centralized debugging and diagnostic tools for troubleshooting your options trading app
          </p>
        </div>

        <DebugCenter />
      </div>
      <Toaster />
    </div>
  )
}
