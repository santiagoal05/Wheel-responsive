"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  PieChart,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Database,
  AlertTriangle,
  Zap,
  Settings,
  Bug,
} from "lucide-react"
import TradesManager from "@/components/trades-manager"
import PositionsSummary from "@/components/positions-summary"
import PerformanceCharts from "@/components/performance-charts"
import DebugCenter from "@/components/debug-center"
import { useTradesData } from "@/hooks/use-trades"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"

export default function OptionsWheelTracker() {
  const { trades, addTrade, updateTrade, deleteTrade, refreshTrades, isLoading, error, hasSupabase, connectionStatus } =
    useTradesData()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your trades...</p>
          <p className="text-sm text-muted-foreground mt-2">{connectionStatus}</p>
        </div>
      </div>
    )
  }

  // Calculate key metrics
  const openTrades = trades.filter((trade) => trade.status === "open")
  const closedTrades = trades.filter((trade) => trade.status !== "open")
  const tradesWithMissingPrices = openTrades.filter(
    (trade) => trade.currentOptionPrice === undefined || trade.currentOptionPrice === null,
  )

  const totalPremiumReceived = trades.reduce((sum, trade) => sum + trade.premiumReceived * trade.quantity * 100, 0)
  const totalProfitLoss = closedTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0)

  // Calculate unrealized P&L using option prices
  const unrealizedPL = openTrades.reduce((sum, trade) => {
    const currentPrice = trade.currentOptionPrice ?? 0;
    const tradePL = (trade.premiumReceived - currentPrice) * trade.quantity * 100;
    return sum + tradePL;
  }, 0);

  const winRate =
    closedTrades.length > 0
      ? (closedTrades.filter((trade) => (trade.profitLoss || 0) > 0).length / closedTrades.length) * 100
      : 0

  // Check if there are any issues that need attention
  const hasIssues = tradesWithMissingPrices.length > 0 || error || !hasSupabase

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Options Wheel Strategy Tracker</h1>
              <p className="text-muted-foreground mt-2">
                Track your cash-secured puts and covered calls with comprehensive analytics
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                {hasSupabase ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Database className="h-4 w-4 text-orange-500" />
                )}
                <Badge variant={hasSupabase ? "default" : "secondary"}>
                  {hasSupabase ? "Supabase Connected" : "Local Storage"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{connectionStatus}</p>
            </div>
          </div>
        </div>

        {/* System Status Alerts */}
        <div className="space-y-4 mb-6">
          {/* Connection Status */}
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>Connection Status:</strong> {connectionStatus}
              {hasSupabase && (
                <span className="block mt-1 text-sm">
                  ✅ All changes are automatically saved to your Supabase database!
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Price Sync Status */}
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <strong>Live Price Sync:</strong> Automatic option price updates via Alpaca Markets API
              </div>
              <Link href="/price-sync">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </Link>
            </AlertDescription>
          </Alert>

          {/* Missing Prices Alert */}
          {tradesWithMissingPrices.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <strong>Missing Price Data:</strong> {tradesWithMissingPrices.length} open position
                  {tradesWithMissingPrices.length > 1 ? "s are" : " is"} missing current option prices. This affects P&L
                  accuracy.
                </div>
                <div className="flex gap-2">
                  <Link href="/missing-prices">
                    <Button variant="outline" size="sm">
                      View Report
                    </Button>
                  </Link>
                  <Link href="/smart-fix">
                    <Button size="sm">Auto-Fix</Button>
                  </Link>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <div>{error}</div>
                <Link href="/debug">
                  <Button variant="outline" size="sm">
                    <Bug className="h-4 w-4 mr-2" />
                    Debug
                  </Button>
                </Link>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Premium Received</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalPremiumReceived.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From {trades.length} total trades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Realized P&L</CardTitle>
              {totalProfitLoss >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalProfitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${totalProfitLoss.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">From {closedTrades.length} closed positions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unrealized P&L</CardTitle>
              {unrealizedPL >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${unrealizedPL >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${unrealizedPL.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                From {openTrades.length} open positions
                {tradesWithMissingPrices.length > 0 && (
                  <span className="text-orange-600"> ({tradesWithMissingPrices.length} missing prices)</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Success rate on closed trades</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 gap-2">
                <TabsTrigger value="dashboard" className="flex items-center justify-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="trades" className="flex items-center justify-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Trades
                </TabsTrigger>
                <TabsTrigger value="positions" className="flex items-center justify-center gap-2">
                  <Target className="h-4 w-4" />
                  Positions
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center justify-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                {hasIssues && (
                  <TabsTrigger value="debug" className="flex items-center justify-center gap-2">
                    <Bug className="h-4 w-4" />
                    Debug
                    <Badge variant="destructive" className="text-xs">
                      {tradesWithMissingPrices.length}
                    </Badge>
                  </TabsTrigger>
                )}
              </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest options trades</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {trades.slice(0, 5).map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={trade.optionType === "put" ? "destructive" : "default"}>
                          {trade.optionType.toUpperCase()}
                        </Badge>
                        <div>
                          <p className="font-medium">{trade.underlying}</p>
                          <p className="text-sm text-muted-foreground">
                            ${trade.strikePrice} • {new Date(trade.expirationDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          +${(trade.premiumReceived * trade.quantity * 100).toLocaleString()}
                        </p>
                        <Badge variant={trade.status === "open" ? "secondary" : "outline"}>{trade.status}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Allocation</CardTitle>
                  <CardDescription>Distribution by underlying asset</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from(new Set(trades.map((t) => t.underlying))).map((symbol) => {
                      const symbolTrades = trades.filter((t) => t.underlying === symbol)
                      const totalValue = symbolTrades.reduce(
                        (sum, trade) => sum + trade.premiumReceived * trade.quantity * 100,
                        0,
                      )
                      const percentage = totalPremiumReceived > 0 ? (totalValue / totalPremiumReceived) * 100 : 0

                      return (
                        <div key={symbol} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{symbol}</span>
                            <span>{percentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trades">
            <TradesManager
              trades={trades}
              addTrade={addTrade}
              updateTrade={updateTrade}
              deleteTrade={deleteTrade}
              refreshTrades={refreshTrades}
            />
          </TabsContent>

          <TabsContent value="positions">
            <PositionsSummary trades={openTrades} />
          </TabsContent>

          <TabsContent value="analytics">
            <PerformanceCharts trades={trades} />
          </TabsContent>

          {hasIssues && (
            <TabsContent value="debug">
              <DebugCenter showQuickActions={true} />
            </TabsContent>
          )}
        </Tabs>
      </div>
      <Toaster />
    </div>
  )
}
