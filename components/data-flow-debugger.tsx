"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RefreshCw, Database, Code, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { useTradesData } from "@/hooks/use-trades"

export default function DataFlowDebugger() {
  const [debugData, setDebugData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { trades: hookTrades, connectionStatus } = useTradesData()

  const loadDebugData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/debug/trades-data")
      const data = await response.json()
      setDebugData(data)
      console.log("🔍 Debug data:", data)
    } catch (error: any) {
      console.error("Error loading debug data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDebugData()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Flow Debugger
              </CardTitle>
              <CardDescription>Analyze the complete data flow from database to UI display</CardDescription>
            </div>
            <Button onClick={loadDebugData} disabled={isLoading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {debugData && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="text-2xl font-bold">{debugData.summary?.total || 0}</div>
                  <p className="text-sm text-muted-foreground">Total Open Trades</p>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-green-600">{debugData.summary?.withPrices || 0}</div>
                  <p className="text-sm text-muted-foreground">With Prices in DB</p>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold text-red-600">{debugData.summary?.missingPrices || 0}</div>
                  <p className="text-sm text-muted-foreground">Missing Prices in DB</p>
                </Card>
              </div>

              {/* Connection Status */}
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  <strong>Connection Status:</strong> {connectionStatus}
                </AlertDescription>
              </Alert>

              {/* Field Analysis */}
              {debugData.analysis?.fieldAnalysis && (
                <Card>
                  <CardHeader>
                    <CardTitle>Database Field Analysis</CardTitle>
                    <CardDescription>Analysis of raw database fields for the first trade</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(debugData.analysis.fieldAnalysis).map(([field, analysis]: [string, any]) => (
                        <div key={field} className="border rounded p-3">
                          <h4 className="font-medium mb-2">{field}</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Value:</span>{" "}
                              <code className="bg-muted px-1 rounded">{String(analysis.value)}</code>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Type:</span>{" "}
                              <Badge variant="secondary">{analysis.type}</Badge>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Is Null:</span>{" "}
                              {analysis.isNull ? (
                                <XCircle className="h-4 w-4 inline text-red-600" />
                              ) : (
                                <CheckCircle className="h-4 w-4 inline text-green-600" />
                              )}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Is Undefined:</span>{" "}
                              {analysis.isUndefined ? (
                                <XCircle className="h-4 w-4 inline text-red-600" />
                              ) : (
                                <CheckCircle className="h-4 w-4 inline text-green-600" />
                              )}
                            </div>
                            {analysis.parsed !== undefined && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Parsed:</span>{" "}
                                <code className="bg-muted px-1 rounded">{String(analysis.parsed)}</code>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transformation Test */}
              {debugData.analysis?.transformationTest && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Data Transformation Test
                    </CardTitle>
                    <CardDescription>How data transforms from database to React hook</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {debugData.analysis.transformationTest.error ? (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Transformation Error:</strong> {debugData.analysis.transformationTest.error}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Original (Database)</h4>
                            <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                              {JSON.stringify(debugData.analysis.transformationTest.original, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Transformed (React)</h4>
                            <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                              {JSON.stringify(debugData.analysis.transformationTest.transformed, null, 2)}
                            </pre>
                          </div>
                        </div>

                        <div className="border rounded p-3">
                          <h4 className="font-medium mb-2">Transformation Checks</h4>
                          <div className="space-y-2">
                            {Object.entries(debugData.analysis.transformationTest.checks).map(
                              ([check, result]: [string, any]) => (
                                <div key={check} className="flex items-center justify-between">
                                  <span className="text-sm">{check}:</span>
                                  <div className="flex items-center gap-2">
                                    <code className="bg-muted px-1 rounded text-xs">{String(result)}</code>
                                    {typeof result === "boolean" &&
                                      (result ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-red-600" />
                                      ))}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Trades with Prices */}
              {debugData.tradesWithPrices && debugData.tradesWithPrices.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">Trades WITH Prices in Database</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Symbol</TableHead>
                          <TableHead>DB Price</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Last Update</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {debugData.tradesWithPrices.map((trade: any) => (
                          <TableRow key={trade.id}>
                            <TableCell className="font-mono text-xs">{trade.id.slice(0, 8)}...</TableCell>
                            <TableCell className="font-medium">{trade.underlying}</TableCell>
                            <TableCell className="text-green-600 font-medium">
                              ${Number.parseFloat(trade.current_option_price).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{trade.type_of_price}</Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              {trade.last_update ? new Date(trade.last_update).toLocaleString() : "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Hook Data Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>React Hook Data Comparison</CardTitle>
                  <CardDescription>Compare database data with what the React hook provides</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Database Count</h4>
                        <div className="text-2xl font-bold">{debugData.summary?.total || 0}</div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Hook Count</h4>
                        <div className="text-2xl font-bold">{hookTrades.length}</div>
                      </div>
                    </div>

                    {hookTrades.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">First Trade from Hook</h4>
                        <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-40">
                          {JSON.stringify(
                            {
                              id: hookTrades[0].id,
                              underlying: hookTrades[0].underlying,
                              currentOptionPrice: hookTrades[0].currentOptionPrice,
                              currentPrice: hookTrades[0].currentPrice,
                              premiumReceived: hookTrades[0].premiumReceived,
                            },
                            null,
                            2,
                          )}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Raw Database Sample */}
              {debugData.analysis?.rawSample && (
                <Card>
                  <CardHeader>
                    <CardTitle>Raw Database Sample</CardTitle>
                    <CardDescription>First trade as stored in Supabase</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-60">
                      {JSON.stringify(debugData.analysis.rawSample, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
