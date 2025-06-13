export interface QuoteData {
  quote_no: string
  customer_no: string
  customer_name: string
  salesperson_id: string
  salesperson_name: string
  date_entered: string
  total_value: number
  total_cost: number
  margin: number
  margin_pct: number
  line_count: number
  status: string
}

export interface OverallMarginAnalysis {
  current_margin: number
  target_margin: number
  customer_historical: {
    overall_avg_margin: number
    twelve_month_margin: number
    trend: 'improving' | 'declining' | 'stable'
    order_count: number
    total_volume: number
  }
  performance_score: number
  recommendations: string[]
}

export interface OrderLineAnalysis {
  line_id: string
  vendor_no: string
  vendor_name: string
  product_description: string
  qty: number
  unit_cost: number
  unit_sell: number
  line_margin: number
  margin_pct: number
  error_flags: {
    type: 'negative_margin' | 'zero_margin' | 'missing_cost' | 'unusual_markup'
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
  }[]
  vendor_analysis: {
    historical_margin: number
    performance_rating: 'excellent' | 'good' | 'fair' | 'poor'
    recommendations: string[]
  }
  cda_analysis?: {
    contract_type: 'trueblue' | 'cooperative' | 'state_contract' | 'standard'
    compliance_status: 'compliant' | 'non_compliant' | 'review_required'
    expected_margin_range: [number, number]
  }
  service_analysis?: {
    service_type: 'design_fee' | 'project_management' | 'foreman_services' | 'delivery'
    internal_cost: number
    markup_applied: number
    recommended_markup: number
  }
  recommendations: string[]
}

export interface AnalysisFlag {
  id: string
  type: 'below_target' | 'error_detected' | 'approval_required' | 'optimization_opportunity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  line_id?: string
  message: string
  recommendation: string
  auto_resolvable: boolean
}

export interface AIInsights {
  overall_insights: string[]
  line_specific_insights: {
    line_id: string
    insights: string[]
  }[]
  optimization_suggestions: string[]
  risk_assessment: {
    risk_level: 'low' | 'medium' | 'high' | 'critical'
    risk_factors: string[]
    mitigation_strategies: string[]
  }
}

export interface AnalysisData {
  quote: QuoteData
  overallMargin: OverallMarginAnalysis
  orderLines: OrderLineAnalysis[]
  flags: AnalysisFlag[]
  aiInsights: AIInsights
  approvalRequired: boolean
}

export interface AnalysisProgress {
  step?: number
  total_steps?: number
  stage?: 'searching' | 'analyzing_overall' | 'analyzing_lines' | 'generating_insights' | 'complete'
  progress?: number
  progress_pct?: number
  current_action?: string
  message?: string
}

// New unified types
export interface SearchResult {
  id: string
  order_no: string
  type: 'quote' | 'order'
  display_name: string
  customer_no: string
  customer_name?: string
  date_entered: string
  sell_value: number
  margin_pct: number
  status: string
  relevance_score: number
}

export interface ComprehensiveAnalysis {
  order_info: {
    order_no: string
    order_type: string
    date_entered: string
    status: string
    project_id?: string
  }
  
  financial_summary: {
    total_sell: number
    total_cost: number
    total_margin: number
    margin_pct: number
    line_count: number
  }
  
  customer_analysis: {
    customer_info: {
      customer_no: string
      customer_name: string
      customer_type?: string
      historical_metrics: {
        total_orders: number
        total_value: number
        avg_margin_pct: number
        last_12_months: {
          orders: number
          value: number
          margin_pct: number
        }
      }
    }
    performance_insights: {
      vs_historical: number
      trend_direction: 'improving' | 'declining' | 'stable'
    }
    detailed_history?: any
  }
  
  vendor_analysis: Array<{
    vendor_no: string
    vendor_name: string
    order_value: number
    line_count: number
    historical_margin_pct: number
    performance_rating: 'excellent' | 'good' | 'fair' | 'poor'
    recommendations: string[]
    detailed_metrics?: any
    insights?: string[]
  }>
  
  line_analysis: {
    total_lines: number
    error_lines: any[]
    negative_margin_lines: any[]
    vendor_breakdown: Array<{
      vendor_no: string
      vendor_name: string
      line_count: number
      total_value: number
      avg_margin_pct: number
    }>
  }
  
  ai_insights: {
    overall_assessment: 'excellent' | 'good' | 'needs_improvement' | 'critical'
    key_findings: string[]
    recommendations: string[]
    risk_factors: string[]
    opportunities: string[]
  }
  
  approval_info: {
    required: boolean
    level: 'NONE' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    urgency: 'standard' | 'urgent' | 'immediate'
  }
  
  salesperson_info: {
    salesperson_id: string
    name: string
    team_id?: string
  }
  
  cda_analysis?: {
    contract_analysis: {
      special_pricing_detected: boolean
      contract_types: string[]
      margin_expectations: {
        minimum: number
        target: number
        excellent: number
      }
      pricing_flexibility: 'low' | 'medium' | 'high'
    }
    compliance_assessment: {
      overall_status: 'compliant' | 'borderline' | 'non_compliant' | 'not_analyzed'
      risk_factors: string[]
      opportunities: string[]
    }
    recommendations: string[]
    action_items: string[]
  }
  
  analysis_metadata: {
    analyzed_at: string
    analysis_version: string
    data_sources: string[]
  }
} 