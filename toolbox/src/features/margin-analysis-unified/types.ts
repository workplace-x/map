// Core analysis data structures
export interface AnalysisData {
  quote: QuoteData
  overallMargin: OverallMarginAnalysis
  orderLines: OrderLineAnalysis[]
  flags: AnalysisFlag[]
  aiInsights: AIInsights
  approvalRequired: boolean
}

export interface QuoteData {
  quote_no: string
  customer_no: string
  customer_name: string
  salesperson_id: string
  salesperson_name: string
  total_sell: number
  total_cost: number
  total_margin: number
  margin_pct: number
  date_created: string
}

// Overall Margin Analysis
export interface OverallMarginAnalysis {
  current_margin: number
  target_margin: number // From salesperson goals
  customer_historical: CustomerMarginHistory
  performance_score: number
  recommendations: string[]
}

export interface CustomerMarginHistory {
  overall_avg_margin: number
  twelve_month_margin: number
  trend: 'improving' | 'declining' | 'stable'
  order_count: number
  total_volume: number
}

// Order Line Analysis
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
  
  // Analysis results
  error_flags: LineErrorFlag[]
  vendor_analysis: VendorAnalysis
  cda_analysis: CDAAnalysis | null
  service_analysis: ServiceAnalysis | null
  recommendations: string[]
}

export interface LineErrorFlag {
  type: 'negative_margin' | 'zero_margin' | 'unusual_pricing'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
}

export interface VendorAnalysis {
  vendor_id: string
  historical_margin: number
  twelve_month_margin: number
  customer_specific_history: {
    avg_margin: number
    last_margin: number
    order_count: number
    trend: 'improving' | 'declining' | 'stable'
  }
  performance_vs_target: number
  
  // Enhanced ML insights from vendor intelligence system
  ml_insights?: {
    risk_level: 'low' | 'medium' | 'high' | 'critical'
    risk_factors: string[]
    margin_variance?: number
    status: string
    days_since_activity?: number | null
    total_orders?: number
    lifetime_spend?: number
    spend_12mo?: number
    customer_diversity?: number
    baseline_performance?: number
  }
  
  // AI-generated recommendations
  recommendations?: string[]
}

export interface CDAAnalysis {
  applicable_cdas: string[]
  primary_cda: string
  cda_type: 'trueblue_standard' | 'cooperative' | 'state_contract' | 'customer_specific'
  contract_margin: number
  vs_standard_performance: number
  optimization_opportunities: string[]
}

export interface ServiceAnalysis {
  service_type: 'design_fees' | 'project_management' | 'foreman_services'
  historical_margin: number
  twelve_month_margin: number
  customer_specific_margin: number
  pricing_optimization: string[]
}

// Flagging and Approval
export interface AnalysisFlag {
  id: string
  type: 'below_target' | 'below_historical' | 'error_detected' | 'cda_issue'
  severity: 'low' | 'medium' | 'high' | 'critical'
  line_id?: string // null for overall flags
  message: string
  recommendation: string
  auto_resolvable: boolean
}

export interface ApprovalRequest {
  id: string
  quote_no: string
  salesperson_id: string
  salesperson_name: string
  team_id: string
  flags: AnalysisFlag[]
  status: 'pending' | 'approved' | 'rejected'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  reviewed_by?: string
  reviewed_at?: string
  comments?: string
}

// AI Insights
export interface AIInsights {
  overall_insights: string[]
  line_specific_insights: Array<{
    line_id: string
    insights: string[]
  }>
  optimization_suggestions: OptimizationSuggestion[]
  risk_assessment: RiskAssessment
}

export interface OptimizationSuggestion {
  type: 'pricing' | 'vendor' | 'contract' | 'service'
  impact: 'low' | 'medium' | 'high'
  description: string
  potential_improvement: number
  confidence: number
}

export interface RiskAssessment {
  overall_risk: 'low' | 'medium' | 'high' | 'critical'
  risk_factors: string[]
  mitigation_strategies: string[]
}

// Team Leader Dashboard
export interface TeamApprovalData {
  pending_approvals: ApprovalRequest[]
  team_performance: {
    total_pending: number
    avg_approval_time: number
    approval_rate: number
  }
  priority_reviews: ApprovalRequest[]
}

// Search and Analysis
export interface SearchParams {
  quote_no: string
  deep_analysis?: boolean
  include_ai_insights?: boolean
}

export interface AnalysisProgress {
  stage: 'searching' | 'analyzing_overall' | 'analyzing_lines' | 'generating_insights' | 'complete'
  progress: number
  current_action: string
} 