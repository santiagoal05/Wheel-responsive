"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Code, TestTube, Settings, Database, Bug, ExternalLink } from "lucide-react"
import Link from "next/link"

interface DebugCenterProps {
  showQuickActions?: boolean
}

export default function DebugCenter({ showQuickActions = true }: DebugCenterProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const debugTools = [
    {
      id: "data-flow",
      name: "Data Flow Debug",
      icon: Code,
      href: "/debug-data-flow",
      description: "Debug price display issues and data transformation",
      priority: "high",
      useCase: "When prices don't show in UI",
    },
    {
      id: "trade-debug",
      name: "Trade Debug",
      icon: TestTube,
      href: "/debug-trades",
      description: "Test individual option symbols and API responses",
      priority: "high",
      useCase: "When specific trades fail to update",
    },
    {
      id: "alpaca-test",
      name: "Alpaca Test",
      icon: Settings,
      href: "/alpaca-test",
      description: "Test API connection and retrieve sample quotes",
      priority: "medium",
      useCase: "When setting up or troubleshooting API",
    },
    {
      id: "api-debug",
      name: "API Debug",
      icon: Bug,
      href: "/alpaca-debug",
      description: "Comprehensive API debugging with environment checks",
      priority: "medium",
      useCase: "When API calls fail completely",
    },
    {
      id: "diagnostics",
      name: "System Diagnostics",
      icon: Database,
      href: "/diagnostics",
      description: "Database connection and system health checks",
      priority: "low",
      useCase: "When database connection issues occur",
    },
  ]

  const quickActions = [
    {
      name: "Fix Missing Prices",
      description: "Run smart fix to update all missing option prices",
      href: "/smart-fix",
      variant: "default" as const,
    },
    {
      name: "Analyze Problem Trade",
      description: "Deep analysis of a specific option symbol",
      href: "/smart-analyzer",
      variant: "outline" as const,
    },
    {
      name: "Check Data Flow",
      description: "Debug why prices aren't displaying",
      href: "/debug-data-flow",
      variant: "outline" as const,
    },
  ]

  return (
    <div className="space-y-6">
      {showQuickActions && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common debugging and fixing tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Link key={action.name} href={action.href}>
                  <Button variant={action.variant} className="w-full h-auto p-4 flex flex-col items-start gap-2">
                    <div className="font-medium text-left">{action.name}</div>
                    <div className="text-xs text-muted-foreground text-left">{action.description}</div>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Debug Tools</CardTitle>
          <CardDescription>Comprehensive debugging and diagnostic tools</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tools">All Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Alert>
                <Code className="h-4 w-4" />
                <AlertDescription>
                  <strong>Most Common Issues:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Prices not displaying → Use Data Flow Debug</li>
                    <li>Specific trades failing → Use Trade Debug</li>
                    <li>API connection issues → Use Alpaca Test</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {debugTools
                  .filter((tool) => tool.priority === "high")
                  .map((tool) => (
                    <Card key={tool.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <tool.icon className="h-5 w-5 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{tool.name}</h3>
                            <Badge variant="default" className="text-xs">
                              Essential
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{tool.description}</p>
                          <p className="text-xs text-muted-foreground mb-3">
                            <strong>Use when:</strong> {tool.useCase}
                          </p>
                          <Link href={tool.href}>
                            <Button size="sm" variant="outline" className="flex items-center gap-2 bg-transparent">
                              Open Tool
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="tools" className="space-y-4">
              <div className="space-y-4">
                {["high", "medium", "low"].map((priority) => (
                  <div key={priority}>
                    <h3 className="font-medium mb-3 capitalize">
                      {priority} Priority Tools
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {debugTools.filter((t) => t.priority === priority).length}
                      </Badge>
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {debugTools
                        .filter((tool) => tool.priority === priority)
                        .map((tool) => (
                          <div key={tool.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <tool.icon className="h-4 w-4" />
                              <div>
                                <p className="font-medium">{tool.name}</p>
                                <p className="text-sm text-muted-foreground">{tool.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  <strong>Use when:</strong> {tool.useCase}
                                </p>
                              </div>
                            </div>
                            <Link href={tool.href}>
                              <Button size="sm" variant="outline">
                                Open
                              </Button>
                            </Link>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
