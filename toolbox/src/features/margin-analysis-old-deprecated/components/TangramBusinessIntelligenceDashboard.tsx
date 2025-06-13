import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { 
  Search, 
  Building2, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  Target,
  Users,
  Hammer,
  PaintBucket,
  ClipboardList,
  Handshake,
  Award,
  Brain,
  Zap,
  Eye,
  Lightbulb,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Settings,
  Sparkles,
  Rocket,
  Shield,
  Clock,
  DollarSign,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  Info,
  Star,
  Filter,
  Download,
  RefreshCw,
  Factory,
  Briefcase,
  Construction
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MarginAnalysisService } from '../services'
import { 
  TangramServiceAnalysis,
  ServiceCategory,
  ContractDiscountAnalysis,
  SteelcasePartnershipAnalysis,
  EnhancedAIInsightsEngine
} from '../types'

interface TangramBusinessIntelligenceDashboardProps {
  className?: string
}

export function TangramBusinessIntelligenceDashboard({ className }: TangramBusinessIntelligenceDashboardProps) {
  // Core state
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [timeFilter, setTimeFilter] = useState<'current_year' | 'previous_year' | 'both'>('both')
  
  // Business intelligence state
  const [tangramAnalysis, setTangramAnalysis] = useState<TangramServiceAnalysis | null>(null)
  const [steelcaseAnalysis, setSteelcaseAnalysis] = useState<SteelcasePartnershipAnalysis | null>(null)
  const [contractAnalysis, setContractAnalysis] = useState<ContractDiscountAnalysis | null>(null)
  const [aiInsights, setAiInsights] = useState<EnhancedAIInsightsEngine | null>(null)
  
  // Service category states
  const [designFees, setDesignFees] = useState<ServiceCategory | null>(null)
  const [projectManagement, setProjectManagement] = useState<ServiceCategory | null>(null)
  const [foremanServices, setForemanServices] = useState<ServiceCategory | null>(null)

  // Load comprehensive business data
  const loadBusinessIntelligence = useCallback(async () => {
    setLoading(true)
    try {
      const [
        tangramData,
        steelcaseData,
        contractData,
        insightsData,
        designData,
        pmData,
        foremanData
      ] = await Promise.all([
        MarginAnalysisService.getTangramServiceAnalysis({ 
          time_period: timeFilter,
          include_forecasting: true 
        }),
        MarginAnalysisService.getSteelcasePartnershipHealth(),
        MarginAnalysisService.getSteelcaseContractAnalysis({ 
          include_cooperative_breakdown: true,
          include_state_contracts: true,
          performance_analysis: true
        }),
        MarginAnalysisService.getEnhancedAIInsights({
          include_tangram_analysis: true,
          include_steelcase_analysis: true,
          focus_area: 'overall'
        }),
        MarginAnalysisService.getDesignFeesAnalysis({ 
          include_breakdown: true,
          year_comparison: true 
        }),
        MarginAnalysisService.getProjectManagementAnalysis({ 
          include_breakdown: true,
          year_comparison: true 
        }),
        MarginAnalysisService.getForemanServicesAnalysis({ 
          include_breakdown: true,
          year_comparison: true 
        })
      ])

      setTangramAnalysis(tangramData)
      setSteelcaseAnalysis(steelcaseData)
      setContractAnalysis(contractData)
      setAiInsights(insightsData)
      setDesignFees(designData)
      setProjectManagement(pmData)
      setForemanServices(foremanData)
      
      toast.success('Business intelligence loaded successfully')
    } catch (error) {
      toast.error('Failed to load business intelligence: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [timeFilter])

  // Load data on mount and time filter change
  useEffect(() => {
    loadBusinessIntelligence()
  }, [loadBusinessIntelligence])

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    if (!tangramAnalysis || !steelcaseAnalysis) return null

    return {
      total_revenue: tangramAnalysis.total_internal_revenue + (steelcaseAnalysis.partnership_health?.overall_score || 0),
      total_margin: tangramAnalysis.total_internal_margin,
      service_mix_score: tangramAnalysis.service_mix_optimization.reduce((sum, opt) => 
        sum + opt.expected_margin_improvement, 0) / tangramAnalysis.service_mix_optimization.length,
      steelcase_health: steelcaseAnalysis.partnership_health?.overall_score || 0,
      ai_opportunities: aiInsights?.business_specific_recommendations.immediate_actions.length || 0
    }
  }, [tangramAnalysis, steelcaseAnalysis, aiInsights])

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50", className)}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Tangram Business Intelligence
                  </h1>
                  <p className="text-sm text-gray-600">
                    AI-powered insights for services & partnerships
                  </p>
                </div>
              </div>
              
              {/* Key Metrics Overview */}
              {keyMetrics && (
                <div className="hidden lg:flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {MarginAnalysisService.formatCurrency(keyMetrics.total_revenue)}
                    </div>
                    <div className="text-xs text-gray-600">Total Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {keyMetrics.total_margin.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">Avg Margin</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {keyMetrics.steelcase_health}/100
                    </div>
                    <div className="text-xs text-gray-600">Steelcase Health</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Select value={timeFilter} onValueChange={(value: any) => setTimeFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_year">Current Year</SelectItem>
                  <SelectItem value="previous_year">Previous Year</SelectItem>
                  <SelectItem value="both">Both Years</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={loadBusinessIntelligence}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/70 backdrop-blur-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Tangram Services
            </TabsTrigger>
            <TabsTrigger value="steelcase" className="flex items-center gap-2">
              <Handshake className="h-4 w-4" />
              Steelcase Partnership
            </TabsTrigger>
            <TabsTrigger value="contracts" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Contract Intelligence
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <BusinessOverviewSection 
              tangramAnalysis={tangramAnalysis}
              steelcaseAnalysis={steelcaseAnalysis}
              loading={loading}
            />
          </TabsContent>

          {/* Tangram Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <TangramServicesSection 
              designFees={designFees}
              projectManagement={projectManagement}
              foremanServices={foremanServices}
              tangramAnalysis={tangramAnalysis}
              loading={loading}
            />
          </TabsContent>

          {/* Steelcase Partnership Tab */}
          <TabsContent value="steelcase" className="space-y-6">
            <SteelcasePartnershipSection 
              partnershipAnalysis={steelcaseAnalysis}
              loading={loading}
            />
          </TabsContent>

          {/* Contract Intelligence Tab */}
          <TabsContent value="contracts" className="space-y-6">
            <ContractIntelligenceSection 
              contractAnalysis={contractAnalysis}
              loading={loading}
            />
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="ai-insights" className="space-y-6">
            <AIInsightsSection 
              aiInsights={aiInsights}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Supporting Components
function BusinessOverviewSection({ tangramAnalysis, steelcaseAnalysis, loading }: {
  tangramAnalysis: TangramServiceAnalysis | null
  steelcaseAnalysis: SteelcasePartnershipAnalysis | null
  loading: boolean
}) {
  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  }

  return (
    <div className="space-y-6">
      {/* Executive Summary Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <DollarSign className="h-5 w-5" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {tangramAnalysis ? MarginAnalysisService.formatCurrency(tangramAnalysis.total_internal_revenue) : '--'}
            </div>
            <p className="text-sm text-green-600 mt-1">Internal services revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <TrendingUp className="h-5 w-5" />
              Avg Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">
              {tangramAnalysis ? `${tangramAnalysis.total_internal_margin.toFixed(1)}%` : '--'}
            </div>
            <p className="text-sm text-blue-600 mt-1">Across all services</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Handshake className="h-5 w-5" />
              Steelcase Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">
              {steelcaseAnalysis ? `${steelcaseAnalysis.partnership_health.overall_score}/100` : '--'}
            </div>
            <p className="text-sm text-purple-600 mt-1">Partnership strength</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Rocket className="h-5 w-5" />
              Growth Ops
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">
              {tangramAnalysis ? tangramAnalysis.service_mix_optimization.length : '--'}
            </div>
            <p className="text-sm text-orange-600 mt-1">Optimization opportunities</p>
          </CardContent>
        </Card>
      </div>

      {/* Service Mix Overview */}
      {tangramAnalysis && (
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-indigo-600" />
              Service Mix Performance
            </CardTitle>
            <CardDescription>
              Breakdown of Tangram's internal services performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <ServiceMixCard 
                title="Design Fees"
                icon={<PaintBucket className="h-5 w-5" />}
                service={tangramAnalysis.service_breakdown.design_fees}
                color="blue"
              />
              <ServiceMixCard 
                title="Project Management"
                icon={<ClipboardList className="h-5 w-5" />}
                service={tangramAnalysis.service_breakdown.project_management}
                color="green"
              />
              <ServiceMixCard 
                title="Foreman Services"
                icon={<Hammer className="h-5 w-5" />}
                service={tangramAnalysis.service_breakdown.foreman_services}
                color="orange"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ServiceMixCard({ title, icon, service, color }: {
  title: string
  icon: React.ReactNode
  service: any
  color: 'blue' | 'green' | 'orange'
}) {
  const colorClasses = {
    blue: 'from-blue-50 to-indigo-100 text-blue-600',
    green: 'from-green-50 to-emerald-100 text-green-600',
    orange: 'from-orange-50 to-amber-100 text-orange-600'
  }

  return (
    <div className={cn('p-4 rounded-lg bg-gradient-to-br border', colorClasses[color])}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Revenue:</span>
          <span className="font-medium">
            {MarginAnalysisService.formatCurrency(service?.current_year?.revenue || 0)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Margin:</span>
          <span className="font-medium">
            {service?.current_year?.gross_profit_percentage?.toFixed(1) || '0.0'}%
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Growth:</span>
          <span className={cn('font-medium', 
            (service?.growth_metrics?.revenue_growth || 0) > 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {service?.growth_metrics?.revenue_growth > 0 ? '+' : ''}
            {service?.growth_metrics?.revenue_growth?.toFixed(1) || '0.0'}%
          </span>
        </div>
      </div>
    </div>
  )
}

function TangramServicesSection({ designFees, projectManagement, foremanServices, tangramAnalysis, loading }: {
  designFees: ServiceCategory | null
  projectManagement: ServiceCategory | null
  foremanServices: ServiceCategory | null
  tangramAnalysis: TangramServiceAnalysis | null
  loading: boolean
}) {
  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  }

  return (
    <div className="space-y-6">
      {/* Service Categories Performance */}
      <div className="grid gap-6">
        {designFees && (
          <ServiceCategoryCard 
            title="Design Fees Analysis"
            icon={<PaintBucket className="h-6 w-6 text-blue-600" />}
            service={designFees}
            color="blue"
            description="Revenue from design services (D, ND, AN codes excluding DM variants)"
          />
        )}
        
        {projectManagement && (
          <ServiceCategoryCard 
            title="Project Management Analysis"
            icon={<ClipboardList className="h-6 w-6 text-green-600" />}
            service={projectManagement}
            color="green"
            description="Revenue from project management services (P, P 2, P 4, P B, P FR, EP2, GP2, NP, NP2)"
          />
        )}
        
        {foremanServices && (
          <ServiceCategoryCard 
            title="Foreman Services Analysis"
            icon={<Hammer className="h-6 w-6 text-orange-600" />}
            service={foremanServices}
            color="orange"
            description="Revenue from foreman services (F codes excluding FR)"
          />
        )}
      </div>

      {/* Service Optimization Recommendations */}
      {tangramAnalysis && (
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-purple-600" />
              Service Mix Optimization
            </CardTitle>
            <CardDescription>
              AI-powered recommendations for optimizing your service portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tangramAnalysis.service_mix_optimization.map((optimization, idx) => (
                <OptimizationRecommendationCard 
                  key={idx}
                  recommendation={optimization}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ServiceCategoryCard({ title, icon, service, color, description }: {
  title: string
  icon: React.ReactNode
  service: ServiceCategory
  color: 'blue' | 'green' | 'orange'
  description: string
}) {
  const colorClasses = {
    blue: 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50',
    green: 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50',
    orange: 'border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50'
  }

  return (
    <Card className={cn('shadow-lg border', colorClasses[color])}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Current Year */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Current Year</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Revenue:</span>
                <span className="font-medium">
                  {MarginAnalysisService.formatCurrency(service.current_year.revenue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Margin:</span>
                <span className="font-medium">
                  {service.current_year.gross_profit_percentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Orders:</span>
                <span className="font-medium">{service.current_year.order_count}</span>
              </div>
            </div>
          </div>

          {/* Previous Year */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Previous Year</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Revenue:</span>
                <span className="font-medium">
                  {MarginAnalysisService.formatCurrency(service.previous_year.revenue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Margin:</span>
                <span className="font-medium">
                  {service.previous_year.gross_profit_percentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Orders:</span>
                <span className="font-medium">{service.previous_year.order_count}</span>
              </div>
            </div>
          </div>

          {/* Growth Metrics */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Growth & Trends</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Revenue Growth:</span>
                <span className={cn('font-medium', 
                  service.growth_metrics.revenue_growth > 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {service.growth_metrics.revenue_growth > 0 ? '+' : ''}
                  {service.growth_metrics.revenue_growth.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Margin Trend:</span>
                <Badge variant={
                  service.growth_metrics.margin_trend === 'improving' ? 'default' :
                  service.growth_metrics.margin_trend === 'declining' ? 'destructive' : 'secondary'
                }>
                  {service.growth_metrics.margin_trend}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Efficiency:</span>
                <span className="font-medium">{service.growth_metrics.efficiency_score}/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        {service.ai_insights.recommendations.length > 0 && (
          <div className="mt-6 p-4 bg-white/70 rounded-lg border">
            <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              AI Recommendations
            </h5>
            <ul className="space-y-1">
              {service.ai_insights.recommendations.slice(0, 3).map((rec, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <Lightbulb className="h-3 w-3 mt-0.5 text-yellow-500 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function OptimizationRecommendationCard({ recommendation }: { 
  recommendation: any 
}) {
  return (
    <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{recommendation.recommendation_type.replace('_', ' ')}</h4>
          <p className="text-sm text-gray-600">{recommendation.implementation_strategy}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-purple-600">
            +{recommendation.expected_margin_improvement.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600">margin improvement</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Current Mix:</span>
          <span className="font-medium ml-2">{recommendation.current_mix_percentage.toFixed(1)}%</span>
        </div>
        <div>
          <span className="text-gray-600">Target Mix:</span>
          <span className="font-medium ml-2">{recommendation.optimal_mix_percentage.toFixed(1)}%</span>
        </div>
      </div>
      
      <div className="mt-3">
        <div className="text-xs text-gray-600 mb-1">Implementation Timeline: {recommendation.expected_timeline}</div>
        <Progress 
          value={(recommendation.expected_margin_improvement / 10) * 100} 
          className="h-2"
        />
      </div>
    </div>
  )
}

function SteelcasePartnershipSection({ partnershipAnalysis, loading }: {
  partnershipAnalysis: SteelcasePartnershipAnalysis | null
  loading: boolean
}) {
  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  }

  if (!partnershipAnalysis) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Steelcase Data Available</h3>
        <p className="text-gray-600">Partnership analysis will appear here when data is loaded.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Partnership Health Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {partnershipAnalysis.partnership_health.overall_score}/100
              </div>
              <div className="text-sm text-blue-700">Overall Health</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {partnershipAnalysis.partnership_health.volume_performance}/100
              </div>
              <div className="text-sm text-green-700">Volume Performance</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {partnershipAnalysis.partnership_health.margin_sustainability}/100
              </div>
              <div className="text-sm text-purple-700">Margin Sustainability</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {partnershipAnalysis.partnership_health.contract_compliance}/100
              </div>
              <div className="text-sm text-orange-700">Contract Compliance</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contract Optimization */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Contract Optimization Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Volume Tier Analysis</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current Tier:</span>
                  <span className="font-medium">
                    {partnershipAnalysis.contract_optimization.volume_tier_analysis.current_tier}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Next Tier Requirement:</span>
                  <span className="font-medium">
                    {MarginAnalysisService.formatCurrency(partnershipAnalysis.contract_optimization.volume_tier_analysis.next_tier_requirements)}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Negotiation Opportunities</h4>
              <ul className="space-y-1">
                {partnershipAnalysis.contract_optimization.negotiation_opportunities.slice(0, 3).map((opp, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <ArrowUpRight className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                    {opp}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitive Positioning */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Competitive Positioning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {partnershipAnalysis.competitive_positioning.market_share_with_steelcase.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Market Share with Steelcase</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {partnershipAnalysis.competitive_positioning.steelcase_share_of_wallet.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Share of Wallet</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">
                {partnershipAnalysis.relationship_insights.relationship_strength}/10
              </div>
              <div className="text-sm text-gray-600">Relationship Strength</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ContractIntelligenceSection({ contractAnalysis, loading }: {
  contractAnalysis: ContractDiscountAnalysis | null
  loading: boolean
}) {
  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Contract Intelligence</h3>
        <p className="text-gray-600">Detailed contract analysis will be displayed here.</p>
      </div>
    </div>
  )
}

function AIInsightsSection({ aiInsights, loading }: {
  aiInsights: EnhancedAIInsightsEngine | null
  loading: boolean
}) {
  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">AI-Powered Insights</h3>
        <p className="text-gray-600">Advanced AI recommendations will be displayed here.</p>
      </div>
    </div>
  )
}

export default TangramBusinessIntelligenceDashboard 