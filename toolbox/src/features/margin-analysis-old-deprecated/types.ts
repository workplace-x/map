export interface OrderLine {
  vnd_no: string
  vendor_name?: string
  customer_no?: string
  customer_name?: string
  qty_ordered: number
  cat_no: string
  unit_list: number
  unit_sell: number
  unit_cost: number
  processing_code: string
  spec_l_order_indictr: string
  freight_indicator: string
  margin: number
  margin_pct?: number
}

export interface OrderSummary {
  order_no: string
  customer_no: string
  customer_name: string
  order_title: string
  date_created: string
  total_sell: number
  total_cost: number
  overall_margin: number
  overall_margin_pct: number
  vendor_lines: OrderLine[]
  tangram_lines: OrderLine[]
  salesperson_name?: string
}

export interface VendorSummary {
  vendorNo: string
  vendorName: string
  marginPct: number | null
  marginPct12mo: number | null
}

export interface CustomerSummary {
  customerNo: string
  customerName: string
  marginPct: number
  marginPct12mo: number
}

export interface VendorComparisonRow {
  vendor: string
  currentMarginPct: number
  allTimeMarginPct: number | null
  marginPct12mo: number | null
  margin: number
}

export interface CustomerComparisonRow {
  customer: string
  currentMarginPct: number
  allTimeMarginPct: number | null
  marginPct12mo: number | null
  margin: number
}

export interface ApprovalStatus {
  id?: string
  order_no: string
  status: 'pending' | 'approved' | 'rejected'
  requested_by: string
  manager_comment?: string
  created_at?: string
  updated_at?: string
}

export interface MarginAnalysisState {
  orderSummary: OrderSummary | null
  loading: boolean
  error: string | null
  searchValue: string
}

export interface ChartDataPoint {
  name: string
  value: number
  percent?: string
}

export interface VendorMarginRow {
  vendor: string
  margin: number
  totalSell: number
}

// Margin Analysis Types - Following our new simplified protocols

export interface MarginAnalysisResponse {
  summary: MarginSummary
  trends: MarginTrends
  alerts: MarginAlert[]
  top_performers: TopPerformer[]
  at_risk_orders: AtRiskOrder[]
  orders: MarginOrder[]
  
  // Metadata
  period: string
  filters_applied: FilterState
  last_updated: string
  predictions?: MarginPrediction[]
}

export interface MarginSummary {
  total_orders: number
  avg_margin_pct: number
  at_risk_count: number
  pending_approvals: number
  total_value: number
}

export interface MarginTrends {
  margin_trend: 'improving' | 'declining' | 'stable'
  trend_pct: number
  vs_last_period: number
}

export interface MarginAlert {
  id: string
  type: 'low_margin' | 'trend_decline' | 'threshold_breach' | 'approval_needed' | 'customer_risk' | 'prediction'
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed'
  
  // Related entities
  order_no?: string
  customer_no?: string
  vendor_no?: string
  salesperson_id?: string
  team_id?: string
  
  // Alert details
  title: string
  message: string
  current_margin?: number
  threshold_margin?: number
  historical_average?: number
  predicted_impact?: number
  trend_direction?: 'improving' | 'declining' | 'stable'
  
  // Smart features
  auto_resolve: boolean
  escalation_hours: number
  priority_score: number
  
  // Metadata
  created_at: string
  updated_at: string
  acknowledged_at?: string
  acknowledged_by?: string
  resolved_at?: string
  resolved_by?: string
  
  // Additional context
  context?: Record<string, any>
}

export interface ApprovalWorkflow {
  id: string
  workflow_name: string
  trigger_condition: string
  trigger_value: Record<string, any>
  
  // Approval routing
  approver_type: 'manager' | 'director' | 'vp' | 'auto_approve' | 'team_leader'
  team_based_routing: boolean
  super_team_approval: boolean
  escalation_hours: number
  
  // Workflow settings
  is_active: boolean
  priority: number
  description?: string
  
  // Metadata
  created_at: string
  updated_at: string
  created_by?: string
  
  // Rules as JSON
  approval_rules: any[]
  notification_settings: Record<string, any>
}

export interface ApprovalRequest {
  id: string
  workflow_id?: string
  order_no: string
  requested_by: string
  assigned_to?: string
  
  // Current state
  status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'expired'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  
  // Approval details
  current_margin?: number
  requested_margin?: number
  business_justification?: string
  
  // Response
  approved_at?: string
  approved_by?: string
  approver_comment?: string
  
  // Timing
  created_at: string
  due_date?: string
  escalated_at?: string
  
  // Additional data
  request_data?: Record<string, any>
}

export interface MarginPrediction {
  id: string
  prediction_type: 'customer_margin' | 'product_margin' | 'team_performance' | 'market_trend'
  entity_type: string
  entity_id: string
  
  // Prediction data
  predicted_margin?: number
  confidence_score: number
  prediction_period: string
  
  // Supporting data
  historical_data?: Record<string, any>
  factors?: Record<string, any>
  recommendations?: Record<string, any>
  
  // Validation
  actual_outcome?: number
  accuracy_score?: number
  
  // Metadata
  model_version: string
  created_at: string
  expires_at?: string
}

export interface MarginOrder {
  order_no: string
  order_title?: string
  date_entered: string
  customer_no: string
  customer_name?: string
  salesperson_id?: string
  salesperson_name?: string
  
  // Financial data
  total_sell: number
  total_cost: number
  total_margin: number
  margin_pct: number
}

export interface TopPerformer {
  salesperson_name: string
  margin_pct: string
  total_sell: number
}

export interface AtRiskOrder {
  order_no: string
  order_title?: string
  customer_name?: string
  salesperson_name?: string
  margin_pct: number
  total_sell: number
  date_entered: string
}

export interface TeamPerformance {
  id: string
  name: string
  is_sales_team: boolean
  is_super_team: boolean
  team_type?: string
  
  // Performance metrics
  margin_performance?: {
    avg_margin: number
    total_sales: number
    orders_count: number
    at_risk_count: number
    member_count: number
  }
  
  // Team members
  team_members?: Array<{
    profiles: {
      AzureID: string
      name: string
      email: string
    }
  }>
}

export interface FilterState {
  low_margin_only: boolean
  high_risk_only: boolean
  sales_team_only: boolean
  salesperson_id?: string
  customer_no?: string
  vendor_no?: string
}

export interface MarginAnalysisSettings {
  id: string
  user_id: string
  team_id?: string
  
  // Dashboard preferences
  default_period: string
  default_filters: Record<string, any>
  kpi_preferences: Record<string, any>
  
  // Alert preferences
  alert_frequency: 'real_time' | 'hourly' | 'daily' | 'weekly'
  alert_channels: string[]
  threshold_overrides: Record<string, any>
  
  // UI preferences
  dashboard_layout: Record<string, any>
  saved_views: any[]
  
  // Metadata
  created_at: string
  updated_at: string
}

// Request/Response types for API calls

export interface CreateAlertRequest {
  type: MarginAlert['type']
  severity: MarginAlert['severity']
  title: string
  message: string
  order_no?: string
  customer_no?: string
  team_id?: string
  current_margin?: number
  threshold_margin?: number
  auto_resolve?: boolean
  context?: Record<string, any>
}

export interface UpdateAlertRequest {
  id: string
  status: MarginAlert['status']
  acknowledged_by?: string
}

export interface CreateApprovalRequest {
  order_no: string
  requested_by: string
  current_margin?: number
  requested_margin?: number
  business_justification?: string
  workflow_id?: string
}

export interface ApprovalDecisionRequest {
  action: 'approved' | 'rejected'
  approved_by: string
  approver_comment?: string
}

export interface BulkApprovalRequest {
  order_nos: string[]
  approved_by: string
  comment?: string
}

export interface BulkApprovalResponse {
  success: boolean
  approved_count: number
  approved_requests: ApprovalRequest[]
}

// Smart filter interfaces
export interface SmartFilter {
  label: string
  filter: string
  description?: string
}

export interface FilterSuggestion {
  suggested_filters: SmartFilter[]
  auto_filters: Array<{
    condition: string
    auto_apply: string
  }>
}

// Period types
export type PeriodType = 'this_month' | 'this_year' | 'last_30_days' | 'this_quarter' | 'last_quarter'

// KPI Card types
export interface KPICardData {
  title: string
  value: string
  change?: string
  subtitle?: string
  trend?: 'up' | 'down'
  color: 'green' | 'red' | 'yellow' | 'blue'
  urgent?: boolean
  actionable?: boolean
}

// ===== AI & MACHINE LEARNING TYPES =====

export interface MLMarginModel {
  id: string
  name: string
  type: 'regression' | 'classification' | 'anomaly_detection' | 'recommendation'
  status: 'training' | 'active' | 'deprecated'
  accuracy: number
  last_trained: string
  features: string[]
  hyperparameters: Record<string, any>
  performance_metrics: {
    mse?: number
    r_squared?: number
    precision?: number
    recall?: number
    f1_score?: number
  }
}

export interface MarginPrediction {
  quote_id: string
  order_no?: string
  predicted_margin_pct: number
  confidence_score: number
  risk_factors: RiskFactor[]
  optimization_suggestions: OptimizationSuggestion[]
  competitive_insights: CompetitiveInsight[]
  model_used: string
  prediction_timestamp: string
}

export interface RiskFactor {
  factor: string
  impact: 'high' | 'medium' | 'low'
  description: string
  suggested_action: string
  historical_data?: {
    success_rate: number
    avg_margin_impact: number
  }
}

export interface OptimizationSuggestion {
  type: 'pricing' | 'vendor' | 'customer' | 'timing' | 'product_mix'
  recommendation: string
  potential_impact: number // margin improvement %
  confidence: number
  effort_level: 'low' | 'medium' | 'high'
  expected_roi: number
  supporting_data: {
    historical_examples: number
    success_rate: number
    avg_improvement: number
  }
}

export interface CompetitiveInsight {
  insight_type: 'market_position' | 'pricing_pressure' | 'vendor_leverage' | 'customer_loyalty'
  description: string
  competitive_score: number // 1-10 scale
  market_data: {
    industry_avg_margin: number
    our_position: 'above' | 'at' | 'below'
    trend_direction: 'improving' | 'stable' | 'declining'
  }
}

export interface SmartSearchResult {
  type: 'quote' | 'order' | 'customer' | 'vendor' | 'product' | 'pattern'
  entity_id: string
  title: string
  description: string
  relevance_score: number
  margin_data: {
    current_margin: number
    historical_avg: number
    trend: 'up' | 'down' | 'stable'
  }
  ai_insights: string[]
  suggested_actions: string[]
}

export interface AdvancedAnalytics {
  pattern_recognition: {
    seasonal_trends: SeasonalTrend[]
    customer_behavior_patterns: CustomerPattern[]
    vendor_performance_patterns: VendorPattern[]
    product_mix_optimization: ProductMixInsight[]
  }
  anomaly_detection: {
    margin_anomalies: MarginAnomaly[]
    pricing_anomalies: PricingAnomaly[]
    volume_anomalies: VolumeAnomaly[]
  }
  predictive_analytics: {
    margin_forecasts: MarginForecast[]
    demand_predictions: DemandPrediction[]
    risk_assessments: RiskAssessment[]
  }
}

export interface SeasonalTrend {
  period: string
  margin_impact: number
  confidence: number
  historical_data: Array<{
    year: number
    margin_pct: number
    volume: number
  }>
}

export interface CustomerPattern {
  customer_id: string
  customer_name: string
  pattern_type: 'loyal' | 'price_sensitive' | 'seasonal' | 'growing' | 'declining'
  margin_behavior: {
    avg_margin: number
    margin_stability: number
    price_elasticity: number
  }
  recommendations: string[]
}

export interface VendorPattern {
  vendor_id: string
  vendor_name: string
  performance_score: number
  margin_reliability: number
  pricing_trends: Array<{
    period: string
    avg_margin: number
    volatility: number
  }>
  strategic_value: 'high' | 'medium' | 'low'
  recommendations: string[]
}

export interface ProductMixInsight {
  category: string
  current_mix_pct: number
  optimal_mix_pct: number
  margin_impact: number
  market_opportunity: number
  actionable_recommendations: string[]
}

export interface MarginAnomaly {
  type: 'sudden_drop' | 'unusual_spike' | 'pattern_break'
  entity_type: 'order' | 'customer' | 'vendor' | 'product'
  entity_id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  detected_at: string
  current_value: number
  expected_value: number
  deviation_pct: number
  potential_causes: string[]
  recommended_actions: string[]
}

export interface PricingAnomaly {
  order_id: string
  line_item: string
  anomaly_type: 'underpriced' | 'overpriced' | 'inconsistent'
  severity: number
  market_comparison: {
    our_price: number
    market_avg: number
    deviation_pct: number
  }
  recommendations: string[]
}

export interface VolumeAnomaly {
  entity_type: 'customer' | 'vendor' | 'product'
  entity_id: string
  anomaly_type: 'spike' | 'drop' | 'unusual_pattern'
  volume_change_pct: number
  margin_impact: number
  potential_reasons: string[]
}

export interface MarginForecast {
  entity_type: 'overall' | 'customer' | 'vendor' | 'product'
  entity_id?: string
  forecast_period: string
  predicted_margin: number
  confidence_interval: {
    lower: number
    upper: number
  }
  key_drivers: string[]
  risk_factors: string[]
}

export interface DemandPrediction {
  product_category: string
  predicted_demand: number
  seasonality_factor: number
  market_trends: string[]
  margin_implications: {
    current_margin: number
    predicted_margin: number
    optimization_potential: number
  }
}

export interface RiskAssessment {
  risk_type: 'margin_compression' | 'customer_loss' | 'vendor_disruption' | 'market_shift'
  probability: number
  potential_impact: number
  risk_score: number
  mitigation_strategies: string[]
  early_warning_indicators: string[]
}

// ===== AI INSIGHTS & RECOMMENDATIONS =====

export interface AIInsightsEngine {
  margin_optimization: {
    immediate_opportunities: MarginOpportunity[]
    strategic_recommendations: StrategicRecommendation[]
    competitive_positioning: CompetitivePositioning
  }
  customer_intelligence: {
    high_value_opportunities: CustomerOpportunity[]
    at_risk_relationships: CustomerRisk[]
    expansion_potential: ExpansionOpportunity[]
  }
  vendor_intelligence: {
    performance_rankings: VendorRanking[]
    negotiation_insights: NegotiationInsight[]
    alternative_sourcing: AlternativeSource[]
  }
}

export interface MarginOpportunity {
  opportunity_id: string
  type: 'price_increase' | 'cost_reduction' | 'mix_optimization' | 'volume_leverage'
  description: string
  potential_impact: number
  effort_required: 'low' | 'medium' | 'high'
  timeline: string
  confidence: number
  success_probability: number
  action_steps: string[]
  roi_estimate: number
}

export interface StrategicRecommendation {
  category: 'pricing_strategy' | 'vendor_management' | 'customer_segmentation' | 'product_focus'
  recommendation: string
  strategic_impact: 'high' | 'medium' | 'low'
  implementation_complexity: 'simple' | 'moderate' | 'complex'
  expected_timeline: string
  resource_requirements: string[]
  success_metrics: string[]
}

export interface CompetitivePositioning {
  overall_position: 'leader' | 'challenger' | 'follower' | 'niche'
  margin_competitiveness: number
  market_share_estimate: number
  competitive_advantages: string[]
  areas_for_improvement: string[]
  strategic_moves: string[]
}

export interface CustomerOpportunity {
  customer_id: string
  customer_name: string
  opportunity_type: 'margin_expansion' | 'volume_growth' | 'new_products' | 'service_upsell'
  potential_value: number
  current_margin: number
  target_margin: number
  approach_strategy: string
  success_probability: number
  next_actions: string[]
}

export interface CustomerRisk {
  customer_id: string
  customer_name: string
  risk_type: 'margin_pressure' | 'volume_decline' | 'payment_issues' | 'competitive_threat'
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  indicators: string[]
  potential_impact: number
  mitigation_strategies: string[]
  monitoring_metrics: string[]
}

export interface ExpansionOpportunity {
  customer_id: string
  opportunity_description: string
  market_size: number
  competitive_landscape: string
  entry_strategy: string
  expected_margin: number
  investment_required: number
  payback_period: string
}

export interface VendorRanking {
  vendor_id: string
  vendor_name: string
  overall_score: number
  margin_contribution: number
  reliability_score: number
  innovation_score: number
  cost_competitiveness: number
  strategic_importance: 'critical' | 'important' | 'standard' | 'commodity'
  trend: 'improving' | 'stable' | 'declining'
}

export interface NegotiationInsight {
  vendor_id: string
  leverage_points: string[]
  market_position: string
  alternative_options: number
  optimal_negotiation_timing: string
  historical_negotiation_success: number
  recommended_approach: string
  expected_margin_improvement: number
}

export interface AlternativeSource {
  current_vendor_id: string
  alternative_vendor_id: string
  alternative_vendor_name: string
  cost_comparison: number
  quality_comparison: string
  risk_assessment: string
  switching_cost: number
  potential_margin_improvement: number
  recommendation: 'strongly_recommend' | 'consider' | 'monitor' | 'avoid'
}

// ===== LEARNING & ADAPTATION =====

export interface LearningSystem {
  model_performance: ModelPerformance[]
  feedback_loops: FeedbackLoop[]
  continuous_improvement: ImprovementMetric[]
  user_interaction_patterns: UserPattern[]
}

export interface ModelPerformance {
  model_id: string
  accuracy_trend: Array<{
    date: string
    accuracy: number
  }>
  prediction_quality: number
  user_satisfaction: number
  business_impact: number
  recommendations_accepted: number
  false_positive_rate: number
  false_negative_rate: number
}

export interface FeedbackLoop {
  prediction_id: string
  actual_outcome: number
  predicted_outcome: number
  user_feedback: 'helpful' | 'neutral' | 'unhelpful'
  business_result: 'positive' | 'neutral' | 'negative'
  learning_weight: number
  model_update_trigger: boolean
}

export interface ImprovementMetric {
  metric_name: string
  baseline_value: number
  current_value: number
  improvement_pct: number
  trend_direction: 'up' | 'down' | 'stable'
  target_value: number
  achievement_date?: string
}

export interface UserPattern {
  user_id: string
  interaction_frequency: number
  feature_usage: Record<string, number>
  success_rate: number
  preferred_insights: string[]
  customization_preferences: Record<string, any>
}

// ===== TANGRAM BUSINESS-SPECIFIC TYPES =====

export interface TangramServiceAnalysis {
  service_breakdown: {
    design_fees: ServiceCategory
    project_management: ServiceCategory
    foreman_services: ServiceCategory
    contract_discounts: ContractDiscountAnalysis
  }
  total_internal_revenue: number
  total_internal_margin: number
  service_mix_optimization: ServiceMixRecommendation[]
  resource_allocation_insights: ResourceAllocationInsight[]
}

export interface ServiceCategory {
  category_name: 'design_fees' | 'project_management' | 'foreman_services'
  identification_criteria: string[] // e.g., ['D', 'ND', 'AN'] for design fees
  current_year: {
    revenue: number
    cost: number
    gross_profit: number
    gross_profit_percentage: number
    order_count: number
  }
  previous_year: {
    revenue: number
    cost: number
    gross_profit: number
    gross_profit_percentage: number
    order_count: number
  }
  growth_metrics: {
    revenue_growth: number
    margin_trend: 'improving' | 'declining' | 'stable'
    efficiency_score: number
  }
  ai_insights: {
    pricing_optimization: string[]
    capacity_utilization: number
    market_positioning: 'premium' | 'competitive' | 'value'
    recommendations: string[]
  }
}

export interface ContractDiscountAnalysis {
  steelcase_partnerships: {
    total_revenue: number
    total_margin: number
    avg_discount_percentage: number
    contract_performance: ContractPerformance[]
  }
  cooperative_analysis: CooperativeInsight[]
  state_contract_analysis: StateContractInsight[]
  strategic_value_assessment: {
    volume_leverage_score: number
    relationship_strength: number
    future_opportunity_value: number
    margin_sacrifice_justification: string
  }
}

export interface ContractPerformance {
  special_quote_no: string
  contract_name: string
  contract_type: 'cooperative' | 'state_contract' | 'trueblue_standard'
  performance_metrics: {
    revenue_contribution: number
    margin_percentage: number
    order_frequency: number
    avg_order_value: number
  }
  competitive_advantage: {
    market_access: string
    volume_benefits: string[]
    strategic_importance: 'critical' | 'important' | 'standard'
  }
}

export interface CooperativeInsight {
  cooperative_name: string
  special_quote_numbers: string[]
  market_reach: string
  performance_vs_standard: {
    margin_differential: number
    volume_multiple: number
    strategic_benefits: string[]
  }
  optimization_opportunities: string[]
}

export interface StateContractInsight {
  state: string
  contract_details: {
    special_quote_numbers: string[]
    market_penetration: number
    competitive_position: string
  }
  performance_analysis: {
    revenue_contribution: number
    margin_efficiency: number
    growth_trajectory: 'expanding' | 'stable' | 'declining'
  }
  expansion_opportunities: string[]
}

export interface ServiceMixRecommendation {
  recommendation_type: 'increase_design_fees' | 'optimize_project_management' | 'expand_foreman_services' | 'rebalance_mix'
  current_mix_percentage: number
  optimal_mix_percentage: number
  expected_margin_improvement: number
  implementation_strategy: string
  risk_factors: string[]
  expected_timeline: string
}

export interface ResourceAllocationInsight {
  service_type: 'design_fees' | 'project_management' | 'foreman_services'
  utilization_metrics: {
    current_utilization: number
    optimal_utilization: number
    efficiency_score: number
  }
  capacity_analysis: {
    current_capacity: number
    demand_forecast: number
    capacity_gap: number
    scaling_recommendations: string[]
  }
  profitability_analysis: {
    revenue_per_hour: number
    cost_per_hour: number
    margin_per_hour: number
    benchmark_comparison: number
  }
}

// ===== VENDOR INTELLIGENCE ENHANCEMENTS =====

export interface EnhancedVendorAnalysis {
  vendor_classification: VendorClassification
  steelcase_partnership: SteelcasePartnershipAnalysis
  vendor_performance: VendorPerformanceMetrics
  negotiation_intelligence: NegotiationIntelligence
  alternative_sourcing: AlternativeSourceAnalysis
}

export interface VendorClassification {
  vendor_id: string
  vendor_name: string
  classification: 'primary_partner' | 'internal_services' | 'standard_vendor' | 'commodity_supplier'
  strategic_importance: 'critical' | 'important' | 'standard' | 'transactional'
  relationship_type: 'steelcase_primary' | 'tangram_internal' | 'external_partner' | 'supplier'
  business_impact: {
    revenue_contribution: number
    margin_contribution: number
    volume_percentage: number
    dependency_risk: number
  }
}

export interface SteelcasePartnershipAnalysis {
  partnership_health: {
    overall_score: number
    volume_performance: number
    margin_sustainability: number
    contract_compliance: number
  }
  contract_optimization: {
    current_discount_levels: Record<string, number>
    benchmark_analysis: string[]
    negotiation_opportunities: string[]
    volume_tier_analysis: {
      current_tier: string
      next_tier_requirements: number
      additional_benefits: string[]
    }
  }
  competitive_positioning: {
    market_share_with_steelcase: number
    steelcase_share_of_wallet: number
    competitive_threats: string[]
    differentiation_opportunities: string[]
  }
  relationship_insights: {
    key_stakeholders: string[]
    relationship_strength: number
    communication_frequency: string
    strategic_alignment: number
  }
}

export interface VendorPerformanceMetrics {
  vendor_id: string
  performance_trends: {
    margin_trend: Array<{
      period: string
      margin_percentage: number
      volume: number
      quality_score: number
    }>
    reliability_metrics: {
      on_time_delivery: number
      quality_rating: number
      service_responsiveness: number
    }
    cost_competitiveness: {
      pricing_trend: 'improving' | 'stable' | 'declining'
      market_position: 'low_cost' | 'competitive' | 'premium'
      value_proposition: string
    }
  }
}

export interface NegotiationIntelligence {
  vendor_id: string
  leverage_analysis: {
    volume_leverage: number
    switching_cost: number
    alternative_options: number
    relationship_value: number
  }
  market_intelligence: {
    vendor_capacity: number
    competitive_pressure: number
    market_conditions: 'buyer_market' | 'balanced' | 'seller_market'
    timing_recommendations: string[]
  }
  negotiation_strategy: {
    recommended_approach: 'aggressive' | 'collaborative' | 'defensive' | 'opportunistic'
    key_negotiation_points: string[]
    expected_outcomes: {
      margin_improvement_potential: number
      volume_commitment_required: number
      relationship_risk: number
    }
  }
  historical_performance: {
    previous_negotiations: Array<{
      date: string
      outcome: string
      margin_impact: number
      lessons_learned: string[]
    }>
  }
}

export interface AlternativeSourceAnalysis {
  primary_vendor_id: string
  alternatives: Array<{
    vendor_id: string
    vendor_name: string
    capability_match: number
    cost_comparison: number
    quality_assessment: number
    risk_factors: string[]
    transition_complexity: 'low' | 'medium' | 'high'
    strategic_fit: number
  }>
  diversification_strategy: {
    recommended_mix: Array<{
      vendor_id: string
      allocation_percentage: number
      rationale: string
    }>
    risk_mitigation: string[]
    implementation_timeline: string
  }
}

// ===== ENHANCED MARGIN PREDICTION WITH BUSINESS CONTEXT =====

export interface ContextualMarginPrediction extends MarginPrediction {
  business_context: {
    service_type: 'design_fees' | 'project_management' | 'foreman_services' | 'product_sales' | 'mixed'
    vendor_relationship: 'steelcase_primary' | 'tangram_internal' | 'external_partner'
    contract_type: 'standard' | 'cooperative' | 'state_contract' | 'trueblue'
    customer_segment: string
    historical_context: {
      customer_margin_history: number[]
      seasonal_patterns: SeasonalPattern[]
      service_mix_trends: ServiceMixTrend[]
    }
  }
  enhanced_insights: {
    service_specific_recommendations: string[]
    vendor_specific_strategies: string[]
    contract_optimization_opportunities: string[]
    cross_selling_opportunities: string[]
  }
}

export interface SeasonalPattern {
  period: string
  typical_margin: number
  volume_multiplier: number
  service_mix_changes: Record<string, number>
}

export interface ServiceMixTrend {
  period: string
  design_fee_percentage: number
  project_management_percentage: number
  foreman_services_percentage: number
  product_sales_percentage: number
  total_margin_impact: number
}

// ===== AI INSIGHTS ENGINE ENHANCEMENTS =====

export interface EnhancedAIInsightsEngine extends AIInsightsEngine {
  tangram_service_intelligence: {
    service_optimization: ServiceOptimizationInsight[]
    capacity_planning: CapacityPlanningInsight[]
    pricing_strategy: PricingStrategyInsight[]
    market_positioning: MarketPositioningInsight[]
  }
  steelcase_partnership_intelligence: {
    relationship_optimization: RelationshipOptimizationInsight[]
    contract_strategy: ContractStrategyInsight[]
    competitive_intelligence: CompetitiveIntelligenceInsight[]
    volume_optimization: VolumeOptimizationInsight[]
  }
  business_specific_recommendations: {
    immediate_actions: BusinessActionItem[]
    strategic_initiatives: StrategicInitiative[]
    risk_mitigation: RiskMitigationItem[]
    growth_opportunities: GrowthOpportunityItem[]
  }
}

export interface ServiceOptimizationInsight {
  service_type: string
  current_performance: ServicePerformanceMetrics
  optimization_potential: number
  recommended_actions: string[]
  expected_impact: {
    margin_improvement: number
    revenue_increase: number
    efficiency_gain: number
  }
}

export interface CapacityPlanningInsight {
  service_category: string
  demand_forecast: number
  capacity_utilization: number
  scaling_recommendations: string[]
  investment_requirements: {
    personnel: number
    technology: number
    training: number
  }
}

export interface PricingStrategyInsight {
  service_type: string
  current_pricing_model: string
  market_analysis: {
    competitive_position: string
    pricing_elasticity: number
    value_perception: number
  }
  optimization_recommendations: {
    pricing_adjustments: Array<{
      service: string
      current_price: number
      recommended_price: number
      justification: string
    }>
    value_added_opportunities: string[]
  }
}

export interface RelationshipOptimizationInsight {
  partnership: 'steelcase' | 'other'
  relationship_strength: number
  optimization_areas: string[]
  action_plan: Array<{
    action: string
    timeline: string
    expected_benefit: string
    risk_level: 'low' | 'medium' | 'high'
  }>
}

export interface BusinessActionItem {
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: 'service_optimization' | 'vendor_management' | 'pricing' | 'capacity'
  action: string
  expected_impact: number
  timeline: string
  resources_required: string[]
  success_metrics: string[]
}

export interface StrategicInitiative {
  initiative_name: string
  objective: string
  scope: 'design_services' | 'project_management' | 'vendor_partnerships' | 'overall_business'
  investment_required: number
  expected_roi: number
  timeline: string
  key_milestones: Array<{
    milestone: string
    target_date: string
    success_criteria: string[]
  }>
}

// ===== MISSING TYPE DEFINITIONS =====

export interface MarketPositioningInsight {
  service_type: string
  current_position: 'premium' | 'competitive' | 'value'
  market_analysis: {
    competitive_landscape: string[]
    pricing_benchmarks: number[]
    differentiation_factors: string[]
  }
  positioning_recommendations: {
    target_position: 'premium' | 'competitive' | 'value'
    strategy: string
    implementation_steps: string[]
    expected_outcomes: string[]
  }
}

export interface ContractStrategyInsight {
  contract_type: 'steelcase' | 'cooperative' | 'state_contract'
  current_performance: {
    revenue_contribution: number
    margin_performance: number
    volume_metrics: number
  }
  optimization_opportunities: {
    renegotiation_potential: number
    volume_leverage: string[]
    terms_improvements: string[]
  }
  strategic_recommendations: string[]
}

export interface CompetitiveIntelligenceInsight {
  market_segment: string
  competitive_analysis: {
    market_position: string
    competitive_advantages: string[]
    threats: string[]
    opportunities: string[]
  }
  strategic_responses: {
    defensive_actions: string[]
    offensive_strategies: string[]
    partnership_opportunities: string[]
  }
}

export interface VolumeOptimizationInsight {
  optimization_type: 'steelcase_volume' | 'service_volume' | 'customer_volume'
  current_performance: {
    volume_metrics: number
    efficiency_rating: number
    capacity_utilization: number
  }
  optimization_potential: {
    volume_increase_opportunity: number
    efficiency_improvements: string[]
    capacity_enhancements: string[]
  }
  implementation_strategy: {
    timeline: string
    resource_requirements: string[]
    expected_roi: number
  }
}

export interface RiskMitigationItem {
  risk_category: 'operational' | 'financial' | 'strategic' | 'competitive'
  risk_description: string
  current_risk_level: 'low' | 'medium' | 'high' | 'critical'
  mitigation_strategy: string
  implementation_priority: 'immediate' | 'short_term' | 'medium_term' | 'long_term'
  expected_impact: {
    risk_reduction: number
    cost_to_implement: number
    timeline: string
  }
  success_metrics: string[]
}

export interface GrowthOpportunityItem {
  opportunity_type: 'market_expansion' | 'service_enhancement' | 'partnership' | 'technology'
  opportunity_description: string
  market_potential: {
    market_size: number
    growth_rate: number
    competitive_intensity: 'low' | 'medium' | 'high'
  }
  implementation_plan: {
    investment_required: number
    timeline: string
    key_milestones: string[]
    resource_needs: string[]
  }
  expected_returns: {
    revenue_potential: number
    margin_improvement: number
    market_share_gain: number
    roi_timeline: string
  }
}

export interface ServicePerformanceMetrics {
  service_category: string
  financial_metrics: {
    revenue: number
    cost: number
    margin: number
    margin_percentage: number
  }
  operational_metrics: {
    utilization_rate: number
    efficiency_score: number
    quality_rating: number
    customer_satisfaction: number
  }
  trend_analysis: {
    revenue_trend: 'growing' | 'stable' | 'declining'
    margin_trend: 'improving' | 'stable' | 'declining'
    demand_trend: 'increasing' | 'stable' | 'decreasing'
  }
  benchmark_comparison: {
    industry_average_margin: number
    performance_vs_benchmark: number
    ranking: 'above_average' | 'average' | 'below_average'
  }
}

// ===== CDA (CUSTOMER DISCOUNT AGREEMENT) ANALYSIS TYPES =====

export interface CDPerformanceMetrics {
  cda_number: string
  cda_name: string
  contract_type: 'trueblue_standard' | 'cooperative' | 'state_contract' | 'non_standard'
  
  // Financial Performance
  financial_metrics: {
    total_volume: number
    total_revenue: number
    total_margin: number
    avg_margin_percentage: number
    order_count: number
    avg_order_value: number
  }
  
  // Usage Analytics
  usage_metrics: {
    customer_count: number
    frequency_score: number
    market_penetration: number
    customer_concentration_risk: number
  }
  
  // Performance Comparison
  benchmark_analysis: {
    vs_trueblue_standard: {
      volume_ratio: number
      margin_difference: number
      efficiency_score: number
    }
    vs_peer_cdas: {
      ranking: number
      percentile: number
      competitive_position: 'leading' | 'competitive' | 'lagging'
    }
    vs_historical: {
      volume_change: number
      margin_change: number
      trend_direction: 'improving' | 'stable' | 'declining'
    }
  }
  
  // Strategic Assessment
  strategic_value: {
    importance_score: number
    growth_potential: number
    risk_factors: string[]
    strategic_recommendations: string[]
  }
}

export interface CDAAnalysisSummary {
  analysis_date: string
  total_cdas_analyzed: number
  
  // Category Breakdown
  category_summary: {
    trueblue_standard: {
      count: number
      total_volume: number
      avg_margin: number
      performance_score: number
    }
    cooperative: {
      count: number
      total_volume: number
      avg_margin: number
      top_performers: string[]
      underperformers: string[]
    }
    state_contract: {
      count: number
      total_volume: number
      avg_margin: number
      regional_insights: Array<{
        region: string
        performance: number
        optimization_potential: number
      }>
    }
    non_standard: {
      count: number
      investigation_required: number
      potential_compliance_issues: string[]
    }
  }
  
  // Key Insights
  insights: {
    top_performing_cdas: CDPerformanceMetrics[]
    concerning_trends: Array<{
      cda_number: string
      issue: string
      severity: 'high' | 'medium' | 'low'
      recommended_action: string
    }>
    optimization_opportunities: Array<{
      category: string
      potential_improvement: number
      implementation_effort: 'low' | 'medium' | 'high'
      expected_roi: number
    }>
  }
  
  // AI Recommendations
  ai_recommendations: {
    immediate_actions: string[]
    strategic_initiatives: string[]
    risk_mitigation: string[]
    contract_renegotiation_priorities: string[]
  }
}

export interface NonStandardCDAInvestigation {
  cda_number: string
  investigation_priority: 'high' | 'medium' | 'low'
  
  // Discovery Information
  discovery_data: {
    first_appearance: string
    last_usage: string
    total_usage_instances: number
    affected_customers: string[]
    total_volume_impact: number
  }
  
  // Analysis Results
  analysis_findings: {
    potential_classification: 'regional_variant' | 'deprecated' | 'custom_agreement' | 'data_error' | 'unknown'
    confidence_level: number
    evidence_supporting: string[]
    evidence_contradicting: string[]
  }
  
  // Risk Assessment
  risk_evaluation: {
    compliance_risk: 'high' | 'medium' | 'low'
    revenue_risk: number
    customer_relationship_risk: 'high' | 'medium' | 'low'
    operational_risk: string[]
  }
  
  // Action Plan
  recommended_actions: {
    immediate_steps: string[]
    investigation_tasks: string[]
    stakeholder_contacts: string[]
    documentation_needs: string[]
    timeline: string
  }
}

export interface CDAHistoricalTrend {
  cda_number: string
  cda_name: string
  
  // Time Series Data
  historical_data: Array<{
    period: string
    volume: number
    revenue: number
    margin_percentage: number
    customer_count: number
    order_frequency: number
  }>
  
  // Trend Analysis
  trend_metrics: {
    overall_direction: 'growing' | 'stable' | 'declining'
    growth_rate: number
    volatility_score: number
    seasonality_detected: boolean
    trend_strength: number
  }
  
  // Pattern Recognition
  patterns: {
    seasonal_patterns: Array<{
      pattern_type: 'quarterly' | 'monthly' | 'seasonal'
      description: string
      impact_magnitude: number
    }>
    anomalies: Array<{
      period: string
      anomaly_type: 'spike' | 'drop' | 'unusual_pattern'
      magnitude: number
      likely_cause: string
    }>
    inflection_points: Array<{
      period: string
      change_type: 'acceleration' | 'deceleration' | 'reversal'
      impact: string
    }>
  }
  
  // Predictive Insights
  forecasting: {
    next_period_prediction: {
      expected_volume: number
      confidence_interval: { lower: number; upper: number }
      key_assumptions: string[]
    }
    risk_factors: string[]
    opportunities: string[]
  }
}

export interface CDACompetitiveAnalysis {
  cda_number: string
  competitive_positioning: {
    market_share: number
    competitive_advantages: string[]
    competitive_threats: string[]
    differentiation_factors: string[]
  }
  
  // Alternative Analysis
  alternative_cdas: Array<{
    alternative_cda: string
    volume_potential: number
    margin_impact: number
    switching_feasibility: 'easy' | 'moderate' | 'difficult'
    customer_acceptance: number
  }>
  
  // Strategic Recommendations
  strategic_guidance: {
    positioning_strategy: string
    volume_optimization: string[]
    margin_enhancement: string[]
    competitive_responses: string[]
  }
}

export interface CDARegionalAnalysis {
  region: string
  states_included: string[]
  
  // Regional Performance
  regional_metrics: {
    total_volume: number
    avg_margin: number
    customer_density: number
    market_penetration: number
  }
  
  // State-by-State Breakdown
  state_performance: Array<{
    state: string
    applicable_cdas: string[]
    performance_metrics: CDPerformanceMetrics
    unique_characteristics: string[]
    optimization_potential: number
  }>
  
  // Regional Insights
  insights: {
    best_performing_states: string[]
    improvement_opportunities: string[]
    regional_trends: string[]
    competitive_landscape: string[]
  }
  
  // Recommendations
  recommendations: {
    regional_strategy: string[]
    state_specific_actions: Array<{
      state: string
      actions: string[]
      priority: 'high' | 'medium' | 'low'
    }>
    resource_allocation: string[]
  }
}

// ===== ENHANCED CONTRACT DISCOUNT ANALYSIS =====

export interface EnhancedContractDiscountAnalysis extends ContractDiscountAnalysis {
  comprehensive_cda_analysis: {
    total_cdas_tracked: number
    performance_summary: CDAAnalysisSummary
    non_standard_investigation: NonStandardCDAInvestigation[]
    historical_trends: CDAHistoricalTrend[]
    competitive_analysis: CDACompetitiveAnalysis[]
    regional_analysis: CDARegionalAnalysis[]
  }
  
  steelcase_relationship_optimization: {
    volume_tier_progression: {
      current_tier: string
      next_tier_requirements: number
      benefits_at_next_tier: string[]
      timeline_to_achievement: string
    }
    contract_renewal_strategy: {
      renewal_date: string
      negotiation_priorities: string[]
      leverage_points: string[]
      expected_improvements: string[]
    }
    partnership_health_score: number
  }
  
  ai_powered_insights: {
    anomaly_detection: Array<{
      cda_number: string
      anomaly_type: string
      severity: 'high' | 'medium' | 'low'
      investigation_required: boolean
    }>
    predictive_analytics: Array<{
      cda_number: string
      prediction_type: string
      forecast_period: string
      predicted_outcome: number
      confidence_level: number
    }>
    optimization_recommendations: Array<{
      recommendation_type: 'volume_consolidation' | 'margin_improvement' | 'contract_renegotiation' | 'customer_migration'
      affected_cdas: string[]
      potential_impact: number
      implementation_complexity: 'low' | 'medium' | 'high'
      expected_timeline: string
    }>
  }
} 