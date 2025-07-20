export interface Trade {
  id: string
  underlying: string
  optionType: "put" | "call"
  strikePrice: number
  expirationDate: string
  premiumReceived: number
  dateSold: string
  quantity: number
  status: "open" | "closed" | "expired" | "assigned"
  currentPrice: number // Kept for compatibility, not used in P&L
  currentOptionPrice: number // Current market price of the option contract
  profitLoss?: number
  assignmentPrice?: number
  costBasis?: number
}

export interface Position {
  underlying: string
  shares: number
  costBasis: number
  currentPrice: number
  unrealizedPL: number
}

export interface WheelMetrics {
  totalPremiumReceived: number
  totalRealizedPL: number
  totalUnrealizedPL: number
  winRate: number
  averageDaysToExpiration: number
  totalAssignments: number
}
