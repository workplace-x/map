import { useState, useEffect, useCallback } from 'react'
import { OrderSummary, VendorSummary, ApprovalStatus } from './types'
import { MarginAnalysisService } from './services'
import { useAuth } from '@/stores/authStore'

// New AI-powered imports
import {
  SmartSearchResult,
  MarginPrediction,
  AdvancedAnalytics,
  AIInsightsEngine,
  MLMarginModel,
  LearningSystem,
  OptimizationSuggestion,
  CompetitiveInsight
} from './types'

// Hook for managing margin analysis data
export function useMarginAnalysis() {
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [autoSearched, setAutoSearched] = useState(false)

  // Set searchValue from URL parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const orderParam = params.get('order')
    if (orderParam) {
      setSearchValue(orderParam)
      setAutoSearched(false)
    }
  }, [])

  // Auto-search when URL parameter is set
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const orderParam = params.get('order')
    if (orderParam && searchValue === orderParam && !autoSearched) {
      handleSearch()
      setAutoSearched(true)
    }
  }, [searchValue, autoSearched])

  const handleSearch = useCallback(async () => {
    if (!searchValue) return

    setLoading(true)
    setError(null)

    try {
      // Use the main margin analysis API instead
      const data = await MarginAnalysisService.fetchMarginAnalysis({
        period: 'this_month'
      })
      setOrderSummary(data as any) // Type assertion for compatibility
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setOrderSummary(null)
    } finally {
      setLoading(false)
    }
  }, [searchValue])

  const reset = useCallback(() => {
    setOrderSummary(null)
    setError(null)
    setSearchValue('')
    setAutoSearched(false)
  }, [])

  return {
    orderSummary,
    loading,
    error,
    searchValue,
    setSearchValue,
    handleSearch,
    reset
  }
}

// Hook for managing approval status
export function useApprovalStatus(orderNo: string) {
  const { user } = useAuth()
  const [approval, setApproval] = useState<ApprovalStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Fetch approval status when user or orderNo changes
  useEffect(() => {
    if (!user?.id || !orderNo) {
      setApproval(null)
      return
    }

    setLoading(true)
    setError(null)

    // Use MarginAnalysisService approval methods
    MarginAnalysisService.fetchApprovals({ assigned_to: user.id })
      .then(approvals => {
        const orderApproval = approvals.find(a => a.order_no === orderNo)
        setApproval(orderApproval as any || null)
      })
      .catch(err => {
        setError('Failed to fetch approval status')
        setApproval(null)
      })
      .finally(() => setLoading(false))
  }, [user?.id, orderNo])

  const submitForApproval = useCallback(async () => {
    if (!user?.id || !orderNo) return

    setSubmitting(true)
    setError(null)

    try {
      const result = await MarginAnalysisService.createApprovalRequest({
        order_no: orderNo,
        requested_by: user.id,
        business_justification: 'Margin approval requested'
      })
      setApproval(result as any)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit for approval')
    } finally {
      setSubmitting(false)
    }
  }, [user?.id, orderNo])

  return {
    approval,
    loading,
    error,
    submitting,
    submitForApproval,
    canSubmit: !!user?.id && !!orderNo && !approval
  }
}

// Hook for managing vendor summaries
export function useVendorSummaries(vendorLines: any[]) {
  const [vendorSummaries, setVendorSummaries] = useState<VendorSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const uniqueVendors = Array.from(
      new Set(vendorLines.map(l => (l.vnd_no || '').trim().toUpperCase()))
    ).filter(Boolean)

    if (uniqueVendors.length === 0) {
      setVendorSummaries([])
      return
    }

    setLoading(true)
    setError(null)

    // Mock vendor summaries for now
    const mockSummaries: VendorSummary[] = uniqueVendors.map(vendorNo => ({
      vendorNo: vendorNo,
      vendorName: `Vendor ${vendorNo}`,
      marginPct: Math.random() * 30 + 10,
      marginPct12mo: Math.random() * 30 + 10
    }))

    setTimeout(() => {
      setVendorSummaries(mockSummaries)
      setLoading(false)
    }, 500)
  }, [vendorLines])

  return {
    vendorSummaries,
    loading,
    error
  }
}

// ===== NEW AI-POWERED HOOKS =====

// Hook for intelligent search functionality
export function useIntelligentSearch() {
  const [results, setResults] = useState<SmartSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  const search = useCallback(async (query: string, options?: {
    search_type?: 'all' | 'quotes' | 'orders' | 'customers' | 'vendors' | 'patterns'
    include_ai_insights?: boolean
    limit?: number
    min_relevance?: number
  }) => {
    if (!query.trim()) {
      setResults([])
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const searchResults = await MarginAnalysisService.intelligentSearch(query, {
        search_type: 'all',
        include_ai_insights: true,
        limit: 20,
        min_relevance: 0.3,
        ...options
      })

      setResults(searchResults)
      
      // Add to search history (max 10 items)
      setSearchHistory(prev => {
        const newHistory = [query, ...prev.filter(h => h !== query)]
        return newHistory.slice(0, 10)
      })

      return searchResults
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed'
      setError(errorMessage)
      setResults([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  const clearHistory = useCallback(() => {
    setSearchHistory([])
  }, [])

  return {
    results,
    loading,
    error,
    searchHistory,
    search,
    clearResults,
    clearHistory
  }
}

// Hook for AI predictions and analysis
export function useAIPredictions() {
  const [predictions, setPredictions] = useState<MarginPrediction | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisHistory, setAnalysisHistory] = useState<{
    entity_id: string
    entity_type: string
    timestamp: string
    prediction: MarginPrediction
  }[]>([])

  const getPrediction = useCallback(async (params: {
    quote_id?: string
    order_no?: string
    customer_id?: string
    vendor_id?: string
    product_category?: string
    order_value?: number
    historical_context?: boolean
  }) => {
    setLoading(true)
    setError(null)

    try {
      const prediction = await MarginAnalysisService.getMarginPrediction(params)
      setPredictions(prediction)
      
      // Add to analysis history
      setAnalysisHistory(prev => {
        const newEntry = {
          entity_id: params.quote_id || params.order_no || params.customer_id || 'unknown',
          entity_type: params.quote_id ? 'quote' : params.order_no ? 'order' : 'other',
          timestamp: new Date().toISOString(),
          prediction
        }
        return [newEntry, ...prev.slice(0, 9)] // Keep last 10
      })

      return prediction
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Prediction failed'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const provideFeedback = useCallback(async (
    predictionId: string,
    actualOutcome: number,
    userFeedback: 'helpful' | 'neutral' | 'unhelpful',
    businessResult: 'positive' | 'neutral' | 'negative',
    additionalContext?: string
  ) => {
    try {
      await MarginAnalysisService.provideFeedback({
        prediction_id: predictionId,
        actual_outcome: actualOutcome,
        user_feedback: userFeedback,
        business_result: businessResult,
        additional_context: additionalContext
      })
      return true
    } catch (err) {
      console.error('Failed to provide feedback:', err)
      return false
    }
  }, [])

  return {
    predictions,
    loading,
    error,
    analysisHistory,
    getPrediction,
    provideFeedback
  }
}

// Hook for advanced analytics and insights
export function useAdvancedAnalytics() {
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null)
  const [insights, setInsights] = useState<AIInsightsEngine | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async (params?: {
    time_period?: string
    include_patterns?: boolean
    include_anomalies?: boolean
    include_forecasts?: boolean
    entities?: string[]
  }) => {
    setLoading(true)
    setError(null)

    try {
      const [analyticsData, insightsData] = await Promise.all([
        MarginAnalysisService.getAdvancedAnalytics({
          time_period: '12_months',
          include_patterns: true,
          include_anomalies: true,
          include_forecasts: true,
          ...params
        }),
        MarginAnalysisService.getAIInsights({
          entity_type: 'overall',
          time_horizon: 'immediate'
        })
      ])

      setAnalytics(analyticsData)
      setInsights(insightsData)

      return { analytics: analyticsData, insights: insightsData }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analytics fetch failed'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const detectAnomalies = useCallback(async (params?: {
    time_period?: string
    entity_types?: string[]
    severity_threshold?: number
    auto_investigate?: boolean
  }) => {
    try {
      return await MarginAnalysisService.detectMarginAnomalies(params)
    } catch (err) {
      console.error('Anomaly detection failed:', err)
      return null
    }
  }, [])

  return {
    analytics,
    insights,
    loading,
    error,
    fetchAnalytics,
    detectAnomalies
  }
}

// Hook for ML model management
export function useMLModels() {
  const [models, setModels] = useState<MLMarginModel[]>([])
  const [learningSystem, setLearningSystem] = useState<LearningSystem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchModels = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [modelsData, learningData] = await Promise.all([
        MarginAnalysisService.getMLModels(),
        MarginAnalysisService.getLearningSystemStatus()
      ])

      setModels(modelsData)
      setLearningSystem(learningData)

      return modelsData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch models'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const trainModel = useCallback(async (params: {
    model_type: string
    training_data_period: string
    features: string[]
    hyperparameters?: Record<string, any>
    validation_split?: number
  }) => {
    try {
      return await MarginAnalysisService.trainMLModel(params)
    } catch (err) {
      console.error('Model training failed:', err)
      return null
    }
  }, [])

  const getModelPerformance = useCallback(async (modelId: string) => {
    try {
      return await MarginAnalysisService.getModelPerformance(modelId)
    } catch (err) {
      console.error('Failed to get model performance:', err)
      return null
    }
  }, [])

  // Load models on mount
  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  return {
    models,
    learningSystem,
    loading,
    error,
    fetchModels,
    trainModel,
    getModelPerformance
  }
}

// Hook for margin optimization
export function useMarginOptimization() {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([])
  const [competitiveInsights, setCompetitiveInsights] = useState<CompetitiveInsight[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getOptimizationSuggestions = useCallback(async (params: {
    quote_id?: string
    order_no?: string
    customer_id?: string
    vendor_lines?: Array<{
      vendor_id: string
      product_category: string
      current_margin: number
      volume: number
    }>
  }) => {
    setLoading(true)
    setError(null)

    try {
      const [suggestionsData, competitiveData] = await Promise.all([
        MarginAnalysisService.getMarginOptimizationSuggestions(params),
        MarginAnalysisService.analyzeCompetitivePosition({
          customer_id: params.customer_id
        })
      ])

      setSuggestions(suggestionsData)
      setCompetitiveInsights(competitiveData)

      return { suggestions: suggestionsData, competitive: competitiveData }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Optimization failed'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const analyzeHistoricalMargins = useCallback(async (params: {
    customer_id?: string
    vendor_id?: string
    product_category?: string
    salesperson_id?: string
    time_periods: string[]
    analysis_type: '12_month' | 'yearly' | 'quarterly' | 'custom'
  }) => {
    try {
      return await MarginAnalysisService.getHistoricalMarginAnalysis(params)
    } catch (err) {
      console.error('Historical analysis failed:', err)
      return null
    }
  }, [])

  return {
    suggestions,
    competitiveInsights,
    loading,
    error,
    getOptimizationSuggestions,
    analyzeHistoricalMargins
  }
}

// Hook for goal-based analysis integration
export function useGoalBasedAnalysis() {
  const [goalAnalysis, setGoalAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeQuoteAgainstGoals = useCallback(async (params: {
    quote_id?: string
    customer_id?: string
    salesperson_id?: string
    vendor_ids?: string[]
  }) => {
    setLoading(true)
    setError(null)

    try {
      const analysis = await MarginAnalysisService.getGoalBasedAnalysis(params)
      setGoalAnalysis(analysis)
      return analysis
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Goal analysis failed'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const checkApprovalRequirements = useCallback((analysis: any) => {
    if (!analysis?.risk_assessment) return { required: false, level: null }

    return {
      required: analysis.risk_assessment.approval_required,
      level: analysis.risk_assessment.approval_level,
      reasons: [
        analysis.risk_assessment.below_threshold_lines > 0 && 
          `${analysis.risk_assessment.below_threshold_lines} line(s) below threshold`,
        analysis.risk_assessment.zero_negative_margin_lines > 0 && 
          `${analysis.risk_assessment.zero_negative_margin_lines} line(s) with zero/negative margin`
      ].filter(Boolean)
    }
  }, [])

  return {
    goalAnalysis,
    loading,
    error,
    analyzeQuoteAgainstGoals,
    checkApprovalRequirements
  }
}

// Hook for comprehensive quote analysis with AI
export function useAIQuoteAnalysis() {
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeQuote = useCallback(async (quoteNumber: string) => {
    setLoading(true)
    setError(null)

    try {
      const comprehensiveAnalysis = await MarginAnalysisService.analyzeQuoteWithAI(quoteNumber)
      setAnalysis(comprehensiveAnalysis)
      return comprehensiveAnalysis
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Quote analysis failed'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const generateExecutiveSummary = useCallback(async (params: {
    time_period: string
    include_predictions?: boolean
    include_recommendations?: boolean
  }) => {
    try {
      return await MarginAnalysisService.generateExecutiveSummary(params)
    } catch (err) {
      console.error('Executive summary generation failed:', err)
      return null
    }
  }, [])

  return {
    analysis,
    loading,
    error,
    analyzeQuote,
    generateExecutiveSummary
  }
}

// Utility hook for AI capability monitoring
export function useAICapabilities() {
  const [capabilities, setCapabilities] = useState(MarginAnalysisService.getAICapabilityScore())
  const [realTimeEnabled, setRealTimeEnabled] = useState(false)

  const refreshCapabilities = useCallback(() => {
    setCapabilities(MarginAnalysisService.getAICapabilityScore())
  }, [])

  const toggleRealTime = useCallback(async () => {
    try {
      if (realTimeEnabled) {
        await MarginAnalysisService.disableRealTime()
      } else {
        await MarginAnalysisService.enableRealTime()
      }
      setRealTimeEnabled(!realTimeEnabled)
    } catch (err) {
      console.error('Failed to toggle real-time mode:', err)
    }
  }, [realTimeEnabled])

  return {
    capabilities,
    realTimeEnabled,
    refreshCapabilities,
    toggleRealTime
  }
} 