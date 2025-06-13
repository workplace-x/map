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
  Building2, TrendingUp, DollarSign, Target, AlertTriangle, Timer,
  Settings, Download, ExternalLink, RefreshCw, Filter, Trophy,
  TrendingDown, Clock, Shield, Star, Info, HelpCircle, Zap,
  Activity, Package, Users, Eye, Brain, BarChart3, Minus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'

const PAGE_SIZE = 50

// ML Vendor Intelligence API Hook
function useVendorIntelligence(params: {
  status?: string
  search?: string
  sort_by?: string
  limit?: number
  offset?: number
  risk_level?: string
}) {
  return useQuery({
    queryKey: ['vendor-intelligence', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      
      if (params.status && params.status !== 'all') {
        searchParams.append('status', params.status)
      }
      if (params.search) searchParams.append('search', params.search)
      if (params.sort_by) searchParams.append('sort_by', params.sort_by)
      if (params.limit) searchParams.append('limit', params.limit.toString())
      if (params.offset) searchParams.append('offset', params.offset.toString())
      if (params.risk_level && params.risk_level !== 'all') {
        searchParams.append('risk_level', params.risk_level)
      }

      const response = await fetch(`/api/vendor-intelligence-fast?${searchParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch vendor intelligence')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// ML Vendor Intelligence Status Hook
function useVendorIntelligenceStatus() {
  return useQuery({
    queryKey: ['vendor-intelligence-status'],
    queryFn: async () => {
      const response = await fetch('/api/vendor-intelligence-fast/status')
      if (!response.ok) {
        throw new Error('Failed to fetch status')
      }
      return response.json()
    },
    refetchInterval: 30 * 1000, // 30 seconds
  })
}

export default function VendorIntelligenceDashboard() {
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedTab, setSelectedTab] = useState('active')
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('lifetime_spend')
  const [showLegend, setShowLegend] = useState(false)
  const { theme, density } = useLayoutContext()

  // Fetch ML Vendor Intelligence data
  const {
    data: intelligenceData,
    isLoading: intelligenceLoading,
    error: intelligenceError,
    refetch: refetchIntelligence
  } = useVendorIntelligence({
    status: statusFilter,
    search: searchQuery,
    sort_by: sortBy,
    limit: PAGE_SIZE,
    offset: currentPage * PAGE_SIZE,
    risk_level: riskFilter
  })

  // Fetch pipeline status
  const { data: statusData } = useVendorIntelligenceStatus()

  const isLoading = intelligenceLoading

  // Extract data from ML response
  const vendors = intelligenceData?.vendors || []
  const summary = intelligenceData?.summary || {}
  const insights = intelligenceData?.insights || []
  const pagination = intelligenceData?.pagination || {}

  // Enhanced analytics from ML data
  const analytics = useMemo(() => {
    if (!summary.status_breakdown) {
      return {
        totalVendors: 0,
        statusBreakdown: { active: 0, new: 0, dormant: 0, inactive: 0 },
        riskBreakdown: { low: 0, medium: 0, high: 0, critical: 0 },
        totalSpend: 0,
        spend12mo: 0,
        avgPerformance: 0,
        filteredVendors: vendors
      }
    }

    return {
      totalVendors: summary.total_vendors || 0,
      statusBreakdown: summary.status_breakdown || {},
      riskBreakdown: summary.risk_breakdown || {},
      totalSpend: summary.total_spend || 0,
      spend12mo: summary.spend_12mo || 0,
      avgPerformance: summary.avg_performance || 0,
      filteredVendors: vendors
    }
  }, [summary, vendors])

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
      toast.info(`Searching vendors for "${query.trim()}"...`)
    } else {
      toast.info('Search cleared')
    }
  }

  // Filter functions
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    setSelectedTab(status)
    setCurrentPage(0)
    toast.success(`Showing ${status === 'all' ? 'All' : status} vendors`)
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
      toast.success('Vendor intelligence refreshed successfully')
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

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'dormant': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get status badge info
  const getStatusInfo = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': 
        return { 
          color: 'bg-green-100 text-green-800 border-green-200', 
          icon: <Activity className="h-3 w-3" />,
          description: 'Currently active vendors'
        }
      case 'new': 
        return { 
          color: 'bg-blue-100 text-blue-800 border-blue-200', 
          icon: <Star className="h-3 w-3" />,
          description: 'New vendors (< 90 days)'
        }
      case 'dormant': 
        return { 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
          icon: <Timer className="h-3 w-3" />,
          description: 'Limited recent activity'
        }
      case 'inactive': 
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          icon: <Clock className="h-3 w-3" />,
          description: 'No recent activity'
        }
      default: 
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          icon: <Building2 className="h-3 w-3" />,
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
  const vendorColumns = [
    {
      key: 'vendor_name',
      title: 'Vendor',
      sortable: true,
      sticky: true,
      width: '320px',
      formatter: (name: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
            <span className="text-purple-600 font-semibold text-sm">
              {name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 truncate">{name}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500">#{row.vendor_id}</p>
              <Badge className={`text-xs px-2 py-0 ${getStatusBadgeColor(row.status)}`}>
                {row.status}
              </Badge>
              {row.performance_score && (
                <Badge variant="outline" className="text-xs px-2 py-0">
                  <Target className="h-3 w-3 mr-1" />
                  {Math.round(row.performance_score)}%
                </Badge>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'lifetime_spend',
      title: 'Lifetime Spend',
      sortable: true,
      align: 'right' as const,
      formatter: (value: number) => (
        <div className="text-right">
          <span className="font-semibold text-purple-600">{formatCurrency(value || 0)}</span>
        </div>
      )
    },
    {
      key: 'spend_12mo',
      title: '12mo Spend',
      sortable: true,
      align: 'right' as const,
      formatter: (value: number, row: any) => (
        <div className="text-right">
          <span className="font-medium text-gray-700">{formatCurrency(value || 0)}</span>
          {row.spend_trend !== undefined && (
            <div className="flex items-center justify-end gap-1 mt-1">
              {row.spend_trend > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : row.spend_trend < 0 ? (
                <TrendingDown className="h-3 w-3 text-red-500" />
              ) : (
                <Minus className="h-3 w-3 text-gray-400" />
              )}
              <span className={`text-xs ${
                row.spend_trend > 0 ? 'text-green-600' : 
                row.spend_trend < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {row.spend_trend > 0 ? '+' : ''}{row.spend_trend?.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'performance_pct',
      title: 'Performance %',
      sortable: true,
      align: 'center' as const,
      formatter: (value: number) => (
        <div className="text-center">
          <span className={`font-semibold ${value >= 90 ? 'text-green-600' : value >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
            {value?.toFixed(1) || '0.0'}%
          </span>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      align: 'center' as const,
      formatter: (status: string, row: any) => (
        <div className="space-y-1">
          <Badge className={`${getStatusInfo(status).color}`}>
            {status}
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
      key: 'diversity_score',
      title: 'Diversity',
      sortable: true,
      align: 'center' as const,
      formatter: (score: number, row: any) => (
        <div className="text-center">
          <Badge variant="outline" className={`
            ${score > 75 ? 'border-green-300 text-green-700' : 
              score > 50 ? 'border-yellow-300 text-yellow-700' : 
              'border-gray-300 text-gray-600'}
          `}>
            {Math.round(score || 0)}%
          </Badge>
          {row.catalog_diversity && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <Package className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">{row.catalog_diversity} items</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'vendor_id',
      title: 'Actions',
      sortable: false,
      width: '120px',
      formatter: (vendorId: string) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`/vendors/${vendorId}/analysis`, '_blank')}
          className="text-xs"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Analyze
        </Button>
      )
    }
  ]

  // Top vendors for overview
  const topVendors = useMemo(() => {
    return [...analytics.filteredVendors]
      .sort((a, b) => (b.lifetime_spend || 0) - (a.lifetime_spend || 0))
      .slice(0, 5)
  }, [analytics.filteredVendors])

  // Legend Component with ML insights
  const ClassificationLegend = () => (
    <Dialog open={showLegend} onOpenChange={setShowLegend}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            ML Vendor Intelligence Guide
          </DialogTitle>
          <DialogDescription>
            Understanding our machine learning-powered vendor classification system
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
                  <span className="text-gray-600">Processed Vendors:</span>
                  <span className="ml-2 font-medium">{statusData.cache_info?.processed_vendors || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Cache Age:</span>
                  <span className="ml-2 font-medium">{statusData.cache_info?.cache_age_hours || 0}h</span>
                </div>
              </div>
            </div>
          )}

          {/* Status Categories */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              ML Status Categories
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(analytics.statusBreakdown).map(([status, count]) => {
                const info = getStatusInfo(status);
                return (
                  <div key={status} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2 mb-1">
                      {info.icon}
                      <Badge className={info.color}>{status}</Badge>
                      <span className="text-sm text-gray-600">({count})</span>
                    </div>
                    <p className="text-xs text-gray-600">{info.description}</p>
                  </div>
                );
              })}
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
                <span className="text-sm text-gray-600">High risk factors ({analytics.riskBreakdown.high || 0})</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-yellow-50 border border-yellow-200">
                <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                <span className="text-sm text-gray-600">Moderate risk factors ({analytics.riskBreakdown.medium || 0})</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-green-50 border border-green-200">
                <Badge className="bg-green-100 text-green-800">Low</Badge>
                <span className="text-sm text-gray-600">Healthy vendors ({analytics.riskBreakdown.low || 0})</span>
              </div>
            </div>
          </div>

          {/* ML Performance Scoring */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              ML Performance Scoring (0-100%)
            </h3>
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
              <p className="text-sm text-gray-700">
                Calculated based on margin performance, delivery reliability, and order consistency. 
                Average portfolio performance: <span className="font-semibold">{analytics.avgPerformance?.toFixed(1) || '0.0'}%</span>
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
        title="ML Vendor Intelligence"
        description="AI-powered vendor analytics with predictive insights and performance optimization"
        searchPlaceholder="Search vendor name or number..."
        onSearch={handleSearch}
        onRefresh={handleRefresh}
        refreshLoading={loading || isLoading}
        statusInfo={{
          text: intelligenceError ? "ML Pipeline Issues" : statusData?.cache_info?.processed_vendors ? "ML Intelligence Ready" : "Processing...",
          status: intelligenceError ? "error" : statusData?.cache_info?.processed_vendors ? "healthy" : "processing",
          details: statusData?.cache_info ? 
            `${statusData.cache_info.processed_vendors} vendors processed, ${statusData.cache_info.cache_age_hours}h cache age` : 
            "Vendor intelligence pipeline running"
        }}
        metrics={[
          { label: "Total Vendors", value: analytics.totalVendors },
          { label: "Active Vendors", value: analytics.statusBreakdown?.active || 0 },
          { label: "Lifetime Spend", value: formatCurrency(analytics.totalSpend) },
          { label: "12mo Spend", value: formatCurrency(analytics.spend12mo) }
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
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-purple-900 flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  ML Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {insights.map((insight: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <Zap className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-purple-800">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Advanced Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
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
              <SelectItem value="lifetime_spend">Lifetime Spend</SelectItem>
              <SelectItem value="spend_12mo">12mo Spend</SelectItem>
              <SelectItem value="performance_pct">Performance %</SelectItem>
              <SelectItem value="days_since_activity">Last Activity</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Tabs */}
        <Tabs value={selectedTab} onValueChange={handleStatusFilter} className="mb-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="text-sm">
              All ({analytics.totalVendors})
            </TabsTrigger>
            <TabsTrigger value="active" className="text-sm">
              Active ({analytics.statusBreakdown?.active || 0})
            </TabsTrigger>
            <TabsTrigger value="new" className="text-sm">
              New ({analytics.statusBreakdown?.new || 0})
            </TabsTrigger>
            <TabsTrigger value="dormant" className="text-sm">
              Dormant ({analytics.statusBreakdown?.dormant || 0})
            </TabsTrigger>
            <TabsTrigger value="inactive" className="text-sm">
              Inactive ({analytics.statusBreakdown?.inactive || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            <SmartTable
              data={vendors}
              columns={vendorColumns}
              loading={isLoading}
              error={intelligenceError}
              emptyState={{
                title: "No vendors found",
                description: "Try adjusting your filters or search criteria",
                action: (
                  <Button variant="outline" onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
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
          { label: "Total Vendors", value: analytics.totalVendors, status: "active" },
          { label: "Filtered Results", value: vendors.length, status: "active" },
          { label: "Current Page", value: `${currentPage + 1}/${totalPages}`, status: "active" },
          { label: "Avg Performance", value: `${analytics.avgPerformance?.toFixed(1) || '0.0'}%`, status: "active" },
          { label: "Last Updated", value: intelligenceData?.last_updated ? new Date(intelligenceData.last_updated).toLocaleTimeString() : 'Never', status: "active" },
          { label: "Theme", value: theme, details: "Current UI theme" }
        ]}
      />

      {/* Classification Legend */}
      <ClassificationLegend />
    </AdvancedLayout>
  )
} 