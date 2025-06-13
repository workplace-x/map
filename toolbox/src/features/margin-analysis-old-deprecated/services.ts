import {
  MarginAnalysisResponse,
  MarginAlert,
  ApprovalRequest,
  MarginPrediction,
  TeamPerformance,
  CreateAlertRequest,
  UpdateAlertRequest,
  CreateApprovalRequest,
  ApprovalDecisionRequest,
  BulkApprovalRequest,
  BulkApprovalResponse,
  PeriodType,
  FilterState,
  MLMarginModel,
  SmartSearchResult,
  AdvancedAnalytics,
  AIInsightsEngine,
  MarginOpportunity,
  RiskFactor,
  OptimizationSuggestion,
  CompetitiveInsight,
  LearningSystem,
  TangramServiceAnalysis,
  EnhancedVendorAnalysis,
  ContextualMarginPrediction,
  EnhancedAIInsightsEngine,
  ServiceCategory,
  ContractDiscountAnalysis,
  SteelcasePartnershipAnalysis,
  VendorClassification,
  CDPerformanceMetrics
} from './types'

export class MarginAnalysisService {
  private static getAuthHeaders() {
    // For demo purposes, don't require authentication
    return {
      'Content-Type': 'application/json'
    }
  }

  // ===== MAIN DASHBOARD API - Following our new simplified protocols =====
  
  static async fetchMarginAnalysis(params?: {
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
    const queryParams = new URLSearchParams()
    
    // Smart filtering with flags - just like our teams API!
    if (params?.period) queryParams.append('period', params.period)
    if (params?.low_margin_only) queryParams.append('low_margin_only', 'true')
    if (params?.high_risk_only) queryParams.append('high_risk_only', 'true')
    if (params?.sales_team_only) queryParams.append('sales_team_only', 'true')
    if (params?.salesperson_id) queryParams.append('salesperson_id', params.salesperson_id)
    if (params?.customer_no) queryParams.append('customer_no', params.customer_no)
    if (params?.vendor_no) queryParams.append('vendor_no', params.vendor_no)
    if (params?.real_time) queryParams.append('real_time', 'true')
    if (params?.include_predictions) queryParams.append('include_predictions', 'true')

    const response = await fetch(`/api/margin-analysis?${queryParams.toString()}`, {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch margin analysis: ${response.statusText}`)
    }
    
    return response.json()
  }

  // ===== AI-POWERED INTELLIGENT SEARCH =====
  
  static async intelligentSearch(query: string, params?: {
    search_type?: 'all' | 'quotes' | 'orders' | 'customers' | 'vendors' | 'patterns'
    include_ai_insights?: boolean
    limit?: number
    min_relevance?: number
  }): Promise<SmartSearchResult[]> {
    const queryParams = new URLSearchParams()
    queryParams.append('q', query)
    
    if (params?.search_type) queryParams.append('search_type', params.search_type)
    if (params?.include_ai_insights) queryParams.append('include_ai_insights', 'true')
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.min_relevance) queryParams.append('min_relevance', params.min_relevance.toString())

    const response = await fetch(`/api/margin-analysis/intelligent-search?${queryParams.toString()}`, {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to perform intelligent search')
    }
    
    return response.json()
  }

  // ===== PREDICTIVE ANALYTICS =====
  
  static async getMarginPrediction(params: {
    quote_id?: string
    order_no?: string
    customer_id?: string
    vendor_id?: string
    product_category?: string
    order_value?: number
    historical_context?: boolean
  }): Promise<MarginPrediction> {
    const response = await fetch('/api/margin-analysis/predictions', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error('Failed to get margin prediction')
    }
    
    return response.json()
  }

  static async getAdvancedAnalytics(params?: {
    time_period?: string
    include_patterns?: boolean
    include_anomalies?: boolean
    include_forecasts?: boolean
    entities?: string[]
  }): Promise<AdvancedAnalytics> {
    const queryParams = new URLSearchParams()
    
    if (params?.time_period) queryParams.append('time_period', params.time_period)
    if (params?.include_patterns) queryParams.append('include_patterns', 'true')
    if (params?.include_anomalies) queryParams.append('include_anomalies', 'true')
    if (params?.include_forecasts) queryParams.append('include_forecasts', 'true')
    if (params?.entities) params.entities.forEach(e => queryParams.append('entities', e))

    const response = await fetch(`/api/margin-analysis/advanced-analytics?${queryParams.toString()}`, {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch advanced analytics')
    }
    
    return response.json()
  }

  // ===== AI INSIGHTS ENGINE =====
  
  static async getAIInsights(params?: {
    entity_type?: 'quote' | 'customer' | 'vendor' | 'overall'
    entity_id?: string
    insight_types?: string[]
    time_horizon?: 'immediate' | 'short_term' | 'long_term'
  }): Promise<AIInsightsEngine> {
    const queryParams = new URLSearchParams()
    
    if (params?.entity_type) queryParams.append('entity_type', params.entity_type)
    if (params?.entity_id) queryParams.append('entity_id', params.entity_id)
    if (params?.insight_types) params.insight_types.forEach(t => queryParams.append('insight_types', t))
    if (params?.time_horizon) queryParams.append('time_horizon', params.time_horizon)

    const response = await fetch(`/api/margin-analysis/ai-insights?${queryParams.toString()}`, {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch AI insights')
    }
    
    return response.json()
  }

  // ===== MARGIN OPTIMIZATION =====
  
  static async getMarginOptimizationSuggestions(params: {
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
    const response = await fetch('/api/margin-analysis/optimization-suggestions', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error('Failed to get optimization suggestions')
    }
    
    return response.json()
  }

  static async analyzeCompetitivePosition(params: {
    customer_id?: string
    product_categories?: string[]
    market_segment?: string
    geographic_region?: string
  }): Promise<CompetitiveInsight[]> {
    const response = await fetch('/api/margin-analysis/competitive-analysis', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error('Failed to analyze competitive position')
    }
    
    return response.json()
  }

  // ===== QUOTE ANALYSIS WITH AI =====
  
  static async analyzeQuoteWithAI(quoteNumber: string): Promise<{
    basic_analysis: any
    predictions: MarginPrediction
    risk_factors: RiskFactor[]
    optimization_suggestions: OptimizationSuggestion[]
    competitive_insights: CompetitiveInsight[]
    goal_comparison: {
      customer_goal_margin: number
      vendor_goal_margins: Array<{
        vendor_id: string
        goal_margin: number
        current_margin: number
        variance: number
      }>
      salesperson_goal: number
      overall_goal_margin: number
    }
    ai_recommendations: string[]
  }> {
    const response = await fetch(`/api/margin-analysis/analyze-quote-ai/${quoteNumber}`, {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to analyze quote with AI')
    }
    
    return response.json()
  }

  // ===== HISTORICAL MARGIN ANALYSIS =====
  
  static async getHistoricalMarginAnalysis(params: {
    customer_id?: string
    vendor_id?: string
    product_category?: string
    salesperson_id?: string
    time_periods: string[]
    analysis_type: '12_month' | 'yearly' | 'quarterly' | 'custom'
  }): Promise<{
    trends: Array<{
      period: string
      avg_margin: number
      volume: number
      trend: 'up' | 'down' | 'stable'
    }>
    seasonality: {
      seasonal_patterns: Array<{
        period: string
        typical_margin: number
        variance: number
      }>
      best_periods: string[]
      worst_periods: string[]
    }
    benchmark_comparison: {
      vs_company_avg: number
      vs_industry_est: number
      performance_percentile: number
    }
  }> {
    const response = await fetch('/api/margin-analysis/historical-analysis', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error('Failed to get historical margin analysis')
    }
    
    return response.json()
  }

  // ===== ANOMALY DETECTION =====
  
  static async detectMarginAnomalies(params?: {
    time_period?: string
    entity_types?: string[]
    severity_threshold?: number
    auto_investigate?: boolean
  }): Promise<{
    anomalies: Array<{
      id: string
      type: string
      entity_type: string
      entity_id: string
      severity: number
      description: string
      detected_at: string
      potential_causes: string[]
      recommended_actions: string[]
      impact_assessment: {
        financial_impact: number
        urgency: 'low' | 'medium' | 'high' | 'critical'
        affected_relationships: string[]
      }
    }>
    summary: {
      total_anomalies: number
      critical_count: number
      estimated_total_impact: number
      top_concerns: string[]
    }
  }> {
    const queryParams = new URLSearchParams()
    
    if (params?.time_period) queryParams.append('time_period', params.time_period)
    if (params?.entity_types) params.entity_types.forEach(t => queryParams.append('entity_types', t))
    if (params?.severity_threshold) queryParams.append('severity_threshold', params.severity_threshold.toString())
    if (params?.auto_investigate) queryParams.append('auto_investigate', 'true')

    const response = await fetch(`/api/margin-analysis/anomaly-detection?${queryParams.toString()}`, {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to detect margin anomalies')
    }
    
    return response.json()
  }

  // ===== MACHINE LEARNING MODEL MANAGEMENT =====
  
  static async getMLModels(): Promise<MLMarginModel[]> {
    const response = await fetch('/api/margin-analysis/ml-models', {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch ML models')
    }
    
    return response.json()
  }

  static async trainMLModel(params: {
    model_type: string
    training_data_period: string
    features: string[]
    hyperparameters?: Record<string, any>
    validation_split?: number
  }): Promise<{
    job_id: string
    estimated_completion: string
    training_data_size: number
    status: 'queued' | 'training' | 'completed' | 'failed'
  }> {
    const response = await fetch('/api/margin-analysis/ml-models/train', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error('Failed to start model training')
    }
    
    return response.json()
  }

  static async getModelPerformance(modelId: string): Promise<{
    accuracy_metrics: Record<string, number>
    performance_trend: Array<{
      date: string
      accuracy: number
      predictions_made: number
    }>
    business_impact: {
      margin_improvement: number
      cost_savings: number
      time_saved_hours: number
    }
    recommendations: string[]
  }> {
    const response = await fetch(`/api/margin-analysis/ml-models/${modelId}/performance`, {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch model performance')
    }
    
    return response.json()
  }

  // ===== LEARNING SYSTEM =====
  
  static async provideFeedback(params: {
    prediction_id: string
    actual_outcome: number
    user_feedback: 'helpful' | 'neutral' | 'unhelpful'
    business_result: 'positive' | 'neutral' | 'negative'
    additional_context?: string
  }): Promise<{
    feedback_recorded: boolean
    model_update_triggered: boolean
    learning_impact: number
  }> {
    const response = await fetch('/api/margin-analysis/feedback', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error('Failed to provide feedback')
    }
    
    return response.json()
  }

  static async getLearningSystemStatus(): Promise<LearningSystem> {
    const response = await fetch('/api/margin-analysis/learning-system', {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch learning system status')
    }
    
    return response.json()
  }

  // ===== GOAL INTEGRATION =====
  
  static async getGoalBasedAnalysis(params: {
    quote_id?: string
    customer_id?: string
    salesperson_id?: string
    vendor_ids?: string[]
  }): Promise<{
    goal_comparison: {
      customer_historical_margin: number
      customer_12mo_margin: number
      vendor_margins: Array<{
        vendor_id: string
        vendor_name: string
        historical_margin: number
        twelve_month_margin: number
        current_margin: number
        goal_variance: number
        meets_threshold: boolean
      }>
      salesperson_goal: {
        target_margin: number
        ytd_performance: number
        goal_progress_pct: number
      }
      overall_margin_goal: number
    }
    risk_assessment: {
      below_threshold_lines: number
      zero_negative_margin_lines: number
      total_risk_amount: number
      approval_required: boolean
      approval_level: 'manager' | 'director' | 'vp'
    }
    improvement_opportunities: Array<{
      line_item: string
      current_margin: number
      target_margin: number
      potential_improvement: number
      confidence: number
      action_required: string
    }>
  }> {
    const response = await fetch('/api/margin-analysis/goal-based-analysis', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error('Failed to get goal-based analysis')
    }
    
    return response.json()
  }

  // ===== ENHANCED EXISTING METHODS =====

  // ===== ALERTS API =====
  
  static async fetchAlerts(params?: {
    active_only?: boolean
    severity?: string
    team_id?: string
  }): Promise<MarginAlert[]> {
    const queryParams = new URLSearchParams()
    
    if (params?.active_only) queryParams.append('active_only', 'true')
    if (params?.severity) queryParams.append('severity', params.severity)
    if (params?.team_id) queryParams.append('team_id', params.team_id)

    const response = await fetch(`/api/margin-analysis/alerts?${queryParams.toString()}`, {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch alerts')
    }
    
    return response.json()
  }

  static async createAlert(data: CreateAlertRequest): Promise<MarginAlert> {
    const response = await fetch('/api/margin-analysis/alerts', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to create alert')
    }
    
    return response.json()
  }

  static async updateAlert(data: UpdateAlertRequest): Promise<MarginAlert> {
    const response = await fetch(`/api/margin-analysis/alerts/${data.id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to update alert')
    }
    
    return response.json()
  }

  // Convenience methods for common alert actions
  static async acknowledgeAlert(alertId: string, userId: string): Promise<MarginAlert> {
    return this.updateAlert({
      id: alertId,
      status: 'acknowledged',
      acknowledged_by: userId
    })
  }

  static async resolveAlert(alertId: string, userId: string): Promise<MarginAlert> {
    return this.updateAlert({
      id: alertId,
      status: 'resolved',
      acknowledged_by: userId
    })
  }

  static async dismissAlert(alertId: string, userId: string): Promise<MarginAlert> {
    return this.updateAlert({
      id: alertId,
      status: 'dismissed',
      acknowledged_by: userId
    })
  }

  // ===== APPROVALS API =====
  
  static async fetchApprovals(params?: {
    status?: string
    assigned_to?: string
  }): Promise<ApprovalRequest[]> {
    const queryParams = new URLSearchParams()
    
    if (params?.status) queryParams.append('status', params.status)
    if (params?.assigned_to) queryParams.append('assigned_to', params.assigned_to)

    const response = await fetch(`/api/margin-analysis/approvals?${queryParams.toString()}`, {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch approvals')
    }
    
    return response.json()
  }

  static async createApprovalRequest(data: CreateApprovalRequest): Promise<ApprovalRequest> {
    const response = await fetch('/api/margin-analysis/approvals', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to create approval request')
    }
    
    return response.json()
  }

  static async approveRequest(approvalId: string, data: ApprovalDecisionRequest): Promise<ApprovalRequest> {
    const response = await fetch(`/api/margin-analysis/approvals/${approvalId}/approve`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to process approval')
    }
    
    return response.json()
  }

  // Convenience methods for approval actions
  static async approve(approvalId: string, userId: string, comment?: string): Promise<ApprovalRequest> {
    return this.approveRequest(approvalId, {
      action: 'approved',
      approved_by: userId,
      approver_comment: comment
    })
  }

  static async reject(approvalId: string, userId: string, comment?: string): Promise<ApprovalRequest> {
    return this.approveRequest(approvalId, {
      action: 'rejected',
      approved_by: userId,
      approver_comment: comment
    })
  }

  // ===== BULK OPERATIONS =====
  
  static async bulkApprove(data: BulkApprovalRequest): Promise<BulkApprovalResponse> {
    const response = await fetch('/api/margin-analysis/bulk-approve', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to bulk approve')
    }
    
    return response.json()
  }

  // ===== TEAMS PERFORMANCE - Leverages our simplified teams API =====
  
  static async fetchTeamPerformance(params?: {
    sales_teams_only?: boolean
    include_performance?: boolean
    year?: number
  }): Promise<TeamPerformance[]> {
    const queryParams = new URLSearchParams()
    
    // Uses our existing team flag patterns!
    if (params?.sales_teams_only) queryParams.append('sales_teams_only', 'true')
    if (params?.include_performance) queryParams.append('include_performance', 'true')
    if (params?.year) queryParams.append('year', params.year.toString())

    const response = await fetch(`/api/margin-analysis/teams?${queryParams.toString()}`, {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch team performance')
    }
    
    return response.json()
  }

  // ===== SMART FILTERING HELPERS =====
  
  static getSuggestedFilters(userRole?: string, teamId?: string) {
    const suggestions = []

    if (userRole === 'manager' && teamId) {
      suggestions.push({
        label: "My Team's Low Margins",
        filter: `team_id=${teamId}&low_margin_only=true`,
        description: "Orders below 15% margin from your team"
      })
    }

    suggestions.push(
      {
        label: "High Risk Orders",
        filter: "high_risk_only=true",
        description: "Orders below 10% margin requiring immediate attention"
      },
      {
        label: "This Week's Approvals",
        filter: "period=this_week&pending_approvals=true",
        description: "Approval requests from this week"
      },
      {
        label: "Sales Teams Only",
        filter: "sales_team_only=true",
        description: "Focus on sales team performance"
      }
    )

    return suggestions
  }

  static buildFilterUrl(filters: FilterState, period: PeriodType = 'this_month'): string {
    const params = new URLSearchParams()
    
    params.append('period', period)
    if (filters.low_margin_only) params.append('low_margin_only', 'true')
    if (filters.high_risk_only) params.append('high_risk_only', 'true')
    if (filters.sales_team_only) params.append('sales_team_only', 'true')
    if (filters.salesperson_id) params.append('salesperson_id', filters.salesperson_id)
    if (filters.customer_no) params.append('customer_no', filters.customer_no)
    if (filters.vendor_no) params.append('vendor_no', filters.vendor_no)

    return params.toString()
  }

  // ===== REAL-TIME HELPERS =====
  
  static async enableRealTime(): Promise<boolean> {
    // This would set up WebSocket connection for real-time updates
    // For now, return true to indicate real-time is "enabled"
    console.log('Real-time margin analysis enabled')
    return true
  }

  static async disableRealTime(): Promise<boolean> {
    console.log('Real-time margin analysis disabled')
    return true
  }

  // ===== PREDICTION HELPERS =====
  
  static async fetchPredictions(entityType?: string, entityId?: string): Promise<MarginPrediction[]> {
    const queryParams = new URLSearchParams()
    if (entityType) queryParams.append('entity_type', entityType)
    if (entityId) queryParams.append('entity_id', entityId)

    const response = await fetch(`/api/margin-analysis/predictions?${queryParams.toString()}`, {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch predictions')
    }
    
    return response.json()
  }

  // ===== EXPORT HELPERS =====
  
  static async exportData(filters: FilterState, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const filterUrl = this.buildFilterUrl(filters)
    
    const response = await fetch(`/api/margin-analysis/export?${filterUrl}&format=${format}`, {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to export data')
    }
    
    return response.blob()
  }

  // ===== NEW AI-ENHANCED UTILITIES =====
  
  static async generateExecutiveSummary(params: {
    time_period: string
    include_predictions?: boolean
    include_recommendations?: boolean
  }): Promise<{
    summary: {
      key_metrics: Record<string, number>
      trends: string[]
      top_opportunities: MarginOpportunity[]
      critical_issues: string[]
      ai_recommendations: string[]
    }
    detailed_analysis: {
      customer_insights: string[]
      vendor_insights: string[]
      market_insights: string[]
      operational_insights: string[]
    }
    action_plan: Array<{
      priority: 'high' | 'medium' | 'low'
      action: string
      expected_impact: number
      timeline: string
      owner: string
    }>
  }> {
    const response = await fetch('/api/margin-analysis/executive-summary', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error('Failed to generate executive summary')
    }
    
    return response.json()
  }

  static getAICapabilityScore(): {
    overall_score: number
    capabilities: {
      predictive_accuracy: number
      anomaly_detection: number
      optimization_suggestions: number
      learning_effectiveness: number
      user_adoption: number
    }
    maturity_level: 'basic' | 'intermediate' | 'advanced' | 'expert'
    next_improvements: string[]
  } {
    // This would be calculated based on actual system performance
    return {
      overall_score: 87,
      capabilities: {
        predictive_accuracy: 85,
        anomaly_detection: 90,
        optimization_suggestions: 88,
        learning_effectiveness: 82,
        user_adoption: 89
      },
      maturity_level: 'advanced',
      next_improvements: [
        'Enhance customer behavior prediction models',
        'Integrate external market data feeds',
        'Implement advanced NLP for contract analysis',
        'Add computer vision for product categorization'
      ]
    }
  }

  // ===== EXISTING UTILITY METHODS (enhanced) =====
  
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
    switch (severity) {
      case 'critical': return 'red'
      case 'high': return 'orange'
      case 'medium': return 'yellow'
      case 'low': return 'blue'
      default: return 'gray'
    }
  }

  static getMarginHealthColor(marginPct: number): string {
    if (marginPct >= 25) return 'green'
    if (marginPct >= 15) return 'yellow'
    if (marginPct >= 10) return 'orange'
    return 'red'
  }

  static shouldShowAlert(alert: MarginAlert): boolean {
    return alert.status === 'active' && alert.severity !== 'low'
  }

  static calculateTrendDirection(current: number, previous: number): 'up' | 'down' | 'stable' {
    const diff = current - previous
    if (Math.abs(diff) < 0.1) return 'stable'
    return diff > 0 ? 'up' : 'down'
  }

  // New AI-enhanced utility methods
  static getConfidenceColor(confidence: number): string {
    if (confidence >= 0.9) return 'green'
    if (confidence >= 0.7) return 'blue'
    if (confidence >= 0.5) return 'yellow'
    return 'orange'
  }

  static formatConfidence(confidence: number): string {
    return `${(confidence * 100).toFixed(0)}%`
  }

  static getPriorityLevel(impact: number, confidence: number): 'low' | 'medium' | 'high' | 'critical' {
    const score = impact * confidence
    if (score >= 0.8) return 'critical'
    if (score >= 0.6) return 'high'
    if (score >= 0.4) return 'medium'
    return 'low'
  }

  static generateInsightSummary(insights: any[]): string {
    const count = insights.length
    if (count === 0) return 'No significant insights detected'
    if (count === 1) return '1 key insight identified'
    return `${count} insights identified with ${insights.filter(i => i.confidence > 0.8).length} high-confidence recommendations`
  }

  // ===== TANGRAM BUSINESS-SPECIFIC SERVICES =====
  
  static async getTangramServiceAnalysis(params?: {
    time_period?: 'current_year' | 'previous_year' | 'both' | 'custom'
    include_forecasting?: boolean
    service_categories?: string[]
  }): Promise<TangramServiceAnalysis> {
    const response = await fetch('/api/margin-analysis/tangram-services', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch Tangram service analysis')
    }
    
    return response.json()
  }

  static async getDesignFeesAnalysis(params?: {
    include_breakdown?: boolean
    salesperson_filter?: string
    customer_filter?: string
    year_comparison?: boolean
  }): Promise<ServiceCategory> {
    const response = await fetch('/api/margin-analysis/design-fees', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        sql_criteria: {
          // Based on the user's SQL: line_sls_cd_list LIKE '%D%' OR line_sls_cd_list = 'ND' OR line_sls_cd_list LIKE '%AN%'
          // Exclude: 'DM', 'DM2', 'DM FR', 'DM B'
          include_codes: ['D', 'ND', 'AN'],
          exclude_codes: ['DM', 'DM2', 'DM FR', 'DM B'],
          company_codes: ['1', 'D'],
          table_source: 'ods_hds_bookingdetail'
        },
        ...params
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch design fees analysis')
    }
    
    return response.json()
  }

  static async getProjectManagementAnalysis(params?: {
    include_breakdown?: boolean
    salesperson_filter?: string
    customer_filter?: string
    year_comparison?: boolean
  }): Promise<ServiceCategory> {
    const response = await fetch('/api/margin-analysis/project-management', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        sql_criteria: {
          // Based on the user's SQL: line_sls_cd_list = ANY (ARRAY['P', 'P 2', 'P 4', 'P B', 'P FR', 'EP2', 'GP2', 'NP', 'NP2'])
          include_codes: ['P', 'P 2', 'P 4', 'P B', 'P FR', 'EP2', 'GP2', 'NP', 'NP2'],
          company_codes: ['1', 'D'],
          table_source: 'ods_hds_bookingdetail'
        },
        ...params
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch project management analysis')
    }
    
    return response.json()
  }

  static async getForemanServicesAnalysis(params?: {
    include_breakdown?: boolean
    salesperson_filter?: string
    customer_filter?: string
    year_comparison?: boolean
  }): Promise<ServiceCategory> {
    const response = await fetch('/api/margin-analysis/foreman-services', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        sql_criteria: {
          // Based on the user's SQL: line_sls_cd_list LIKE '%F%' AND line_sls_cd_list NOT LIKE '%FR%'
          include_pattern: '%F%',
          exclude_pattern: '%FR%',
          company_codes: ['1', 'D'],
          table_source: 'ods_hds_bookingdetail'
        },
        ...params
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch foreman services analysis')
    }
    
    return response.json()
  }

  static async getSteelcaseContractAnalysis(params?: {
    include_cooperative_breakdown?: boolean
    include_state_contracts?: boolean
    performance_analysis?: boolean
  }): Promise<ContractDiscountAnalysis> {
    const response = await fetch('/api/margin-analysis/steelcase-contracts', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        sql_criteria: {
          // Based on the user's complex SQL for contract discounts
          cooperative_quotes: [
            '18Z06248', // Buyboard Purchasing Cooperative
            '20Z02678', '20Z02589', // MHEC
            '21Z00987', // E&I Cooperative (US)
            '22Z01109', // E&I Cooperative (CAD)
            '19Z05659', // Omnia Partners
            '17Z04985', // GreenHealth
            '20Z05310', // Premier (US)
            '20Z05312', // Premier (CAD)
            '16Z04531', // Healthtrust Purchasing Group (HPG)
            '23Z03946', '23Z05337', // Sourcewell
            '20Z05992', // Kinetic (CAD)
            '19Z01270' // Vizient
          ],
          state_quotes: [
            '21Z05832', // Alabama
            '18Z06362', // Nevada
            '18Z03782', '18Z03725', // Alaska
            '12Z05189', // New Jersey
            // ... all other state contract quotes from the SQL
          ],
          trueblue_standard: ['03Z00444', '03Z00445'],
          table_sources: ['ods_hds_orderheader', 'ods_hds_orderline']
        },
        ...params
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch Steelcase contract analysis')
    }
    
    return response.json()
  }

  // ===== ENHANCED VENDOR ANALYSIS =====
  
  static async getEnhancedVendorAnalysis(vendorId: string, params?: {
    include_steelcase_specifics?: boolean
    include_alternatives?: boolean
    include_negotiation_intel?: boolean
  }): Promise<EnhancedVendorAnalysis> {
    const response = await fetch(`/api/margin-analysis/vendors/${vendorId}/enhanced`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch enhanced vendor analysis')
    }
    
    return response.json()
  }

  static async classifyVendor(vendorName: string, vendorId: string): Promise<VendorClassification> {
    // Smart vendor classification based on business rules
    let classification: VendorClassification['classification'] = 'standard_vendor'
    let relationship_type: VendorClassification['relationship_type'] = 'supplier'
    let strategic_importance: VendorClassification['strategic_importance'] = 'standard'

    // Business logic for vendor classification
    const vendorNameLower = vendorName.toLowerCase()
    
    if (vendorNameLower.includes('steelcase')) {
      classification = 'primary_partner'
      relationship_type = 'steelcase_primary'
      strategic_importance = 'critical'
    } else if (vendorNameLower.includes('tangram') || 
               vendorNameLower.includes('map') ||
               vendorId === 'INTERNAL' ||
               vendorNameLower.includes('internal')) {
      classification = 'internal_services'
      relationship_type = 'tangram_internal'
      strategic_importance = 'critical'
    } else {
      // Additional business logic could be added here
      classification = 'standard_vendor'
      relationship_type = 'external_partner'
      strategic_importance = 'standard'
    }

    return {
      vendor_id: vendorId,
      vendor_name: vendorName,
      classification,
      strategic_importance,
      relationship_type,
      business_impact: {
        revenue_contribution: 0, // Would be calculated from actual data
        margin_contribution: 0,
        volume_percentage: 0,
        dependency_risk: 0
      }
    }
  }

  static async getSteelcasePartnershipHealth(): Promise<SteelcasePartnershipAnalysis> {
    const response = await fetch('/api/margin-analysis/steelcase-partnership', {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch Steelcase partnership analysis')
    }
    
    return response.json()
  }

  // ===== CONTEXTUAL MARGIN PREDICTION =====
  
  static async getContextualMarginPrediction(params: {
    quote_id?: string
    order_no?: string
    vendor_analysis?: boolean
    service_type_detection?: boolean
    contract_context?: boolean
  }): Promise<ContextualMarginPrediction> {
    const response = await fetch('/api/margin-analysis/contextual-prediction', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error('Failed to get contextual margin prediction')
    }
    
    return response.json()
  }

  // ===== BUSINESS-SPECIFIC AI INSIGHTS =====
  
  static async getEnhancedAIInsights(params?: {
    include_tangram_analysis?: boolean
    include_steelcase_analysis?: boolean
    focus_area?: 'service_optimization' | 'vendor_management' | 'contract_optimization' | 'overall'
  }): Promise<EnhancedAIInsightsEngine> {
    const response = await fetch('/api/margin-analysis/enhanced-ai-insights', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch enhanced AI insights')
    }
    
    return response.json()
  }

  // ===== SERVICE OPTIMIZATION ANALYSIS =====
  
  static async getServiceMixOptimization(params?: {
    time_period?: string
    target_margin_improvement?: number
    resource_constraints?: string[]
  }): Promise<{
    current_mix: {
      design_fees_percentage: number
      project_management_percentage: number
      foreman_services_percentage: number
      product_sales_percentage: number
    }
    optimal_mix: {
      design_fees_percentage: number
      project_management_percentage: number
      foreman_services_percentage: number
      product_sales_percentage: number
    }
    optimization_strategy: {
      recommended_changes: Array<{
        service_type: string
        current_allocation: number
        target_allocation: number
        expected_impact: number
        implementation_steps: string[]
      }>
      expected_margin_improvement: number
      implementation_timeline: string
      risk_factors: string[]
    }
    business_impact: {
      revenue_impact: number
      margin_impact: number
      resource_requirements: string[]
      competitive_implications: string[]
    }
  }> {
    const response = await fetch('/api/margin-analysis/service-mix-optimization', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error('Failed to get service mix optimization')
    }
    
    return response.json()
  }

  // ===== ADVANCED QUOTE ANALYSIS WITH BUSINESS CONTEXT =====
  
  static async analyzeQuoteWithBusinessContext(quoteNumber: string): Promise<{
    basic_analysis: any
    vendor_breakdown: {
      steelcase_components: {
        revenue: number
        margin: number
        contract_discounts_applied: string[]
        optimization_opportunities: string[]
      }
      tangram_services: {
        design_fees: { revenue: number; margin: number; optimization_potential: string[] }
        project_management: { revenue: number; margin: number; optimization_potential: string[] }
        foreman_services: { revenue: number; margin: number; optimization_potential: string[] }
      }
      other_vendors: Array<{
        vendor_name: string
        revenue: number
        margin: number
        classification: string
        recommendations: string[]
      }>
    }
    service_mix_analysis: {
      current_mix: Record<string, number>
      optimal_mix: Record<string, number>
      mix_score: number
      improvement_potential: number
    }
    contract_intelligence: {
      applicable_contracts: string[]
      discount_optimization: string[]
      competitive_positioning: string
    }
    ai_recommendations: {
      immediate_actions: string[]
      strategic_considerations: string[]
      risk_mitigation: string[]
      profit_optimization: string[]
    }
    business_insights: {
      customer_relationship_context: string
      market_positioning: string
      competitive_factors: string[]
      strategic_value: number
    }
  }> {
    const response = await fetch(`/api/margin-analysis/quote-business-analysis/${quoteNumber}`, {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to analyze quote with business context')
    }
    
    return response.json()
  }

  // ===== COMPETITIVE INTELLIGENCE FOR STEELCASE =====
  
  static async getSteelcaseCompetitiveIntelligence(): Promise<{
    market_position: {
      market_share_estimate: number
      competitive_landscape: string[]
      positioning_strength: number
    }
    contract_benchmarking: {
      discount_levels_vs_market: number
      volume_tiers_comparison: string[]
      terms_competitiveness: number
    }
    relationship_optimization: {
      partnership_score: number
      improvement_areas: string[]
      strategic_opportunities: string[]
    }
    negotiation_intelligence: {
      leverage_points: string[]
      timing_recommendations: string[]
      expected_outcomes: string[]
    }
  }> {
    const response = await fetch('/api/margin-analysis/steelcase-competitive-intelligence', {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch Steelcase competitive intelligence')
    }
    
    return response.json()
  }

  // ===== BUSINESS PERFORMANCE DASHBOARD =====
  
  static async getBusinessPerformanceDashboard(params?: {
    time_period?: string
    include_forecasting?: boolean
    breakdown_level?: 'summary' | 'detailed' | 'comprehensive'
  }): Promise<{
    tangram_services_performance: {
      design_fees: { revenue: number; margin: number; growth: number; trend: string }
      project_management: { revenue: number; margin: number; growth: number; trend: string }
      foreman_services: { revenue: number; margin: number; growth: number; trend: string }
      total_internal_services: { revenue: number; margin: number; growth: number }
    }
    steelcase_partnership_performance: {
      total_revenue: number
      total_margin: number
      contract_performance: Array<{
        contract_type: string
        performance_score: number
        optimization_potential: number
      }>
      relationship_health: number
    }
    overall_business_metrics: {
      total_revenue: number
      total_margin: number
      margin_percentage: number
      service_mix_optimization_score: number
      vendor_relationship_health: number
    }
    ai_insights: {
      key_opportunities: string[]
      risk_alerts: string[]
      strategic_recommendations: string[]
      performance_predictions: Array<{
        metric: string
        predicted_value: number
        confidence: number
        timeframe: string
      }>
    }
  }> {
    const response = await fetch('/api/margin-analysis/business-dashboard', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch business performance dashboard')
    }
    
    return response.json()
  }

  // ===== UTILITY METHODS FOR BUSINESS LOGIC =====
  
  static detectServiceType(lineItemData: {
    line_sls_cd_list?: string
    vendor_name?: string
    product_description?: string
  }): 'design_fees' | 'project_management' | 'foreman_services' | 'product_sales' | 'unknown' {
    const { line_sls_cd_list, vendor_name } = lineItemData
    
    if (!line_sls_cd_list) return 'unknown'
    
    // Design fees logic from user's SQL
    if ((line_sls_cd_list.includes('D') || line_sls_cd_list === 'ND' || line_sls_cd_list.includes('AN')) &&
        !['DM', 'DM2', 'DM FR', 'DM B'].includes(line_sls_cd_list)) {
      return 'design_fees'
    }
    
    // Project management logic from user's SQL
    if (['P', 'P 2', 'P 4', 'P B', 'P FR', 'EP2', 'GP2', 'NP', 'NP2'].includes(line_sls_cd_list)) {
      return 'project_management'
    }
    
    // Foreman services logic from user's SQL
    if (line_sls_cd_list.includes('F') && !line_sls_cd_list.includes('FR')) {
      return 'foreman_services'
    }
    
    // If vendor is Tangram but doesn't match service patterns, still internal
    if (vendor_name?.toLowerCase().includes('tangram')) {
      return 'product_sales' // Tangram product sales vs services
    }
    
    return 'product_sales'
  }

  static isInternalTangramService(vendorName: string, serviceType: string): boolean {
    const vendorLower = vendorName.toLowerCase()
    return (vendorLower.includes('tangram') || vendorLower.includes('map')) &&
           ['design_fees', 'project_management', 'foreman_services'].includes(serviceType)
  }

  static isSteelcasePartner(vendorName: string): boolean {
    return vendorName.toLowerCase().includes('steelcase')
  }

  static getContractTypeFromQuoteNumber(special_quote_no: string): {
    contract_type: 'cooperative' | 'state_contract' | 'trueblue_standard' | 'unknown'
    contract_name: string
  } {
    // Based on the complete 2025 TrueBlue Reference Card
    const contractMappings: Record<string, { contract_type: 'cooperative' | 'state_contract' | 'trueblue_standard', contract_name: string }> = {
      // TrueBlue Standard CDAs
      '03Z00444': { contract_type: 'trueblue_standard', contract_name: 'TrueBlue Standard (US)' },
      '03Z00445': { contract_type: 'trueblue_standard', contract_name: 'TrueBlue Standard (CAD)' },
      
      // Group Purchasing Organizations
      '24Z05272': { contract_type: 'cooperative', contract_name: 'Allied Health' },
      '18Z06248': { contract_type: 'cooperative', contract_name: 'Buyboard Purchasing Cooperative' },
      '21Z00987': { contract_type: 'cooperative', contract_name: 'E&I Cooperative (US)' },
      '22Z01109': { contract_type: 'cooperative', contract_name: 'E&I Cooperative (CAD)' },
      '17Z04985': { contract_type: 'cooperative', contract_name: 'GreenHealth' },
      '16Z04531': { contract_type: 'cooperative', contract_name: 'Healthtrust Purchasing Group (HPG)' },
      '20Z05992': { contract_type: 'cooperative', contract_name: 'Kinetic (CAD)' },
      '20Z02678': { contract_type: 'cooperative', contract_name: 'MHEC (Union)' },
      '20Z02589': { contract_type: 'cooperative', contract_name: 'MHEC (Non-union)' },
      '19Z05659': { contract_type: 'cooperative', contract_name: 'Omnia Partners' },
      '20Z05310': { contract_type: 'cooperative', contract_name: 'Premier (US)' },
      '20Z05312': { contract_type: 'cooperative', contract_name: 'Premier (CAD)' },
      '23Z03946': { contract_type: 'cooperative', contract_name: 'Sourcewell (US)' },
      '23Z05337': { contract_type: 'cooperative', contract_name: 'Sourcewell (CAD)' },
      '19Z01270': { contract_type: 'cooperative', contract_name: 'Vizient' },
      
      // State Contracts (all from reference card)
      '21Z05832': { contract_type: 'state_contract', contract_name: 'Alabama' },
      '18Z03782': { contract_type: 'state_contract', contract_name: 'Alaska' },
      '18Z03725': { contract_type: 'state_contract', contract_name: 'Alaska' },
      '21Z02096': { contract_type: 'state_contract', contract_name: 'Arkansas' },
      '22Z02699': { contract_type: 'state_contract', contract_name: 'Colorado' },
      '15Z03242': { contract_type: 'state_contract', contract_name: 'Connecticut' },
      '15Z05995': { contract_type: 'state_contract', contract_name: 'Connecticut' },
      '16Z07564': { contract_type: 'state_contract', contract_name: 'Connecticut' },
      '15Z04260': { contract_type: 'state_contract', contract_name: 'Connecticut' },
      '16Z07140': { contract_type: 'state_contract', contract_name: 'Connecticut' },
      '16Z07145': { contract_type: 'state_contract', contract_name: 'Connecticut' },
      '15Z05996': { contract_type: 'state_contract', contract_name: 'Connecticut' },
      '16Z07565': { contract_type: 'state_contract', contract_name: 'Connecticut' },
      '15Z07068': { contract_type: 'state_contract', contract_name: 'Connecticut' },
      '15Z07069': { contract_type: 'state_contract', contract_name: 'Connecticut' },
      '23Z05397': { contract_type: 'state_contract', contract_name: 'Florida' },
      '21Z06277': { contract_type: 'state_contract', contract_name: 'Georgia' },
      '21Z06283': { contract_type: 'state_contract', contract_name: 'Georgia' },
      '18Z02879': { contract_type: 'state_contract', contract_name: 'Hawaii' },
      '18Z03570': { contract_type: 'state_contract', contract_name: 'Idaho' },
      '22Z02782': { contract_type: 'state_contract', contract_name: 'Iowa' },
      '24Z00743': { contract_type: 'state_contract', contract_name: 'Kansas' },
      '23Z00398': { contract_type: 'state_contract', contract_name: 'Kentucky' },
      '23Z01607': { contract_type: 'state_contract', contract_name: 'Louisiana' },
      '19Z03506': { contract_type: 'state_contract', contract_name: 'Minnesota' },
      '23Z03291': { contract_type: 'state_contract', contract_name: 'Mississippi' },
      '24Z02194': { contract_type: 'state_contract', contract_name: 'Mississippi' },
      '23Z03547': { contract_type: 'state_contract', contract_name: 'Missouri' },
      '18Z04466': { contract_type: 'state_contract', contract_name: 'Montana' },
      '18Z04476': { contract_type: 'state_contract', contract_name: 'Montana' },
      '18Z06362': { contract_type: 'state_contract', contract_name: 'Nevada' },
      '12Z05189': { contract_type: 'state_contract', contract_name: 'New Jersey' },
      '15Z00624': { contract_type: 'state_contract', contract_name: 'New Mexico' },
      '15Z00626': { contract_type: 'state_contract', contract_name: 'New Mexico' },
      '15Z00628': { contract_type: 'state_contract', contract_name: 'New Mexico' },
      '23Z05305': { contract_type: 'state_contract', contract_name: 'New York' },
      '23Z02830': { contract_type: 'state_contract', contract_name: 'New York' },
      '24Z02266': { contract_type: 'state_contract', contract_name: 'North Carolina' },
      '19Z07643': { contract_type: 'state_contract', contract_name: 'North Dakota' },
      '15Z04445': { contract_type: 'state_contract', contract_name: 'Ohio' },
      '19Z01891': { contract_type: 'state_contract', contract_name: 'Oregon' },
      '21Z06507': { contract_type: 'state_contract', contract_name: 'Pennsylvania' },
      '22Z00619': { contract_type: 'state_contract', contract_name: 'Pennsylvania' },
      '19Z07838': { contract_type: 'state_contract', contract_name: 'South Carolina' },
      '20Z01254': { contract_type: 'state_contract', contract_name: 'South Dakota' },
      '24Z03604': { contract_type: 'state_contract', contract_name: 'Tennessee' },
      '19Z04140': { contract_type: 'state_contract', contract_name: 'Texas' },
      '18Z02775': { contract_type: 'state_contract', contract_name: 'Utah' },
      '21Z01668': { contract_type: 'state_contract', contract_name: 'Utah' },
      '23Z01714': { contract_type: 'state_contract', contract_name: 'Vermont' },
      '22Z00860': { contract_type: 'state_contract', contract_name: 'Washington' },
      '19Z05060': { contract_type: 'state_contract', contract_name: 'Wisconsin' }
    }
    
    const mapping = contractMappings[special_quote_no]
    return mapping || { contract_type: 'unknown', contract_name: 'Unknown Contract' }
  }

  // ===== ENHANCED CDA ANALYSIS =====

  static async getComprehensiveCDAAnalysis(params?: {
    time_period?: string
    include_non_standard_cdas?: boolean
    include_historical_comparison?: boolean
    include_performance_trends?: boolean
  }): Promise<{
    trueblue_standard_performance: {
      cda_03Z00444_us: CDPerformanceMetrics
      cda_03Z00445_cad: CDPerformanceMetrics
      combined_performance: CDPerformanceMetrics
    }
    cooperative_performance: {
      top_performing_cdas: CDPerformanceMetrics[]
      underperforming_cdas: CDPerformanceMetrics[]
      strategic_opportunities: string[]
    }
    state_contract_performance: {
      by_state: Array<{
        state: string
        performance: CDPerformanceMetrics
        multiple_cdas: boolean
        optimization_potential: number
      }>
      regional_analysis: {
        northeast: CDPerformanceMetrics
        southeast: CDPerformanceMetrics
        midwest: CDPerformanceMetrics
        west: CDPerformanceMetrics
      }
    }
    non_standard_cda_analysis: {
      unknown_cdas: Array<{
        cda_number: string
        usage_frequency: number
        margin_performance: number
        investigation_priority: 'high' | 'medium' | 'low'
        potential_classification: string
      }>
      deprecated_cdas: Array<{
        cda_number: string
        last_used: string
        replacement_suggestion: string
      }>
    }
    historical_comparison: {
      year_over_year_trends: Array<{
        cda_number: string
        cda_name: string
        trend_analysis: {
          volume_change: number
          margin_change: number
          frequency_change: number
        }
        performance_rating: 'improving' | 'stable' | 'declining'
      }>
    }
    ai_recommendations: {
      cda_optimization_strategies: string[]
      contract_renegotiation_priorities: string[]
      volume_consolidation_opportunities: string[]
      margin_improvement_actions: string[]
    }
  }> {
    const response = await fetch('/api/margin-analysis/comprehensive-cda-analysis', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error('Failed to get comprehensive CDA analysis')
    }
    
    return response.json()
  }

  static async analyzeCDAPerformance(cda_number: string, params?: {
    comparison_period?: string
    include_customer_breakdown?: boolean
    include_product_mix?: boolean
    benchmark_against_standard?: boolean
  }): Promise<{
    cda_details: {
      cda_number: string
      cda_name: string
      contract_type: string
      status: 'active' | 'inactive' | 'deprecated'
    }
    performance_metrics: CDPerformanceMetrics
    customer_analysis: {
      top_customers: Array<{
        customer_name: string
        volume: number
        margin: number
        frequency: number
      }>
      customer_concentration: number
      diversification_score: number
    }
    product_mix_analysis: {
      categories: Array<{
        category: string
        volume_percentage: number
        margin_performance: number
      }>
      mix_optimization_potential: number
    }
    benchmark_comparison: {
      vs_trueblue_standard: {
        volume_difference: number
        margin_difference: number
        value_proposition: string
      }
      vs_industry_avg: {
        performance_percentile: number
        competitive_position: string
      }
    }
    historical_trends: {
      quarterly_performance: Array<{
        quarter: string
        volume: number
        margin: number
        customer_count: number
      }>
      trend_direction: 'improving' | 'stable' | 'declining'
      seasonality_patterns: string[]
    }
    optimization_recommendations: {
      immediate_actions: string[]
      strategic_initiatives: string[]
      risk_mitigation: string[]
    }
  }> {
    const response = await fetch(`/api/margin-analysis/cda-performance/${cda_number}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error('Failed to analyze CDA performance')
    }
    
    return response.json()
  }

  static async identifyNonStandardCDAs(params?: {
    time_period?: string
    min_usage_threshold?: number
    investigation_depth?: 'basic' | 'detailed' | 'comprehensive'
  }): Promise<{
    summary: {
      total_non_standard_cdas: number
      high_priority_investigations: number
      potential_revenue_impact: number
      compliance_risk_score: number
    }
    non_standard_cdas: Array<{
      cda_number: string
      discovery_details: {
        first_seen: string
        last_used: string
        usage_frequency: number
        total_volume: number
        avg_margin: number
      }
      analysis: {
        potential_type: 'regional_variant' | 'deprecated' | 'custom_agreement' | 'error' | 'unknown'
        investigation_priority: 'high' | 'medium' | 'low'
        risk_factors: string[]
        impact_assessment: {
          revenue_at_risk: number
          compliance_concerns: string[]
          customer_impact: string
        }
      }
      recommendations: {
        immediate_actions: string[]
        research_required: string[]
        stakeholder_engagement: string[]
      }
    }>
    pattern_analysis: {
      common_patterns: Array<{
        pattern: string
        frequency: number
        likely_explanation: string
      }>
      regional_variations: Array<{
        region: string
        unique_cdas: string[]
        investigation_needed: boolean
      }>
    }
    compliance_assessment: {
      potential_issues: string[]
      audit_recommendations: string[]
      documentation_gaps: string[]
    }
  }> {
    const response = await fetch('/api/margin-analysis/non-standard-cdas', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error('Failed to identify non-standard CDAs')
    }
    
    return response.json()
  }

  static async getCDAHistoricalComparison(params: {
    cda_numbers: string[]
    comparison_periods: string[]
    metrics: Array<'volume' | 'margin' | 'frequency' | 'customer_count'>
    benchmark_against?: 'trueblue_standard' | 'industry_avg' | 'top_performer'
  }): Promise<{
    comparison_matrix: Array<{
      cda_number: string
      cda_name: string
      period_comparisons: Array<{
        period: string
        metrics: Record<string, number>
        performance_rating: number
        trend_direction: 'up' | 'down' | 'stable'
      }>
      overall_trend: {
        direction: 'improving' | 'declining' | 'stable'
        trend_strength: number
        key_inflection_points: string[]
      }
    }>
    insights: {
      best_performing_periods: Array<{
        cda_number: string
        period: string
        performance_highlights: string[]
      }>
      concerning_trends: Array<{
        cda_number: string
        issue: string
        severity: 'high' | 'medium' | 'low'
        recommended_action: string
      }>
      optimization_opportunities: Array<{
        opportunity_type: string
        affected_cdas: string[]
        potential_impact: number
        implementation_difficulty: 'easy' | 'moderate' | 'complex'
      }>
    }
    benchmark_analysis: {
      vs_benchmark: Array<{
        cda_number: string
        performance_vs_benchmark: number
        ranking: number
        improvement_potential: number
      }>
    }
  }> {
    const response = await fetch('/api/margin-analysis/cda-historical-comparison', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error('Failed to get CDA historical comparison')
    }
    
    return response.json()
  }

  // ===== CDA UTILITY METHODS =====

  static getAllTrueBlueCDAs(): string[] {
    return [
      // TrueBlue Standard
      '03Z00444', '03Z00445',
      
      // Group Purchasing Organizations
      '24Z05272', '18Z06248', '21Z00987', '22Z01109', '17Z04985',
      '16Z04531', '20Z05992', '20Z02678', '20Z02589', '19Z05659',
      '20Z05310', '20Z05312', '23Z03946', '23Z05337', '19Z01270',
      
      // State Contracts (all from reference card)
      '21Z05832', '18Z03782', '18Z03725', '21Z02096', '22Z02699',
      '15Z03242', '15Z05995', '16Z07564', '15Z04260', '16Z07140',
      '16Z07145', '15Z05996', '16Z07565', '15Z07068', '15Z07069',
      '23Z05397', '21Z06277', '21Z06283', '18Z02879', '18Z03570',
      '22Z02782', '24Z00743', '23Z00398', '23Z01607', '19Z03506',
      '23Z03291', '24Z02194', '23Z03547', '18Z04466', '18Z04476',
      '18Z06362', '12Z05189', '15Z00624', '15Z00626', '15Z00628',
      '23Z05305', '23Z02830', '24Z02266', '19Z07643', '15Z04445',
      '19Z01891', '21Z06507', '22Z00619', '19Z07838', '20Z01254',
      '24Z03604', '19Z04140', '18Z02775', '21Z01668', '23Z01714',
      '22Z00860', '19Z05060'
    ]
  }

  static isTrueBlueCDA(cda_number: string): boolean {
    return this.getAllTrueBlueCDAs().includes(cda_number)
  }

  static getCDACategory(cda_number: string): 'trueblue_standard' | 'cooperative' | 'state_contract' | 'non_standard' {
    const cdaInfo = this.getContractTypeFromQuoteNumber(cda_number)
    return cdaInfo.contract_type === 'unknown' ? 'non_standard' : cdaInfo.contract_type
  }

  static getStateFromStateCDA(cda_number: string): string | null {
    const stateMapping = this.getContractTypeFromQuoteNumber(cda_number)
    return stateMapping.contract_type === 'state_contract' ? stateMapping.contract_name : null
  }

  static getCDAStrategicValue(cda_number: string): 'critical' | 'important' | 'standard' | 'investigate' {
    const category = this.getCDACategory(cda_number)
    
    if (category === 'trueblue_standard') return 'critical'
    if (category === 'cooperative') return 'important'
    if (category === 'state_contract') return 'standard'
    return 'investigate'
  }

  // ===== REAL CUSTOMER CDA ANALYSIS =====

  static async getRealCustomerCDAAnalysis(params?: {
    include_expiring_contracts?: boolean
    sales_region_filter?: string
    cda_status_filter?: string[]
    contract_type_filter?: string[]
    min_contract_value?: number
  }): Promise<{
    active_cdas_summary: {
      total_active_cdas: number
      total_contract_value: number
      by_status: Record<string, { count: number; value: number }>
      by_type: Record<string, { count: number; value: number }>
      by_region: Record<string, { count: number; value: number; owner_count: number }>
    }
    expiring_contracts: {
      expiring_30_days: Array<{
        cda: string
        customer: string
        owner: string
        list_value: number
        expiration: string
        days_until_expiration: number
        renewal_priority: 'critical' | 'high' | 'medium' | 'low'
      }>
      expiring_90_days: Array<{
        cda: string
        customer: string
        owner: string
        list_value: number
        expiration: string
        days_until_expiration: number
        renewal_priority: 'critical' | 'high' | 'medium' | 'low'
      }>
      renewal_opportunities: number
      at_risk_value: number
    }
    sales_performance: {
      by_owner: Array<{
        owner: string
        region: string
        active_cdas: number
        total_value: number
        avg_contract_size: number
        expiring_soon: number
        performance_score: number
      }>
      top_performers: string[]
      attention_needed: string[]
    }
    customer_insights: {
      high_value_customers: Array<{
        customer: string
        total_cdas: number
        total_value: number
        relationship_strength: number
        expansion_opportunities: string[]
      }>
      multi_cda_customers: Array<{
        customer: string
        cdas: string[]
        total_value: number
        consolidation_opportunity: boolean
      }>
    }
    strategic_analysis: {
      project_vs_continuing: {
        project_contracts: { count: number; value: number; avg_size: number }
        continuing_contracts: { count: number; value: number; avg_size: number }
        strategic_recommendations: string[]
      }
      regional_opportunities: Array<{
        region: string
        growth_potential: number
        competitive_position: string
        recommended_actions: string[]
      }>
      contract_health: {
        healthy_contracts: number
        at_risk_contracts: number
        lost_opportunities: number
        intervention_required: string[]
      }
    }
    ai_recommendations: {
      immediate_actions: string[]
      renewal_strategies: string[]
      expansion_opportunities: string[]
      risk_mitigation: string[]
    }
  }> {
    const response = await fetch('/api/margin-analysis/real-customer-cda-analysis', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error('Failed to get real customer CDA analysis')
    }
    
    return response.json()
  }

  static async analyzeCDAByCustomer(customer_name: string): Promise<{
    customer_profile: {
      customer_name: string
      total_cdas: number
      active_cdas: number
      total_contract_value: number
      relationship_duration: string
      primary_owner: string
      primary_region: string
    }
    cda_portfolio: Array<{
      cda: string
      description: string
      status: string
      type: string
      list_value: number
      owner: string
      expiration: string
      performance_metrics: {
        utilization_rate: number
        margin_performance: number
        order_frequency: number
      }
    }>
    relationship_health: {
      overall_score: number
      contract_diversity: number
      geographic_spread: number
      owner_consistency: number
      renewal_history: string[]
    }
    growth_opportunities: {
      contract_expansion: string[]
      new_regions: string[]
      service_upsell: string[]
      strategic_partnerships: string[]
    }
    risk_assessment: {
      expiring_contracts: number
      contract_concentration: number
      competitive_threats: string[]
      mitigation_strategies: string[]
    }
    recommendations: {
      renewal_approach: string
      expansion_strategy: string[]
      relationship_strengthening: string[]
      competitive_defense: string[]
    }
  }> {
    const response = await fetch(`/api/margin-analysis/cda-customer-analysis/${encodeURIComponent(customer_name)}`, {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to analyze CDAs by customer')
    }
    
    return response.json()
  }

  static async getRegionalCDAPerformance(region?: string): Promise<{
    regional_overview: {
      region: string
      total_cdas: number
      total_value: number
      active_owners: number
      avg_contract_size: number
      market_penetration: number
    }
    owner_performance: Array<{
      owner: string
      cdas_managed: number
      total_value: number
      win_rate: number
      renewal_rate: number
      pipeline_value: number
      performance_ranking: number
    }>
    contract_analysis: {
      by_type: Record<string, { count: number; value: number; performance: number }>
      by_status: Record<string, { count: number; value: number }>
      expiration_timeline: Array<{
        period: string
        expiring_count: number
        expiring_value: number
        renewal_probability: number
      }>
    }
    competitive_landscape: {
      market_position: 'leader' | 'challenger' | 'emerging'
      competitive_threats: string[]
      market_opportunities: string[]
      strategic_advantages: string[]
    }
    growth_strategy: {
      expansion_targets: string[]
      partnership_opportunities: string[]
      competitive_responses: string[]
      investment_priorities: string[]
    }
  }> {
    const queryParams = new URLSearchParams()
    if (region) queryParams.append('region', region)

    const response = await fetch(`/api/margin-analysis/regional-cda-performance?${queryParams.toString()}`, {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to get regional CDA performance')
    }
    
    return response.json()
  }

  static async getCDAExpirationDashboard(params?: {
    timeline?: '30_days' | '60_days' | '90_days' | '6_months' | '1_year'
    min_value_threshold?: number
    include_renewal_probability?: boolean
  }): Promise<{
    expiration_summary: {
      total_expiring: number
      total_value_at_risk: number
      critical_renewals: number
      high_probability_losses: number
      avg_days_to_expiration: number
    }
    timeline_breakdown: Array<{
      period: string
      expiring_count: number
      total_value: number
      high_priority_count: number
      renewal_actions_required: number
    }>
    critical_renewals: Array<{
      cda: string
      customer: string
      description: string
      value: number
      owner: string
      region: string
      days_until_expiration: number
      renewal_probability: number
      strategic_importance: 'critical' | 'high' | 'medium' | 'low'
      recommended_actions: string[]
      escalation_required: boolean
    }>
    renewal_strategies: {
      early_engagement: Array<{
        cda: string
        recommended_start_date: string
        stakeholders: string[]
        approach_strategy: string
      }>
      competitive_defense: Array<{
        cda: string
        competitive_threats: string[]
        defense_strategy: string[]
        value_proposition: string
      }>
      expansion_opportunities: Array<{
        cda: string
        expansion_potential: number
        upsell_opportunities: string[]
        cross_sell_potential: string[]
      }>
    }
    success_metrics: {
      renewal_targets: {
        total_target_renewals: number
        value_target: number
        success_rate_target: number
      }
      tracking_metrics: {
        outreach_completion: number
        proposal_submission: number
        negotiation_progress: number
        signed_renewals: number
      }
    }
  }> {
    const response = await fetch('/api/margin-analysis/cda-expiration-dashboard', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params)
    })
    
    if (!response.ok) {
      throw new Error('Failed to get CDA expiration dashboard')
    }
    
    return response.json()
  }

  // ===== ENHANCED CDA UTILITY METHODS WITH REAL DATA =====

  static parseCustomerCDAData(csvData: string): Array<{
    cda: string
    description: string
    status: string
    type: string
    customer: string
    list_value: number
    owner: string
    sales_region: string
    expiration: string
    ultimate_site: string
  }> {
    const lines = csvData.split('\n')
    const headers = lines[0].split(',')
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',')
      if (values.length >= headers.length) {
        data.push({
          cda: values[0]?.trim() || '',
          description: values[1]?.trim() || '',
          status: values[2]?.trim() || '',
          type: values[3]?.trim() || '',
          customer: values[4]?.trim() || '',
          list_value: parseFloat(values[5]?.replace(/[,$"]/g, '') || '0'),
          owner: values[6]?.trim() || '',
          sales_region: values[7]?.trim() || '',
          expiration: values[8]?.trim() || '',
          ultimate_site: values[9]?.trim() || ''
        })
      }
    }

    return data
  }

  static classifyCustomerCDA(cda: string): {
    classification: 'trueblue_standard' | 'cooperative' | 'state_contract' | 'customer_specific' | 'unknown'
    program_type: string
    strategic_value: 'critical' | 'important' | 'standard' | 'customer_specific'
  } {
    // First check if it's a standard TrueBlue CDA
    if (this.isTrueBlueCDA(cda)) {
      const contractInfo = this.getContractTypeFromQuoteNumber(cda)
      return {
        classification: contractInfo.contract_type as any,
        program_type: contractInfo.contract_name,
        strategic_value: contractInfo.contract_type === 'trueblue_standard' ? 'critical' : 
                        contractInfo.contract_type === 'cooperative' ? 'important' : 'standard'
      }
    }

    // Customer-specific CDA
    return {
      classification: 'customer_specific',
      program_type: 'Customer Specific Agreement',
      strategic_value: 'customer_specific'
    }
  }

  static calculateContractRenewalPriority(params: {
    list_value: number
    days_until_expiration: number
    customer_relationship_score?: number
    competitive_risk?: number
  }): 'critical' | 'high' | 'medium' | 'low' {
    const { list_value, days_until_expiration, customer_relationship_score = 5, competitive_risk = 5 } = params

    // Calculate priority score based on multiple factors
    let priorityScore = 0

    // Value component (0-40 points)
    if (list_value > 5000000) priorityScore += 40
    else if (list_value > 1000000) priorityScore += 30
    else if (list_value > 500000) priorityScore += 20
    else if (list_value > 100000) priorityScore += 10

    // Urgency component (0-30 points)
    if (days_until_expiration <= 30) priorityScore += 30
    else if (days_until_expiration <= 60) priorityScore += 25
    else if (days_until_expiration <= 90) priorityScore += 20
    else if (days_until_expiration <= 180) priorityScore += 10

    // Relationship component (0-20 points)
    priorityScore += (customer_relationship_score / 10) * 20

    // Competitive risk component (0-10 points)
    priorityScore += (competitive_risk / 10) * 10

    // Determine priority level
    if (priorityScore >= 80) return 'critical'
    if (priorityScore >= 60) return 'high'
    if (priorityScore >= 40) return 'medium'
    return 'low'
  }

  static calculateDaysUntilExpiration(expirationDate: string): number {
    try {
      const expDate = new Date(expirationDate)
      const today = new Date()
      const diffTime = expDate.getTime() - today.getTime()
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    } catch {
      return -1 // Invalid date
    }
  }

  static getSalesRegionInsights(region: string): {
    region_characteristics: string[]
    market_opportunities: string[]
    competitive_landscape: string[]
    growth_strategies: string[]
  } {
    // Business intelligence for different sales regions
    const regionInsights: Record<string, any> = {
      'SoCal and Hawaii': {
        region_characteristics: ['High-value entertainment and tech clients', 'Competitive market', 'Premium pricing tolerance'],
        market_opportunities: ['Tech company expansions', 'Entertainment industry growth', 'Hawaii tourism recovery'],
        competitive_landscape: ['Strong local dealers', 'National competitors present', 'Price-sensitive segments'],
        growth_strategies: ['Focus on tech partnerships', 'Entertainment industry specialization', 'Hawaii market development']
      },
      'NorCal and Nevada': {
        region_characteristics: ['Tech hub concentration', 'High real estate costs', 'Innovation-focused buyers'],
        market_opportunities: ['Silicon Valley growth', 'Nevada business relocations', 'Startup ecosystem'],
        competitive_landscape: ['Premium market focus', 'Technology integration important', 'Sustainability priorities'],
        growth_strategies: ['Tech partnership expansion', 'Nevada market penetration', 'Innovation showcasing']
      },
      'South Central North America': {
        region_characteristics: ['Energy sector focus', 'Cost-conscious buyers', 'Large project opportunities'],
        market_opportunities: ['Energy sector growth', 'Manufacturing expansion', 'Corporate relocations'],
        competitive_landscape: ['Price competition', 'Relationship-driven sales', 'Volume opportunities'],
        growth_strategies: ['Energy sector specialization', 'Volume pricing strategies', 'Regional partnership development']
      }
      // Add more regions as needed
    }

    return regionInsights[region] || {
      region_characteristics: ['Market analysis pending'],
      market_opportunities: ['Opportunity assessment in progress'],
      competitive_landscape: ['Competitive analysis required'],
      growth_strategies: ['Strategy development needed']
    }
  }
} 