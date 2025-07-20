"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, Bug, RefreshCw } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"

export default function AlpacaDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runDebug = async () => {
    setIsLoading(true)
    const info: any = {
      timestamp: new Date().toISOString(),
      environment: {},
      clientTest: null,
      connectionTest: null,
      sampleQuoteTest: null,
    }

    // Check environment variables
    info.environment = {
      ALPACA_API_KEY: process.env.ALPACA_API_KEY ? `${process.env.ALPACA_API_KEY.substring(0, 8)}...` : "❌ Missing",
      ALPACA_SECRET_KEY: process.env.ALPACA_SECRET_KEY
        ? `${process.env.ALPACA_SECRET_KEY.substring(0, 8)}...`
        : "❌ Missing",
      NEXT_PUBLIC_ALPACA_API_KEY: process.env.NEXT_PUBLIC_ALPACA_API_KEY
        ? `${process.env.NEXT_PUBLIC_ALPACA_API_KEY.substring(0, 8)}...`
        : "❌ Missing",
      NEXT_PUBLIC_ALPACA_SECRET_KEY: process.env.NEXT_PUBLIC_ALPACA_SECRET_KEY
        ? `${process.env.NEXT_PUBLIC_ALPACA_SECRET_KEY.substring(0, 8)}...`
        : "❌ Missing",
      ALPACA_BASE_URL: process.env.ALPACA_BASE_URL || "❌ Missing",
    }

    // Test client creation
    try {
      const { alpacaClient } = await import("@/lib/alpaca-client")
      info.clientTest = {
        success: true,
        hasCredentials: !!alpacaClient,
      }

      // Test connection
      if (alpacaClient) {
        const connectionResult = await alpacaClient.testConnection()
        info.connectionTest = {
          success: connectionResult,
          tested: true,
        }

        // Test sample quote if connection works
        if (connectionResult) {
          try {
            const samplePrice = await alpacaClient.getOptionQuote("AAPL", "2024-03-15", "put", 180)
            info.sampleQuoteTest = {
              success: samplePrice !== null,
              price: samplePrice,
              symbol: "AAPL 240315P180",
            }
          } catch (error: any) {
            info.sampleQuoteTest = {
              success: false,
              error: error.message,
            }
          }
        }
      }
    } catch (error: any) {
      info.clientTest = {
        success: false,
        error: error.message,
      }
    }

    setDebugInfo(info)
    setIsLoading(false)
  }

  useEffect(() => {
    runDebug()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bug className="h-8 w-8" />
            Alpaca API Debug
          </h1>
          <p className="text-muted-foreground mt-2">Detailed debugging information for Alpaca API integration</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Debug Information</h2>
            <Button onClick={runDebug} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Running..." : "Refresh Debug"}
            </Button>
          </div>

          {debugInfo && (
            <>
              {/* Overall Status */}
              <Alert>
                <div className="flex items-center gap-2">
                  {debugInfo.connectionTest?.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <AlertDescription>
                  <strong>Overall Status:</strong>{" "}
                  {debugInfo.connectionTest?.success ? (
                    <span className="text-green-600">✅ Alpaca API is working correctly!</span>
                  ) : (
                    <span className="text-red-600">❌ Alpaca API connection failed</span>
                  )}
                </AlertDescription>
              </Alert>

              {/* Environment Variables */}
              <Card>
                <CardHeader>
                  <CardTitle>Environment Variables</CardTitle>
                  <CardDescription>Check if API keys are properly loaded</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(debugInfo.environment).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded">
                        <span className="font-mono text-sm">{key}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{value}</span>
                          {value.includes("❌") ? (
                            <XCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Connection Test */}
              <Card>
                <CardHeader>
                  <CardTitle>API Connection Test</CardTitle>
                  <CardDescription>Test actual connection to Alpaca API</CardDescription>
                </CardHeader>
                <CardContent>
                  {debugInfo.connectionTest ? (
                    <Alert>
                      <div className="flex items-center gap-2">
                        {debugInfo.connectionTest.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <AlertDescription>
                        {debugInfo.connectionTest.success ? (
                          <strong>✅ API Connection Successful</strong>
                        ) : (
                          <strong>❌ API Connection Failed</strong>
                        )}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>Connection test not run - Client creation failed</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Sample Quote Test */}
              {debugInfo.sampleQuoteTest && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sample Quote Test</CardTitle>
                    <CardDescription>Test retrieving actual option price data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Alert>
                      <div className="flex items-center gap-2">
                        {debugInfo.sampleQuoteTest.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <AlertDescription>
                        {debugInfo.sampleQuoteTest.success ? (
                          <div>
                            <strong>✅ Quote Retrieved Successfully</strong>
                            <div className="mt-2 p-3 bg-muted rounded">
                              <p>
                                <strong>Symbol:</strong> {debugInfo.sampleQuoteTest.symbol}
                              </p>
                              <p>
                                <strong>Price:</strong>{" "}
                                <span className="text-green-600 font-bold">
                                  ${debugInfo.sampleQuoteTest.price?.toFixed(2)}
                                </span>
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <strong>❌ Quote Test Failed</strong>
                            <p className="text-sm mt-1">
                              {debugInfo.sampleQuoteTest.error || "No price data available"}
                            </p>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}

              {/* Next Steps */}
              {debugInfo.connectionTest?.success && (
                <Card>
                  <CardHeader>
                    <CardTitle>🎉 Ready to Use!</CardTitle>
                    <CardDescription>Your Alpaca integration is working. Here's what you can do next:</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 border rounded">
                        <Badge>1</Badge>
                        <div>
                          <p className="font-medium">Enable Auto-Updates</p>
                          <p className="text-sm text-muted-foreground">
                            Go to Price Sync to enable automatic hourly updates
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded">
                        <Badge>2</Badge>
                        <div>
                          <p className="font-medium">Update Missing Prices</p>
                          <p className="text-sm text-muted-foreground">
                            Use Quick Update to fill in current option prices
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded">
                        <Badge>3</Badge>
                        <div>
                          <p className="font-medium">Monitor Your Trades</p>
                          <p className="text-sm text-muted-foreground">
                            Return to Dashboard to see accurate P&L calculations
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Raw Debug Data */}
              <Card>
                <CardHeader>
                  <CardTitle>Raw Debug Data</CardTitle>
                  <CardDescription>Complete debug information for troubleshooting</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </>
          )}

          {isLoading && (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Running comprehensive debug tests...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  )
}
