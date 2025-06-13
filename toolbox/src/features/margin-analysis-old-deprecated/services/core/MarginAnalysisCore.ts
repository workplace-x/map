/**
 * Core Margin Analysis Logic
 * Contains fundamental business calculations and validation
 */

export interface MarginCalculation {
  revenue: number
  cost: number
  margin: number
  margin_percentage: number
  margin_health: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical'
}

export interface ServiceClassification {
  service_type: 'design_fees' | 'project_management' | 'foreman_services' | 'product_sales'
  is_tangram_internal: boolean
  line_sales_code: string
  confidence: number
}

export interface VendorClassification {
  vendor_type: 'steelcase_primary' | 'tangram_internal' | 'standard_vendor'
  strategic_importance: 'critical' | 'important' | 'standard'
  relationship_strength: number
}

export class MarginAnalysisCore {
  
  // ===== MARGIN CALCULATIONS =====
  
  static calculateMargin(revenue: number, cost: number): MarginCalculation {
    const margin = revenue - cost
    const margin_percentage = cost > 0 ? (margin / cost) * 100 : 0
    
    return {
      revenue,
      cost,
      margin,
      margin_percentage,
      margin_health: this.getMarginHealth(margin_percentage)
    }
  }

  static getMarginHealth(marginPercent: number): 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical' {
    if (marginPercent >= 30) return 'excellent'
    if (marginPercent >= 20) return 'good'
    if (marginPercent >= 10) return 'acceptable'
    if (marginPercent >= 5) return 'poor'
    return 'critical'
  }

  // ===== SERVICE CLASSIFICATION =====
  
  static classifyService(lineSalesCode: string, vendorName?: string): ServiceClassification {
    const cleanCode = lineSalesCode?.toUpperCase().trim() || ''
    
    // Design fees classification (from user's SQL)
    if (this.isDesignFee(cleanCode)) {
      return {
        service_type: 'design_fees',
        is_tangram_internal: this.isTangramVendor(vendorName),
        line_sales_code: cleanCode,
        confidence: 0.95
      }
    }
    
    // Project management classification
    if (this.isProjectManagement(cleanCode)) {
      return {
        service_type: 'project_management',
        is_tangram_internal: this.isTangramVendor(vendorName),
        line_sales_code: cleanCode,
        confidence: 0.95
      }
    }
    
    // Foreman services classification
    if (this.isForemanService(cleanCode)) {
      return {
        service_type: 'foreman_services',
        is_tangram_internal: this.isTangramVendor(vendorName),
        line_sales_code: cleanCode,
        confidence: 0.95
      }
    }
    
    // Default to product sales
    return {
      service_type: 'product_sales',
      is_tangram_internal: this.isTangramVendor(vendorName),
      line_sales_code: cleanCode,
      confidence: 0.8
    }
  }

  private static isDesignFee(code: string): boolean {
    // Based on user's SQL: D, ND, AN but NOT DM, DM2, DM FR, DM B
    const excludedCodes = ['DM', 'DM2', 'DM FR', 'DM B']
    
    if (excludedCodes.includes(code)) return false
    
    return code.includes('D') || code === 'ND' || code.includes('AN')
  }

  private static isProjectManagement(code: string): boolean {
    // Based on user's SQL: P, P 2, P 4, P B, P FR, EP2, GP2, NP, NP2
    const pmCodes = ['P', 'P 2', 'P 4', 'P B', 'P FR', 'EP2', 'GP2', 'NP', 'NP2']
    return pmCodes.includes(code)
  }

  private static isForemanService(code: string): boolean {
    // Based on user's SQL: Contains F but NOT FR
    return code.includes('F') && !code.includes('FR')
  }

  private static isTangramVendor(vendorName?: string): boolean {
    if (!vendorName) return false
    const vendor = vendorName.toLowerCase()
    return vendor.includes('tangram') || vendor.includes('map')
  }

  // ===== VENDOR CLASSIFICATION =====
  
  static classifyVendor(vendorName: string): VendorClassification {
    const vendor = vendorName.toLowerCase().trim()
    
    // Steelcase primary partner
    if (vendor.includes('steelcase')) {
      return {
        vendor_type: 'steelcase_primary',
        strategic_importance: 'critical',
        relationship_strength: 0.95
      }
    }
    
    // Tangram internal
    if (vendor.includes('tangram') || vendor.includes('map')) {
      return {
        vendor_type: 'tangram_internal',
        strategic_importance: 'critical',
        relationship_strength: 1.0
      }
    }
    
    // Standard vendor
    return {
      vendor_type: 'standard_vendor',
      strategic_importance: 'standard',
      relationship_strength: 0.5
    }
  }

  // ===== CDA CLASSIFICATION =====
  
  static classifyCDA(cdaNumber: string): {
    type: 'trueblue_standard' | 'cooperative' | 'state_contract' | 'customer_specific' | 'unknown'
    strategic_value: 'critical' | 'important' | 'standard' | 'investigate'
    region?: string
  } {
    const cda = cdaNumber.trim().toUpperCase()
    
    // TrueBlue Standard
    if (['03Z00444', '03Z00445'].includes(cda)) {
      return {
        type: 'trueblue_standard',
        strategic_value: 'critical'
      }
    }
    
    // Major cooperatives (high strategic value)
    const majorCooperatives = [
      '18Z06248', // Buyboard
      '21Z00987', '22Z01109', // E&I
      '19Z05659', // Omnia Partners
      '20Z05310', '20Z05312', // Premier
      '19Z01270' // Vizient
    ]
    
    if (majorCooperatives.includes(cda)) {
      return {
        type: 'cooperative',
        strategic_value: 'important'
      }
    }
    
    // State contracts
    if (this.isStateCDA(cda)) {
      return {
        type: 'state_contract',
        strategic_value: 'standard',
        region: this.getStateFromCDA(cda)
      }
    }
    
    // If not in known lists, likely customer-specific
    if (cda.match(/^\d{2}Z\d{5}$/)) {
      return {
        type: 'customer_specific',
        strategic_value: 'investigate'
      }
    }
    
    return {
      type: 'unknown',
      strategic_value: 'investigate'
    }
  }

  private static isStateCDA(cda: string): boolean {
    const stateCDAs = [
      '21Z05832', '18Z03782', '18Z03725', '21Z02096', '22Z02699',
      '15Z03242', '15Z05995', '16Z07564', '15Z04260', '16Z07140',
      // ... many more state CDAs from the reference card
    ]
    return stateCDAs.includes(cda)
  }

  private static getStateFromCDA(cda: string): string {
    const stateMap: Record<string, string> = {
      '21Z05832': 'Alabama',
      '18Z03782': 'Alaska',
      '18Z03725': 'Alaska',
      '21Z02096': 'Arkansas',
      '22Z02699': 'Colorado',
      // ... complete mapping would go here
    }
    return stateMap[cda] || 'Unknown'
  }

  // ===== BUSINESS RULES VALIDATION =====
  
  static validateMarginThresholds(margin: number, context: {
    customer_type?: string
    vendor_type?: string
    service_type?: string
    order_value?: number
  }): {
    meets_threshold: boolean
    required_margin: number
    risk_level: 'low' | 'medium' | 'high' | 'critical'
    approval_required: boolean
    approval_level?: 'manager' | 'director' | 'vp'
  } {
    let required_margin = 15 // Default 15%
    
    // Adjust based on service type
    if (context.service_type === 'design_fees') {
      required_margin = 25 // Higher margin for design services
    } else if (context.service_type === 'project_management') {
      required_margin = 20
    } else if (context.service_type === 'foreman_services') {
      required_margin = 18
    }
    
    // Adjust based on order value
    if (context.order_value && context.order_value > 1000000) {
      required_margin -= 2 // Slightly lower for large orders
    }
    
    const meets_threshold = margin >= required_margin
    const variance = margin - required_margin
    
    let risk_level: 'low' | 'medium' | 'high' | 'critical'
    let approval_required = false
    let approval_level: 'manager' | 'director' | 'vp' | undefined
    
    if (variance >= 5) {
      risk_level = 'low'
    } else if (variance >= 0) {
      risk_level = 'medium'
    } else if (variance >= -5) {
      risk_level = 'high'
      approval_required = true
      approval_level = 'manager'
    } else {
      risk_level = 'critical'
      approval_required = true
      approval_level = variance < -10 ? 'vp' : 'director'
    }
    
    return {
      meets_threshold,
      required_margin,
      risk_level,
      approval_required,
      approval_level
    }
  }

  // ===== UTILITY FUNCTIONS =====
  
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  static formatPercentage(value: number, decimals = 1): string {
    return `${value.toFixed(decimals)}%`
  }

  static calculateTrend(current: number, previous: number): {
    direction: 'up' | 'down' | 'stable'
    change: number
    change_percent: number
  } {
    const change = current - previous
    const change_percent = previous !== 0 ? (change / previous) * 100 : 0
    
    let direction: 'up' | 'down' | 'stable'
    if (Math.abs(change_percent) < 0.1) {
      direction = 'stable'
    } else {
      direction = change > 0 ? 'up' : 'down'
    }
    
    return {
      direction,
      change,
      change_percent
    }
  }

  // ===== CONFIGURATION =====
  
  static getBusinessConfig() {
    return {
      margin_thresholds: {
        excellent: 30,
        good: 20,
        acceptable: 10,
        poor: 5,
        critical: 0
      },
      service_margins: {
        design_fees: 25,
        project_management: 20,
        foreman_services: 18,
        product_sales: 15
      },
      approval_thresholds: {
        manager: -5,
        director: -10,
        vp: -15
      },
      strategic_vendors: ['steelcase', 'tangram'],
      critical_cdas: ['03Z00444', '03Z00445']
    }
  }
}

export default MarginAnalysisCore 