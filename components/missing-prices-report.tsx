"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Edit, RefreshCw, Download } from "lucide-react"
import type { Trade } from "@/types/trading"

interface MissingPricesReportProps {
  trades: Trade[]
  onEditTrade: (trade: Trade) => void
  onRefreshTrades: () => Promise<void>
}

export default function MissingPricesReport({ trades, onEditTrade, onRefreshTrades }: MissingPricesReportProps) {
  // Filter trades that are missing current option price
  const tradesWithMissingPrices = trades.filter((trade) => {
    return trade.status === "open" && (trade.currentOptionPrice === undefined || trade.currentOptionPrice === null)
  })

  const totalMissingPremium = tradesWithMissingPrices.reduce(
    (sum, trade) => sum + trade.premiumReceived * trade.quantity * 100,
    0,
  )

  const exportMissingPrices = () => {
    const csvContent = [
      "Symbol,Type,Strike,Expiration,Premium Received,Quantity,Date Sold,Status",
      ...tradesWithMissingPrices.map((trade) =>
        [
          trade.underlying,
          trade.optionType.toUpperCase(),
          trade.strikePrice,
          trade.expirationDate,
          trade.premiumReceived,
          trade.quantity,
          trade.dateSold,
          trade.status,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `missing-prices-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const calculateDaysToExpiration = (expirationDate: string) => {
    const expiry = new Date(expirationDate)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Missing Price Data Report
              </CardTitle>
              <CardDescription>
                Open positions without current option prices - P&L calculations may be inaccurate
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onRefreshTrades} size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {tradesWithMissingPrices.length > 0 && (
                <Button variant="outline" onClick={exportMissingPrices} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">{tradesWithMissingPrices.length}</div>
              <p className="text-sm text-muted-foreground">Trades Missing Prices</p>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">${totalMissingPremium.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Total Premium at Risk</p>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">{trades.filter((t) => t.status === "open").length}</div>
              <p className="text-sm text-muted-foreground">Total Open Positions</p>
            </Card>
          </div>

          {/* Alert */}
          {tradesWithMissingPrices.length > 0 ? (
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Action Required:</strong> {tradesWithMissingPrices.length} open position
                {tradesWithMissingPrices.length > 1 ? "s are" : " is"} missing current option price data. Update these
                prices to get accurate P&L calculations and better risk management insights.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>All Good!</strong> All open positions have current price data. Your P&L calculations are
                accurate.
              </AlertDescription>
            </Alert>
          )}

          {/* Missing Prices Table */}
          {tradesWithMissingPrices.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Strike</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Days to Exp</TableHead>
                    <TableHead>Premium Received</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradesWithMissingPrices
                    .sort((a, b) => {
                      // Sort by days to expiration (ascending) - most urgent first
                      const daysA = calculateDaysToExpiration(a.expirationDate)
                      const daysB = calculateDaysToExpiration(b.expirationDate)
                      return daysA - daysB
                    })
                    .map((trade) => {
                      const daysToExp = calculateDaysToExpiration(trade.expirationDate)
                      const premiumValue = trade.premiumReceived * trade.quantity * 100

                      // Determine priority based on days to expiration
                      let priority = "Low"
                      let priorityVariant: "default" | "secondary" | "destructive" = "secondary"

                      if (daysToExp <= 7) {
                        priority = "High"
                        priorityVariant = "destructive"
                      } else if (daysToExp <= 30) {
                        priority = "Medium"
                        priorityVariant = "default"
                      }

                      return (
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
                            <span className={daysToExp <= 7 ? "text-red-600 font-medium" : ""}>{daysToExp} days</span>
                          </TableCell>
                          <TableCell className="text-green-600">${premiumValue.toLocaleString()}</TableCell>
                          <TableCell>{trade.quantity}</TableCell>
                          <TableCell>
                            <Badge variant={priorityVariant}>{priority}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => onEditTrade(trade)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Update Price
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">How to Update Missing Prices:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Click "Update Price" next to any trade</li>
              <li>Enter the current market price of the option contract</li>
              <li>Save the changes to get accurate P&L calculations</li>
              <li>Prioritize trades expiring soon (marked as High priority)</li>
            </ol>
          </div>

          {/* Quick Stats by Symbol */}
          {tradesWithMissingPrices.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Missing Prices by Symbol:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from(new Set(tradesWithMissingPrices.map((t) => t.underlying))).map((symbol) => {
                  const symbolTrades = tradesWithMissingPrices.filter((t) => t.underlying === symbol)
                  const symbolPremium = symbolTrades.reduce(
                    (sum, trade) => sum + trade.premiumReceived * trade.quantity * 100,
                    0,
                  )

                  return (
                    <Card key={symbol} className="p-3">
                      <div className="font-medium">{symbol}</div>
                      <div className="text-sm text-muted-foreground">{symbolTrades.length} trades</div>
                      <div className="text-sm text-green-600">${symbolPremium.toLocaleString()}</div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
