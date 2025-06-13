import React, { useState, useEffect } from 'react'
import { TrendingUp, Users, Building, Package, AlertCircle, CheckCircle, Target, Zap } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'

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

interface VendorPerformance {
  vendor_code: string
  vendor_name: string
  avg_margin: number
  reliability_score: number
  volume: number
  trend: 'improving' | 'declining' | 'stable'
  performance_tier: 'excellent' | 'good' | 'fair' | 'poor'
  recommendations: string[]
}

interface CustomerBenchmark {
  customer_no: string
  customer_name: string
  avg_margin: number
  order_frequency: number
  relationship_strength: 'strong' | 'moderate' | 'new' | 'at_risk'
  negotiation_leverage: 'high' | 'medium' | 'low'
  growth_potential: number
  recent_trends: {
    margin_trend: 'improving' | 'declining' | 'stable'
    volume_trend: 'growing' | 'shrinking' | 'stable'
  }
}

interface MonthlyTrend {
  month: string
  avg_margin: number
  orders_count: number
  revenue: number
  approvals_needed: number
}

export function PerformanceInsights({ userId }: { userId?: string }) {
  const [salespersonTargets, setSalespersonTargets] = useState<SalespersonTarget[]>([])
  const [vendorPerformance, setVendorPerformance] = useState<VendorPerformance[]>([])
  const [customerBenchmarks, setCustomerBenchmarks] = useState<CustomerBenchmark[]>([])
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPerformanceData()
  }, [userId])

  const loadPerformanceData = async () => {
    setLoading(true)
    try {
      // Load salesperson performance and targets
      const salespersonResponse = await fetch(`/api/margin-analysis/salesperson/${userId || 'team'}/dashboard?include_targets=true&include_opportunities=true`)
      const salespersonData = await salespersonResponse.json()
      
      if (salespersonData.team_comparison?.team_members) {
        setSalespersonTargets(salespersonData.team_comparison.team_members.map((member: any) => ({
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
          opportunities: salespersonData.opportunities || []
        })))
      }

      if (salespersonData.monthly_trends) {
        setMonthlyTrends(salespersonData.monthly_trends)
      }

      // Load vendor performance analysis
      const vendorResponse = await fetch('/api/margin-analysis?vendor_analysis=true&period=last_6_months')
      const vendorData = await vendorResponse.json()
      
      if (vendorData.vendor_analysis) {
        setVendorPerformance(vendorData.vendor_analysis.map((vendor: any) => ({
          vendor_code: vendor.vendor_code,
          vendor_name: vendor.vendor_name || vendor.vendor_code,
          avg_margin: vendor.avg_margin_pct,
          reliability_score: vendor.reliability_score || 85,
          volume: vendor.total_orders,
          trend: vendor.margin_trend,
          performance_tier: vendor.avg_margin_pct > 25 ? 'excellent' : 
                          vendor.avg_margin_pct > 20 ? 'good' : 
                          vendor.avg_margin_pct > 15 ? 'fair' : 'poor',
          recommendations: vendor.recommendations || []
        })))
      }

      // Load customer benchmarking
      const customerResponse = await fetch('/api/margin-analysis?customer_analysis=true&period=last_12_months')
      const customerData = await customerResponse.json()
      
      if (customerData.customer_analysis) {
        setCustomerBenchmarks(customerData.customer_analysis.map((customer: any) => ({
          customer_no: customer.customer_no,
          customer_name: customer.customer_name,
          avg_margin: customer.avg_margin_pct,
          order_frequency: customer.order_frequency,
          relationship_strength: customer.relationship_strength,
          negotiation_leverage: customer.negotiation_leverage,
          growth_potential: customer.growth_potential || 0,
          recent_trends: customer.recent_trends || { margin_trend: 'stable', volume_trend: 'stable' }
        })))
      }

    } catch (error) {
      setError(`Failed to load performance data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
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

  const getPerformanceBadge = (tier: 'excellent' | 'good' | 'fair' | 'poor') => {
    const variants = {
      excellent: <Badge className="bg-green-500">Excellent</Badge>,
      good: <Badge className="bg-blue-500">Good</Badge>,
      fair: <Badge variant="outline" className="border-yellow-500 text-yellow-600">Fair</Badge>,
      poor: <Badge variant="destructive">Poor</Badge>
    }
    return variants[tier] || <Badge variant="outline">Unknown</Badge>
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading performance insights...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="targets" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="targets">Salesperson Targets</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Performance</TabsTrigger>
          <TabsTrigger value="customers">Customer Benchmarks</TabsTrigger>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="targets" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Vendor Performance Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vendorPerformance.map((vendor) => (
                  <Card key={vendor.vendor_code} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{vendor.vendor_name}</h4>
                        <p className="text-sm text-gray-600">
                          {vendor.volume} orders • {vendor.reliability_score}% reliability
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(vendor.trend)}
                        {getPerformanceBadge(vendor.performance_tier)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-sm font-medium">Average Margin</p>
                        <p className="text-2xl font-bold">{vendor.avg_margin.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Reliability Score</p>
                        <p className="text-2xl font-bold">{vendor.reliability_score}%</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Order Volume</p>
                        <p className="text-2xl font-bold">{vendor.volume}</p>
                      </div>
                    </div>

                    {vendor.recommendations.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Recommendations</h5>
                        <div className="space-y-1">
                          {vendor.recommendations.map((rec, idx) => (
                            <div key={idx} className="text-sm p-2 bg-blue-50 rounded">
                              {rec}
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
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Customer Margin Benchmarks</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerBenchmarks.map((customer) => (
                  <Card key={customer.customer_no} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{customer.customer_name}</h4>
                        <p className="text-sm text-gray-600">
                          {customer.order_frequency} orders/month • {customer.relationship_strength} relationship
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(customer.recent_trends.margin_trend)}
                        <Badge variant="outline">
                          {customer.negotiation_leverage.toUpperCase()} Leverage
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-sm font-medium">Average Margin</p>
                        <p className="text-2xl font-bold">{customer.avg_margin.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Order Frequency</p>
                        <p className="text-2xl font-bold">{customer.order_frequency}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Growth Potential</p>
                        <p className="text-2xl font-bold text-green-600">+{customer.growth_potential.toFixed(1)}%</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Margin Trend: </span>
                        <span className={customer.recent_trends.margin_trend === 'improving' ? 'text-green-600' : 
                                       customer.recent_trends.margin_trend === 'declining' ? 'text-red-600' : 'text-gray-600'}>
                          {customer.recent_trends.margin_trend}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Volume Trend: </span>
                        <span className={customer.recent_trends.volume_trend === 'growing' ? 'text-green-600' : 
                                       customer.recent_trends.volume_trend === 'shrinking' ? 'text-red-600' : 'text-gray-600'}>
                          {customer.recent_trends.volume_trend}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>6-Month Performance Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyTrends.map((trend, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <h4 className="font-semibold">{trend.month}</h4>
                      <p className="text-sm text-gray-600">{trend.orders_count} orders</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{trend.avg_margin.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">Avg Margin</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">${(trend.revenue / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-gray-500">Revenue</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-yellow-600">{trend.approvals_needed}</p>
                      <p className="text-xs text-gray-500">Approvals</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 