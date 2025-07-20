"use client"

import DataFlowDebugger from "@/components/data-flow-debugger"
import { Toaster } from "@/components/ui/toaster"

export default function DebugDataFlowPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Data Flow Debugger</h1>
          <p className="text-muted-foreground mt-2">
            Investigate and resolve issues with option price display in the trades section
          </p>
        </div>

        <DataFlowDebugger />
      </div>
      <Toaster />
    </div>
  )
}
