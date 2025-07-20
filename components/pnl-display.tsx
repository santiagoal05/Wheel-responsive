"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface PnLDisplayProps {
  value: number
  type?: "currency" | "percentage"
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
  showBackground?: boolean
  precision?: number
}

export function PnLDisplay({
  value,
  type = "currency",
  size = "md",
  showIcon = true,
  showBackground = false,
  precision = 2,
}: PnLDisplayProps) {
  const isPositive = value > 0
  const isNegative = value < 0
  const isNeutral = value === 0

  const getColorClasses = () => {
    if (isPositive) {
      return showBackground ? "text-green-700 bg-green-50 border-green-200" : "text-green-600"
    }
    if (isNegative) {
      return showBackground ? "text-red-700 bg-red-50 border-red-200" : "text-red-600"
    }
    return showBackground ? "text-gray-700 bg-gray-50 border-gray-200" : "text-gray-600"
  }

  const getIcon = () => {
    if (isPositive) return TrendingUp
    if (isNegative) return TrendingDown
    return Minus
  }

  const formatValue = () => {
    const absValue = Math.abs(value)
    const prefix = isPositive ? "+" : isNegative ? "-" : ""

    if (type === "percentage") {
      return `${prefix}${absValue.toFixed(precision)}%`
    }

    // Currency formatting with smart precision
    if (absValue >= 1000000) {
      return `${prefix}$${(absValue / 1000000).toFixed(1)}M`
    }
    if (absValue >= 1000) {
      return `${prefix}$${(absValue / 1000).toFixed(1)}K`
    }
    return `${prefix}$${absValue.toFixed(precision)}`
  }

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  const Icon = getIcon()

  if (showBackground) {
    return (
      <Badge
        variant="outline"
        className={cn("font-semibold border transition-colors duration-200", getColorClasses(), sizeClasses[size])}
      >
        <div className="flex items-center gap-1.5">
          {showIcon && <Icon className={iconSizes[size]} />}
          <span>{formatValue()}</span>
        </div>
      </Badge>
    )
  }

  return (
    <div className={cn("font-semibold flex items-center gap-1.5", getColorClasses(), sizeClasses[size])}>
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{formatValue()}</span>
    </div>
  )
}
