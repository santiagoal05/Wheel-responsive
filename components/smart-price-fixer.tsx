"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Zap, CheckCircle, XCircle, Settings, Target } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SmartPriceFixer() {
  const [isFixing, setIsFixing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<any>(null)
  const { toast } = useToast()

  const runSmartFix = async () => {
    setIsFixing(true)
    setProgress(0)
    setResults(null)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 1000)

      console.log("🚀 Starting smart price fix...")

      const response = await fetch("/api/alpaca/fix-option-symbols", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      clearInterval(progressInterval)
      setProgress(100)
      setResults(data)

      setTimeout(() => {
        setProgress(0)
        setIsFixing(false)
      }, 2000)

      if (data.success) {
        if (data.updated > 0) {
          toast({
            title: "Smart Fix Complete! 🎯",
            description: `Successfully found and updated ${data.updated} option prices using intelligent symbol detection`,
          })
        } else {
          toast({
            title: "No Updates Needed",
            description: "All trades already have current prices",
          })
        }

        if (data.failed > 0) {
          toast({
            title: "Partial Success",
            description: `${data.updated} updated, ${data.failed} still need manual attention`,
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Fix Failed",
          description: data.error || "Smart fix encountered an error",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      setIsFixing(false)
      setProgress(0)
      toast({
        title: "Error",
        description: error.message || "Failed to run smart fix",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Smart Price Fixer
          </CardTitle>
          <CardDescription>Intelligent option price updates using multiple symbol format testing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              <strong>How it works:</strong> This tool tests multiple option symbol formats for each trade to find the
              correct one that Alpaca recognizes, then updates the prices automatically.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Smart Symbol Detection</p>
                <p className="text-sm text-muted-foreground">
                  Tests multiple formats: standard, alternative, integer, and high-precision
                </p>
              </div>
              <Button onClick={runSmartFix} disabled={isFixing} size="lg">
                <Zap className={`h-4 w-4 mr-2 ${isFixing ? "animate-spin" : ""}`} />
                {isFixing ? "Fixing..." : "Run Smart Fix"}
              </Button>
            </div>

            {isFixing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Testing symbol formats and updating prices...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  This may take a few moments as we test multiple formats for each option
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.updated > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-orange-500" />
              )}
              Smart Fix Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.updated || 0}</div>
                <p className="text-sm text-muted-foreground">Fixed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{results.failed || 0}</div>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{(results.updated || 0) + (results.failed || 0)}</div>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>

            {/* Detailed Results */}
            {results.details && results.details.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Detailed Results:</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {results.details.map((detail: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {detail.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">{detail.symbol}</p>
                          {detail.workingSymbol && (
                            <p className="text-xs text-muted-foreground font-mono">{detail.workingSymbol}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {detail.success ? (
                          <div>
                            <p className="font-medium text-green-600">${detail.price?.toFixed(2)}</p>
                            <Badge variant="default" className="text-xs">
                              Fixed
                            </Badge>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs text-red-600">{detail.error}</p>
                            <Badge variant="destructive" className="text-xs">
                              Failed
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Message */}
            {results.updated > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Success!</strong> {results.updated} option price{results.updated > 1 ? "s" : ""} updated using
                  intelligent symbol detection. Your P&L calculations should now be accurate.
                </AlertDescription>
              </Alert>
            )}

            {/* Next Steps */}
            {results.failed > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Manual Action Required:</strong> {results.failed} trade{results.failed > 1 ? "s" : ""} still
                  need attention. These options may be expired, delisted, or not available in Alpaca's data feed.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How Smart Fix Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium">🔍 Symbol Format Testing</h4>
            <p className="text-sm text-muted-foreground">
              Tests 4 different strike price formats: standard ($8.00 → 00008000), alternative ($8.00 → 00000800),
              integer ($8.00 → 00000008), and high-precision ($8.00 → 00080000)
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">🎯 Automatic Detection</h4>
            <p className="text-sm text-muted-foreground">
              Finds the correct symbol format that Alpaca recognizes and retrieves the current market price
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">💾 Database Update</h4>
            <p className="text-sm text-muted-foreground">
              Automatically updates your trades with the found prices and marks the source as "alpaca_smart"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
