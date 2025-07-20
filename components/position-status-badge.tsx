"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface PositionStatusBadgeProps {
  status: "open" | "closed" | "expired" | "assigned"
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
}

export function PositionStatusBadge({ status, size = "md", showIcon = true }: PositionStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "open":
        return {
          label: "Open",
          icon: Clock,
          className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
          dotColor: "bg-blue-500",
        }
      case "closed":
        return {
          label: "Closed",
          icon: CheckCircle,
          className: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
          dotColor: "bg-green-500",
        }
      case "expired":
        return {
          label: "Expired",
          icon: XCircle,
          className: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100",
          dotColor: "bg-gray-500",
        }
      case "assigned":
        return {
          label: "Assigned",
          icon: AlertTriangle,
          className: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
          dotColor: "bg-orange-500",
        }
      default:
        return {
          label: status,
          icon: Clock,
          className: "bg-gray-50 text-gray-700 border-gray-200",
          dotColor: "bg-gray-500",
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  return (
    <Badge
      variant="outline"
      className={cn("font-medium border transition-colors duration-200", config.className, sizeClasses[size])}
    >
      <div className="flex items-center gap-2">
        {showIcon && (
          <div className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 rounded-full", config.dotColor)} />
            <Icon className={iconSizes[size]} />
          </div>
        )}
        {config.label}
      </div>
    </Badge>
  )
}
