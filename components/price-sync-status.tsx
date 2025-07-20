"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, Wifi, WifiOff, Clock, CheckCircle, XCircle, Settings, Zap, AlertTriangle } from "lucide-react"
import { alpacaClient } from "@/lib/alpaca-client"
import { priceUpdater } from "@/lib/price-updater"
import { useToast } from "@/hooks/use-toast"

export default function PriceSyncStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [updateProgress, setUpdateProgress] = useState(0)
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false)
  const [lastUpdateResult, setLastUpdateResult] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    checkConnection()

    // Check if auto-updates are enabled
    const autoUpdate = localStorage.getItem("auto-price-updates")
    if (autoUpdate === "enabled") {
      setAutoUpdateEnabled(true)
      priceUpdater.startAutoUpdates(60) // Every hour
    }
  }, [])

  const checkConnection = async () => {
    try {
      console.log("🔍 Testing Alpaca connection...")
      const connected = await alpacaClient.testConnection()
      setIsConnected(connected)

      if (connected) {
        console.log("✅ Alpaca connection verified")
      } else {
        console.log("❌ Alpaca connection failed")
      }
    } catch (error) {
      console.error("Connection check error:", error)
      setIsConnected(false)
    }
  }

  const handleManualUpdate = async () => {
    setIsUpdating(true)
    setUpdateProgress(0)
    setLastUpdateResult(null)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUpdateProgress((prev) => Math.min(prev + 5, 90))
      }, 1000)

      console.log("🚀 Starting manual price update...")
      const result = await priceUpdater.updateAllOptionPrices()

      clearInterval(progressInterval)
      setUpdateProgress(100)
      setLastUpdateResult(result)

      setTimeout(() => {
        setUpdateProgress(0)
        setIsUpdating(false)
        setLastUpdate(new Date())
      }, 2000)

      if (result.updated > 0) {
        toast({
          title: "Prices Updated! 🎯",
          description: `Successfully updated ${result.updated} option prices`,
        })
      }

      if (result.failed > 0) {
        toast({
          title: "Partial Update",
          description: `${result.updated} updated, ${result.failed} failed. Check details below.`,
          variant: "destructive",
        })
      }

      if (result.updated === 0 && result.failed === 0) {
        toast({
          title: "No Updates",
          description: "No open trades found to update",
        })
      }
    } catch (error: any) {
      setIsUpdating(false)
      setUpdateProgress(0)
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update prices",
        variant: "destructive",
      })
    }
  }

  const toggleAutoUpdates = () => {
    const newState = !autoUpdateEnabled
    setAutoUpdateEnabled(newState)

    if (newState) {
      localStorage.setItem("auto-price-updates", "enabled")
      priceUpdater.startAutoUpdates(60)
      toast({
        title: "Auto-Updates Enabled",
        description: "Option prices will update automatically every hour",
      })
    } else {
      localStorage.setItem("auto-price-updates", "disabled")
      toast({
        title: "Auto-Updates Disabled",
        description: "You'll need to update prices manually",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Live Price Sync
              </CardTitle>
              <CardDescription>Automatic option price updates via Alpaca Markets</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isConnected === true && <Wifi className="h-4 w-4 text-green-600" />}
              {isConnected === false && <WifiOff className="h-4 w-4 text-red-600" />}
              {isConnected === null && <RefreshCw className="h-4 w-4 animate-spin" />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <Alert>
            <div className="flex items-center gap-2">
              {isConnected === true && <CheckCircle className="h-4 w-4 text-green-600" />}
              {isConnected === false && <XCircle className="h-4 w-4 text-red-600" />}
              {isConnected === null && <RefreshCw className="h-4 w-4 animate-spin" />}
            </div>
            <AlertDescription>
              {isConnected === true && (
                <span className="text-green-600 font-medium">✅ Connected to Alpaca Markets - Live data available</span>
              )}
              {isConnected === false && (
                <span className="text-red-600 font-medium">❌ Not connected - Check your Alpaca API credentials</span>
              )}
              {isConnected === null && <span className="text-muted-foreground">🔄 Testing connection...</span>}
            </AlertDescription>
          </Alert>

          {/* Auto-Update Status */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4" />
              <div>
                <p className="font-medium">Automatic Updates</p>
                <p className="text-sm text-muted-foreground">
                  {autoUpdateEnabled ? "Updates every hour" : "Manual updates only"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={autoUpdateEnabled ? "default" : "secondary"}>
                {autoUpdateEnabled ? "Enabled" : "Disabled"}
              </Badge>
              <Button variant="outline" size="sm" onClick={toggleAutoUpdates}>
                <Settings className="h-4 w-4 mr-1" />
                {autoUpdateEnabled ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>

          {/* Manual Update */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Manual Update</p>
                <p className="text-sm text-muted-foreground">
                  {lastUpdate ? `Last updated: ${lastUpdate.toLocaleTimeString()}` : "Never updated"}
                </p>
              </div>
              <Button onClick={handleManualUpdate} disabled={isUpdating || isConnected === false} size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? "animate-spin" : ""}`} />
                {isUpdating ? "Updating..." : "Update Now"}
              </Button>
            </div>

            {isUpdating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Updating option prices...</span>
                  <span>{updateProgress}%</span>
                </div>
                <Progress value={updateProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">This may take a few moments for multiple trades</p>
              </div>
            )}
          </div>

          {/* Test Connection Button */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={checkConnection} disabled={isConnected === null}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isConnected === null ? "animate-spin" : ""}`} />
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Last Update Results */}
      {lastUpdateResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {lastUpdateResult.updated > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              )}
              Last Update Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{lastUpdateResult.updated}</div>
                <p className="text-sm text-muted-foreground">Updated</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{lastUpdateResult.failed}</div>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{lastUpdateResult.details?.length || 0}</div>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>

            {lastUpdateResult.details && lastUpdateResult.details.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Details:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {lastUpdateResult.details.map((detail: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 border rounded">
                      <span>{detail.symbol}</span>
                      {detail.success ? (
                        <span className="text-green-600">✅ ${detail.price?.toFixed(2)}</span>
                      ) : (
                        <span className="text-red-600">❌ {detail.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lastUpdateResult.errors && lastUpdateResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Errors:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {lastUpdateResult.errors.slice(0, 3).map((error: string, index: number) => (
                      <li key={index} className="text-xs">
                        {error}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Setup Instructions */}
      {isConnected === false && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium">1. Get Alpaca API Keys (Free)</h4>
              <p className="text-sm text-muted-foreground">
                Sign up at{" "}
                <a href="https://alpaca.markets" target="_blank" className="text-blue-600 underline" rel="noreferrer">
                  alpaca.markets
                </a>{" "}
                and get your API keys
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">2. Add Environment Variables</h4>
              <div className="p-3 bg-black text-green-400 rounded text-xs font-mono">
                ALPACA_API_KEY=your_api_key
                <br />
                ALPACA_SECRET_KEY=your_secret_key
              </div>
              <p className="text-xs text-muted-foreground">
                Note: Use ALPACA_API_KEY and ALPACA_SECRET_KEY (without NEXT_PUBLIC prefix) for server-side security
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">3. Test Connection</h4>
              <p className="text-sm text-muted-foreground">
                Use the test button above to verify your API is working correctly
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
