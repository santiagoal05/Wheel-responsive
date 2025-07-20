"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Clock, Target, AlertTriangle, CheckCircle, DollarSign } from "lucide-react"
import { PnLDisplay } from "./pnl-display"
import { PositionStatusBadge } from "./position-status-badge"
import { OptionTypeBadge } from "./option-type-badge"
import type { Trade } from "@/types/trading"

interface PositionSummaryCardsProps {
  trades: Trade[]
}

export function PositionSummaryCards({ trades }: PositionSummaryCardsProps) {
  const openTrades = trades.filter((trade) => trade.status === "open")
  const closedTrades = trades.filter((trade) => trade.status !== "open")

  const calculateDaysToExpiration = (expirationDate: string) => {
    const expiry = new Date(expirationDate)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const calculateMoneyness = (trade: Trade) => {
    const { optionType, strikePrice, currentPrice } = trade
    if (optionType === "put") {
      return currentPrice > strikePrice ? "OTM" : "ITM"
    } else {
      return currentPrice < strikePrice ? "OTM" : "ITM"
    }
  }

  const calculateProbabilityProfit = (trade: Trade) => {
    if (trade.currentOptionPrice !== undefined) {
      const currentPL = (trade.premiumReceived - trade.currentOptionPrice) * trade.quantity * 100
      const maxProfit = trade.premiumReceived * trade.quantity * 100
      const profitPercentage = (currentPL / maxProfit) * 100
      return Math.max(20, Math.min(95, 50 + profitPercentage * 0.5))
    }
    return 50
  }

  // Summary metrics
  const totalOpenValue = openTrades.reduce((sum, trade) => sum + trade.premiumReceived * trade.quantity * 100, 0)

  const totalUnrealizedPL = openTrades.reduce((sum, trade) => {
    if (trade.currentOptionPrice !== undefined && trade.currentOptionPrice !== null) {
      return sum + (trade.premiumReceived - trade.currentOptionPrice) * trade.quantity * 100
    }
    return sum + trade.premiumReceived * trade.quantity * 100
  }, 0)

  const totalRealizedPL = closedTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0)

  const winRate =
    closedTrades.length > 0
      ? (closedTrades.filter((trade) => (trade.profitLoss || 0) > 0).length / closedTrades.length) * 100
      : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{openTrades.length}</div>
            <PnLDisplay value={totalOpenValue} size="sm" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Positions</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{closedTrades.length}</div>
            <PnLDisplay value={totalRealizedPL} size="sm" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unrealized P&L</CardTitle>
            {totalUnrealizedPL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <PnLDisplay value={totalUnrealizedPL} size="lg" showIcon={false} />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {closedTrades.filter((t) => (t.profitLoss || 0) > 0).length} of {closedTrades.length} profitable
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Open Positions Detail */}
      {openTrades.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Open Positions Detail
          </h3>

          <div className="grid gap-4">
            {openTrades.map((trade) => {
              const daysToExp = calculateDaysToExpiration(trade.expirationDate)
              const moneyness = calculateMoneyness(trade)
              const probProfit = calculateProbabilityProfit(trade)
              const currentOptionValue = trade.currentOptionPrice || 0
              const unrealizedPL = (trade.premiumReceived - currentOptionValue) * trade.quantity * 100
              const maxProfit = trade.premiumReceived * trade.quantity * 100
              const profitPercentage = maxProfit > 0 ? (unrealizedPL / maxProfit) * 100 : 0

              return (
                <Card
                  key={trade.id}
                  className={cn(
                    "transition-all duration-200 hover:shadow-md",
                    "border-l-4 border-l-blue-500 bg-blue-50/20",
                  )}
                >
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Position Details */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold">{trade.underlying}</h3>
                          <div className="flex gap-2">
                            <OptionTypeBadge type={trade.optionType} />
                            <PositionStatusBadge status={trade.status} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Strike Price</p>
                            <p className="font-semibold text-lg">${trade.strikePrice}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Current Price</p>
                            <p className="font-semibold text-lg">${trade.currentPrice}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Quantity</p>
                            <p className="font-semibold">{trade.quantity} contracts</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Premium Received</p>
                            <PnLDisplay
                              value={trade.premiumReceived * trade.quantity * 100}
                              size="sm"
                              showBackground={true}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Risk Metrics */}
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Risk Analysis
                        </h4>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Moneyness</span>
                            <Badge variant={moneyness === "OTM" ? "secondary" : "destructive"}>{moneyness}</Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Days to Expiration</span>
                            <div className="flex items-center gap-2">
                              {daysToExp <= 7 && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                              <span
                                className={cn("font-semibold", daysToExp <= 7 ? "text-orange-600" : "text-foreground")}
                              >
                                {daysToExp} days
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Probability of Profit</span>
                              <span className="font-semibold">{probProfit.toFixed(0)}%</span>
                            </div>
                            <Progress value={probProfit} className="h-2" />
                          </div>
                        </div>
                      </div>

                      {/* P&L Analysis */}
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          P&L Analysis
                        </h4>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Current P&L</span>
                            <PnLDisplay value={unrealizedPL} size="md" showBackground={true} showIcon={true} />
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Max Profit</span>
                            <PnLDisplay value={maxProfit} size="sm" showBackground={true} />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Profit Captured</span>
                              <span className="font-semibold">{Math.max(0, profitPercentage).toFixed(1)}%</span>
                            </div>
                            <Progress value={Math.max(0, Math.min(100, profitPercentage))} className="h-2" />
                          </div>

                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Assignment Risk</span>
                              <Badge variant={moneyness === "ITM" ? "destructive" : "secondary"}>
                                {moneyness === "ITM" ? "High" : "Low"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
