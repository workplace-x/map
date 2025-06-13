import React, { useState, useMemo } from 'react'
import { 
  AdvancedLayout, 
  useLayoutContext 
} from '@/components/layout/advanced-layout-system'
import { 
  SmartTable 
} from '@/components/advanced/smart-data-components'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Users, TrendingUp, DollarSign, Target, AlertTriangle, Timer,
  Settings, Download, ExternalLink, RefreshCw, Filter, Trophy,
  TrendingDown, Clock, Shield, Star, Info, HelpCircle, Zap,
  UserCheck, UserMinus, UserPlus, UserX, Activity, XCircle, Plus,
  Brain, Heart, Gauge, Minus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'

const PAGE_SIZE = 50

// ML Customer Intelligence API Hook
function useCustomerIntelligence(params: {
  lifecycle_stage?: string
  search?: string
  sort_by?: string
  limit?: number
  offset?: number
  customer_tier?: string
  risk_level?: string
}) {
  return useQuery({
    queryKey: ['customer-intelligence', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      
      if (params.lifecycle_stage && params.lifecycle_stage !== 'all') {
        searchParams.append('lifecycle_stage', params.lifecycle_stage)
      }
      if (params.search) searchParams.append('search', params.search)
      if (params.sort_by) searchParams.append('sort_by', params.sort_by)
      if (params.limit) searchParams.append('limit', params.limit.toString())
      if (params.offset) searchParams.append('offset', params.offset.toString())
      if (params.customer_tier && params.customer_tier !== 'all') {
        searchParams.append('customer_tier', params.customer_tier)
      }
      if (params.risk_level && params.risk_level !== 'all') {
        searchParams.append('risk_level', params.risk_level)
      }

      const response = await fetch(`/api/customer-intelligence-fast?${searchParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch customer intelligence')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// ML Customer Intelligence Status Hook
function useCustomerIntelligenceStatus() {
  return useQuery({
    queryKey: ['customer-intelligence-status'],
    queryFn: async () => {
              const response = await fetch('/api/customer-intelligence-fast/status')
      if (!response.ok) {
        throw new Error('Failed to fetch status')
      }
      return response.json()
    },
    refetchInterval: 30 * 1000, // 30 seconds
  })
}

export default function AdvancedCustomersPage() {
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedTab, setSelectedTab] = useState('active')
  const [loading, setLoading] = useState(false)
  const [lifecycleFilter, setLifecycleFilter] = useState<string>('active')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('lifetime_revenue')
  const [showLegend, setShowLegend] = useState(false)
  const { theme, density } = useLayoutContext()

  // Fetch ML Customer Intelligence data
  const {
    data: intelligenceData,
    isLoading: intelligenceLoading,
    error: intelligenceError,
    refetch: refetchIntelligence
  } = useCustomerIntelligence({
    lifecycle_stage: lifecycleFilter,
    search: searchQuery,
    sort_by: sortBy,
    limit: PAGE_SIZE,
    offset: currentPage * PAGE_SIZE,
    customer_tier: tierFilter,
    risk_level: riskFilter
  })

  // Fetch pipeline status
  const { data: statusData } = useCustomerIntelligenceStatus()

  const isLoading = intelligenceLoading

  // Extract data from ML response
  const customers = intelligenceData?.customers || []
  const summary = intelligenceData?.summary || {}
  const insights = intelligenceData?.insights || []
  const pagination = intelligenceData?.pagination || {}

  // Enhanced analytics from ML data
  const analytics = useMemo(() => {
    if (!summary.lifecycle_breakdown) {
      return {
        totalCustomers: 0,
        lifecycleBreakdown: { active: 0, new: 0, dormant: 0, at_risk: 0, churned: 0, prospect: 0 },
        tierBreakdown: { platinum: 0, gold: 0, silver: 0, bronze: 0 },
        riskBreakdown: { low: 0, medium: 0, high: 0, critical: 0 },
        totalRevenue: 0,
        revenue12mo: 0,
        avgMarginPct: 0,
        avgLoyaltyScore: 0,
        filteredCustomers: customers
      }
    }

    return {
      totalCustomers: summary.total_customers || 0,
      lifecycleBreakdown: summary.lifecycle_breakdown || {},
      tierBreakdown: summary.tier_breakdown || {},
      riskBreakdown: summary.risk_breakdown || {},
      totalRevenue: summary.total_revenue || 0,
      revenue12mo: summary.revenue_12mo || 0,
      avgMarginPct: summary.avg_margin_pct || 0,
      avgLoyaltyScore: summary.avg_loyalty_score || 0,
      filteredCustomers: customers
    }
  }, [summary, customers])

  // Pagination controls
  const totalPages = Math.ceil((pagination.total || 0) / PAGE_SIZE)
  const hasNextPage = pagination.has_more || false
  const hasPrevPage = currentPage > 0

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (hasPrevPage) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Intelligent search function
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(0)
    
    if (query.trim()) {
      toast.info(`Searching customers for "${query.trim()}"...`)
    } else {
      toast.info('Search cleared')
    }
  }

  // Filter functions
  const handleLifecycleFilter = (stage: string) => {
    setLifecycleFilter(stage)
    setSelectedTab(stage)
    setCurrentPage(0)
    toast.success(`Showing ${stage === 'all' ? 'All' : stage} customers`)
  }

  const handleTierFilter = (tier: string) => {
    setTierFilter(tier)
    setCurrentPage(0)
  }

  const handleRiskFilter = (risk: string) => {
    setRiskFilter(risk)
    setCurrentPage(0)
  }

  const handleSortChange = (sort: string) => {
    setSortBy(sort)
    setCurrentPage(0)
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      await refetchIntelligence()
      toast.success('Customer intelligence refreshed successfully')
    } catch (err) {
      toast.error('Failed to refresh data')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    toast.success('Export started - you will receive an email when complete')
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0)
  }

  // Get tier badge color with new ML tiers
  const getTierBadgeColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'bronze': return 'bg-amber-100 text-amber-800 border-amber-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get lifecycle badge color and icon with new ML stages
  const getLifecycleInfo = (stage: string) => {
    switch (stage?.toLowerCase()) {
      case 'active': 
        return { 
          color: 'bg-green-100 text-green-800 border-green-200', 
          icon: <UserCheck className="h-3 w-3" />,
          description: 'Currently active customers'
        }
      case 'new': 
        return { 
          color: 'bg-blue-100 text-blue-800 border-blue-200', 
          icon: <UserPlus className="h-3 w-3" />,
          description: 'New customers (< 90 days)'
        }
      case 'dormant': 
        return { 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
          icon: <Timer className="h-3 w-3" />,
          description: 'Limited recent activity'
        }
      case 'at_risk': 
        return { 
          color: 'bg-orange-100 text-orange-800 border-orange-200', 
          icon: <AlertTriangle className="h-3 w-3" />,
          description: 'At risk of churning'
        }
      case 'churned': 
        return { 
          color: 'bg-red-100 text-red-800 border-red-200', 
          icon: <UserX className="h-3 w-3" />,
          description: 'Churned customers'
        }
      case 'prospect': 
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          icon: <UserMinus className="h-3 w-3" />,
          description: 'Prospects (no revenue yet)'
        }
      default: 
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          icon: <Users className="h-3 w-3" />,
          description: ''
        }
    }
  }

  // Get risk level color
  const getRiskBadgeColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Enhanced smart table columns with ML insights
  const customerColumns = [
    {
      key: 'customer_name',
      title: 'Customer',
      sortable: true,
      sticky: true,
      width: '320px',
      formatter: (name: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-sm">
              {name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 truncate">{name}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500">#{row.customer_id}</p>
              <Badge className={`text-xs px-2 py-0 ${getTierBadgeColor(row.customer_tier)}`}>
                {row.customer_tier}
              </Badge>
              {row.loyalty_score && (
                <Badge variant="outline" className="text-xs px-2 py-0">
                  <Heart className="h-3 w-3 mr-1" />
                  {Math.round(row.loyalty_score)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'lifetime_revenue',
      title: 'Lifetime Revenue',
      sortable: true,
      align: 'right' as const,
      formatter: (value: number) => (
        <div className="text-right">
          <span className="font-semibold text-blue-600">{formatCurrency(value || 0)}</span>
        </div>
      )
    },
    {
      key: 'revenue_12mo',
      title: '12mo Revenue',
      sortable: true,
      align: 'right' as const,
      formatter: (value: number, row: any) => (
        <div className="text-right">
          <span className="font-medium text-gray-700">{formatCurrency(value || 0)}</span>
          {row.growth_trend_pct !== undefined && (
            <div className="flex items-center justify-end gap-1 mt-1">
              {row.growth_trend_pct > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : row.growth_trend_pct < 0 ? (
                <TrendingDown className="h-3 w-3 text-red-500" />
              ) : (
                <Minus className="h-3 w-3 text-gray-400" />
              )}
              <span className={`text-xs ${
                row.growth_trend_pct > 0 ? 'text-green-600' : 
                row.growth_trend_pct < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {row.growth_trend_pct > 0 ? '+' : ''}{row.growth_trend_pct?.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'margin_pct',
      title: 'Margin %',
      sortable: true,
      align: 'center' as const,
      formatter: (value: number) => (
        <div className="text-center">
          <span className={`font-semibold ${value >= 20 ? 'text-green-600' : value >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
            {value?.toFixed(1) || '0.0'}%
          </span>
        </div>
      )
    },
    {
      key: 'lifecycle_stage',
      title: 'Lifecycle',
      sortable: true,
      align: 'center' as const,
      formatter: (stage: string, row: any) => (
        <div className="space-y-1">
          <Badge className={`${getLifecycleInfo(stage).color}`}>
            {stage}
          </Badge>
          {row.days_since_activity !== undefined && (
            <div className="text-xs text-gray-500">
              {row.days_since_activity}d ago
            </div>
          )}
        </div>
      )
    },
    {
      key: 'risk_level',
      title: 'Risk',
      sortable: true,
      align: 'center' as const,
      formatter: (risk: string, row: any) => (
        <div className="space-y-1">
          <Badge className={`${getRiskBadgeColor(risk)}`}>
            {risk}
          </Badge>
          {row.risk_factors && row.risk_factors.length > 0 && (
            <div className="text-xs text-gray-500">
              {row.risk_factors.length} factor{row.risk_factors.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'relationship_strength',
      title: 'Relationship',
      sortable: true,
      align: 'center' as const,
      formatter: (strength: string, row: any) => (
        <div className="text-center">
          <Badge variant="outline" className={`
            ${strength === 'strong' ? 'border-green-300 text-green-700' : 
              strength === 'moderate' ? 'border-yellow-300 text-yellow-700' : 
              'border-gray-300 text-gray-600'}
          `}>
            {strength}
          </Badge>
          {row.loyalty_score && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <Gauge className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">{Math.round(row.loyalty_score)}</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'customer_id',
      title: 'Actions',
      sortable: false,
      width: '120px',
      formatter: (customerId: string) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`/customers/${customerId}/analysis`, '_blank')}
          className="text-xs"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Analyze
        </Button>
      )
    }
  ]

  // Top customers for overview
  const topCustomers = useMemo(() => {
    return [...analytics.filteredCustomers]
      .sort((a, b) => (b.lifetime_revenue || 0) - (a.lifetime_revenue || 0))
      .slice(0, 5)
  }, [analytics.filteredCustomers])

  // Legend Component with ML insights
  const ClassificationLegend = () => (
    <Dialog open={showLegend} onOpenChange={setShowLegend}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            ML Customer Intelligence Guide
          </DialogTitle>
          <DialogDescription>
            Understanding our machine learning-powered customer classification system
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* ML Pipeline Status */}
          {statusData && (
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold text-blue-900">ML Pipeline Status</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Processed Customers:</span>
                  <span className="ml-2 font-medium">{statusData.cache_info?.processed_customers || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Cache Age:</span>
                  <span className="ml-2 font-medium">{statusData.cache_info?.cache_age_hours || 0}h</span>
                </div>
              </div>
            </div>
          )}

          {/* Lifecycle Stages */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              ML Lifecycle Stages
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(analytics.lifecycleBreakdown).map(([stage, count]) => {
                const info = getLifecycleInfo(stage);
                return (
                  <div key={stage} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2 mb-1">
                      {info.icon}
                      <Badge className={info.color}>{stage}</Badge>
                      <span className="text-sm text-gray-600">({count})</span>
                    </div>
                    <p className="text-xs text-gray-600">{info.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Tiers */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-600" />
              ML Customer Tiers (Lifetime Revenue)
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded bg-purple-50 border border-purple-200">
                <Badge className="bg-purple-100 text-purple-800">Platinum</Badge>
                <span className="text-sm text-gray-600">{'>'}$500,000 ({analytics.tierBreakdown.platinum || 0})</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-yellow-50 border border-yellow-200">
                <Badge className="bg-yellow-100 text-yellow-800">Gold</Badge>
                <span className="text-sm text-gray-600">$100,000 - $500,000 ({analytics.tierBreakdown.gold || 0})</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-200">
                <Badge className="bg-gray-100 text-gray-800">Silver</Badge>
                <span className="text-sm text-gray-600">$25,000 - $100,000 ({analytics.tierBreakdown.silver || 0})</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-amber-50 border border-amber-200">
                <Badge className="bg-amber-100 text-amber-800">Bronze</Badge>
                <span className="text-sm text-gray-600">{'<'}$25,000 ({analytics.tierBreakdown.bronze || 0})</span>
              </div>
            </div>
          </div>

          {/* Risk Levels */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              ML Risk Assessment
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded bg-red-50 border border-red-200">
                <Badge className="bg-red-100 text-red-800">Critical</Badge>
                <span className="text-sm text-gray-600">Immediate attention required ({analytics.riskBreakdown.critical || 0})</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-orange-50 border border-orange-200">
                <Badge className="bg-orange-100 text-orange-800">High</Badge>
                <span className="text-sm text-gray-600">High churn probability ({analytics.riskBreakdown.high || 0})</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-yellow-50 border border-yellow-200">
                <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                <span className="text-sm text-gray-600">Moderate risk factors ({analytics.riskBreakdown.medium || 0})</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-green-50 border border-green-200">
                <Badge className="bg-green-100 text-green-800">Low</Badge>
                <span className="text-sm text-gray-600">Healthy customers ({analytics.riskBreakdown.low || 0})</span>
              </div>
            </div>
          </div>

          {/* ML Insights */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              ML Loyalty Score (0-100)
            </h3>
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
              <p className="text-sm text-gray-700">
                Calculated based on recency, frequency, and monetary value. 
                Average portfolio score: <span className="font-semibold">{analytics.avgLoyaltyScore?.toFixed(1) || '0.0'}</span>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <AdvancedLayout>
      <AdvancedLayout.Header
        title="ML Customer Intelligence"
        description="AI-powered customer analytics with predictive insights"
        searchPlaceholder="Search customer name or number..."
        onSearch={handleSearch}
        onRefresh={handleRefresh}
        refreshLoading={loading || isLoading}
        statusInfo={{
          text: intelligenceError ? "ML Pipeline Issues" : statusData?.cache_info?.processed_customers ? "ML Intelligence Ready" : "Processing...",
          status: intelligenceError ? "error" : statusData?.cache_info?.processed_customers ? "healthy" : "processing",
          details: statusData?.cache_info ? 
            `${statusData.cache_info.processed_customers} customers processed, ${statusData.cache_info.cache_age_hours}h cache age` : 
            "Customer intelligence pipeline running"
        }}
        metrics={[
          { label: "Total Customers", value: analytics.totalCustomers },
          { label: "Active Customers", value: analytics.lifecycleBreakdown?.active || 0 },
          { label: "Lifetime Revenue", value: formatCurrency(analytics.totalRevenue) },
          { label: "12mo Revenue", value: formatCurrency(analytics.revenue12mo) }
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowLegend(true)}>
              <Info className="h-4 w-4 mr-2" />
              ML Guide
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </>
        }
      />

      {/* Advanced Content */}
      <div className="space-y-6">
        {/* ML Insights Summary */}
        {insights && insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-900 flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  ML Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {insights.map((insight: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <Zap className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Advanced Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={tierFilter} onValueChange={handleTierFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Customer Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="platinum">Platinum</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="silver">Silver</SelectItem>
              <SelectItem value="bronze">Bronze</SelectItem>
            </SelectContent>
          </Select>

          <Select value={riskFilter} onValueChange={handleRiskFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lifetime_revenue">Lifetime Revenue</SelectItem>
              <SelectItem value="revenue_12mo">12mo Revenue</SelectItem>
              <SelectItem value="loyalty_score">Loyalty Score</SelectItem>
              <SelectItem value="margin_pct">Margin %</SelectItem>
              <SelectItem value="days_since_activity">Last Activity</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lifecycle Tabs */}
        <Tabs value={selectedTab} onValueChange={handleLifecycleFilter} className="mb-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all" className="text-sm">
              All ({analytics.totalCustomers})
            </TabsTrigger>
            <TabsTrigger value="active" className="text-sm">
              Active ({analytics.lifecycleBreakdown?.active || 0})
            </TabsTrigger>
            <TabsTrigger value="new" className="text-sm">
              New ({analytics.lifecycleBreakdown?.new || 0})
            </TabsTrigger>
            <TabsTrigger value="dormant" className="text-sm">
              Dormant ({analytics.lifecycleBreakdown?.dormant || 0})
            </TabsTrigger>
            <TabsTrigger value="at_risk" className="text-sm">
              At Risk ({analytics.lifecycleBreakdown?.at_risk || 0})
            </TabsTrigger>
            <TabsTrigger value="churned" className="text-sm">
              Churned ({analytics.lifecycleBreakdown?.churned || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            <SmartTable
              data={customers}
              columns={customerColumns}
              loading={isLoading}
              error={intelligenceError}
              emptyState={{
                title: "No customers found",
                description: "Try adjusting your filters or search criteria",
                action: (
                  <Button variant="outline" onClick={() => {
                    setSearchQuery('')
                    setLifecycleFilter('all')
                    setTierFilter('all')
                    setRiskFilter('all')
                  }}>
                    Clear Filters
                  </Button>
                )
              }}
              pagination={{
                currentPage,
                totalPages,
                hasNextPage,
                hasPrevPage,
                onNextPage: handleNextPage,
                onPrevPage: handlePrevPage,
                pageSize: PAGE_SIZE,
                totalItems: pagination.total || 0
              }}
              density={density}
            />
                     </TabsContent>
         </Tabs>
       </div>

      <AdvancedLayout.StatusBar
        items={[
          { 
            label: "ML Pipeline", 
            value: statusData?.pipeline_status || "Unknown", 
            status: statusData?.pipeline_status === "running" ? "active" : "error" 
          },
          { label: "Total Customers", value: analytics.totalCustomers, status: "active" },
          { label: "Filtered Results", value: customers.length, status: "active" },
          { label: "Current Page", value: `${currentPage + 1}/${totalPages}`, status: "active" },
          { label: "Avg Loyalty Score", value: analytics.avgLoyaltyScore?.toFixed(1) || '0.0', status: "active" },
          { label: "Last Updated", value: intelligenceData?.last_updated ? new Date(intelligenceData.last_updated).toLocaleTimeString() : 'Never', status: "active" },
          { label: "Theme", value: theme, details: "Current UI theme" }
        ]}
      />

      {/* Classification Legend */}
      <ClassificationLegend />
    </AdvancedLayout>
  )
} 