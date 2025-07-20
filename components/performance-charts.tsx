"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from "recharts"
import type { Trade } from "@/types/trading"
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react"

interface PerformanceChartsProps {
  trades: Trade[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 text-sm bg-background/90 border rounded-lg shadow-lg">
        <p className="font-bold">{label}</p>
        <p style={{ color: payload[0].color }}>
          {`${payload[0].name}: ${payload[0].value.toLocaleString("en-US", { style: "currency", currency: "USD" })}`}
        </p>
      </div>
    )
  }
  return null
}

export default function PerformanceCharts({ trades }: PerformanceChartsProps) {
  if (!trades || trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            <p>No trade data available.</p>
            <p>Add some trades to see your performance charts.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  const closedTrades = trades.filter((t) => t.status === "closed" && t.profitLoss != null)

  if (closedTrades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            <p>No closed trades with profit/loss data yet.</p>
            <p>Close some trades to see your performance analytics.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Cumulative P&L
  const cumulativePnL = closedTrades
    .sort((a, b) => new Date(a.dateSold).getTime() - new Date(b.dateSold).getTime())
    .reduce((acc, trade, index) => {
      const pnl = trade.profitLoss || 0
      const prevPnl = index > 0 ? acc[index - 1].cumulativePnl : 0
      acc.push({
        date: new Date(trade.dateSold).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        pnl: pnl,
        cumulativePnl: prevPnl + pnl,
      })
      return acc
    }, [] as Array<{ date: string; pnl: number; cumulativePnl: number }>)

  // Key Performance Indicators
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0)
  const winningTrades = closedTrades.filter((t) => (t.profitLoss || 0) > 0).length
  const losingTrades = closedTrades.filter((t) => (t.profitLoss || 0) < 0).length
  const winRate = closedTrades.length > 0 ? (winningTrades / (winningTrades + losingTrades)) * 100 : 0
  const totalGains = closedTrades.filter(t => (t.profitLoss || 0) > 0).reduce((sum, t) => sum + (t.profitLoss || 0), 0)
  const totalLosses = Math.abs(closedTrades.filter(t => (t.profitLoss || 0) < 0).reduce((sum, t) => sum + (t.profitLoss || 0), 0))
  const profitFactor = totalLosses > 0 ? totalGains / totalLosses : Infinity

  // Scatter plot data: P&L vs. Days Held
  const scatterData = closedTrades.map((trade) => ({
    daysHeld: (new Date(trade.dateSold).getTime() - new Date(trade.dateOpened).getTime()) / (1000 * 3600 * 24),
    pnl: trade.profitLoss || 0,
    underlying: trade.underlying,
  }))

  // Underlying performance
  const underlyingPerformance = Array.from(new Set(trades.map((t) => t.underlying))).map((symbol) => {
    const symbolTrades = trades.filter((t) => t.underlying === symbol)
    const totalPL = symbolTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0)
    return {
      symbol,
      profitLoss: totalPL,
    }
  })

  const kpiData = [
    {
      title: "Total P&L",
      value: totalPnl.toLocaleString("en-US", { style: "currency", currency: "USD" }),
      icon: DollarSign,
      color: totalPnl >= 0 ? "text-green-500" : "text-red-500",
    },
    {
      title: "Win Rate",
      value: `${winRate.toFixed(2)}%`,
      icon: Percent,
      color: "text-blue-500",
    },
    {
      title: "Profit Factor",
      value: profitFactor === Infinity ? "∞" : profitFactor.toFixed(2),
      icon: TrendingUp,
      color: "text-purple-500",
    },
    {
      title: "Total Trades",
      value: closedTrades.length,
      icon: TrendingDown,
      color: "text-gray-500",
    },
  ]

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Cumulative P&L Chart */}
        <Card className="col-span-1 xl:col-span-2">
          <CardHeader>
            <CardTitle>Cumulative Profit & Loss</CardTitle>
            <CardDescription>Running total of profits and losses over time.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativePnL} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))" }} fontSize={12} />
                <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} tick={{ fill: "hsl(var(--muted-foreground))" }} fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="cumulativePnl" name="Cumulative P&L" stroke="#10b981" fillOpacity={1} fill="url(#colorPnl)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* P&L vs Days Held Scatter Plot */}
        <Card>
          <CardHeader>
            <CardTitle>P&L vs. Trade Duration</CardTitle>
            <CardDescription>Each point represents a trade's outcome vs. its duration.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" dataKey="daysHeld" name="Days Held" unit="d" tick={{ fill: "hsl(var(--muted-foreground))" }} fontSize={12} />
                <YAxis type="number" dataKey="pnl" name="P&L" unit="$" tickFormatter={(value) => `$${value}`} tick={{ fill: "hsl(var(--muted-foreground))" }} fontSize={12} />
                <ZAxis type="category" dataKey="underlying" name="Symbol" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[2].payload;
                    return (
                      <div className="p-2 text-sm bg-background/90 border rounded-lg shadow-lg">
                        <p className="font-bold">{data.underlying}</p>
                        <p>P&L: {data.pnl.toLocaleString("en-US", { style: "currency", currency: "USD" })}</p>
                        <p>Days Held: {data.daysHeld.toFixed(1)}</p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Legend />
                <Scatter name="Trades" data={scatterData} fill="#3b82f6">
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "#22c55e" : "#ef4444"} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance by Underlying */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Underlying</CardTitle>
            <CardDescription>Total P&L generated by each asset.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={underlyingPerformance} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))" }} fontSize={12} />
                <YAxis type="category" dataKey="symbol" tick={{ fill: "hsl(var(--muted-foreground))" }} fontSize={12} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="profitLoss" name="Total P&L">
                  {underlyingPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.profitLoss >= 0 ? "#84cc16" : "#dc2626"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
