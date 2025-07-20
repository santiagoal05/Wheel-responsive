"use client"

import SmartOptionAnalyzer from "@/components/smart-option-analyzer"
import { Toaster } from "@/components/ui/toaster"

export default function SmartAnalyzerPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Smart Option Analyzer</h1>
          <p className="text-muted-foreground mt-2">
            Intelligent analysis of option symbols with multiple format testing and actionable recommendations
          </p>
        </div>

        <SmartOptionAnalyzer />
      </div>
      <Toaster />
    </div>
  )
}
