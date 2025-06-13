import React, { useState, useMemo } from 'react'
import { 
  AdvancedLayout
} from '@/components/layout/advanced-layout-system'
import { 
  SmartKPI, 
  SmartTable 
} from '@/components/advanced/smart-data-components'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calculator, TrendingUp, AlertTriangle, DollarSign, 
  Settings, Download, Target, Filter, Search, Users, 
  Package, Building, Clock, Zap, CheckCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  useMarginAnalysis
} from '@/hooks/api-hooks'

interface OrderAnalysis {
  order_no: string
  order_title: string
  order_type: string
  is_quote: boolean
  customer_name: string
  salesperson_name: string
  salesperson_id: string
  total_sell: number
  total_cost: number
  margin_pct: number
  approval_required: boolean
  approval_level: string
  approval_urgency: string
  optimization_potential: number
  performance_vs_target: number
  historical_comparison?: {
    customer_avg_margin: number
    salesperson_avg_margin: number
    vendor_performance: string
  }
  line_items?: Array<{
    line_no: number
    description: string
    unit_sell: number
    unit_cost: number
    margin_pct: number
    vendor: string
    status: string
    recommendation: string
  }>
}

interface ApprovalRequest {
  id: string
  order_no: string
  approval_level: string
  assigned_to_name: string
  due_date: string
  status: string
  business_justification: string
}

interface SalespersonTarget {
  salesperson_id: string
  name: string
  current_margin: number
  target_margin: number
  achievement_pct: number
  orders_count: number
  total_revenue: number
  trend: 'improving' | 'declining' | 'stable'
  risk_level: 'low' | 'medium' | 'high'
  opportunities: Array<{
    type: string
    description: string
    potential_value: number
  }>
}

export default function MarginAnalysis() {
  const [selectedTab, setSelectedTab] = useState('search')
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    period: 'this_month',
    low_margin_only: false,
    high_risk_only: false,
    sales_team_only: false
  })

  // New state for intelligent analysis
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<OrderAnalysis[]>([])
  const [selectedOrder, setSelectedOrder] = useState<OrderAnalysis | null>(null)
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([])
  const [salespersonTargets, setSalespersonTargets] = useState<SalespersonTarget[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch margin analysis data using real API hooks
  const { 
    data: marginData, 
    isLoading: loadingAnalysis, 
    error: analysisError,
    refetch: refetchAnalysis
  } = useMarginAnalysis(filters)

  // Calculate analytics from the data
  const analytics = useMemo(() => {
    if (!marginData) return {
      totalOrders: 0,
      avgMargin: 0,
      atRiskOrders: 0,
      totalValue: 0,
      highMarginOrders: 0,
      pendingApprovals: 0,
      opportunityValue: 0
    }

    return {
      totalOrders: marginData.orders?.length || 0,
      avgMargin: marginData.summary?.avg_margin_pct || 0,
      atRiskOrders: marginData.summary?.at_risk_count || 0,
      totalValue: marginData.summary?.total_value || 0,
      highMarginOrders: marginData.orders?.filter((order: any) => order.margin_pct > 25).length || 0,
      pendingApprovals: pendingApprovals.length,
      opportunityValue: searchResults.reduce((sum, order) => sum + (order.optimization_potential || 0) * order.total_sell / 100, 0)
    }
  }, [marginData, pendingApprovals, searchResults])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      await refetchAnalysis()
      await loadPendingApprovals()
      toast.success('Margin analysis data refreshed successfully')
    } catch (err) {
      toast.error('Failed to refresh data')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    toast.success('Export started - you will receive an email when complete')
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // NEW: Intelligent Search Function
  const handleIntelligentSearch = async () => {
    if (!searchQuery.trim()) return

    setSearchLoading(true)
    setError('')
    
    try {
      // Use the intelligent margin analysis API
      const response = await fetch(`/api/margin-analysis?search=${encodeURIComponent(searchQuery)}&include_historical=true&include_line_items=true&include_approvals=true`)
      const data = await response.json()

      if (data.orders && data.orders.length > 0) {
        // Transform API response to match our interface
        const transformedResults = data.orders.map((order: any) => ({
          order_no: order.order_no,
          order_title: order.order_title || `${order.order_type === 'Q' ? 'Quote' : 'Order'} ${order.order_no}`,
          order_type: order.order_type,
          is_quote: order.order_type === 'Q',
          customer_name: order.customer_name,
          salesperson_name: order.salesperson_name,
          salesperson_id: order.salesperson_id,
          total_sell: order.total_sell || 0,
          total_cost: order.total_cost || 0,
          margin_pct: order.margin_pct || 0,
          approval_required: order.approval_required || false,
          approval_level: order.approval_level || 'NONE',
          approval_urgency: order.approval_urgency || 'none',
          optimization_potential: order.optimization_potential || 0,
          performance_vs_target: order.performance_vs_target || 0,
          historical_comparison: order.historical_comparison,
          line_items: order.line_items
        }))
        
        setSearchResults(transformedResults)
        
        // If single result, auto-select it for detailed analysis
        if (transformedResults.length === 1) {
          await analyzeOrderInDetail(transformedResults[0])
        }
      } else {
        setError('No orders found matching your search criteria')
        setSearchResults([])
      }
    } catch (error) {
      setError(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSearchLoading(false)
    }
  }

  // NEW: Detailed Order Analysis
  const analyzeOrderInDetail = async (order: OrderAnalysis) => {
    setSelectedOrder(order)
    setSelectedTab('analysis')
    
    try {
      // Get detailed analysis including historical comparisons
      const detailResponse = await fetch(`/api/margin-analysis/orders/${order.order_no}/margin`)
      const detailData = await detailResponse.json()
      
      // Update selected order with detailed analysis
      setSelectedOrder({
        ...order,
        ...detailData,
        historical_comparison: detailData.historical_comparison,
        line_items: detailData.line_items
      })
    } catch (error) {
      console.error('Error loading order details:', error)
    }
  }

  // NEW: Load Pending Approvals
  const loadPendingApprovals = async () => {
    try {
      const userId = 'current-user-id' // Replace with actual user ID from auth
      const response = await fetch(`/api/margin-analysis/approval-dashboard/${userId}`)
      const data = await response.json()
      
      if (data.approvals?.assigned_to_me) {
        setPendingApprovals(data.approvals.assigned_to_me)
      }
    } catch (error) {
      console.error('Error loading approvals:', error)
    }
  }

  // NEW: Load Salesperson Targets
  const loadSalespersonTargets = async () => {
    try {
      const userId = 'current-user-id' // Replace with actual user ID
      const response = await fetch(`/api/margin-analysis/salesperson/${userId}/dashboard?include_targets=true&include_opportunities=true`)
      const data = await response.json()
      
      if (data.team_comparison?.team_members) {
        setSalespersonTargets(data.team_comparison.team_members.map((member: any) => ({
          salesperson_id: member.salesperson_id,
          name: member.name,
          current_margin: member.avg_margin_pct,
          target_margin: 25.0, // Company target
          achievement_pct: (member.avg_margin_pct / 25.0) * 100,
          orders_count: member.orders_count,
          total_revenue: member.total_value,
          trend: member.avg_margin_pct > member.previous_month_margin ? 'improving' : 
                 member.avg_margin_pct < member.previous_month_margin ? 'declining' : 'stable',
          risk_level: member.avg_margin_pct < 15 ? 'high' : member.avg_margin_pct < 20 ? 'medium' : 'low',
          opportunities: data.opportunities || []
        })))
      }
    } catch (error) {
      console.error('Error loading salesperson targets:', error)
    }
  }

  // NEW: Create Approval Request
  const initiateApprovalRequest = async (order: OrderAnalysis) => {
    try {
      const response = await fetch('/api/margin-analysis/check-and-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_no: order.order_no,
          salesperson_id: order.salesperson_id,
          requested_by: 'current-user-id' // Replace with actual user ID
        })
      })
      
      const result = await response.json()
      
      if (result.success && result.approval_created) {
        toast.success(`Approval request created and assigned to ${result.assigned_to.name}`)
        await loadPendingApprovals() // Refresh approvals
      } else if (result.existing_approval) {
        toast.info('Approval request already exists for this order')
      } else {
        toast.info(`No approval required - margin meets thresholds (${order.margin_pct.toFixed(1)}%)`)
      }
    } catch (error) {
      toast.error(`Error creating approval request: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Load initial data
  React.useEffect(() => {
    loadPendingApprovals()
    loadSalespersonTargets()
  }, [])

  // Helper functions
  const getMarginStatusColor = (marginPct: number, isQuote: boolean) => {
    const criticalThreshold = isQuote ? 7 : 5
    const highThreshold = isQuote ? 15 : 10
    const mediumThreshold = isQuote ? 20 : 15
    
    if (marginPct < criticalThreshold) return 'text-red-600 bg-red-50'
    if (marginPct < highThreshold) return 'text-orange-600 bg-orange-50'
    if (marginPct < mediumThreshold) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const getApprovalBadge = (level: string, urgency: string) => {
    const badges = {
      CRITICAL: <Badge variant="destructive" className="animate-pulse">CRITICAL - {urgency}</Badge>,
      HIGH: <Badge variant="outline" className="border-orange-500 text-orange-600">HIGH RISK - {urgency}</Badge>,
      MEDIUM: <Badge variant="outline" className="border-yellow-500 text-yellow-600">MEDIUM - {urgency}</Badge>,
      NONE: <Badge variant="outline" className="border-green-500 text-green-600">APPROVED</Badge>
    }
    return badges[level as keyof typeof badges] || <Badge variant="outline">UNKNOWN</Badge>
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'declining': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
      default: return <div className="h-4 w-4 bg-gray-300 rounded-full" />
    }
  }

  const getRiskBadge = (level: 'low' | 'medium' | 'high') => {
    const variants = {
      low: <Badge variant="outline" className="border-green-500 text-green-600">Low Risk</Badge>,
      medium: <Badge variant="outline" className="border-yellow-500 text-yellow-600">Medium Risk</Badge>,
      high: <Badge variant="destructive">High Risk</Badge>
    }
    return variants[level] || <Badge variant="outline">Unknown</Badge>
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  // Smart table columns for margin analysis
  const marginColumns = [
    {
      key: 'order_no' as const,
      title: 'Order #',
      sortable: true,
      sticky: true,
      width: '120px',
      formatter: (orderNo: string) => (
        <span className="font-mono text-blue-600">{orderNo}</span>
      )
    },
    {
      key: 'customer_name' as const,
      title: 'Customer',
      sortable: true,
      formatter: (name: string) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-xs">
              {name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <span className="font-medium">{name}</span>
        </div>
      )
    },
    {
      key: 'total_value' as const,
      title: 'Order Value',
      sortable: true,
      align: 'right' as const,
      formatter: (value: number) => (
        <span className="font-semibold text-blue-600">{formatCurrency(value || 0)}</span>
      )
    },
    {
      key: 'margin_pct' as const,
      title: 'Margin %',
      sortable: true,
      align: 'center' as const,
      formatter: (value: number) => (
        <span className={`font-semibold px-2 py-1 rounded-full text-xs ${
          value >= 25 ? 'bg-green-100 text-green-800' : 
          value >= 15 ? 'bg-yellow-100 text-yellow-800' : 
          'bg-red-100 text-red-800'
        }`}>
          {value?.toFixed(1) || '0.0'}%
        </span>
      )
    },
    {
      key: 'salesperson_name' as const,
      title: 'Salesperson',
      sortable: true,
      formatter: (name: string) => (
        <span className="text-sm">{name}</span>
      )
    },
    {
      key: 'status' as const,
      title: 'Status',
      sortable: true,
      formatter: (status: string) => (
        <Badge variant={status === 'at_risk' ? 'destructive' : 'default'}>
          {status?.replace('_', ' ') || 'Normal'}
        </Badge>
      )
    }
  ]

  return (
    <AdvancedLayout>
      <AdvancedLayout.Header
        title="🚀 TESTING - NEW MARGIN ANALYSIS SYSTEM 🚀"
        description="Advanced margin analytics with intelligent search, approval workflows, and performance insights"
        searchPlaceholder="Search orders, customers, or order numbers..."
        onSearch={setSearchQuery}
        onRefresh={handleRefresh}
        refreshLoading={loading || loadingAnalysis}
        statusInfo={{
          text: analysisError ? "Data Issues Detected" : "Analysis Updated",
          status: analysisError ? "error" : "healthy",
          details: analysisError ? analysisError.message : "Margin data synchronized"
        }}
        metrics={[
          { label: "Total Orders", value: analytics.totalOrders },
          { label: "Avg Margin", value: `${analytics.avgMargin.toFixed(1)}%` },
          { label: "At Risk", value: analytics.atRiskOrders },
          { label: "Total Value", value: formatCurrency(analytics.totalValue) },
          { label: "Pending Approvals", value: analytics.pendingApprovals },
          { label: "Opportunity Value", value: formatCurrency(analytics.opportunityValue) }
        ]}
        actions={
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleFilterChange('low_margin_only', !filters.low_margin_only)}
              className={filters.low_margin_only ? 'bg-red-50 border-red-200' : ''}
            >
              <Filter className="h-4 w-4 mr-2" />
              Low Margin
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

      {/* Enhanced KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <SmartKPI
          title="Average Margin"
          value={analytics.avgMargin}
          format="percentage"
          icon={<TrendingUp />}
          color="blue"
          trend={{ direction: 'up', percentage: 2.3, period: 'vs last month' }}
          loading={loadingAnalysis}
          target={25}
        />
        
        <SmartKPI
          title="At Risk Orders"
          value={analytics.atRiskOrders}
          icon={<AlertTriangle />}
          color="red"
          loading={loadingAnalysis}
          subtitle="Below threshold"
          interactive
          onClick={() => handleFilterChange('low_margin_only', true)}
        />
        
        <SmartKPI
          title="Total Revenue"
          value={analytics.totalValue}
          format="currency"
          icon={<DollarSign />}
          color="green"
          trend={{ direction: 'up', percentage: 8.5, period: 'vs last period' }}
          loading={loadingAnalysis}
        />

        <SmartKPI
          title="Pending Approvals"
          value={analytics.pendingApprovals}
          icon={<Clock />}
          color="yellow"
          loading={loading}
          subtitle="Require action"
          interactive
          onClick={() => setSelectedTab('approvals')}
        />
        
        <SmartKPI
          title="High Margin Orders"
          value={analytics.highMarginOrders}
          icon={<Target />}
          color="purple"
          loading={loadingAnalysis}
          subtitle=">25% margin"
        />

        <SmartKPI
          title="Opportunity Value"
          value={analytics.opportunityValue}
          format="currency"
          icon={<Zap />}
          color="purple"
          loading={searchLoading}
          subtitle="Revenue potential"
        />
      </div>

      {/* Advanced Content with New Tabs */}
      <AdvancedLayout.Card variant="elevated" className="min-h-[600px]">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="bg-gray-100/80 backdrop-blur-sm rounded-xl border border-gray-200">
              <TabsTrigger value="search" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
                🔍 Intelligent Search
              </TabsTrigger>
              <TabsTrigger value="analysis" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
                📊 Deep Analysis
              </TabsTrigger>
              <TabsTrigger value="approvals" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
                👥 Approval Workflow
              </TabsTrigger>
              <TabsTrigger value="performance" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
                🎯 Performance Insights
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
                📋 Orders Table
              </TabsTrigger>
            </TabsList>
          </div>

          {/* NEW: Intelligent Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Smart Order Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter order number, customer name, or quote ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleIntelligentSearch()}
                  />
                  <Button onClick={handleIntelligentSearch} disabled={searchLoading}>
                    {searchLoading ? 'Analyzing...' : 'Analyze'}
                  </Button>
                </div>

                {error && (
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {searchResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h3 className="font-semibold">Analysis Results</h3>
                    {searchResults.map((order) => (
                      <Card key={order.order_no} className="cursor-pointer hover:bg-gray-50" onClick={() => analyzeOrderInDetail(order)}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{order.order_title}</h4>
                              <p className="text-sm text-gray-600">{order.customer_name} • {order.salesperson_name}</p>
                              <p className="text-sm">
                                ${order.total_sell.toLocaleString()} • 
                                <span className={`ml-1 px-2 py-1 rounded text-sm ${getMarginStatusColor(order.margin_pct, order.is_quote)}`}>
                                  {order.margin_pct.toFixed(1)}% margin
                                </span>
                              </p>
                            </div>
                            <div className="text-right space-y-1">
                              {getApprovalBadge(order.approval_level, order.approval_urgency)}
                              {order.optimization_potential > 0 && (
                                <p className="text-xs text-purple-600">
                                  +{order.optimization_potential.toFixed(1)}% potential
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* NEW: Deep Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            {selectedOrder ? (
              <div className="space-y-4">
                {/* Order Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{selectedOrder.order_title} - Deep Analysis</span>
                      {selectedOrder.approval_required && (
                        <Button onClick={() => initiateApprovalRequest(selectedOrder)} variant="outline" size="sm">
                          Request Approval
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Order Details</h4>
                        <p><strong>Customer:</strong> {selectedOrder.customer_name}</p>
                        <p><strong>Salesperson:</strong> {selectedOrder.salesperson_name}</p>
                        <p><strong>Type:</strong> {selectedOrder.is_quote ? 'Quote' : 'Order'}</p>
                        <p><strong>Value:</strong> ${selectedOrder.total_sell.toLocaleString()}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Margin Analysis</h4>
                        <p><strong>Current Margin:</strong> 
                          <span className={`ml-1 px-2 py-1 rounded ${getMarginStatusColor(selectedOrder.margin_pct, selectedOrder.is_quote)}`}>
                            {selectedOrder.margin_pct.toFixed(1)}%
                          </span>
                        </p>
                        <p><strong>Margin Value:</strong> ${(selectedOrder.total_sell - selectedOrder.total_cost).toLocaleString()}</p>
                        <p><strong>Cost:</strong> ${selectedOrder.total_cost.toLocaleString()}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Performance vs Target</h4>
                        {selectedOrder.historical_comparison && (
                          <>
                            <p><strong>Customer Avg:</strong> {selectedOrder.historical_comparison.customer_avg_margin.toFixed(1)}%</p>
                            <p><strong>Salesperson Avg:</strong> {selectedOrder.historical_comparison.salesperson_avg_margin.toFixed(1)}%</p>
                            <p><strong>Vendor Performance:</strong> {selectedOrder.historical_comparison.vendor_performance}</p>
                          </>
                        )}
                        {selectedOrder.optimization_potential > 0 && (
                          <p className="text-purple-600"><strong>Optimization Potential:</strong> +{selectedOrder.optimization_potential.toFixed(1)}%</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Line Item Analysis */}
                {selectedOrder.line_items && selectedOrder.line_items.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Line Item Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Line</th>
                              <th className="text-left p-2">Description</th>
                              <th className="text-right p-2">Unit Sell</th>
                              <th className="text-right p-2">Unit Cost</th>
                              <th className="text-right p-2">Margin %</th>
                              <th className="text-left p-2">Vendor</th>
                              <th className="text-left p-2">Status</th>
                              <th className="text-left p-2">Recommendation</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrder.line_items.map((line) => (
                              <tr key={line.line_no} className="border-b">
                                <td className="p-2">{line.line_no}</td>
                                <td className="p-2">{line.description}</td>
                                <td className="p-2 text-right">${line.unit_sell.toFixed(2)}</td>
                                <td className="p-2 text-right">${line.unit_cost.toFixed(2)}</td>
                                <td className={`p-2 text-right ${getMarginStatusColor(line.margin_pct, selectedOrder.is_quote)}`}>
                                  {line.margin_pct.toFixed(1)}%
                                </td>
                                <td className="p-2">{line.vendor}</td>
                                <td className="p-2">
                                  <Badge variant={line.status === 'excellent' ? 'default' : line.status === 'good' ? 'secondary' : 'destructive'}>
                                    {line.status}
                                  </Badge>
                                </td>
                                <td className="p-2 text-xs">{line.recommendation}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Order Selected</h3>
                  <p className="text-gray-600">Search for an order to see detailed margin analysis and recommendations</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* NEW: Approval Workflow Tab */}
          <TabsContent value="approvals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Approval Workflow Dashboard</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingApprovals.length > 0 ? (
                  <div className="space-y-3">
                    {pendingApprovals.map((approval) => (
                      <Card key={approval.id} className="border-l-4 border-l-orange-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{approval.order_no}</h4>
                              <p className="text-sm text-gray-600">{approval.business_justification}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Due: {new Date(approval.due_date).toLocaleDateString()} • 
                                Assigned to: {approval.assigned_to_name}
                              </p>
                            </div>
                            <div className="space-x-2">
                              {getApprovalBadge(approval.approval_level, 'pending')}
                              <Button size="sm" variant="outline">Review</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Pending Approvals</h3>
                    <p className="text-gray-600">All margin approvals are up to date</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* NEW: Performance Insights Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Salesperson Margin Targets & Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {salespersonTargets.map((target) => (
                      <Card key={target.salesperson_id} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{target.name}</h4>
                            <p className="text-sm text-gray-600">
                              {target.orders_count} orders • ${target.total_revenue.toLocaleString()} revenue
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getTrendIcon(target.trend)}
                            {getRiskBadge(target.risk_level)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-sm font-medium">Current Margin</p>
                            <p className="text-2xl font-bold">{target.current_margin.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Target Margin</p>
                            <p className="text-2xl font-bold text-green-600">{target.target_margin.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Achievement</p>
                            <p className="text-2xl font-bold">{target.achievement_pct.toFixed(0)}%</p>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress to Target</span>
                            <span>{target.achievement_pct.toFixed(1)}%</span>
                          </div>
                          <Progress value={Math.min(target.achievement_pct, 100)} className="h-2" />
                        </div>

                        {target.opportunities.length > 0 && (
                          <div>
                            <h5 className="font-medium mb-2">Improvement Opportunities</h5>
                            <div className="space-y-1">
                              {target.opportunities.map((opp, idx) => (
                                <div key={idx} className="text-sm p-2 bg-purple-50 rounded">
                                  <span className="font-medium">{opp.type}:</span> {opp.description}
                                  <span className="text-purple-600 ml-2">(+${opp.potential_value.toLocaleString()})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ORIGINAL: Orders Table Tab (Enhanced) */}
          <TabsContent value="orders" className="space-y-6">
            <SmartTable
              data={marginData?.orders || []}
              columns={marginColumns}
              loading={loadingAnalysis}
              searchable={true}
              exportable={true}
              selectable={true}
              realTime={true}
              onRefresh={handleRefresh}
              onExport={handleExport}
            />
          </TabsContent>
        </Tabs>
      </AdvancedLayout.Card>

      {/* Enhanced Status Bar */}
      <AdvancedLayout.StatusBar
        items={[
          { 
            label: "Data Status", 
            value: analysisError ? "Issues" : "Synchronized", 
            status: analysisError ? "error" : "active" 
          },
          { label: "Total Orders", value: analytics.totalOrders, status: "active" },
          { label: "At Risk", value: analytics.atRiskOrders, status: analytics.atRiskOrders > 0 ? "warning" : "active" },
          { label: "Pending Approvals", value: analytics.pendingApprovals, status: analytics.pendingApprovals > 0 ? "warning" : "active" },
          { label: "Last Updated", value: new Date().toLocaleTimeString(), status: "active" }
        ]}
      />
    </AdvancedLayout>
  )
} 