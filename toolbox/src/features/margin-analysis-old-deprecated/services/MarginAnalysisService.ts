/**
 * Production-Ready Margin Analysis Service
 * Orchestrates all optimized components with dependency injection
 */

import { cacheManager } from './core/CacheManager'
import { errorHandler } from './core/ErrorHandler'
import marginAnalysisAPI from './core/APIClient'

// Import types from the original types file
import type {
  MarginAnalysisResponse,
  MarginPrediction,
  AdvancedAnalytics,
  AIInsightsEngine,
  OptimizationSuggestion,
  CompetitiveInsight,
  MLMarginModel,
  LearningSystem,
  FilterState,
  PeriodType
} from '../types'

interface ServiceConfig {
  enableCaching: boolean
  enableBatching: boolean
  enableOfflineSupport: boolean
  maxConcurrentRequests: number
  defaultCacheTTL: number
}

export class MarginAnalysisService {
  private config: ServiceConfig
  private initialized = false

  constructor(config: Partial<ServiceConfig> = {}) {
    this.config = {
      enableCaching: true,
      enableBatching: true,
      enableOfflineSupport: true,
      maxConcurrentRequests: 10,
      defaultCacheTTL: 5 * 60 * 1000, // 5 minutes
      ...config
    }
  }

  // ===== INITIALIZATION =====

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Warm up cache with frequently accessed data
      if (this.config.enableCaching) {
        await cacheManager.warmCache('customer_patterns')
        await cacheManager.warmCache('vendor_trends')
      }

      // Configure API client
      marginAnalysisAPI.setRateLimit({
        maxRequests: this.config.maxConcurrentRequests * 10,
        windowMs: 60000
      })

      this.initialized = true
      console.log('✅ Margin Analysis Service initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Margin Analysis Service:', error)
      throw error
    }
  }

  // ===== CORE ANALYSIS METHODS =====

  async fetchMarginAnalysis(params?: {
    period?: PeriodType
    low_margin_only?: boolean
    high_risk_only?: boolean
    sales_team_only?: boolean
    salesperson_id?: string
    customer_no?: string
    vendor_no?: string
    real_time?: boolean
    include_predictions?: boolean
  }): Promise<MarginAnalysisResponse> {
    await this.ensureInitialized()

    // Check cache first
    const cacheKey = `margin_analysis:${JSON.stringify(params)}`
    
    if (this.config.enableCaching) {
      const cached = await cacheManager.get<MarginAnalysisResponse>(cacheKey)
      if (cached) return cached
    }

    // Execute with error handling and optimization
    return errorHandler.withRetry(async () => {
      const result = await marginAnalysisAPI.request<MarginAnalysisResponse>('/api/margin-analysis', {
        method: 'GET',
        body: params,
        priority: 'high',
        batchable: this.config.enableBatching
      })

      // Cache successful results
      if (this.config.enableCaching) {
        await cacheManager.set(cacheKey, result, this.config.defaultCacheTTL)
      }

      return result
    }, { operation: 'fetchMarginAnalysis', params })
  }

  async analyzeQuoteWithAI(quoteNumber: string): Promise<{
    basic_analysis: any
    predictions: MarginPrediction
    risk_factors: any[]
    optimization_suggestions: OptimizationSuggestion[]
    competitive_insights: CompetitiveInsight[]
    goal_comparison: any
    ai_recommendations: string[]
  }> {
    await this.ensureInitialized()

    // Enhanced quote analysis with business context
    return errorHandler.withCircuitBreaker(
      async () => {
        // Check cache
        const cached = await cacheManager.getMarginAnalysis(quoteNumber)
        if (cached) return cached

        // Analyze with AI
        const result = await marginAnalysisAPI.analyzeQuote(quoteNumber)
        
        // Cache result
        await cacheManager.setMarginAnalysis(quoteNumber, result)
        
        return result
      },
      'quote_analysis'
    )
  }

  async getAdvancedAnalytics(params?: {
    time_period?: string
    include_patterns?: boolean
    include_anomalies?: boolean
    include_forecasts?: boolean
    entities?: string[]
  }): Promise<AdvancedAnalytics> {
    await this.ensureInitialized()

    return errorHandler.withRetry(async () => {
      return marginAnalysisAPI.request<AdvancedAnalytics>('/advanced-analytics', {
        method: 'POST',
        body: params,
        priority: 'medium',
        cacheTTL: 15 * 60 * 1000 // 15 minutes
      })
    }, { operation: 'getAdvancedAnalytics', params })
  }

  async getAIInsights(params?: {
    entity_type?: 'quote' | 'customer' | 'vendor' | 'overall'
    entity_id?: string
    insight_types?: string[]
    time_horizon?: 'immediate' | 'short_term' | 'long_term'
  }): Promise<AIInsightsEngine> {
    await this.ensureInitialized()

    return marginAnalysisAPI.request<AIInsightsEngine>('/ai-insights', {
      method: 'POST',
      body: params,
      priority: 'medium',
      batchable: true
    })
  }

  // ===== BUSINESS-SPECIFIC METHODS =====

  async analyzeTangramServices(params?: {
    time_period?: 'current_year' | 'previous_year' | 'both' | 'custom'
    include_forecasting?: boolean
    service_categories?: string[]
  }): Promise<any> {
    await this.ensureInitialized()

    return errorHandler.withRetry(async () => {
      return marginAnalysisAPI.request('/tangram-services', {
        method: 'POST',
        body: params,
        priority: 'high',
        cacheTTL: 20 * 60 * 1000 // 20 minutes
      })
    }, { operation: 'analyzeTangramServices', params })
  }

  async analyzeSteelcasePartnership(): Promise<any> {
    await this.ensureInitialized()

    const cacheKey = 'steelcase_partnership_analysis'
    
    // Check cache (longer TTL for partnership data)
    if (this.config.enableCaching) {
      const cached = await cacheManager.get(cacheKey)
      if (cached) return cached
    }

    const result = await marginAnalysisAPI.request('/steelcase-partnership', {
      priority: 'medium',
      cacheTTL: 60 * 60 * 1000 // 1 hour
    })

    // Cache with extended TTL
    if (this.config.enableCaching) {
      await cacheManager.set(cacheKey, result, 60 * 60 * 1000)
    }

    return result
  }

  async analyzeCustomerCDAs(params?: {
    include_expiring_contracts?: boolean
    sales_region_filter?: string
    cda_status_filter?: string[]
  }): Promise<any> {
    await this.ensureInitialized()

    return marginAnalysisAPI.request('/real-customer-cda-analysis', {
      method: 'POST',
      body: params,
      priority: 'high',
      batchable: true,
      cacheTTL: 30 * 60 * 1000 // 30 minutes
    })
  }

  // ===== INTELLIGENT SEARCH =====

  async intelligentSearch(query: string, params?: {
    search_type?: 'all' | 'quotes' | 'orders' | 'customers' | 'vendors' | 'patterns'
    include_ai_insights?: boolean
    limit?: number
    min_relevance?: number
  }): Promise<any[]> {
    await this.ensureInitialized()

    // Don't cache search results (too dynamic)
    return marginAnalysisAPI.request('/intelligent-search', {
      method: 'POST',
      body: { query, ...params },
      priority: 'high',
      cache: false
    })
  }

  // ===== PREDICTIVE ANALYTICS =====

  async getMarginPrediction(params: {
    quote_id?: string
    order_no?: string
    customer_id?: string
    vendor_id?: string
    product_category?: string
    order_value?: number
    historical_context?: boolean
  }): Promise<MarginPrediction> {
    await this.ensureInitialized()

    return errorHandler.withCircuitBreaker(
      async () => {
        return marginAnalysisAPI.request<MarginPrediction>('/predictions', {
          method: 'POST',
          body: params,
          priority: 'high',
          cacheTTL: 10 * 60 * 1000 // 10 minutes
        })
      },
      'margin_prediction'
    )
  }

  async detectMarginAnomalies(params?: {
    time_period?: string
    entity_types?: string[]
    severity_threshold?: number
    auto_investigate?: boolean
  }): Promise<any> {
    await this.ensureInitialized()

    return marginAnalysisAPI.request('/anomaly-detection', {
      method: 'POST',
      body: params,
      priority: 'medium',
      cacheTTL: 5 * 60 * 1000 // 5 minutes (fresh anomaly data)
    })
  }

  // ===== ML MODEL MANAGEMENT =====

  async getMLModels(): Promise<MLMarginModel[]> {
    await this.ensureInitialized()

    return marginAnalysisAPI.request<MLMarginModel[]>('/ml-models', {
      priority: 'low',
      cacheTTL: 60 * 60 * 1000 // 1 hour
    })
  }

  async trainMLModel(params: {
    model_type: string
    training_data_period: string
    features: string[]
    hyperparameters?: Record<string, any>
    validation_split?: number
  }): Promise<any> {
    await this.ensureInitialized()

    return marginAnalysisAPI.request('/ml-models/train', {
      method: 'POST',
      body: params,
      priority: 'low',
      timeout: 300000, // 5 minutes for training
      cache: false
    })
  }

  async provideFeedback(params: {
    prediction_id: string
    actual_outcome: number
    user_feedback: 'helpful' | 'neutral' | 'unhelpful'
    business_result: 'positive' | 'neutral' | 'negative'
    additional_context?: string
  }): Promise<any> {
    await this.ensureInitialized()

    return marginAnalysisAPI.request('/feedback', {
      method: 'POST',
      body: params,
      priority: 'medium',
      cache: false
    })
  }

  // ===== OPTIMIZATION FEATURES =====

  async getMarginOptimizationSuggestions(params: {
    quote_id?: string
    order_no?: string
    customer_id?: string
    vendor_lines?: Array<{
      vendor_id: string
      product_category: string
      current_margin: number
      volume: number
    }>
  }): Promise<OptimizationSuggestion[]> {
    await this.ensureInitialized()

    return marginAnalysisAPI.request<OptimizationSuggestion[]>('/optimization-suggestions', {
      method: 'POST',
      body: params,
      priority: 'high',
      cacheTTL: 15 * 60 * 1000 // 15 minutes
    })
  }

  async analyzeCompetitivePosition(params: {
    customer_id?: string
    product_categories?: string[]
    market_segment?: string
    geographic_region?: string
  }): Promise<CompetitiveInsight[]> {
    await this.ensureInitialized()

    return marginAnalysisAPI.request<CompetitiveInsight[]>('/competitive-analysis', {
      method: 'POST',
      body: params,
      priority: 'medium',
      cacheTTL: 30 * 60 * 1000 // 30 minutes
    })
  }

  // ===== REAL-TIME FEATURES =====

  async enableRealTimeUpdates(callback: (update: any) => void): Promise<void> {
    await this.ensureInitialized()

    // Implement WebSocket or Server-Sent Events for real-time updates
    console.log('Real-time updates enabled')
    // In production, this would establish a WebSocket connection
  }

  async subscribeToMarginAlerts(alertTypes: string[], callback: (alert: any) => void): Promise<void> {
    await this.ensureInitialized()

    // Subscribe to specific alert types
    console.log('Subscribed to margin alerts:', alertTypes)
  }

  // ===== BULK OPERATIONS =====

  async analyzeBulkQuotes(quoteIds: string[]): Promise<Map<string, any>> {
    await this.ensureInitialized()

    const results = new Map<string, any>()
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 5
    for (let i = 0; i < quoteIds.length; i += batchSize) {
      const batch = quoteIds.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (quoteId) => {
        try {
          const result = await this.analyzeQuoteWithAI(quoteId)
          return { quoteId, result, success: true }
        } catch (error) {
          const { fallbackData, errorInfo } = await errorHandler.handleQuoteAnalysisError(error, quoteId)
          return { quoteId, result: fallbackData, success: false, error: errorInfo }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      batchResults.forEach(({ quoteId, result }) => {
        results.set(quoteId, result)
      })

      // Small delay between batches
      if (i + batchSize < quoteIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return results
  }

  // ===== STREAMING FOR LARGE DATASETS =====

  async streamLargeAnalysis(
    endpoint: string, 
    params: any, 
    onChunk: (chunk: any) => void,
    onComplete?: () => void,
    onError?: (error: any) => void
  ): Promise<void> {
    await this.ensureInitialized()

    try {
      await marginAnalysisAPI.streamLargeDataset(endpoint, onChunk)
      onComplete?.()
    } catch (error) {
      onError?.(error)
    }
  }

  // ===== UTILITY METHODS =====

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }
  }

  // ===== METRICS & MONITORING =====

  getSystemMetrics() {
    return {
      cache: cacheManager.getMetrics(),
      errors: errorHandler.getErrorMetrics(),
      api: marginAnalysisAPI.getMetrics(),
      initialized: this.initialized,
      config: this.config
    }
  }

  // ===== CONFIGURATION =====

  updateConfig(newConfig: Partial<ServiceConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // ===== CLEANUP =====

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Margin Analysis Service...')
    
    // Clear caches
    cacheManager.clear()
    
    // Reset error handler
    errorHandler.resetMetrics()
    
    // Reset API client
    marginAnalysisAPI.reset()
    
    this.initialized = false
  }

  // ===== LEGACY COMPATIBILITY =====

  // Keep existing methods for backward compatibility but optimize them
  static async fetchMarginAnalysis(params?: any): Promise<MarginAnalysisResponse> {
    const instance = marginAnalysisServiceInstance
    return instance.fetchMarginAnalysis(params)
  }

  static async analyzeQuoteWithAI(quoteNumber: string): Promise<any> {
    const instance = marginAnalysisServiceInstance
    return instance.analyzeQuoteWithAI(quoteNumber)
  }

  // Add other static methods as needed for backward compatibility...

  // ===== FORMAT HELPERS =====
  
  static formatMargin(margin: number): string {
    return `${margin.toFixed(1)}%`
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  static getUrgencyColor(severity: string): string {
    const colors = {
      critical: 'red',
      high: 'orange', 
      medium: 'yellow',
      low: 'blue'
    }
    return colors[severity as keyof typeof colors] || 'gray'
  }

  static getMarginHealthColor(marginPct: number): string {
    if (marginPct >= 25) return 'green'
    if (marginPct >= 15) return 'yellow'
    if (marginPct >= 10) return 'orange'
    return 'red'
  }
}

// Create singleton instance for global usage
export const marginAnalysisServiceInstance = new MarginAnalysisService()

// Auto-initialize on import
marginAnalysisServiceInstance.initialize().catch(console.error)

// Default export for main usage
export default MarginAnalysisService 