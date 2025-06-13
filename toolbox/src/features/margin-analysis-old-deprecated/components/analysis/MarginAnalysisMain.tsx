import React, { useState, useEffect } from 'react'
import { Search, TrendingUp, AlertTriangle, CheckCircle, Clock, Users, Target, Zap } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MarginAnalysisService } from '../../services'
import { PerformanceInsights } from './PerformanceInsights'

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

interface PerformanceMetrics {
  avg_margin: number
  at_risk_orders: number
  total_revenue: number
  pending_approvals: number
  opportunity_value: number
}

export function MarginAnalysisMain() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<OrderAnalysis[]>([])
  const [selectedOrder, setSelectedOrder] = useState<OrderAnalysis | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('search')

  // Load initial dashboard data
  useEffect(() => {
    loadDashboardData()
    loadPendingApprovals()
  }, [])

  const loadDashboardData = async () => {
    try {
      const response = await MarginAnalysisService.fetchMarginAnalysis({
        include_predictions: true,
        focus_on_quotes: true,
        sales_team_only: true
      })
      
      if (response.summary) {
        setPerformanceMetrics({
          avg_margin: response.summary.avg_margin_pct,
          at_risk_orders: response.summary.at_risk_orders,
          total_revenue: response.summary.total_revenue,
          pending_approvals: response.summary.pending_approvals || 0,
          opportunity_value: response.summary.optimization_opportunities?.total_potential || 0
        })
      }
    } catch (error) {
      console.error('Error loading dashboard:', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const loadPendingApprovals = async () => {
    try {
      // This would need the user ID from context/auth
      const userId = 'current-user-id' // Replace with actual user ID
      const response = await fetch(`/api/margin-analysis/approval-dashboard/${userId}`)
      const data = await response.json()
      
      if (data.approvals?.assigned_to_me) {
        setPendingApprovals(data.approvals.assigned_to_me)
      }
    } catch (error) {
      console.error('Error loading approvals:', error)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setError('')
    
    try {
      // Use the intelligent margin analysis API
      const response = await MarginAnalysisService.fetchMarginAnalysis({
        order_filter: searchQuery,
        include_historical: true,
        include_line_items: true,
        include_approvals: true
      })

      if (response.orders && response.orders.length > 0) {
        setSearchResults(response.orders)
        
        // If single result, auto-select it for detailed analysis
        if (response.orders.length === 1) {
          await analyzeOrderInDetail(response.orders[0])
        }
      } else {
        setError('No orders found matching your search criteria')
        setSearchResults([])
      }
    } catch (error) {
      setError(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const analyzeOrderInDetail = async (order: OrderAnalysis) => {
    setSelectedOrder(order)
    setActiveTab('analysis')
    
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
        alert(`Approval request created and assigned to ${result.assigned_to.name}`)
        await loadPendingApprovals() // Refresh approvals
      } else if (result.existing_approval) {
        alert('Approval request already exists for this order')
      } else {
        alert(`No approval required - margin meets thresholds (${order.margin_pct.toFixed(1)}%)`)
      }
    } catch (error) {
      alert(`Error creating approval request: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const getMarginStatusColor = (marginPct: number, isQuote: boolean) => {
    const criticalThreshold = isQuote ? 7 : 5
    const highThreshold = isQuote ? 15 : 10
    const mediumThreshold = isQuote ? 20 : 15
    
    if (marginPct < criticalThreshold) return 'text-red-600 bg-red-50'
    if (marginPct < highThreshold) return 'text-orange-600 bg-orange-50'
    if (marginPct < mediumThreshold) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const getApprovalBadge = (level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NONE', urgency: string) => {
    const badges = {
      CRITICAL: <Badge variant="destructive" className="animate-pulse">CRITICAL - {urgency}</Badge>,
      HIGH: <Badge variant="outline" className="border-orange-500 text-orange-600">HIGH RISK - {urgency}</Badge>,
      MEDIUM: <Badge variant="outline" className="border-yellow-500 text-yellow-600">MEDIUM - {urgency}</Badge>,
      NONE: <Badge variant="outline" className="border-green-500 text-green-600">APPROVED</Badge>
    }
    return badges[level] || <Badge variant="outline">UNKNOWN</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Performance Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Avg Margin</p>
                <p className="text-2xl font-bold">{performanceMetrics?.avg_margin.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">At Risk Orders</p>
                <p className="text-2xl font-bold text-red-600">{performanceMetrics?.at_risk_orders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Pending Approvals</p>
                <p className="text-2xl font-bold text-yellow-600">{performanceMetrics?.pending_approvals || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold">${((performanceMetrics?.total_revenue || 0) / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Opportunity Value</p>
                <p className="text-2xl font-bold text-purple-600">${((performanceMetrics?.opportunity_value || 0) / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">Intelligent Search</TabsTrigger>
          <TabsTrigger value="analysis">Deep Analysis</TabsTrigger>
          <TabsTrigger value="approvals">Approval Workflow</TabsTrigger>
          <TabsTrigger value="performance">Performance Insights</TabsTrigger>
        </TabsList>

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
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? 'Analyzing...' : 'Analyze'}
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

        <TabsContent value="performance" className="space-y-4">
          <PerformanceInsights userId="current-user-id" />
        </TabsContent>
      </Tabs>
    </div>
  )
} 