"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Filter, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { EnhancedTradesTable } from "./enhanced-trades-table"
import type { Trade } from "@/types/trading"
import { useToast } from "@/hooks/use-toast"

interface TradesManagerProps {
  trades: Trade[]
  addTrade: (trade: Omit<Trade, "id">) => Promise<string>
  updateTrade: (trade: Trade) => Promise<void>
  deleteTrade: (id: string) => Promise<void>
  refreshTrades: () => Promise<void>
}

export default function TradesManager({
  trades,
  addTrade,
  updateTrade,
  deleteTrade,
  refreshTrades,
}: TradesManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterUnderlying, setFilterUnderlying] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("dateSold")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    underlying: "",
    optionType: "put" as "put" | "call",
    strikePrice: "",
    expirationDate: "",
    premiumReceived: "",
    dateSold: "",
    quantity: "1",
    currentOptionPrice: "",
  })

  const resetForm = () => {
    setFormData({
      underlying: "",
      optionType: "put",
      strikePrice: "",
      expirationDate: "",
      premiumReceived: "",
      dateSold: "",
      quantity: "1",
      currentOptionPrice: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const tradeData = {
        underlying: formData.underlying.toUpperCase(),
        optionType: formData.optionType,
        strikePrice: Number.parseFloat(formData.strikePrice),
        expirationDate: formData.expirationDate,
        premiumReceived: Number.parseFloat(formData.premiumReceived),
        dateSold: formData.dateSold,
        quantity: Number.parseInt(formData.quantity),
        status: "open" as const,
        currentPrice: 0,
        currentOptionPrice: formData.currentOptionPrice ? Number.parseFloat(formData.currentOptionPrice) : undefined,
      }

      if (editingTrade) {
        await updateTrade({ ...tradeData, id: editingTrade.id })
        toast({
          title: "Trade Updated",
          description: `Successfully updated ${tradeData.underlying} ${tradeData.optionType} trade`,
        })
        setEditingTrade(null)
      } else {
        await addTrade(tradeData)
        toast({
          title: "Trade Added",
          description: `Successfully added ${tradeData.underlying} ${tradeData.optionType} trade`,
        })
      }

      resetForm()
      setIsAddDialogOpen(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save trade",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (trade: Trade) => {
    setFormData({
      underlying: trade.underlying,
      optionType: trade.optionType,
      strikePrice: trade.strikePrice.toString(),
      expirationDate: trade.expirationDate,
      premiumReceived: trade.premiumReceived.toString(),
      dateSold: trade.dateSold,
      quantity: trade.quantity.toString(),
      currentOptionPrice: trade.currentOptionPrice?.toString() || "",
    })
    setEditingTrade(trade)
    setIsAddDialogOpen(true)
  }

  const [deletingTrade, setDeletingTrade] = useState<Trade | null>(null);

  const handleDelete = async () => {
    if (!deletingTrade) return;

    try {
      await deleteTrade(deletingTrade.id);
      toast({
        title: "Trade Deleted",
        description: "Trade has been successfully deleted",
      });
      setDeletingTrade(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete trade",
        variant: "destructive",
      });
    }
  };

  const handleClosePosition = async (trade: Trade, profitLoss: number) => {
    try {
      await updateTrade({ ...trade, status: "closed", profitLoss })
      toast({
        title: "Position Closed",
        description: `Closed ${trade.underlying} ${trade.optionType} position`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to close position",
        variant: "destructive",
      })
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshTrades()
      toast({
        title: "Refreshed",
        description: "Trades have been refreshed from the database",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to refresh trades",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Filter and sort trades
  const filteredTrades = trades
    .filter((trade) => filterStatus === "all" || trade.status === filterStatus)
    .filter((trade) => filterUnderlying === "all" || trade.underlying === filterUnderlying)
    .sort((a, b) => {
      switch (sortBy) {
        case "dateSold":
          return new Date(b.dateSold).getTime() - new Date(a.dateSold).getTime()
        case "underlying":
          return a.underlying.localeCompare(b.underlying)
        case "premium":
          return b.premiumReceived - a.premiumReceived
        default:
          return 0
      }
    })

  // Separate trades by status
  const openTrades = filteredTrades.filter((trade) => trade.status === "open")
  const closedTrades = filteredTrades.filter((trade) => trade.status === "closed")
  const expiredTrades = filteredTrades.filter((trade) => trade.status === "expired")
  const assignedTrades = filteredTrades.filter((trade) => trade.status === "assigned")

  const uniqueUnderlyings = Array.from(new Set(trades.map((t) => t.underlying)))

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Trade Management</CardTitle>
              <CardDescription>Add, edit, and track your options trades</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Trade
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{editingTrade ? "Edit Trade" : "Add New Trade"}</DialogTitle>
                    <DialogDescription>Enter the details of your options trade</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="underlying">Underlying</Label>
                        <Input
                          id="underlying"
                          placeholder="AAPL"
                          value={formData.underlying}
                          onChange={(e) => setFormData({ ...formData, underlying: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="optionType">Option Type</Label>
                        <Select
                          value={formData.optionType}
                          onValueChange={(value: "put" | "call") => setFormData({ ...formData, optionType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="put">Put</SelectItem>
                            <SelectItem value="call">Call</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="strikePrice">Strike Price</Label>
                        <Input
                          id="strikePrice"
                          type="number"
                          step="0.01"
                          placeholder="180.00"
                          value={formData.strikePrice}
                          onChange={(e) => setFormData({ ...formData, strikePrice: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="premiumReceived">Premium Received</Label>
                        <Input
                          id="premiumReceived"
                          type="number"
                          step="0.01"
                          placeholder="3.50"
                          value={formData.premiumReceived}
                          onChange={(e) => setFormData({ ...formData, premiumReceived: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          placeholder="1"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currentOptionPrice">Current Option Price</Label>
                        <Input
                          id="currentOptionPrice"
                          type="number"
                          step="0.01"
                          placeholder="1.07 (optional)"
                          value={formData.currentOptionPrice}
                          onChange={(e) => setFormData({ ...formData, currentOptionPrice: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateSold">Date Sold</Label>
                        <Input
                          id="dateSold"
                          type="date"
                          value={formData.dateSold}
                          onChange={(e) => setFormData({ ...formData, dateSold: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expirationDate">Expiration Date</Label>
                        <Input
                          id="expirationDate"
                          type="date"
                          value={formData.expirationDate}
                          onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="submit">{editingTrade ? "Update Trade" : "Add Trade"}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Label>Filters:</Label>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterUnderlying} onValueChange={setFilterUnderlying}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Symbol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Symbols</SelectItem>
                {uniqueUnderlyings.map((symbol) => (
                  <SelectItem key={symbol} value={symbol}>
                    {symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dateSold">Date Sold</SelectItem>
                <SelectItem value="underlying">Symbol</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trades by Status */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="all" className="flex-1 md:flex-none flex items-center gap-2 text-xs md:text-sm px-2 md:px-4 py-1 md:py-2">
            All Trades
            <Badge variant="secondary">{filteredTrades.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="open" className="flex-1 md:flex-none flex items-center gap-2 text-xs md:text-sm px-2 md:px-4 py-1 md:py-2">
            <Clock className="h-4 w-4" />
            Open
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {openTrades.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="closed" className="flex-1 md:flex-none flex items-center gap-2 text-xs md:text-sm px-2 md:px-4 py-1 md:py-2">
            <CheckCircle className="h-4 w-4" />
            Closed
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {closedTrades.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="expired" className="flex-1 md:flex-none flex items-center gap-2 text-xs md:text-sm px-2 md:px-4 py-1 md:py-2">
            <XCircle className="h-4 w-4" />
            Expired
            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
              {expiredTrades.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="assigned" className="flex-1 md:flex-none flex items-center gap-2 text-xs md:text-sm px-2 md:px-4 py-1 md:py-2">
            <AlertTriangle className="h-4 w-4" />
            Assigned
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              {assignedTrades.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <EnhancedTradesTable
            trades={filteredTrades}
            onEdit={handleEdit}
            onDelete={(trade) => setDeletingTrade(trade)}
            onClose={handleClosePosition}
            title="All Trades"
          />
        </TabsContent>

        <TabsContent value="open">
          <EnhancedTradesTable
            trades={openTrades}
            onEdit={handleEdit}
            onDelete={(trade) => setDeletingTrade(trade)}
            onClose={handleClosePosition}
            title="Open Positions"
          />
        </TabsContent>

        <TabsContent value="closed">
          <EnhancedTradesTable
            trades={closedTrades}
            onEdit={handleEdit}
            onDelete={(trade) => setDeletingTrade(trade)}
            onClose={handleClosePosition}
            title="Closed Positions"
          />
        </TabsContent>

        <TabsContent value="expired">
          <EnhancedTradesTable
            trades={expiredTrades}
            onEdit={handleEdit}
            onDelete={(trade) => setDeletingTrade(trade)}
            onClose={handleClosePosition}
            title="Expired Positions"
          />
        </TabsContent>

        <TabsContent value="assigned">
          <EnhancedTradesTable
            trades={assignedTrades}
            onEdit={handleEdit}
            onDelete={(trade) => setDeletingTrade(trade)}
            onClose={handleClosePosition}
            title="Assigned Positions"
          />
        </TabsContent>
      </Tabs>

      <Dialog open={!!deletingTrade} onOpenChange={() => setDeletingTrade(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the trade for {deletingTrade?.underlying}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingTrade(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
