/**
 * Predictive Analytics Service
 * Advanced forecasting and trend analysis for margin optimization
 */

import { mlModelManager, MLPrediction } from './MLModelManager'

export interface TrendAnalysis {
  entity_type: 'customer' | 'vendor' | 'product' | 'overall'
  entity_id?: string
  current_value: number
  trend_direction: 'up' | 'down' | 'stable'
  trend_strength: 'weak' | 'moderate' | 'strong'
  confidence: number
  forecast_period: number
  predicted_values: Array<{
    period: string
    value: number
    confidence_interval: { lower: number; upper: number }
  }>
  factors: Array<{
    factor: string
    impact: number
    description: string
  }>
}

export interface MarginForecast {
  forecast_id: string
  customer_id?: string
  vendor_id?: string
  product_category?: string
  time_horizon: '1_month' | '3_months' | '6_months' | '1_year'
  baseline_margin: number
  predicted_margin: number
  margin_range: { min: number; max: number }
  probability_distribution: Record<string, number>
  risk_factors: Array<{
    factor: string
    impact: number
    mitigation: string
  }>
  opportunities: Array<{
    opportunity: string
    potential_improvement: number
    effort_required: 'low' | 'medium' | 'high'
  }>
  confidence_score: number
  created_at: Date
  valid_until: Date
}

export interface SeasonalityAnalysis {
  entity_type: string
  entity_id: string
  seasonal_patterns: Array<{
    period: string
    typical_margin: number
    variance: number
    trend: 'increasing' | 'decreasing' | 'stable'
  }>
  peak_periods: string[]
  low_periods: string[]
  recommendations: string[]
}

export class PredictiveAnalytics {
  private forecastCache = new Map<string, MarginForecast>()
  private trendCache = new Map<string, TrendAnalysis>()

  // ===== MARGIN FORECASTING =====

  async generateMarginForecast(params: {
    customer_id?: string
    vendor_id?: string
    product_category?: string
    time_horizon: '1_month' | '3_months' | '6_months' | '1_year'
    historical_data?: any[]
    include_external_factors?: boolean
  }): Promise<MarginForecast> {
    const cacheKey = this.getForecastCacheKey(params)
    
    // Check cache first
    const cached = this.forecastCache.get(cacheKey)
    if (cached && cached.valid_until > new Date()) {
      return cached
    }

    // Generate forecast using ML models
    const features = {
      ...params,
      historical_pattern: await this.analyzeHistoricalPattern(params),
      market_conditions: await this.getMarketConditions(),
      seasonal_factors: await this.getSeasonalFactors(params)
    }

    const prediction = await mlModelManager.predictMargin(features)
    
    const forecast: MarginForecast = {
      forecast_id: this.generateForecastId(),
      ...params,
      baseline_margin: features.historical_pattern?.average || 15,
      predicted_margin: prediction.prediction as number,
      margin_range: prediction.prediction_bounds 
        ? { min: prediction.prediction_bounds.lower, max: prediction.prediction_bounds.upper }
        : { min: (prediction.prediction as number) - 3, max: (prediction.prediction as number) + 3 },
      probability_distribution: this.generateProbabilityDistribution(prediction),
      risk_factors: await this.identifyRiskFactors(params),
      opportunities: await this.identifyOpportunities(params),
      confidence_score: prediction.confidence_score,
      created_at: new Date(),
      valid_until: new Date(Date.now() + this.getValidityPeriod(params.time_horizon))
    }

    // Cache the forecast
    this.forecastCache.set(cacheKey, forecast)
    
    return forecast
  }

  async getBatchForecasts(requests: Array<{
    customer_id?: string
    vendor_id?: string
    product_category?: string
    time_horizon: '1_month' | '3_months' | '6_months' | '1_year'
  }>): Promise<MarginForecast[]> {
    const forecasts = await Promise.all(
      requests.map(request => this.generateMarginForecast(request))
    )
    return forecasts
  }

  // ===== TREND ANALYSIS =====

  async analyzeTrend(params: {
    entity_type: 'customer' | 'vendor' | 'product' | 'overall'
    entity_id?: string
    time_period?: '30_days' | '90_days' | '1_year'
    include_predictions?: boolean
  }): Promise<TrendAnalysis> {
    const cacheKey = `trend:${params.entity_type}:${params.entity_id || 'all'}:${params.time_period || '90_days'}`
    
    // Check cache
    const cached = this.trendCache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Analyze historical data patterns
    const historicalData = await this.getHistoricalTrendData(params)
    const trendMetrics = this.calculateTrendMetrics(historicalData)
    
    const analysis: TrendAnalysis = {
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      current_value: trendMetrics.current,
      trend_direction: trendMetrics.direction,
      trend_strength: trendMetrics.strength,
      confidence: trendMetrics.confidence,
      forecast_period: this.getForecastPeriod(params.time_period),
      predicted_values: params.include_predictions 
        ? await this.generateTrendPredictions(params, trendMetrics)
        : [],
      factors: await this.identifyTrendFactors(params, trendMetrics)
    }

    // Cache for 30 minutes
    this.trendCache.set(cacheKey, analysis)
    setTimeout(() => this.trendCache.delete(cacheKey), 30 * 60 * 1000)

    return analysis
  }

  // ===== SEASONALITY ANALYSIS =====

  async analyzeSeasonality(params: {
    entity_type: 'customer' | 'vendor' | 'product'
    entity_id: string
    years_back?: number
  }): Promise<SeasonalityAnalysis> {
    const historicalData = await this.getSeasonalHistoricalData(params)
    const seasonalPatterns = this.extractSeasonalPatterns(historicalData)
    
    return {
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      seasonal_patterns: seasonalPatterns,
      peak_periods: this.identifyPeakPeriods(seasonalPatterns),
      low_periods: this.identifyLowPeriods(seasonalPatterns),
      recommendations: this.generateSeasonalRecommendations(seasonalPatterns)
    }
  }

  // ===== PREDICTIVE INSIGHTS =====

  async getMarginRiskPrediction(params: {
    customer_id?: string
    vendor_id?: string
    current_margin: number
    order_value?: number
    market_conditions?: Record<string, any>
  }): Promise<{
    risk_level: 'low' | 'medium' | 'high' | 'critical'
    risk_score: number
    risk_factors: Array<{ factor: string; impact: number; description: string }>
    recommendations: string[]
    confidence: number
  }> {
    const features = {
      current_margin: params.current_margin,
      expected_margin: await this.getExpectedMargin(params),
      customer_type: await this.getCustomerType(params.customer_id),
      vendor_type: await this.getVendorType(params.vendor_id),
      order_characteristics: {
        value: params.order_value,
        complexity: this.estimateOrderComplexity(params)
      }
    }

    const prediction = await mlModelManager.detectMarginAnomaly(features)
    
    const riskScore = this.calculateRiskScore(prediction, features)
    
    return {
      risk_level: this.classifyRiskLevel(riskScore),
      risk_score: riskScore,
      risk_factors: await this.analyzeRiskFactors(features, prediction),
      recommendations: this.generateRiskRecommendations(riskScore, features),
      confidence: prediction.confidence_score
    }
  }

  async getOptimizationSuggestions(params: {
    customer_id?: string
    vendor_id?: string
    current_margin: number
    target_margin?: number
    constraints?: Record<string, any>
  }): Promise<{
    suggestions: Array<{
      action: string
      expected_improvement: number
      effort_required: 'low' | 'medium' | 'high'
      risk_level: 'low' | 'medium' | 'high'
      implementation_time: string
      description: string
    }>
    potential_margin_improvement: number
    confidence: number
  }> {
    const features = {
      current_setup: {
        margin: params.current_margin,
        customer_id: params.customer_id,
        vendor_id: params.vendor_id
      },
      constraints: params.constraints || {},
      objectives: ['maximize_margin', 'minimize_risk', 'maintain_relationships']
    }

    const prediction = await mlModelManager.optimizeMargin(features)
    const optimizationResult = prediction.prediction as Record<string, any>
    
    return {
      suggestions: this.generateActionableSuggestions(optimizationResult),
      potential_margin_improvement: optimizationResult.potential_improvement || 0,
      confidence: prediction.confidence_score
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  private async analyzeHistoricalPattern(params: any): Promise<any> {
    // Mock historical pattern analysis
    return {
      average: 18.5,
      volatility: 3.2,
      trend: 'stable',
      seasonality_factor: 1.05
    }
  }

  private async getMarketConditions(): Promise<any> {
    return {
      economic_indicators: 'positive',
      competitive_pressure: 'moderate',
      supply_chain_stability: 'stable'
    }
  }

  private async getSeasonalFactors(params: any): Promise<any> {
    const month = new Date().getMonth()
    return {
      current_season_multiplier: month < 3 || month > 9 ? 1.1 : 0.95,
      upcoming_trends: 'improving'
    }
  }

  private generateProbabilityDistribution(prediction: MLPrediction): Record<string, number> {
    const value = prediction.prediction as number
    const distribution: Record<string, number> = {}
    
    for (let i = Math.max(0, value - 10); i <= value + 10; i++) {
      const distance = Math.abs(i - value)
      const probability = Math.exp(-distance / 3) * prediction.confidence_score
      distribution[i.toString()] = probability
    }
    
    return distribution
  }

  private async identifyRiskFactors(params: any): Promise<any[]> {
    return [
      {
        factor: 'Market volatility',
        impact: -2.1,
        mitigation: 'Diversify customer base'
      },
      {
        factor: 'Vendor relationship',
        impact: 1.5,
        mitigation: 'Strengthen partnership terms'
      }
    ]
  }

  private async identifyOpportunities(params: any): Promise<any[]> {
    return [
      {
        opportunity: 'Volume discount optimization',
        potential_improvement: 1.8,
        effort_required: 'medium' as const
      },
      {
        opportunity: 'Product mix adjustment',
        potential_improvement: 2.3,
        effort_required: 'low' as const
      }
    ]
  }

  private getValidityPeriod(timeHorizon: string): number {
    const periods = {
      '1_month': 7 * 24 * 60 * 60 * 1000,      // 7 days
      '3_months': 14 * 24 * 60 * 60 * 1000,    // 14 days
      '6_months': 30 * 24 * 60 * 60 * 1000,    // 30 days
      '1_year': 60 * 24 * 60 * 60 * 1000       // 60 days
    }
    return periods[timeHorizon as keyof typeof periods] || periods['3_months']
  }

  private getForecastCacheKey(params: any): string {
    return `forecast:${params.customer_id || 'all'}:${params.vendor_id || 'all'}:${params.product_category || 'all'}:${params.time_horizon}`
  }

  private generateForecastId(): string {
    return `forecast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async getHistoricalTrendData(params: any): Promise<any[]> {
    // Mock historical data
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      value: 15 + Math.sin(i / 7) * 3 + Math.random() * 2
    }))
  }

  private calculateTrendMetrics(data: any[]): any {
    const values = data.map(d => d.value)
    const current = values[0]
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    
    // Simple trend calculation
    const trend = (current - avg) / avg
    
    return {
      current,
      direction: trend > 0.05 ? 'up' : trend < -0.05 ? 'down' : 'stable',
      strength: Math.abs(trend) > 0.1 ? 'strong' : Math.abs(trend) > 0.03 ? 'moderate' : 'weak',
      confidence: 0.8
    }
  }

  private getForecastPeriod(timePeriod?: string): number {
    const periods = {
      '30_days': 30,
      '90_days': 90,
      '1_year': 365
    }
    return periods[timePeriod as keyof typeof periods] || 90
  }

  private async generateTrendPredictions(params: any, metrics: any): Promise<any[]> {
    // Generate simple trend predictions
    return Array.from({ length: 12 }, (_, i) => ({
      period: `Week ${i + 1}`,
      value: metrics.current + (i * 0.1),
      confidence_interval: {
        lower: metrics.current + (i * 0.1) - 1,
        upper: metrics.current + (i * 0.1) + 1
      }
    }))
  }

  private async identifyTrendFactors(params: any, metrics: any): Promise<any[]> {
    return [
      {
        factor: 'Historical performance',
        impact: 0.7,
        description: 'Strong historical trends indicate continued performance'
      },
      {
        factor: 'Market conditions',
        impact: 0.3,
        description: 'Current market conditions are favorable'
      }
    ]
  }

  // Additional helper methods...
  private async getSeasonalHistoricalData(params: any): Promise<any[]> { return [] }
  private extractSeasonalPatterns(data: any[]): any[] { return [] }
  private identifyPeakPeriods(patterns: any[]): string[] { return [] }
  private identifyLowPeriods(patterns: any[]): string[] { return [] }
  private generateSeasonalRecommendations(patterns: any[]): string[] { return [] }
  private async getExpectedMargin(params: any): Promise<number> { return 15 }
  private async getCustomerType(customerId?: string): Promise<string> { return 'standard' }
  private async getVendorType(vendorId?: string): Promise<string> { return 'standard' }
  private estimateOrderComplexity(params: any): string { return 'medium' }
  private calculateRiskScore(prediction: MLPrediction, features: any): number { return 0.3 }
  private classifyRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    return score > 0.7 ? 'critical' : score > 0.5 ? 'high' : score > 0.3 ? 'medium' : 'low'
  }
  private async analyzeRiskFactors(features: any, prediction: MLPrediction): Promise<any[]> { return [] }
  private generateRiskRecommendations(score: number, features: any): string[] { return [] }
  private generateActionableSuggestions(result: any): any[] { return [] }
}

// Singleton instance
export const predictiveAnalytics = new PredictiveAnalytics()

export default PredictiveAnalytics 