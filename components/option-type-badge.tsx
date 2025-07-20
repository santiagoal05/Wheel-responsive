"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ArrowDown, ArrowUp } from "lucide-react"

interface OptionTypeBadgeProps {
  type: "put" | "call"
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
}

export function OptionTypeBadge({ type, size = "md", showIcon = true }: OptionTypeBadgeProps) {
  const isPut = type === "put"

  const config = {
    put: {
      label: "PUT",
      icon: ArrowDown,
      className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    },
    call: {
      label: "CALL",
      icon: ArrowUp,
      className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    },
  }

  const typeConfig = config[type]
  const Icon = typeConfig.icon

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
      className={cn("font-medium border transition-colors duration-200", typeConfig.className, sizeClasses[size])}
    >
      <div className="flex items-center gap-1.5">
        {showIcon && <Icon className={iconSizes[size]} />}
        {typeConfig.label}
      </div>
    </Badge>
  )
}
