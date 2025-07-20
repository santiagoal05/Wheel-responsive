"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, XCircle, AlertCircle, Zap, Play, TestTube } from "lucide-react"
import { alpacaClient } from "@/lib/alpaca-client"
import { useToast } from "@/hooks/use-toast"

export default function AlpacaTest() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const { toast } = useToast()

  // Test form data
  const [testData, setTestData] = useState({
    underlying: "AAPL",
    optionType: "put",
    strikePrice: "180",
    expirationDate: "2024-03-15",
  })

  const testConnection = async () => {
    setIsTesting(true)
    try {
      const connected = await alpacaClient.testConnection()
      setIsConnected(connected)

      if (connected) {
        toast({
          title: "Connection Successful! 🎉",
          description: "Alpaca Markets API is working correctly",
        })
      } else {
        toast({
          title: "Connection Failed",
          description: "Check your API credentials",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      setIsConnected(false)
      toast({
        title: "Connection Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const testOptionQuote = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const price = await alpacaClient.getOptionQuote(
        testData.underlying,
        testData.expirationDate,
        testData.optionType,
        Number.parseFloat(testData.strikePrice),
      )

      const result = {
        symbol: testData.underlying,
        optionType: testData.optionType,
        strike: testData.strikePrice,
        expiration: testData.expirationDate,
        price: price,
        success: price !== null,
      }

      setTestResult(result)

      if (price !== null) {
        toast({
          title: "Quote Retrieved! 📊",
          description: `${testData.underlying} ${testData.optionType} $${testData.strikePrice}: $${price.toFixed(2)}`,
        })
      } else {
        toast({
          title: "No Quote Available",
          description: "This option may not exist or market is closed",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message,
      })
      toast({
        title: "Quote Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Alpaca Connection Test
          </CardTitle>
          <CardDescription>Test your Alpaca Markets API connection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">API Connection Status</p>
              <p className="text-sm text-muted-foreground">
                {isConnected === null && "Not tested yet"}
                {isConnected === true && "Connected successfully"}
                {isConnected === false && "Connection failed"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isConnected === true && <CheckCircle className="h-4 w-4 text-green-600" />}
              {isConnected === false && <XCircle className="h-4 w-4 text-red-600" />}
              {isConnected === null && <AlertCircle className="h-4 w-4 text-gray-400" />}
              <Button onClick={testConnection} disabled={isTesting} size="sm">
                <Play className={`h-4 w-4 mr-2 ${isTesting ? "animate-spin" : ""}`} />
                {isTesting ? "Testing..." : "Test Connection"}
              </Button>
            </div>
          </div>

          {isConnected === false && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Connection Failed:</strong> Check your Alpaca API credentials in the environment variables.
              </AlertDescription>
            </Alert>
          )}

          {isConnected === true && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Connected!</strong> Your Alpaca API is working correctly.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Option Quote Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Option Quote Test
          </CardTitle>
          <CardDescription>Test retrieving real option prices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="underlying">Underlying Symbol</Label>
              <Input
                id="underlying"
                value={testData.underlying}
                onChange={(e) => setTestData({ ...testData, underlying: e.target.value.toUpperCase() })}
                placeholder="AAPL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="optionType">Option Type</Label>
              <Select
                value={testData.optionType}
                onValueChange={(value) => setTestData({ ...testData, optionType: value })}
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
                value={testData.strikePrice}
                onChange={(e) => setTestData({ ...testData, strikePrice: e.target.value })}
                placeholder="180.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expirationDate">Expiration Date</Label>
              <Input
                id="expirationDate"
                type="date"
                value={testData.expirationDate}
                onChange={(e) => setTestData({ ...testData, expirationDate: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={testOptionQuote} disabled={isTesting || isConnected !== true} className="w-full">
            <TestTube className={`h-4 w-4 mr-2 ${isTesting ? "animate-spin" : ""}`} />
            {isTesting ? "Getting Quote..." : "Get Option Quote"}
          </Button>

          {testResult && (
            <Alert className={testResult.success ? "" : "border-red-200"}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <AlertDescription>
                {testResult.success ? (
                  <div>
                    <strong>Quote Retrieved:</strong>
                    <div className="mt-2 p-3 bg-muted rounded">
                      <p>
                        <strong>Symbol:</strong> {testResult.symbol}
                      </p>
                      <p>
                        <strong>Option:</strong> {testResult.optionType.toUpperCase()} ${testResult.strike}
                      </p>
                      <p>
                        <strong>Expiration:</strong> {new Date(testResult.expiration).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Current Price:</strong>{" "}
                        <span className="text-green-600 font-bold">${testResult.price.toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <strong>Quote Failed:</strong> {testResult.error || "No data available for this option"}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Test Buttons */}
          <div className="space-y-2">
            <h4 className="font-medium">Quick Tests:</h4>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTestData({
                    underlying: "SOFI",
                    optionType: "put",
                    strikePrice: "8",
                    expirationDate: "2025-01-17",
                  })
                }}
              >
                SOFI Put $8
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTestData({
                    underlying: "ASTS",
                    optionType: "put",
                    strikePrice: "43",
                    expirationDate: "2025-08-15",
                  })
                }}
              >
                ASTS Put $43
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTestData({
                    underlying: "AAPL",
                    optionType: "put",
                    strikePrice: "220",
                    expirationDate: "2025-02-21",
                  })
                }}
              >
                AAPL Put $220
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium">1. Get Alpaca API Keys (Free)</h4>
            <p className="text-sm text-muted-foreground">
              Sign up at{" "}
              <a href="https://alpaca.markets" target="_blank" className="text-blue-600 underline" rel="noreferrer">
                alpaca.markets
              </a>{" "}
              and get your API keys
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">2. Add Environment Variables</h4>
            <div className="p-3 bg-black text-green-400 rounded text-xs font-mono">
              ALPACA_API_KEY=your_api_key
              <br />
              ALPACA_SECRET_KEY=your_secret_key
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">3. Test Connection</h4>
            <p className="text-sm text-muted-foreground">
              Use the test button above to verify your API is working correctly
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
