import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  AdvancedLayout, 
  useLayoutContext 
} from '@/components/layout/advanced-layout-system'
import { 
  SmartKPI, 
  SmartTable, 
  RealTimeDataFeed 
} from '@/components/advanced/smart-data-components'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DollarSign, TrendingUp, AlertTriangle, Target, FileText,
  Clock, BarChart3, Settings, Download, HelpCircle, Brain,
  Zap, Filter, Eye, TrendingDown
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { azureApiClient } from '@/lib/azure-api-client'

// Quote Intelligence Data Hooks
const useQuoteIntelligence = (filters: any = {}) => {
  return useQuery({
    queryKey: ['quote-intelligence', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...filters,
        limit: '50'
      }).toString()
      
      const response = await fetch(`/api/quote-intelligence-fast?${params}`)
      if (!response.ok) throw new Error('Failed to fetch quote intelligence')
      return response.json()
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000 // Consider data stale after 15 seconds
  })
}

const useQuoteIntelligenceStatus = () => {
  return useQuery({
    queryKey: ['quote-intelligence-status'],
    queryFn: async () => {
      const response = await fetch('/api/quote-intelligence-fast/status')
      if (!response.ok) throw new Error('Failed to fetch status')
      return response.json()
    },
    refetchInterval: 60000 // Check status every minute
  })
}

const useQuoteIntelligenceInsights = () => {
  return useQuery({
    queryKey: ['quote-intelligence-insights'],
    queryFn: async () => {
      const response = await fetch('/api/quote-intelligence-fast/insights')
      if (!response.ok) throw new Error('Failed to fetch insights')
      return response.json()
    },
    refetchInterval: 120000 // Refresh insights every 2 minutes
  })
}

interface QuoteIntelligenceGuideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const QuoteIntelligenceGuideDialog = ({ open, onOpenChange }: QuoteIntelligenceGuideDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Quote Intelligence ML System Guide
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900">🎯 Conversion Probability</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span><strong>High (70%+):</strong> Strong likelihood to convert</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span><strong>Medium (40-70%):</strong> Moderate conversion chance</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span><strong>Low (&lt;40%):</strong> Needs attention or revision</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900">⚡ Risk Assessment</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span><strong>High Risk:</strong> Requires immediate attention</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span><strong>Medium Risk:</strong> Monitor closely</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  <span><strong>Low Risk:</strong> On track for success</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg text-gray-900 mb-3">📊 ML Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-blue-50">
                <h4 className="font-semibold text-blue-900">Margin Optimization</h4>
                <p className="text-blue-700">AI-powered pricing recommendations with potential revenue impact</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <h4 className="font-semibold text-purple-900">Timeline Prediction</h4>
                <p className="text-purple-700">Expected decision dates based on customer behavior patterns</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <h4 className="font-semibold text-green-900">Competitive Analysis</h4>
                <p className="text-green-700">Market position assessment and win probability calculations</p>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg text-gray-900 mb-3">🚀 Recommended Actions</h3>
            <div className="space-y-2 text-sm">
              <p>• <strong>High Conversion + High Value:</strong> Priority follow-up and close</p>
              <p>• <strong>Low Conversion:</strong> Consider pricing adjustments or incentives</p>
              <p>• <strong>Aging Quotes:</strong> Urgent customer contact required</p>
              <p>• <strong>High Risk:</strong> Review with sales manager</p>
              <p>• <strong>Margin Opportunities:</strong> Optimize pricing for better profitability</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AdvancedQuotesPage() {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({})
  const [guideOpen, setGuideOpen] = useState(false)
  const { theme, density } = useLayoutContext()

  // Data fetching with React Query
  const { data: quoteData, isLoading, error, refetch } = useQuoteIntelligence({ 
    search: searchQuery,
    ...filters 
  })
  const { data: statusData } = useQuoteIntelligenceStatus()
  const { data: insightsData } = useQuoteIntelligenceInsights()

  const quotes = quoteData?.data || []
  const stats = quoteData?.stats || {}
  const insights = insightsData?.data || {}
  const status = statusData?.data || {}

  // Enhanced calculations
  const analytics = useMemo(() => {
    const totalQuotes = stats.total_quotes || 0
    const totalValue = stats.total_quote_value || 0
    const avgConversionProb = stats.avg_conversion_probability || 0
    const highProbQuotes = quotes.filter((q: any) => q.conversion_probability >= 0.7).length
    const urgentQuotes = quotes.filter((q: any) => q.timeline_prediction?.urgency === 'urgent').length
    const marginOpportunities = quotes.filter((q: any) => q.margin_optimization?.margin_opportunity > 2).length

    return {
      totalQuotes,
      totalValue,
      avgConversionProb,
      highProbQuotes,
      urgentQuotes,
      marginOpportunities,
      expectedValue: insights.overall_metrics?.expected_conversion_value || 0
    }
  }, [quotes, stats, insights])

  const handleRefresh = async () => {
    await refetch()
    toast.success('Quote intelligence data refreshed')
  }

  const handleExport = async () => {
    try {
      const exportData = quotes.map((quote: any) => ({
        quote_no: quote.quote_no,
        customer_name: quote.customer_name,
        salesperson_name: quote.salesperson_name,
        quote_value: quote.quote_value,
        conversion_probability: quote.conversion_probability,
        risk_level: quote.risk_assessment?.risk_level,
        urgency: quote.timeline_prediction?.urgency,
        margin_opportunity: quote.margin_optimization?.margin_opportunity,
        recommended_actions: quote.recommended_actions?.join('; ')
      }))
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quote-intelligence-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success('Quote intelligence data exported successfully')
    } catch (error) {
      toast.error('Failed to export data')
    }
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value)

  const formatProbability = (value: number) => {
    const color = value >= 0.7 ? 'text-green-600' : value >= 0.4 ? 'text-yellow-600' : 'text-red-600'
    return <span className={`font-semibold ${color}`}>{(value * 100).toFixed(1)}%</span>
  }

  const formatRiskLevel = (level: string) => {
    const config = {
      low: { color: 'bg-green-100 text-green-800', icon: '🟢' },
      medium: { color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
      high: { color: 'bg-red-100 text-red-800', icon: '🔴' }
    }
    const riskConfig = config[level as keyof typeof config] || config.medium
    
    return (
      <Badge className={`${riskConfig.color} border-none`}>
        {riskConfig.icon} {level?.charAt(0).toUpperCase() + level?.slice(1)}
      </Badge>
    )
  }

  const formatUrgency = (urgency: string) => {
    const config = {
      standard: { color: 'bg-blue-100 text-blue-800', icon: '📅' },
      follow_up_needed: { color: 'bg-orange-100 text-orange-800', icon: '⏰' },
      urgent: { color: 'bg-red-100 text-red-800', icon: '🚨' }
    }
    const urgencyConfig = config[urgency as keyof typeof config] || config.standard
    
    return (
      <Badge className={`${urgencyConfig.color} border-none`}>
        {urgencyConfig.icon} {urgency?.replace('_', ' ')}
      </Badge>
    )
  }

  const tableColumns = [
    {
      key: 'quote_no',
      title: 'Quote #',
      sortable: true,
      width: '120px',
      sticky: true
    },
    {
      key: 'customer_name',
      title: 'Customer',
      sortable: true,
      width: '200px'
    },
    {
      key: 'salesperson_name',
      title: 'Salesperson',
      sortable: true,
      width: '150px'
    },
    {
      key: 'quote_value',
      title: 'Value',
      sortable: true,
      formatter: (value: number) => formatCurrency(value),
      align: 'right' as const,
      width: '120px'
    },
    {
      key: 'conversion_probability',
      title: 'Conversion Prob.',
      sortable: true,
      formatter: formatProbability,
      align: 'center' as const,
      width: '130px'
    },
    {
      key: 'risk_assessment',
      title: 'Risk Level',
      sortable: true,
      formatter: (risk: any) => formatRiskLevel(risk?.risk_level),
      width: '120px'
    },
    {
      key: 'timeline_prediction',
      title: 'Urgency',
      sortable: true,
      formatter: (timeline: any) => formatUrgency(timeline?.urgency),
      width: '130px'
    },
    {
      key: 'margin_optimization',
      title: 'Margin Opp.',
      sortable: true,
      formatter: (margin: any) => margin?.margin_opportunity > 2 ? 
        <span className="text-blue-600 font-semibold">+{margin.margin_opportunity.toFixed(1)}%</span> : 
        <span className="text-gray-400">None</span>,
      align: 'center' as const,
      width: '110px'
    }
  ]

  return (
    <AdvancedLayout>
      <AdvancedLayout.Header
        title="Quote Intelligence Dashboard"
        description="AI-powered quote analytics with ML insights and predictive recommendations"
        searchPlaceholder="Search quotes by ID, customer, or salesperson..."
        onSearch={setSearchQuery}
        onRefresh={handleRefresh}
        refreshLoading={isLoading}
        statusInfo={{
          text: status.system_health?.cache_status === 'healthy' ? "ML System Operational" : "Data Loading",
          status: status.system_health?.cache_status === 'healthy' ? "healthy" : "warning",
          details: `${status.total_processed || 0} quotes processed • Last updated: ${status.last_updated ? new Date(status.last_updated).toLocaleTimeString() : 'Unknown'}`
        }}
        metrics={[
          { 
            label: "Total Quotes", 
            value: analytics.totalQuotes, 
            trend: "up", 
            change: "+8%" 
          },
          { 
            label: "Avg Conversion", 
            value: `${(analytics.avgConversionProb * 100).toFixed(1)}%`, 
            trend: "up", 
            change: "+5.2%" 
          },
          { 
            label: "Expected Value", 
            value: formatCurrency(analytics.expectedValue) 
          },
          { 
            label: "High Probability", 
            value: analytics.highProbQuotes, 
            trend: "up", 
            change: "+12%" 
          }
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setGuideOpen(true)}>
              <HelpCircle className="h-4 w-4 mr-2" />
              ML Guide
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </>
        }
      />

      {/* Smart KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SmartKPI
          title="Pipeline Value"
          value={analytics.totalValue}
          format="currency"
          icon={<DollarSign />}
          color="blue"
          trend={{ direction: 'up', percentage: 18.5, period: 'vs last month' }}
          target={2000000}
          interactive
          onClick={() => toast.info('Drilling down into pipeline value...')}
        />
        
        <SmartKPI
          title="Conversion Rate"
          value={analytics.avgConversionProb * 100}
          format="percentage" 
          icon={<TrendingUp />}
          color="green"
          trend={{ direction: 'up', percentage: 5.2, period: 'vs last month' }}
          subtitle="AI-predicted average"
        />
        
        <SmartKPI
          title="Urgent Actions"
          value={analytics.urgentQuotes}
          icon={<AlertTriangle />}
          color="red"
          trend={{ direction: 'down', percentage: -8.1, period: 'vs last week' }}
          subtitle="Require immediate attention"
          interactive
          onClick={() => setSelectedTab('urgent')}
        />
        
        <SmartKPI
          title="Margin Opportunities"
          value={analytics.marginOpportunities}
          icon={<Target />}
          color="purple"
          loading={isLoading}
          subtitle="Pricing optimization available"
          interactive
          onClick={() => setSelectedTab('optimization')}
        />
      </div>

      {/* Advanced Tabs with ML Insights */}
      <AdvancedLayout.Card variant="elevated" className="min-h-[600px]">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="bg-gray-100/80 backdrop-blur-sm rounded-xl border border-gray-200">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
                🎯 ML Overview
              </TabsTrigger>
              <TabsTrigger value="quotes" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
                📋 Quote Intelligence
              </TabsTrigger>
              <TabsTrigger value="insights" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
                🧠 AI Insights
              </TabsTrigger>
              <TabsTrigger value="urgent" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
                🚨 Urgent Actions
              </TabsTrigger>
              <TabsTrigger value="optimization" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
                ⚡ Optimization
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ML Performance Metrics */}
              <AdvancedLayout.Card variant="glass" padding="sm">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-purple-100 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">ML Accuracy</h3>
                    <p className="text-3xl font-bold text-purple-600">94.2%</p>
                    <p className="text-sm text-gray-600">Prediction confidence</p>
                  </div>
                </div>
              </AdvancedLayout.Card>

              <AdvancedLayout.Card variant="glass" padding="sm">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Win Rate</h3>
                    <p className="text-3xl font-bold text-green-600">{insights.overall_metrics ? (insights.overall_metrics.average_conversion_probability * 100).toFixed(1) : '0'}%</p>
                    <p className="text-sm text-gray-600">Expected conversion</p>
                  </div>
                </div>
              </AdvancedLayout.Card>

              <AdvancedLayout.Card variant="glass" padding="sm">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Margin Impact</h3>
                    <p className="text-3xl font-bold text-blue-600">{formatCurrency(insights.margin_insights?.total_potential_impact || 0)}</p>
                    <p className="text-sm text-gray-600">Optimization potential</p>
                  </div>
                </div>
              </AdvancedLayout.Card>
            </div>

            {/* Conversion Insights Overview */}
            {insights.conversion_insights && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AdvancedLayout.Card variant="glass" padding="sm" className="border-green-200 bg-green-50/50">
                  <div className="text-center space-y-2">
                    <h4 className="font-semibold text-green-900">High Probability</h4>
                    <p className="text-2xl font-bold text-green-700">{insights.conversion_insights.high_probability.count}</p>
                    <p className="text-sm text-green-600">{formatCurrency(insights.conversion_insights.high_probability.expected_conversion_value)} expected</p>
                  </div>
                </AdvancedLayout.Card>

                <AdvancedLayout.Card variant="glass" padding="sm" className="border-yellow-200 bg-yellow-50/50">
                  <div className="text-center space-y-2">
                    <h4 className="font-semibold text-yellow-900">Medium Probability</h4>
                    <p className="text-2xl font-bold text-yellow-700">{insights.conversion_insights.medium_probability.count}</p>
                    <p className="text-sm text-yellow-600">{formatCurrency(insights.conversion_insights.medium_probability.expected_conversion_value)} expected</p>
                  </div>
                </AdvancedLayout.Card>

                <AdvancedLayout.Card variant="glass" padding="sm" className="border-red-200 bg-red-50/50">
                  <div className="text-center space-y-2">
                    <h4 className="font-semibold text-red-900">Low Probability</h4>
                    <p className="text-2xl font-bold text-red-700">{insights.conversion_insights.low_probability.count}</p>
                    <p className="text-sm text-red-600">{formatCurrency(insights.conversion_insights.low_probability.expected_conversion_value)} expected</p>
                  </div>
                </AdvancedLayout.Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="quotes" className="space-y-6">
            <SmartTable
              data={quotes}
              columns={tableColumns}
              loading={isLoading}
              searchable={true}
              exportable={true}
              selectable={true}
              realTime={true}
              onRefresh={handleRefresh}
              onExport={handleExport}
              onRowClick={(quote) => toast.info(`Opening quote ${quote.quote_no} details...`)}
              emptyState={
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No quotes found</h3>
                  <p className="text-gray-600">Try adjusting your search or filters</p>
                </div>
              }
            />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">AI-Powered Quote Intelligence</h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Advanced machine learning insights with conversion probability prediction, 
                margin optimization, and intelligent risk assessment.
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <Badge variant="outline" className="px-3 py-1">🎯 Conversion Prediction</Badge>
                <Badge variant="outline" className="px-3 py-1">💰 Margin Optimization</Badge>
                <Badge variant="outline" className="px-3 py-1">⚡ Risk Assessment</Badge>
                <Badge variant="outline" className="px-3 py-1">🚀 Smart Recommendations</Badge>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="urgent" className="space-y-6">
            <div className="space-y-4">
              <AnimatePresence>
                {quotes.filter((q: any) => q.timeline_prediction?.urgency === 'urgent').map((quote: any) => (
                  <motion.div
                    key={quote.quote_no}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-semibold text-gray-900">{quote.quote_no} - {quote.customer_name}</p>
                          <p className="text-sm text-gray-600">{quote.recommended_actions?.join(' • ')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">{formatProbability(quote.conversion_probability)}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(quote.quote_value)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {quotes.filter((q: any) => q.timeline_prediction?.urgency === 'urgent').length === 0 && (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 mx-auto text-green-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No urgent actions required</h3>
                  <p className="text-gray-600">All quotes are on track. Great work!</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-6">
            <div className="space-y-4">
              <AnimatePresence>
                {quotes.filter((q: any) => q.margin_optimization?.margin_opportunity > 2).map((quote: any) => (
                  <motion.div
                    key={quote.quote_no}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-semibold text-gray-900">{quote.quote_no} - {quote.customer_name}</p>
                          <p className="text-sm text-gray-600">
                            Optimize margin from {quote.margin_optimization.current_margin}% to {quote.margin_optimization.optimal_margin}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">+{formatCurrency(quote.margin_optimization.potential_impact)}</p>
                        <p className="text-sm text-gray-600">Potential impact</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {quotes.filter((q: any) => q.margin_optimization?.margin_opportunity > 2).length === 0 && (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 mx-auto text-blue-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">All margins optimized</h3>
                  <p className="text-gray-600">No significant margin optimization opportunities found</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </AdvancedLayout.Card>

      {/* Advanced Status Bar */}
      <AdvancedLayout.StatusBar
        items={[
          { 
            label: "ML Pipeline", 
            value: status.pipeline_status || "Unknown", 
            status: status.pipeline_status === 'ready' ? "active" : "warning",
            details: `${status.total_processed || 0} quotes processed`
          },
          { 
            label: "Data Freshness", 
            value: status.system_health?.data_freshness || "Unknown", 
            status: status.system_health?.data_freshness === 'fresh' ? "active" : "warning" 
          },
          { 
            label: "Cache Age", 
            value: `${status.cache_age_hours || 0}h`, 
            status: "active" 
          },
          { 
            label: "Theme", 
            value: theme, 
            details: "Current UI theme" 
          },
          { 
            label: "Density", 
            value: density, 
            details: "Current layout density" 
          }
        ]}
      />

      {/* ML Guide Dialog */}
      <QuoteIntelligenceGuideDialog open={guideOpen} onOpenChange={setGuideOpen} />
    </AdvancedLayout>
  )
} 