import {
  QuoteData,
  VendorAnalysis,
  ServiceAnalysis,
  LineErrorFlag,
  OptimizationSuggestion,
  RiskAssessment,
  CustomerMarginHistory,
  OverallMarginAnalysis,
  OrderLineAnalysis
} from '../types'

/**
 * MARGIN CALCULATIONS SERVICE
 * 
 * Core business logic for margin analysis, vendor performance,
 * error detection, and recommendation generation.
 */
export class MarginCalculations {
  
  static calculatePerformanceScore(
    currentMargin: number,
    targetMargin: number,
    historicalMargin: number
  ): number {
    const targetScore = Math.min(100, (currentMargin / targetMargin) * 50)
    const historicalScore = Math.min(50, (currentMargin / historicalMargin) * 50)
    return Math.round(targetScore + historicalScore)
  }
  
  static generateOverallRecommendations(
    quote: QuoteData,
    targetMargin: number,
    customerHistorical: CustomerMarginHistory
  ): string[] {
    const recommendations: string[] = []
    
    if (quote.margin_pct < targetMargin) {
      const gap = targetMargin - quote.margin_pct
      recommendations.push(`Increase margin by ${gap.toFixed(1)}% to meet target`)
    }
    
    if (quote.margin_pct < customerHistorical.overall_avg_margin) {
      recommendations.push('Current margin below customer historical average')
    }
    
    if (customerHistorical.trend === 'declining') {
      recommendations.push('Customer margin trend is declining - consider pricing strategy review')
    }
    
    return recommendations
  }
  
  static detectLineErrors(line: any): LineErrorFlag[] {
    const errors: LineErrorFlag[] = []
    
    if (line.margin_pct <= 0) {
      errors.push({
        type: line.margin_pct < 0 ? 'negative_margin' : 'zero_margin',
        severity: 'critical',
        message: `${line.margin_pct < 0 ? 'Negative' : 'Zero'} margin detected (${line.margin_pct.toFixed(1)}%)`
      })
    }
    
    if (line.unit_sell <= 0 || line.unit_cost <= 0) {
      errors.push({
        type: 'unusual_pricing',
        severity: 'high',
        message: 'Invalid pricing detected - check unit cost and sell prices'
      })
    }
    
    if (line.margin_pct > 80) {
      errors.push({
        type: 'unusual_pricing',
        severity: 'medium',
        message: `Unusually high margin (${line.margin_pct.toFixed(1)}%) - verify pricing`
      })
    }
    
    return errors
  }
  
  static async analyzeVendor(vendorNo: string, customerNo: string): Promise<VendorAnalysis> {
    try {
      console.log(`🤖 Analyzing vendor ${vendorNo} with ML-powered insights`)
      
      // Get vendor historical data (now ML-powered)
      const vendorResponse = await fetch(`/api/margin-analysis-unified/vendor/${vendorNo}/history`)
      const vendorData = vendorResponse.ok ? await vendorResponse.json() : null
      
      // Get customer-specific vendor history (now ML-enhanced)
      const customerVendorResponse = await fetch(
        `/api/margin-analysis-unified/vendor/${vendorNo}/customer/${customerNo}/history`
      )
      const customerVendorData = customerVendorResponse.ok ? await customerVendorResponse.json() : null
      
      // Enhanced analysis with ML insights
      const analysis: VendorAnalysis = {
        vendor_id: vendorNo,
        historical_margin: vendorData?.avg_margin || 25,
        twelve_month_margin: vendorData?.twelve_month_margin || 25,
        customer_specific_history: {
          avg_margin: customerVendorData?.avg_margin || 25,
          last_margin: customerVendorData?.last_margin || 25,
          order_count: customerVendorData?.order_count || 0,
          trend: customerVendorData?.trend || 'stable'
        },
        performance_vs_target: vendorData?.performance_score || 75,
        
        // Enhanced ML insights
        ml_insights: {
          risk_level: vendorData?.ml_risk_level || 'medium',
          risk_factors: vendorData?.ml_risk_factors || [],
          margin_variance: vendorData?.ml_margin_variance || 0,
          status: vendorData?.ml_status || 'unknown',
          days_since_activity: vendorData?.ml_days_since_activity || null,
          total_orders: vendorData?.ml_total_orders || 0,
          lifetime_spend: vendorData?.ml_lifetime_spend || 0,
          spend_12mo: vendorData?.ml_spend_12mo || 0,
          customer_diversity: customerVendorData?.ml_vendor_customer_diversity || 0,
          baseline_performance: customerVendorData?.ml_baseline_performance || 0
        },
        
        // Smart recommendations based on ML data
        recommendations: this.generateMLRecommendations(vendorData, customerVendorData)
      }
      
      console.log(`✅ ML vendor analysis complete for ${vendorNo}:`, {
        risk: analysis.ml_insights?.risk_level,
        performance: analysis.historical_margin,
        recommendations: analysis.recommendations?.length
      })
      
      return analysis
    } catch (error) {
      console.warn(`⚠️ ML vendor analysis failed for ${vendorNo}, using defaults:`, error)
      
      // Return default values if analysis fails
      return {
        vendor_id: vendorNo,
        historical_margin: 25,
        twelve_month_margin: 25,
        customer_specific_history: {
          avg_margin: 25,
          last_margin: 25,
          order_count: 0,
          trend: 'stable'
        },
        performance_vs_target: 75,
        ml_insights: {
          risk_level: 'medium',
          risk_factors: ['Analysis unavailable'],
          status: 'unknown'
        },
        recommendations: ['ML analysis unavailable - manual review recommended']
      }
    }
  }
  
  private static generateMLRecommendations(vendorData: any, customerVendorData: any): string[] {
    const recommendations: string[] = []
    
    // Risk-based recommendations
    if (vendorData?.ml_risk_level === 'critical') {
      recommendations.push('🚨 CRITICAL: Vendor requires immediate attention based on ML risk assessment')
    } else if (vendorData?.ml_risk_level === 'high') {
      recommendations.push('⚠️ HIGH RISK: Monitor vendor closely and consider alternatives')
    }
    
    // Performance-based recommendations
    if (vendorData?.avg_margin > 30) {
      recommendations.push('⭐ Excellent performer - consider increasing volume with this vendor')
    } else if (vendorData?.avg_margin < 10) {
      recommendations.push('📉 Low margins - renegotiate pricing or consider alternatives')
    }
    
    // Activity-based recommendations
    if (vendorData?.ml_days_since_activity > 180) {
      recommendations.push('💤 Vendor inactive for 6+ months - verify availability and current pricing')
    }
    
    // Variance-based recommendations
    if (vendorData?.ml_margin_variance < -10) {
      recommendations.push('📊 Large negative variance - actual margins worse than planned')
    } else if (vendorData?.ml_margin_variance > 10) {
      recommendations.push('📈 Positive variance - vendor delivering better margins than planned')
    }
    
    // Customer diversity insights
    if (customerVendorData?.ml_vendor_customer_diversity === 1) {
      recommendations.push('🎯 Single-customer vendor - strong relationship but concentration risk')
    } else if (customerVendorData?.ml_vendor_customer_diversity > 5) {
      recommendations.push('🌐 Well-diversified vendor - stable supplier across multiple customers')
    }
    
    // Trend-based recommendations
    if (customerVendorData?.trend === 'declining') {
      recommendations.push('📉 Customer-vendor relationship declining - investigate and address')
    } else if (customerVendorData?.trend === 'improving') {
      recommendations.push('📈 Improving relationship - good opportunity to expand')
    }
    
    return recommendations
  }
  
  static async analyzeService(line: any, quote: QuoteData): Promise<ServiceAnalysis | null> {
    // Check if this is an internal service line
    const serviceType = this.detectServiceType(line.vendor_name, line.cat_no, line.product_description)
    
    if (!serviceType) {
      return null
    }
    
    try {
      const serviceResponse = await fetch(
        `/api/margin-analysis-unified/service/${serviceType}/customer/${quote.customer_no}/history`
      )
      
      const serviceData = serviceResponse.ok ? await serviceResponse.json() : null
      
      return {
        service_type: serviceType,
        historical_margin: serviceData?.historical_margin || 35,
        twelve_month_margin: serviceData?.twelve_month_margin || 35,
        customer_specific_margin: serviceData?.customer_margin || 35,
        pricing_optimization: serviceData?.optimization_tips || []
      }
    } catch (error) {
      return {
        service_type: serviceType,
        historical_margin: 35,
        twelve_month_margin: 35,
        customer_specific_margin: 35,
        pricing_optimization: ['Review service pricing against market rates']
      }
    }
  }
  
  static detectServiceType(
    vendorName: string, 
    catNo: string, 
    description: string
  ): 'design_fees' | 'project_management' | 'foreman_services' | null {
    
    const vendor = (vendorName || '').toLowerCase()
    const cat = (catNo || '').toLowerCase()
    const desc = (description || '').toLowerCase()
    
    // Design Fees
    if (vendor.includes('tangram') && (cat.includes('d') || desc.includes('design'))) {
      return 'design_fees'
    }
    
    // Project Management  
    if (vendor.includes('tangram') && (cat.includes('pm') || desc.includes('project management'))) {
      return 'project_management'
    }
    
    // Foreman Services
    if (vendor.includes('tangram') && (cat.includes('f') || desc.includes('foreman') || desc.includes('installation'))) {
      return 'foreman_services'
    }
    
    return null
  }
  
  static generateLineRecommendations(
    line: any,
    vendorAnalysis: VendorAnalysis,
    cdaAnalysis: any,
    serviceAnalysis: ServiceAnalysis | null
  ): string[] {
    const recommendations: string[] = []
    
    // Vendor performance recommendations
    if (line.margin_pct < vendorAnalysis.historical_margin) {
      recommendations.push(
        `Below vendor average (${vendorAnalysis.historical_margin.toFixed(1)}%) - consider price adjustment`
      )
    }
    
    if (vendorAnalysis.customer_specific_history.order_count > 0 && 
        line.margin_pct < vendorAnalysis.customer_specific_history.avg_margin) {
      recommendations.push(
        `Below customer-vendor average (${vendorAnalysis.customer_specific_history.avg_margin.toFixed(1)}%)`
      )
    }
    
    // CDA recommendations
    if (cdaAnalysis?.optimization_opportunities) {
      recommendations.push(...cdaAnalysis.optimization_opportunities)
    }
    
    // Service recommendations
    if (serviceAnalysis?.pricing_optimization) {
      recommendations.push(...serviceAnalysis.pricing_optimization)
    }
    
    return recommendations
  }
  
  static generateOptimizationSuggestions(
    quote: QuoteData,
    overallMargin: OverallMarginAnalysis,
    orderLines: OrderLineAnalysis[]
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []
    
    // Overall pricing suggestions
    if (quote.margin_pct < overallMargin.target_margin) {
      suggestions.push({
        type: 'pricing',
        impact: 'high',
        description: 'Increase overall pricing to meet target margin',
        potential_improvement: overallMargin.target_margin - quote.margin_pct,
        confidence: 85
      })
    }
    
    // Vendor optimization
    const underperformingVendors = orderLines.filter(
      line => line.margin_pct < line.vendor_analysis.historical_margin
    )
    
    if (underperformingVendors.length > 0) {
      suggestions.push({
        type: 'vendor',
        impact: 'medium',
        description: `${underperformingVendors.length} vendor lines below historical performance`,
        potential_improvement: 2.5,
        confidence: 70
      })
    }
    
    // Service optimization
    const serviceLines = orderLines.filter(line => line.service_analysis !== null)
    if (serviceLines.length > 0) {
      suggestions.push({
        type: 'service',
        impact: 'medium',
        description: 'Optimize internal service pricing',
        potential_improvement: 1.8,
        confidence: 75
      })
    }
    
    return suggestions
  }
  
  static assessRisk(
    quote: QuoteData,
    overallMargin: OverallMarginAnalysis,
    orderLines: OrderLineAnalysis[]
  ): RiskAssessment {
    const riskFactors: string[] = []
    
    if (quote.margin_pct < overallMargin.target_margin * 0.8) {
      riskFactors.push('Significantly below target margin')
    }
    
    if (orderLines.some(line => line.error_flags.length > 0)) {
      riskFactors.push('Line-level pricing errors detected')
    }
    
    if (overallMargin.customer_historical.trend === 'declining') {
      riskFactors.push('Customer margin trend declining')
    }
    
    const criticalIssues = orderLines.filter(
      line => line.error_flags.some(flag => flag.severity === 'critical')
    ).length
    
    let overall_risk: 'low' | 'medium' | 'high' | 'critical' = 'low'
    
    if (criticalIssues > 0) {
      overall_risk = 'critical'
    } else if (quote.margin_pct < overallMargin.target_margin * 0.8) {
      overall_risk = 'high'
    } else if (riskFactors.length > 1) {
      overall_risk = 'medium'
    }
    
    return {
      overall_risk,
      risk_factors: riskFactors,
      mitigation_strategies: [
        'Review pricing strategy',
        'Negotiate better vendor terms',
        'Consider alternative sourcing'
      ]
    }
  }
} 