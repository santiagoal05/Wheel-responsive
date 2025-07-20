"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, CheckCircle, XCircle, AlertTriangle, Calendar, TrendingUp, Clock, Target } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SmartOptionAnalyzerProps {
  onPriceFound?: (price: number, symbol: string) => void
}

export default function SmartOptionAnalyzer({ onPriceFound }: SmartOptionAnalyzerProps) {
  const [formData, setFormData] = useState({
    underlying: "SOFI",
    optionType: "put",
    strikePrice: "8",
    expirationDate: "2025-01-17",
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const { toast } = useToast()

  const runSmartAnalysis = async () => {
    setIsAnalyzing(true)
    setAnalysis(null)

    try {
      const response = await fetch("/api/alpaca/smart-option-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          underlying: formData.underlying,
          expirationDate: formData.expirationDate,
          optionType: formData.optionType,
          strikePrice: Number.parseFloat(formData.strikePrice),
        }),
      })

      const data = await response.json()
      setAnalysis(data.analysis)

      if (data.foundQuote && data.price) {
        toast({
          title: "Price Found! 🎯",
          description: `${formData.underlying} ${formData.optionType} $${formData.strikePrice}: $${data.price.toFixed(2)}`,
        })

        if (onPriceFound) {
          onPriceFound(data.price, data.workingSymbol)
        }
      } else {
        toast({
          title: "No Price Found",
          description: "Check the recommendations below for next steps",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Analysis Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const loadPresetTrade = (preset: any) => {
    setFormData(preset)
    setAnalysis(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Smart Option Analyzer
          </CardTitle>
          <CardDescription>
            Intelligent analysis of option symbols with multiple format testing and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Presets */}
          <div className="space-y-2">
            <Label>Quick Test Presets:</Label>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  loadPresetTrade({
                    underlying: "SOFI",
                    optionType: "put",
                    strikePrice: "8",
                    expirationDate: "2025-01-17",
                  })
                }
              >
                SOFI Put $8
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  loadPresetTrade({
                    underlying: "ASTS",
                    optionType: "put",
                    strikePrice: "43",
                    expirationDate: "2025-08-15",
                  })
                }
              >
                ASTS Put $43
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  loadPresetTrade({
                    underlying: "AAPL",
                    optionType: "put",
                    strikePrice: "220",
                    expirationDate: "2025-02-21",
                  })
                }
              >
                AAPL Put $220
              </Button>
            </div>
          </div>

          {/* Form */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="underlying">Underlying Symbol</Label>
              <Input
                id="underlying"
                value={formData.underlying}
                onChange={(e) => setFormData({ ...formData, underlying: e.target.value.toUpperCase() })}
                placeholder="SOFI"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="optionType">Option Type</Label>
              <Select
                value={formData.optionType}
                onValueChange={(value) => setFormData({ ...formData, optionType: value })}
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
            <div className="space-y-2">
              <Label htmlFor="strikePrice">Strike Price</Label>
              <Input
                id="strikePrice"
                type="number"
                step="0.01"
                value={formData.strikePrice}
                onChange={(e) => setFormData({ ...formData, strikePrice: e.target.value })}
                placeholder="8.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expirationDate">Expiration Date</Label>
              <Input
                id="expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={runSmartAnalysis} disabled={isAnalyzing} className="w-full">
            <Search className={`h-4 w-4 mr-2 ${isAnalyzing ? "animate-spin" : ""}`} />
            {isAnalyzing ? "Analyzing..." : "Run Smart Analysis"}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Analysis Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2">
                    {analysis.isExpired ? (
                      <XCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    <span className={analysis.isExpired ? "text-red-600" : "text-green-600"}>
                      {analysis.isExpired ? "Expired" : "Active"}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Days to Expiry</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className={analysis.daysToExpiry <= 7 ? "text-red-600 font-medium" : ""}>
                      {analysis.daysToExpiry} days
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Symbol Variants</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{analysis.symbolVariants?.length || 0} tested</Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Quote Found</p>
                  <div className="flex items-center gap-2">
                    {analysis.testResults?.some((r: any) => r.hasQuote) ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">Yes</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-red-600">No</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.recommendations.map((rec: string, index: number) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{rec}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Symbol Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Symbol Variant Test Results</CardTitle>
              <CardDescription>Results from testing different option symbol formats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.testResults?.map((result: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      {result.hasQuote ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : result.success ? (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <div>
                        <p className="font-mono text-sm">{result.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          Status: {result.status} {result.hasQuote && "• Quote Found!"}
                        </p>
                      </div>
                    </div>
                    {result.hasQuote && result.data && (
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          ${(() => {
                            const quote = result.data
                            const askPrice = quote.ap || quote.ask
                            const bidPrice = quote.bp || quote.bid
                            const lastPrice = quote.last
                            const midPrice =
                              bidPrice && askPrice ? (bidPrice + askPrice) / 2 : lastPrice || askPrice || bidPrice
                            return midPrice?.toFixed(2) || "N/A"
                          })()}
                        </p>
                        <p className="text-xs text-muted-foreground">Current Price</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alternative Suggestions */}
          {analysis.alternativeExpirations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Alternative Expiration Dates
                </CardTitle>
                <CardDescription>Try these standard option expiration dates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {analysis.alternativeExpirations.map((date: string, index: number) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData({ ...formData, expirationDate: date })
                        setAnalysis(null)
                      }}
                    >
                      {new Date(date).toLocaleDateString()}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
