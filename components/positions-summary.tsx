"use client"
import type { Trade } from "@/types/trading"
import { PositionSummaryCards } from "./position-summary-cards"

interface PositionsSummaryProps {
  trades: Trade[]
}

export default function PositionsSummary({ trades }: PositionsSummaryProps) {
  return <PositionSummaryCards trades={trades} />
}

// The existing code for PositionSummaryCards can be placed here if needed
