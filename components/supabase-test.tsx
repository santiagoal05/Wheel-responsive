"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Database, Play } from "lucide-react"

export default function SupabaseTest() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runTests = async () => {
    setIsRunning(true)
    const results: any[] = []

    try {
      // Import Supabase
      const { supabase, hasSupabase } = await import("@/lib/supabase")

      results.push({
        test: "Client Creation",
        status: hasSupabase ? "success" : "error",
        message: hasSupabase ? "Supabase client created" : "Failed to create client",
        details: hasSupabase ? "Client is available" : "Check credentials",
      })

      if (hasSupabase && supabase) {
        // Test 1: Basic connection
        try {
          console.log("Testing basic connection...")
          const { data, error } = await supabase.from("trades").select("count", { count: "exact", head: true })

          if (error) {
            results.push({
              test: "Connection Test",
              status: "error",
              message: "Connection failed",
              details: error.message,
            })
          } else {
            results.push({
              test: "Connection Test",
              status: "success",
              message: "Successfully connected",
              details: "Database is accessible",
            })
          }
        } catch (err: any) {
          results.push({
            test: "Connection Test",
            status: "error",
            message: "Connection error",
            details: err.message,
          })
        }

        // Test 2: Check if tables exist
        try {
          console.log("Testing table access...")
          const { data, error } = await supabase.from("trades").select("*").limit(1)

          if (error) {
            if (error.message.includes("relation") && error.message.includes("does not exist")) {
              results.push({
                test: "Table Check",
                status: "error",
                message: "Tables don't exist",
                details: "Need to run SQL scripts to create tables",
              })
            } else {
              results.push({
                test: "Table Check",
                status: "error",
                message: "Table access error",
                details: error.message,
              })
            }
          } else {
            results.push({
              test: "Table Check",
              status: "success",
              message: "Tables exist and accessible",
              details: `Found ${data?.length || 0} sample records`,
            })
          }
        } catch (err: any) {
          results.push({
            test: "Table Check",
            status: "error",
            message: "Table test failed",
            details: err.message,
          })
        }

        // Test 3: Try to insert test data
        try {
          console.log("Testing insert permissions...")
          const testTrade = {
            underlying: "TEST",
            option_type: "put",
            strike_price: 100.0,
            expiration_date: "2024-12-31",
            premium_received: 1.0,
            date_sold: "2024-01-01",
            quantity: 1,
            current_price: 105.0,
          }

          const { data, error } = await supabase.from("trades").insert(testTrade).select()

          if (error) {
            results.push({
              test: "Insert Test",
              status: "error",
              message: "Insert failed",
              details: error.message,
            })
          } else {
            // Clean up test data
            if (data && data[0]) {
              await supabase.from("trades").delete().eq("id", data[0].id)
            }
            results.push({
              test: "Insert Test",
              status: "success",
              message: "Insert/delete successful",
              details: "Permissions are working correctly",
            })
          }
        } catch (err: any) {
          results.push({
            test: "Insert Test",
            status: "error",
            message: "Insert test failed",
            details: err.message,
          })
        }
      }
    } catch (err: any) {
      results.push({
        test: "Import Test",
        status: "error",
        message: "Failed to import Supabase",
        details: err.message,
      })
    }

    setTestResults(results)
    setIsRunning(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-orange-500" />
    }
  }

  const successCount = testResults.filter((r) => r.status === "success").length
  const errorCount = testResults.filter((r) => r.status === "error").length

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Supabase Connection Test</CardTitle>
          </div>
          <Button onClick={runTests} disabled={isRunning} size="sm">
            <Play className={`h-4 w-4 mr-2 ${isRunning ? "animate-spin" : ""}`} />
            {isRunning ? "Testing..." : "Run Tests"}
          </Button>
        </div>
        <CardDescription>Test your Supabase connection and permissions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {testResults.length > 0 && (
          <div className="flex gap-4 mb-4">
            <Badge variant="default" className="bg-green-100 text-green-800">
              ✅ {successCount} Passed
            </Badge>
            {errorCount > 0 && <Badge variant="destructive">❌ {errorCount} Failed</Badge>}
          </div>
        )}

        {testResults.map((result, index) => (
          <Alert key={index}>
            <div className="flex items-start gap-3">
              {getStatusIcon(result.status)}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{result.test}</h4>
                  <Badge variant={result.status === "success" ? "default" : "destructive"}>{result.status}</Badge>
                </div>
                <AlertDescription className="mt-1">
                  <p className="font-medium">{result.message}</p>
                  {result.details && <p className="text-sm text-muted-foreground mt-1">{result.details}</p>}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ))}

        {testResults.length === 0 && (
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>Click "Run Tests" to check your Supabase connection.</AlertDescription>
          </Alert>
        )}

        {/* Quick Setup Instructions */}
        {errorCount > 0 && testResults.some((r) => r.message.includes("Tables don't exist")) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Tables Missing:</strong> You need to create the database tables. Go to your Supabase dashboard →
              SQL Editor and run:
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                {`CREATE TABLE trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  underlying VARCHAR(10) NOT NULL,
  option_type VARCHAR(4) CHECK (option_type IN ('put', 'call')) NOT NULL,
  strike_price DECIMAL(10,2) NOT NULL,
  expiration_date DATE NOT NULL,
  premium_received DECIMAL(10,2) NOT NULL,
  date_sold DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) DEFAULT 'open',
  current_price DECIMAL(10,2),
  profit_loss DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON trades FOR ALL USING (true) WITH CHECK (true);`}
              </pre>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
