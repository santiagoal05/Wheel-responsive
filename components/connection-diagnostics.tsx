"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database, Wifi } from "lucide-react"

interface DiagnosticResult {
  test: string
  status: "success" | "error" | "warning"
  message: string
  details?: string
}

export default function ConnectionDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    const diagnostics: DiagnosticResult[] = []

    // Test 1: Environment Variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      diagnostics.push({
        test: "Environment Variables",
        status: "success",
        message: "Supabase credentials found",
        details: `URL: ${supabaseUrl.substring(0, 30)}...`,
      })
    } else {
      diagnostics.push({
        test: "Environment Variables",
        status: "error",
        message: "Missing Supabase credentials",
        details: `URL: ${supabaseUrl || "missing"}, Key: ${supabaseKey ? "present" : "missing"}`,
      })
      setResults(diagnostics)
      setIsRunning(false)
      return
    }

    // Test 2: Supabase Client Creation
    try {
      const { supabase } = await import("@/lib/supabase")

      if (supabase) {
        diagnostics.push({
          test: "Client Creation",
          status: "success",
          message: "Supabase client created successfully",
        })

        // Test 3: Basic Connection
        try {
          const { data, error } = await supabase.from("trades").select("count", { count: "exact", head: true })

          if (error) {
            diagnostics.push({
              test: "Database Connection",
              status: "error",
              message: "Failed to connect to database",
              details: error.message,
            })
          } else {
            diagnostics.push({
              test: "Database Connection",
              status: "success",
              message: "Successfully connected to database",
            })
          }
        } catch (connectionError: any) {
          diagnostics.push({
            test: "Database Connection",
            status: "error",
            message: "Connection failed",
            details: connectionError.message,
          })
        }

        // Test 4: Table Structure
        try {
          const { data, error } = await supabase.from("trades").select("*").limit(1)

          if (error) {
            if (error.message.includes("relation") && error.message.includes("does not exist")) {
              diagnostics.push({
                test: "Table Structure",
                status: "error",
                message: "Tables not found",
                details: "The 'trades' table doesn't exist. Run the SQL scripts first.",
              })
            } else {
              diagnostics.push({
                test: "Table Structure",
                status: "error",
                message: "Table access error",
                details: error.message,
              })
            }
          } else {
            diagnostics.push({
              test: "Table Structure",
              status: "success",
              message: "Tables accessible",
              details: `Sample data: ${data?.length || 0} records`,
            })
          }
        } catch (tableError: any) {
          diagnostics.push({
            test: "Table Structure",
            status: "error",
            message: "Table check failed",
            details: tableError.message,
          })
        }

        // Test 5: Data Query
        try {
          const { data, error } = await supabase.from("trades").select("*").limit(5)

          if (error) {
            diagnostics.push({
              test: "Data Query",
              status: "error",
              message: "Failed to query data",
              details: error.message,
            })
          } else {
            diagnostics.push({
              test: "Data Query",
              status: "success",
              message: `Successfully queried ${data?.length || 0} trades`,
              details: data?.length > 0 ? `First trade: ${data[0].underlying}` : "No data found",
            })
          }
        } catch (queryError: any) {
          diagnostics.push({
            test: "Data Query",
            status: "error",
            message: "Query failed",
            details: queryError.message,
          })
        }
      } else {
        diagnostics.push({
          test: "Client Creation",
          status: "error",
          message: "Supabase client not available",
        })
      }
    } catch (clientError: any) {
      diagnostics.push({
        test: "Client Creation",
        status: "error",
        message: "Failed to create Supabase client",
        details: clientError.message,
      })
    }

    setResults(diagnostics)
    setIsRunning(false)
  }

  useEffect(() => {
    // Only run diagnostics in the browser
    if (typeof window !== "undefined") {
      runDiagnostics()
    }
  }, [])

  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-orange-500" />
    }
  }

  const getStatusColor = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return "text-green-600"
      case "error":
        return "text-red-600"
      case "warning":
        return "text-orange-500"
    }
  }

  const successCount = results.filter((r) => r.status === "success").length
  const errorCount = results.filter((r) => r.status === "error").length
  const warningCount = results.filter((r) => r.status === "warning").length

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Supabase Connection Diagnostics</CardTitle>
          </div>
          <Button onClick={runDiagnostics} disabled={isRunning} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? "animate-spin" : ""}`} />
            {isRunning ? "Running..." : "Run Tests"}
          </Button>
        </div>
        <CardDescription>Comprehensive connection and configuration testing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        {results.length > 0 && (
          <div className="flex gap-4">
            <Badge variant="default" className="bg-green-100 text-green-800">
              ✅ {successCount} Passed
            </Badge>
            {warningCount > 0 && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                ⚠️ {warningCount} Warnings
              </Badge>
            )}
            {errorCount > 0 && <Badge variant="destructive">❌ {errorCount} Failed</Badge>}
          </div>
        )}

        {/* Overall Status */}
        {results.length > 0 && (
          <Alert>
            <Wifi className="h-4 w-4" />
            <AlertDescription>
              {errorCount === 0 ? (
                <span className="text-green-600 font-medium">
                  🎉 All critical tests passed! Your Supabase connection is working properly.
                </span>
              ) : (
                <span className="text-red-600 font-medium">
                  ❌ {errorCount} critical issue{errorCount > 1 ? "s" : ""} found. Please review the details below.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Detailed Results */}
        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  <h3 className="font-medium">{result.test}</h3>
                </div>
                <Badge
                  variant={
                    result.status === "success" ? "default" : result.status === "error" ? "destructive" : "secondary"
                  }
                >
                  {result.status}
                </Badge>
              </div>
              <p className={`text-sm ${getStatusColor(result.status)} mb-1`}>{result.message}</p>
              {result.details && <p className="text-xs text-muted-foreground">{result.details}</p>}
            </div>
          ))}
        </div>

        {/* Loading state */}
        {results.length === 0 && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Running diagnostics...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
