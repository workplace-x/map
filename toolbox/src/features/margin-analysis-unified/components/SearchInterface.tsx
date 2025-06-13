'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, TrendingUp, AlertCircle, Play } from 'lucide-react'
import { analysisEngine } from '../services/AnalysisEngine'
import { AnalysisData } from '../types'

interface AnalysisProgress {
  progress?: number
  current_action?: string
  message?: string
}

interface SearchInterfaceProps {
  onAnalysisComplete: (analysis: AnalysisData) => void
}

export function SearchInterface({ onAnalysisComplete }: SearchInterfaceProps) {
  const [orderNumber, setOrderNumber] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress>({})
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    const orderNo = orderNumber.trim()
    
    if (!orderNo) {
      setError('Please enter an order number')
      return
    }

    if (orderNo.length < 3) {
      setError('Order number must be at least 3 characters')
      return
    }

    console.log('🚀 Starting direct analysis for order:', orderNo)
    setIsAnalyzing(true)
    setError(null)
    setAnalysisProgress({ progress: 0, current_action: 'Starting analysis...' })
    
    try {
      // Determine order type (Q for quotes, O for orders by default)
      const orderType = orderNo.toLowerCase().startsWith('q') ? 'quote' : 'order'
      const cleanOrderNo = orderNo.replace(/^[qQ]/i, '') // Remove Q prefix if present
      
      const analysis = await analysisEngine.getEnhancedAnalysis(
        cleanOrderNo,
        orderType,
        (progress) => {
          console.log('📊 Analysis progress:', progress)
          setAnalysisProgress(progress)
        }
      )
      
      console.log('✅ Analysis completed:', analysis)
      onAnalysisComplete(analysis)
    } catch (err: any) {
      console.error('❌ Analysis error:', err)
      setError(`Analysis failed: ${err.message}`)
    } finally {
      setIsAnalyzing(false)
      setAnalysisProgress({})
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAnalyzing) {
      handleAnalyze()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          Margin Analysis
        </h2>
        <p className="text-muted-foreground">
          Enter an order or quote number for instant AI-powered margin analysis
        </p>
      </div>

      {/* Direct Analysis Input */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter order number (e.g., 489716, Q123456)"
                  value={orderNumber}
                  onChange={(e) => {
                    setOrderNumber(e.target.value)
                    setError(null)
                  }}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                  disabled={isAnalyzing}
                />
              </div>
              <Button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !orderNumber.trim()}
                className="px-6"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Analyze Order
                  </>
                )}
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Analysis Progress */}
            {isAnalyzing && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>{analysisProgress.current_action || analysisProgress.message || 'Processing...'}</span>
                  <span>{analysisProgress.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${analysisProgress.progress || 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
            1
          </Badge>
          <span>Enter order/quote number</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
            2
          </Badge>
          <span>Click Analyze or press Enter</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
            3
          </Badge>
          <span>View comprehensive analysis</span>
        </div>
      </div>
    </div>
  )
} 