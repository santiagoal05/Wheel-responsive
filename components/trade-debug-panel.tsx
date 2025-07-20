"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RefreshCw, Bug, TestTube, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TradeDebugPanel() {
  const [debugData, setDebugData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [testingSymbol, setTestingSymbol] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const { toast } = useToast()

  const loadDebugData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/alpaca/debug-trades")
      const data = await response.json()
      setDebugData(data)
      console.log("Debug data:", data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testSpecificSymbol = async (optionSymbol: string) => {
    setTestingSymbol(optionSymbol)
    setTestResults(null)

    try {
      const response = await fetch("/api/alpaca/test-specific-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ optionSymbol }),
      })

      const data = await response.json()
      setTestResults(data)
      console.log("Test results:", data)

      const successfulEndpoint = data.results?.find((r: any) => r.success && r.hasQuote)
      if (successfulEndpoint) {
        toast({
          title: "Quote Found! 🎯",
          description: `Found data for ${optionSymbol} via ${successfulEndpoint.endpoint}`,
        })
      } else {
        toast({
          title: "No Quote Found",
          description: `No data available for ${optionSymbol} on any endpoint`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Test Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setTestingSymbol(null)
    }
  }

  const forceUpdateTrade = async (tradeId: string) => {
    try {
      const response = await fetch("/api/alpaca/update-prices", {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Update Complete",
          description: `${data.updated} trades updated, ${data.failed} failed`,
        })
        loadDebugData() // Refresh the data
      }
    } catch (error: any) {
      toast({
        title: "Update Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    loadDebugData()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Trade Debug Panel
              </CardTitle>
              <CardDescription>Detailed analysis of trades and their price data</CardDescription>
            </div>
            <Button onClick={loadDebugData} disabled={isLoading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {debugData && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="p-4">
                  <div className="text-2xl font-bold">{debugData.summary?.total || 0}</div>
                  <p className="text-sm text-muted-foreground">Total Open Trades</p>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-green-600">{debugData.summary?.withPrices || 0}</div>
                  <p className="text-sm text-muted-foreground">With Prices</p>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-red-600">{debugData.summary?.missingPrices || 0}</div>
                  <p className="text-sm text-muted-foreground">Missing Prices</p>
                </Card>
              </div>

              {/* Missing Prices Alert */}
              {debugData.summary?.missingPrices > 0 && (
                <Alert className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Action Required:</strong> {debugData.summary.missingPrices} trade
                    {debugData.summary.missingPrices > 1 ? "s are" : " is"} missing price data. Use the test buttons
                    below to diagnose why.
                  </AlertDescription>
                </Alert>
              )}

              {/* Trades Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Strike</TableHead>
                      <TableHead>Expiration</TableHead>
                      <TableHead>Days to Exp</TableHead>
                      <TableHead>Current Price</TableHead>
                      <TableHead>Option Symbol</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debugData.trades?.map((trade: any) => (
                      <TableRow key={trade.id}>
                        <TableCell className="font-medium">{trade.underlying}</TableCell>
                        <TableCell>
                          <Badge variant={trade.optionType === "put" ? "destructive" : "default"}>
                            {trade.optionType.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>${trade.strikePrice}</TableCell>
                        <TableCell>{new Date(trade.expirationDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={trade.daysToExpiry <= 7 ? "text-red-600 font-medium" : ""}>
                            {trade.daysToExpiry} days
                          </span>
                        </TableCell>
                        <TableCell>
                          {trade.hasPrice ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-green-600">
                                ${Number.parseFloat(trade.currentPrice).toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span className="text-red-600">Missing</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{trade.optionSymbol}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => testSpecificSymbol(trade.optionSymbol)}
                              disabled={testingSymbol === trade.optionSymbol}
                            >
                              <TestTube
                                className={`h-4 w-4 mr-1 ${testingSymbol === trade.optionSymbol ? "animate-spin" : ""}`}
                              />
                              Test
                            </Button>
                            {!trade.hasPrice && (
                              <Button variant="outline" size="sm" onClick={() => forceUpdateTrade(trade.id)}>
                                Update
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results for {testResults.optionSymbol}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.results?.map((result: any, index: number) => (
                <Alert key={index} className={result.success ? "border-green-200" : "border-red-200"}>
                  <div className="flex items-center gap-2">
                    {result.success && result.hasQuote ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : result.success ? (
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <AlertDescription>
                    <div>
                      <strong>Endpoint {result.endpoint}:</strong> Status {result.status}
                      {result.success && result.hasQuote && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          <strong>Quote Data Found!</strong>
                          <pre className="mt-1 overflow-auto">
                            {JSON.stringify(result.data?.quotes?.[testResults.optionSymbol], null, 2)}
                          </pre>
                        </div>
                      )}
                      {result.success && !result.hasQuote && (
                        <div className="mt-1 text-sm text-orange-600">
                          API responded successfully but no quote data found
                        </div>
                      )}
                      {!result.success && (
                        <div className="mt-1 text-sm text-red-600">{result.error || `HTTP ${result.status}`}</div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
