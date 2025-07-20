"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Edit, Trash2, Calendar, Target, DollarSign } from "lucide-react"
import { PositionStatusBadge } from "./position-status-badge"
import { PnLDisplay } from "./pnl-display"
import { OptionTypeBadge } from "./option-type-badge"
import type { Trade } from "@/types/trading"

interface EnhancedTradesTableProps {
  trades: Trade[]
  onEdit: (trade: Trade) => void
  onDelete: (trade: Trade) => void
  onClose: (trade: Trade, profitLoss: number) => void
  title?: string
  showActions?: boolean
}

const TradeCard = ({ trade, onEdit, onDelete, onClose, calculatePnL, calculateDaysToExpiration, getRowClassName }) => {
  const pnl = calculatePnL(trade)
  const daysToExp = calculateDaysToExpiration(trade.expirationDate)
  const isExpiringSoon = daysToExp <= 7 && trade.status === "open"

  return (
    <Card className={cn("mb-4", getRowClassName(trade))}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="font-semibold text-xl">{trade.underlying}</div>
            <OptionTypeBadge type={trade.optionType} />
          </div>
          <PositionStatusBadge status={trade.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="text-muted-foreground">Strike</p>
            <p className="font-medium">${trade.strikePrice}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Expiration</p>
            <p className={cn(isExpiringSoon && "text-red-600 font-bold")}>
              {new Date(trade.expirationDate).toLocaleDateString()} ({daysToExp}d)
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Premium</p>
            <PnLDisplay value={trade.premiumReceived * trade.quantity * 100} size="sm" />
          </div>
          <div>
            <p className="text-muted-foreground">Current Price</p>
            {trade.currentOptionPrice !== undefined && trade.currentOptionPrice !== null ? (
              <p className="font-medium text-red-600">${trade.currentOptionPrice.toFixed(2)}</p>
            ) : (
              <Badge variant="outline" className="text-xs">N/A</Badge>
            )}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-muted-foreground">P&L</p>
          <PnLDisplay value={pnl} size="lg" showBackground={true} showIcon={true} />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(trade)}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(trade)}><Trash2 className="h-4 w-4" /></Button>
          {trade.status === 'open' && (
            <Button variant="outline" size="sm" onClick={() => onClose(trade, pnl)}>Close Position</Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function EnhancedTradesTable({
  trades,
  onEdit,
  onDelete,
  onClose,
  title = "Trades",
  showActions = true,
}: EnhancedTradesTableProps) {
  const isMobile = useMobile();
  const calculatePnL = (trade: Trade) => {
    if (trade.status === "open") {
      if (trade.currentOptionPrice !== undefined && trade.currentOptionPrice !== null) {
        return (trade.premiumReceived - trade.currentOptionPrice) * trade.quantity * 100
      } else {
        return trade.premiumReceived * trade.quantity * 100
      }
    } else {
      return trade.profitLoss || 0
    }
  }

  const calculateDaysToExpiration = (expirationDate: string) => {
    const expiry = new Date(expirationDate)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getRowClassName = (trade: Trade) => {
    const baseClasses = "transition-colors duration-200 hover:bg-muted/50"

    switch (trade.status) {
      case "open":
        return cn(baseClasses, "border-l-4 border-l-blue-500 bg-blue-50/30")
      case "closed":
        return cn(baseClasses, "border-l-4 border-l-green-500 bg-green-50/30")
      case "expired":
        return cn(baseClasses, "border-l-4 border-l-gray-500 bg-gray-50/30")
      case "assigned":
        return cn(baseClasses, "border-l-4 border-l-orange-500 bg-orange-50/30")
      default:
        return baseClasses
    }
  }

  if (isMobile) {
    return (
      <div>
        {trades.map(trade => (
          <TradeCard 
            key={trade.id} 
            trade={trade} 
            onEdit={onEdit} 
            onDelete={onDelete} 
            onClose={onClose} 
            calculatePnL={calculatePnL}
            calculateDaysToExpiration={calculateDaysToExpiration}
            getRowClassName={getRowClassName}
          />
        ))}
      </div>
    )
  }

  if (trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No trades found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {title}
          <Badge variant="secondary" className="ml-2">
            {trades.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Symbol</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Strike</TableHead>
                <TableHead className="font-semibold">Expiration</TableHead>
                <TableHead className="font-semibold">Premium</TableHead>
                <TableHead className="font-semibold">Current Price</TableHead>
                <TableHead className="font-semibold">Qty</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">P&L</TableHead>
                {showActions && <TableHead className="font-semibold">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => {
                const pnl = calculatePnL(trade)
                const daysToExp = calculateDaysToExpiration(trade.expirationDate)
                const isExpiringSoon = daysToExp <= 7 && trade.status === "open"

                return (
                  <TableRow key={trade.id} className={getRowClassName(trade)}>
                    <TableCell>
                      <div className="font-semibold text-lg">{trade.underlying}</div>
                    </TableCell>

                    <TableCell>
                      <OptionTypeBadge type={trade.optionType} />
                    </TableCell>

                    <TableCell>
                      <div className="font-medium">${trade.strikePrice}</div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{new Date(trade.expirationDate).toLocaleDateString()}</div>
                        {trade.status === "open" && (
                          <div
                            className={cn(
                              "text-xs flex items-center gap-1",
                              isExpiringSoon ? "text-red-600 font-medium" : "text-muted-foreground",
                            )}
                          >
                            <Calendar className="h-3 w-3" />
                            {daysToExp} days
                            {isExpiringSoon && " ⚠️"}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <PnLDisplay
                        value={trade.premiumReceived * trade.quantity * 100}
                        size="sm"
                        showBackground={true}
                      />
                    </TableCell>

                    <TableCell>
                      {trade.currentOptionPrice !== undefined && trade.currentOptionPrice !== null ? (
                        <div className="font-medium text-red-600">${trade.currentOptionPrice.toFixed(2)}</div>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          N/A
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="font-medium">
                        {trade.quantity}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <PositionStatusBadge status={trade.status} />
                    </TableCell>

                    <TableCell>
                      <PnLDisplay value={pnl} size="md" showBackground={true} showIcon={true} />
                    </TableCell>

                    {showActions && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => onEdit(trade)} className="hover:bg-blue-50">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(trade)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {trade.status === "open" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onClose(trade, pnl)}
                              className="hover:bg-green-50 hover:border-green-200"
                            >
                              Close
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
