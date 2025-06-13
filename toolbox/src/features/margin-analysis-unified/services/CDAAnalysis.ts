import { CDAAnalysis as CDAAnalysisType, QuoteData } from '../types'

/**
 * CDA ANALYSIS SERVICE
 * 
 * Analyzes Customer Discount Agreements (CDAs) for each order line,
 * including TrueBlue standard, cooperative, and state contracts.
 */
export class CDAAnalysis {
  
  static async analyzeLine(line: any, quote: QuoteData): Promise<CDAAnalysisType | null> {
    try {
      // Check if vendor is eligible for CDA analysis (primarily Steelcase)
      if (!this.isEligibleForCDA(line.vendor_name)) {
        return null
      }
      
      // Get applicable CDAs for this customer/vendor combination
      const applicableCDAs = await this.getApplicableCDAs(quote.customer_no, line.vendor_no)
      
      if (applicableCDAs.length === 0) {
        return null
      }
      
      const primaryCDA = applicableCDAs[0]
      const cdaType = this.classifyCDA(primaryCDA)
      
      // Get contract performance data
      const contractPerformance = await this.getContractPerformance(primaryCDA, quote.customer_no)
      
      // Generate optimization opportunities
      const optimizationOpportunities = this.generateOptimizations(
        line,
        primaryCDA,
        cdaType,
        contractPerformance
      )
      
      return {
        applicable_cdas: applicableCDAs,
        primary_cda: primaryCDA,
        cda_type: cdaType,
        contract_margin: contractPerformance.avg_margin,
        vs_standard_performance: this.compareToStandard(contractPerformance.avg_margin),
        optimization_opportunities: optimizationOpportunities
      }
      
    } catch (error) {
      console.warn('CDA analysis failed for line:', line, error)
      return null
    }
  }
  
  private static isEligibleForCDA(vendorName: string): boolean {
    const vendor = (vendorName || '').toLowerCase()
    
    // Primary CDA vendors (mainly Steelcase and partners)
    const cdaVendors = [
      'steelcase',
      'coalesse',
      'designtex',
      'turnstone',
      'smith system',
      'universal'
    ]
    
    return cdaVendors.some(cdaVendor => vendor.includes(cdaVendor))
  }
  
  private static async getApplicableCDAs(customerNo: string, vendorNo: string): Promise<string[]> {
    try {
      const response = await fetch(
        `/api/margin-analysis-unified/customer/${customerNo}/vendor/${vendorNo}/cdas`
      )
      
      if (!response.ok) {
        return []
      }
      
      const data = await response.json()
      return data.applicable_cdas || []
      
    } catch (error) {
      return []
    }
  }
  
  private static classifyCDA(cdaNumber: string): 'trueblue_standard' | 'cooperative' | 'state_contract' | 'customer_specific' {
    // TrueBlue Standard CDAs
    if (cdaNumber === '03Z00444' || cdaNumber === '03Z00445') {
      return 'trueblue_standard'
    }
    
    // Cooperative CDAs (usually start with specific patterns)
    if (this.isCooperativeCDA(cdaNumber)) {
      return 'cooperative'
    }
    
    // State contracts (identified by patterns)
    if (this.isStateCDA(cdaNumber)) {
      return 'state_contract'
    }
    
    return 'customer_specific'
  }
  
  private static isCooperativeCDA(cdaNumber: string): boolean {
    // Common cooperative CDA patterns
    const cooperativePatterns = [
      /^03Z004[0-3][0-9]/,  // Many cooperatives in this range
      /^03Z005[0-9][0-9]/,  // Additional cooperative range
    ]
    
    return cooperativePatterns.some(pattern => pattern.test(cdaNumber))
  }
  
  private static isStateCDA(cdaNumber: string): boolean {
    // State contract patterns (examples)
    const statePatterns = [
      /^03Z006[0-9][0-9]/,  // State contract range
      /^03Z007[0-9][0-9]/,  // Additional state range
    ]
    
    return statePatterns.some(pattern => pattern.test(cdaNumber))
  }
  
  private static async getContractPerformance(cdaNumber: string, customerNo: string): Promise<{
    avg_margin: number
    order_count: number
    total_volume: number
    trend: 'improving' | 'declining' | 'stable'
  }> {
    try {
      const response = await fetch(
        `/api/margin-analysis-unified/cda/${cdaNumber}/customer/${customerNo}/performance`
      )
      
      if (!response.ok) {
        return {
          avg_margin: 25,
          order_count: 0,
          total_volume: 0,
          trend: 'stable'
        }
      }
      
      return await response.json()
      
    } catch (error) {
      return {
        avg_margin: 25,
        order_count: 0,
        total_volume: 0,
        trend: 'stable'
      }
    }
  }
  
  private static compareToStandard(contractMargin: number): number {
    // Compare against TrueBlue standard performance (typically around 22-25%)
    const standardMargin = 23.5
    return ((contractMargin - standardMargin) / standardMargin) * 100
  }
  
  private static generateOptimizations(
    line: any,
    cdaNumber: string,
    cdaType: 'trueblue_standard' | 'cooperative' | 'state_contract' | 'customer_specific',
    performance: any
  ): string[] {
    const optimizations: string[] = []
    
    // TrueBlue standard optimizations
    if (cdaType === 'trueblue_standard') {
      if (line.margin_pct < 20) {
        optimizations.push('Consider upgrading customer to higher volume tier for better discounts')
      }
      
      if (performance.trend === 'declining') {
        optimizations.push('TrueBlue performance declining - review pricing strategy')
      }
    }
    
    // Cooperative optimizations
    if (cdaType === 'cooperative') {
      optimizations.push('Leverage cooperative volume for better vendor terms')
      
      if (line.margin_pct < performance.avg_margin) {
        optimizations.push(`Below cooperative average (${performance.avg_margin.toFixed(1)}%)`)
      }
    }
    
    // State contract optimizations
    if (cdaType === 'state_contract') {
      optimizations.push('State contract - ensure compliance with margin requirements')
      
      if (line.margin_pct > 30) {
        optimizations.push('High margin on state contract - verify pricing alignment')
      }
    }
    
    // General CDA optimizations
    if (performance.order_count > 10 && line.margin_pct < performance.avg_margin - 2) {
      optimizations.push('Significantly below contract historical performance')
    }
    
    return optimizations
  }
  
  // Utility methods for CDA management
  static async getAllTrueBlueCDAs(): Promise<string[]> {
    return ['03Z00444', '03Z00445']  // US and CAD TrueBlue
  }
  
  static async getCooperativeCDAs(): Promise<Array<{
    cda_number: string
    cda_name: string
    market_reach: string
  }>> {
    try {
      const response = await fetch('/api/margin-analysis-unified/cdas/cooperative')
      return response.ok ? await response.json() : []
    } catch {
      return []
    }
  }
  
  static async getStateCDAs(): Promise<Array<{
    cda_number: string
    state: string
    contract_name: string
  }>> {
    try {
      const response = await fetch('/api/margin-analysis-unified/cdas/state-contracts')
      return response.ok ? await response.json() : []
    } catch {
      return []
    }
  }
  
  static async analyzeCDAPerformance(cdaNumber: string): Promise<{
    performance_metrics: any
    optimization_opportunities: string[]
    competitive_position: string
  }> {
    try {
      const response = await fetch(`/api/margin-analysis-unified/cda/${cdaNumber}/analysis`)
      return response.ok ? await response.json() : {
        performance_metrics: {},
        optimization_opportunities: [],
        competitive_position: 'Unknown'
      }
    } catch {
      return {
        performance_metrics: {},
        optimization_opportunities: [],
        competitive_position: 'Unknown'
      }
    }
  }
} 