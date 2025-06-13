/**
 * Tangram Services Analysis
 * Handles internal Tangram company services with proper customer/company matching
 */

export interface CustomerCompanyMatch {
  customer_no: string
  company_no: string
  customer_name: string
  company_name: string
  is_valid_match: boolean
  match_confidence: number
  discrepancies?: string[]
}

export interface TangramServiceAnalysis {
  service_type: 'design_fees' | 'project_management' | 'foreman_services'
  total_revenue: number
  total_cost: number
  margin_amount: number
  margin_percentage: number
  customer_breakdown: Array<{
    customer_no: string
    customer_name: string
    company_no: string
    revenue: number
    margin_pct: number
    risk_level: 'low' | 'medium' | 'high'
  }>
  trends: {
    period_comparison: number
    growth_rate: number
    seasonality_factor: number
  }
  optimization_opportunities: Array<{
    opportunity: string
    potential_impact: number
    implementation_effort: 'low' | 'medium' | 'high'
  }>
}

export class TangramServices {
  
  // ===== CUSTOMER/COMPANY MATCHING =====
  
  async validateCustomerCompanyMatch(
    customer_no: string, 
    company_no: string
  ): Promise<CustomerCompanyMatch> {
    // This would query the actual database to validate the match
    // For now, implementing the core logic structure
    
    try {
      // Query customer data
      const customerData = await this.getCustomerData(customer_no)
      const companyData = await this.getCompanyData(company_no)
      
      if (!customerData || !companyData) {
        return {
          customer_no,
          company_no,
          customer_name: customerData?.customer_name || 'Unknown',
          company_name: companyData?.company_name || 'Unknown',
          is_valid_match: false,
          match_confidence: 0,
          discrepancies: ['Customer or company not found']
        }
      }

      // Validate the relationship
      const isValidMatch = this.validateCustomerCompanyRelationship(customerData, companyData)
      const matchConfidence = this.calculateMatchConfidence(customerData, companyData)
      const discrepancies = this.identifyDiscrepancies(customerData, companyData)

      return {
        customer_no,
        company_no,
        customer_name: customerData.customer_name,
        company_name: companyData.company_name,
        is_valid_match: isValidMatch,
        match_confidence: matchConfidence,
        discrepancies: discrepancies.length > 0 ? discrepancies : undefined
      }
      
    } catch (error) {
      console.error('Error validating customer/company match:', error)
      return {
        customer_no,
        company_no,
        customer_name: 'Error',
        company_name: 'Error',
        is_valid_match: false,
        match_confidence: 0,
        discrepancies: ['Database error during validation']
      }
    }
  }

  async validateBulkCustomerCompanyMatches(
    pairs: Array<{ customer_no: string; company_no: string }>
  ): Promise<CustomerCompanyMatch[]> {
    const results = await Promise.all(
      pairs.map(pair => this.validateCustomerCompanyMatch(pair.customer_no, pair.company_no))
    )
    return results
  }

  // ===== TANGRAM SERVICE ANALYSIS =====

  async analyzeTangramDesignFees(params: {
    time_period?: 'current_month' | 'current_quarter' | 'current_year'
    validate_customer_matches?: boolean
    include_forecasting?: boolean
  }): Promise<TangramServiceAnalysis> {
    
    // Get design fee data with customer/company validation
    const designFeeOrders = await this.getDesignFeeOrders(params)
    
    // Validate customer/company matches if requested
    if (params.validate_customer_matches) {
      const validationResults = await this.validateOrderCustomerMatches(designFeeOrders)
      // Filter out or flag invalid matches
      designFeeOrders.forEach((order, index) => {
        const validation = validationResults[index]
        if (!validation.is_valid_match) {
          order.data_quality_flags = ['invalid_customer_company_match']
          order.confidence_score = validation.match_confidence
        }
      })
    }

    return this.processServiceAnalysis(designFeeOrders, 'design_fees')
  }

  async analyzeTangramProjectManagement(params: {
    time_period?: 'current_month' | 'current_quarter' | 'current_year'
    validate_customer_matches?: boolean
    include_forecasting?: boolean
  }): Promise<TangramServiceAnalysis> {
    
    const projectMgmtOrders = await this.getProjectManagementOrders(params)
    
    if (params.validate_customer_matches) {
      const validationResults = await this.validateOrderCustomerMatches(projectMgmtOrders)
      projectMgmtOrders.forEach((order, index) => {
        const validation = validationResults[index]
        if (!validation.is_valid_match) {
          order.data_quality_flags = ['invalid_customer_company_match']
          order.confidence_score = validation.match_confidence
        }
      })
    }

    return this.processServiceAnalysis(projectMgmtOrders, 'project_management')
  }

  async analyzeTangramForemanServices(params: {
    time_period?: 'current_month' | 'current_quarter' | 'current_year'
    validate_customer_matches?: boolean
    include_forecasting?: boolean
  }): Promise<TangramServiceAnalysis> {
    
    const foremanOrders = await this.getForemanServiceOrders(params)
    
    if (params.validate_customer_matches) {
      const validationResults = await this.validateOrderCustomerMatches(foremanOrders)
      foremanOrders.forEach((order, index) => {
        const validation = validationResults[index]
        if (!validation.is_valid_match) {
          order.data_quality_flags = ['invalid_customer_company_match']
          order.confidence_score = validation.match_confidence
        }
      })
    }

    return this.processServiceAnalysis(foremanOrders, 'foreman_services')
  }

  // ===== COMPREHENSIVE TANGRAM ANALYSIS =====

  async getComprehensiveTangramAnalysis(params: {
    time_period?: 'current_month' | 'current_quarter' | 'current_year'
    validate_customer_matches?: boolean
    include_forecasting?: boolean
  }): Promise<{
    design_fees: TangramServiceAnalysis
    project_management: TangramServiceAnalysis
    foreman_services: TangramServiceAnalysis
    combined_metrics: {
      total_revenue: number
      total_margin: number
      avg_margin_pct: number
      customer_count: number
      data_quality_score: number
    }
    customer_match_report?: {
      total_validated: number
      valid_matches: number
      invalid_matches: number
      confidence_distribution: Record<string, number>
    }
  }> {
    
    const [designFees, projectMgmt, foremanServices] = await Promise.all([
      this.analyzeTangramDesignFees(params),
      this.analyzeTangramProjectManagement(params),
      this.analyzeTangramForemanServices(params)
    ])

    const combinedMetrics = this.calculateCombinedMetrics([designFees, projectMgmt, foremanServices])
    
    const result: any = {
      design_fees: designFees,
      project_management: projectMgmt,
      foreman_services: foremanServices,
      combined_metrics: combinedMetrics
    }

    if (params.validate_customer_matches) {
      result.customer_match_report = this.generateMatchReport([designFees, projectMgmt, foremanServices])
    }

    return result
  }

  // ===== PRIVATE HELPER METHODS =====

  private async getCustomerData(customer_no: string): Promise<any> {
    // Would query ods_hds_customer table
    // Ensuring customer_no and company_no relationship is valid
    return {
      customer_no,
      customer_name: 'Sample Customer',
      company_no: 'COMP001',
      // ... other customer fields
    }
  }

  private async getCompanyData(company_no: string): Promise<any> {
    // Would query company/organization table
    return {
      company_no,
      company_name: 'Sample Company',
      // ... other company fields
    }
  }

  private validateCustomerCompanyRelationship(customerData: any, companyData: any): boolean {
    // Core validation logic: customer_no and company_no must match in relationship
    // This would implement your specific business rules for customer/company relationships
    
    // Basic validation - customer should have a valid company_no that matches
    if (!customerData.company_no || !companyData.company_no) {
      return false
    }
    
    // Check if customer's company_no matches the provided company_no
    return customerData.company_no === companyData.company_no
  }

  private calculateMatchConfidence(customerData: any, companyData: any): number {
    let confidence = 0.5 // Base confidence
    
    // Increase confidence based on data quality and consistency
    if (customerData.company_no === companyData.company_no) {
      confidence += 0.3
    }
    
    if (customerData.customer_name && companyData.company_name) {
      confidence += 0.2
    }
    
    // Additional checks can be added here
    return Math.min(confidence, 1.0)
  }

  private identifyDiscrepancies(customerData: any, companyData: any): string[] {
    const discrepancies: string[] = []
    
    if (customerData.company_no !== companyData.company_no) {
      discrepancies.push(`Customer company_no (${customerData.company_no}) does not match provided company_no (${companyData.company_no})`)
    }
    
    // Add more discrepancy checks as needed
    return discrepancies
  }

  private async getDesignFeeOrders(params: any): Promise<any[]> {
    // Query orders with design fee line sales codes
    // line_sls_cd_list LIKE '%D%' OR = 'ND' OR LIKE '%AN%' (excluding DM, DM2, DM FR, DM B)
    return [] // Mock data
  }

  private async getProjectManagementOrders(params: any): Promise<any[]> {
    // Query orders with project management codes: P, P 2, P 4, P B, P FR, EP2, GP2, NP, NP2
    return [] // Mock data
  }

  private async getForemanServiceOrders(params: any): Promise<any[]> {
    // Query orders with foreman service codes: LIKE '%F%' AND NOT LIKE '%FR%'
    return [] // Mock data
  }

  private async validateOrderCustomerMatches(orders: any[]): Promise<CustomerCompanyMatch[]> {
    const pairs = orders.map(order => ({
      customer_no: order.customer_no,
      company_no: order.company_no
    }))
    return this.validateBulkCustomerCompanyMatches(pairs)
  }

  private processServiceAnalysis(orders: any[], serviceType: string): TangramServiceAnalysis {
    // Process orders to generate service analysis
    return {
      service_type: serviceType as any,
      total_revenue: 0,
      total_cost: 0,
      margin_amount: 0,
      margin_percentage: 0,
      customer_breakdown: [],
      trends: {
        period_comparison: 0,
        growth_rate: 0,
        seasonality_factor: 1.0
      },
      optimization_opportunities: []
    }
  }

  private calculateCombinedMetrics(analyses: TangramServiceAnalysis[]): any {
    const totalRevenue = analyses.reduce((sum, analysis) => sum + analysis.total_revenue, 0)
    const totalMargin = analyses.reduce((sum, analysis) => sum + analysis.margin_amount, 0)
    
    return {
      total_revenue: totalRevenue,
      total_margin: totalMargin,
      avg_margin_pct: totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0,
      customer_count: 0, // Would be calculated from unique customers
      data_quality_score: 0.85 // Would be calculated based on validation results
    }
  }

  private generateMatchReport(analyses: TangramServiceAnalysis[]): any {
    return {
      total_validated: 0,
      valid_matches: 0,
      invalid_matches: 0,
      confidence_distribution: {}
    }
  }
}

// Singleton instance
export const tangramServices = new TangramServices()

export default TangramServices 