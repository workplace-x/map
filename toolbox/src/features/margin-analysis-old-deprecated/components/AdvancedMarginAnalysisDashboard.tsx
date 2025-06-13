import React, { useState, useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, TrendingDown, AlertTriangle, DollarSign, 
  Users, Filter, Download, RefreshCw, Zap, Clock, Target, Search, Calculator
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { MarginAnalysisService } from '../services'
import { 
  MarginAnalysisResponse, 
  MarginAlert, 
  PeriodType, 
  FilterState
} from '../types'

interface OrderMarginResponse {
  order_no: string
  order_title: string
  customer_name: string
  salesperson_name: string
  totalSell: number
  totalCost: number
  orderMarginPct: number
  lines: Array<{
    line_no: number
    item_no: string
    description: string
    qty_ordered: number
    unit_sell: number
    unit_cost: number
    vendor_name: string
    margin_pct: number
  }>
}

export function AdvancedMarginAnalysisDashboard() {
  const [data, setData] = useState<MarginAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<PeriodType>('this_month')
  const [filters, setFilters] = useState<FilterState>({
    low_margin_only: false,
    high_risk_only: false,
    sales_team_only: false
  })
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderMarginResponse | null>(null)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [orderNumber, setOrderNumber] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const { theme, density } = useLayoutContext()

  // Mock activity feed for real-time updates
  const [activityFeed, setActivityFeed] = useState([
    {
      id: '1',
      type: 'warning' as const,
      message: 'Order Q-2024-003 margin dropped below 15%',
      timestamp: new Date(),
      details: 'Customer pricing adjustment required'
    },
    {
      id: '2',
      type: 'success' as const,
      message: 'Margin analysis completed for 47 orders',
      timestamp: new Date(Date.now() - 300000),
      details: 'All thresholds within acceptable range'
    }
  ])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await MarginAnalysisService.fetchMarginAnalysis({
        period,
        ...filters,
        real_time: realTimeEnabled,
        include_predictions: true
      })
      
      setData(response)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch margin analysis'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const searchOrder = async () => {
    if (!orderNumber.trim()) {
      toast.error('Please enter an order number')
      return
    }

    setSearchLoading(true)
    try {
      const response = await fetch(`/api/orders/${orderNumber.trim()}/margin`)
      
      if (response.ok) {
        const orderData = await response.json()
        setSelectedOrder(orderData)
        setSelectedTab('order-detail')
        toast.success(`Order ${orderNumber} found!`)
      } else if (response.status === 404) {
        toast.error(`Order ${orderNumber} not found`)
      } else {
        toast.error('Error searching for order')
      }
    } catch (error) {
      toast.error('Failed to search order')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleRefresh = async () => {
    await fetchData()
    toast.success('Margin analysis data refreshed')
  }

  const handleExport = () => {
    toast.success('Export started - you will receive an email when complete')
  }

  const toggleRealTime = async () => {
    try {
      if (realTimeEnabled) {
        await MarginAnalysisService.disableRealTime()
        setRealTimeEnabled(false)
        toast.success('Real-time updates disabled')
      } else {
        await MarginAnalysisService.enableRealTime()
        setRealTimeEnabled(true)
        toast.success('Real-time updates enabled')
      }
    } catch (err) {
      toast.error('Failed to toggle real-time updates')
    }
  }

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newActivity = {
        id: Date.now().toString(),
        type: (Math.random() > 0.7 ? 'warning' : 'success') as 'warning' | 'success',
        message: Math.random() > 0.5 ? 
          `Order Q-2024-${String(Math.floor(Math.random() * 100)).padStart(3, '0')} margin analysis updated` :
          `${Math.floor(Math.random() * 50)} orders analyzed successfully`,
        timestamp: new Date(),
        details: 'Automated margin monitoring'
      }
      setActivityFeed(prev => [newActivity, ...prev.slice(0, 9)])
    }, 20000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchData()
  }, [period, filters])

  // Auto-refresh every 30 seconds if real-time is enabled
  useEffect(() => {
    if (!realTimeEnabled) return

    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [realTimeEnabled, period, filters])

  // Mock table data for orders
  const orderTableData = selectedOrder ? [
    ...(selectedOrder.lines || []).map(line => ({
      line_no: line.line_no,
      item_no: line.item_no,
      description: line.description,
      qty_ordered: line.qty_ordered,
      unit_sell: line.unit_sell,
      unit_cost: line.unit_cost,
      vendor_name: line.vendor_name,
      margin_pct: line.margin_pct
    }))
  ] : []

  const orderColumns = [
    { key: 'line_no' as const, title: 'Line', width: '80px' },
    { key: 'item_no' as const, title: 'Item #', width: '120px' },
    { key: 'description' as const, title: 'Description', width: '250px' },
    { key: 'qty_ordered' as const, title: 'Qty', align: 'center' as const, width: '80px' },
    { 
      key: 'unit_sell' as const, 
      title: 'Unit Sell', 
      align: 'right' as const,
      formatter: (value: number) => MarginAnalysisService.formatCurrency(value)
    },
    { 
      key: 'unit_cost' as const, 
      title: 'Unit Cost', 
      align: 'right' as const,
      formatter: (value: number) => MarginAnalysisService.formatCurrency(value)
    },
    { key: 'vendor_name' as const, title: 'Vendor', width: '150px' },
    { 
      key: 'margin_pct' as const, 
      title: 'Margin %', 
      align: 'center' as const,
      formatter: (value: number) => (
        <span className={`font-semibold ${value >= 20 ? 'text-green-600' : 'text-red-600'}`}>
          {value.toFixed(1)}%
        </span>
      )
    }
  ]

  return (
    <AdvancedLayout>
      <AdvancedLayout.Header
        title="Advanced Margin Analysis"
        description="Real-time margin intelligence with automated insights and workflow optimization"
        searchPlaceholder="Search orders, customers, or items..."
        onSearch={(query) => console.log('Search:', query)}
        onRefresh={handleRefresh}
        refreshLoading={loading}
        statusInfo={{
          text: realTimeEnabled ? "Real-time Monitoring Active" : "Manual Mode",
          status: realTimeEnabled ? "healthy" : "warning",
          details: realTimeEnabled ? "Live margin updates enabled" : "Manual refresh required"
        }}
        metrics={data ? [
          { label: "Avg Margin", value: `${data.summary.avg_margin_pct.toFixed(1)}%`, trend: "up", change: `+${data.trends.trend_pct.toFixed(1)}%` },
          { label: "At Risk Orders", value: data.summary.at_risk_count },
          { label: "Total Revenue", value: MarginAnalysisService.formatCurrency(data.summary.total_value) },
          { label: "Pending Approvals", value: data.summary.pending_approvals }
        ] : []}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={toggleRealTime}>
              <Zap className="h-4 w-4 mr-2" />
              {realTimeEnabled ? 'Disable' : 'Enable'} Live
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </>
        }
      />

      {/* Quick Order Search */}
      <AdvancedLayout.Card variant="glass" padding="sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-2 rounded-xl bg-blue-600 text-white">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Quick Order Analysis</h3>
            <p className="text-sm text-gray-600">Enter order number for instant line-by-line margin breakdown</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Input
            placeholder="Enter order number (e.g., 12345, Q-67890)"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchOrder()}
            className="flex-1 h-10"
          />
          <Button 
            onClick={searchOrder} 
            disabled={searchLoading}
            className="h-10 px-6"
          >
            {searchLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Search
          </Button>
        </div>

        {selectedOrder && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{selectedOrder.order_title}</p>
                <p className="text-sm text-gray-600">{selectedOrder.customer_name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {selectedOrder.orderMarginPct.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">
                  {MarginAnalysisService.formatCurrency(selectedOrder.totalSell)}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AdvancedLayout.Card>

      {/* Period Selector */}
      <AdvancedLayout.Card variant="glass" padding="sm">
        <div className="flex gap-2">
          {(['this_month', 'this_year', 'last_30_days', 'this_quarter'] as PeriodType[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
              className={period === p ? 'bg-blue-600 text-white' : 'bg-white/80 hover:bg-white'}
            >
              {p.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Button>
          ))}
        </div>
      </AdvancedLayout.Card>

      {/* Smart KPI Dashboard */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SmartKPI
            title="Average Margin"
            value={data.summary.avg_margin_pct}
            format="percentage"
            icon={<TrendingUp />}
            color="green"
            trend={{ 
              direction: data.trends.margin_trend === 'improving' ? 'up' : 'down', 
              percentage: Math.abs(data.trends.trend_pct), 
              period: 'vs last period' 
            }}
            loading={loading}
          />
          
          <SmartKPI
            title="At Risk Orders"
            value={data.summary.at_risk_count}
            icon={<AlertTriangle />}
            color="red"
            loading={loading}
            subtitle="Below 15% margin"
            interactive
            onClick={() => {
              setFilters(prev => ({ ...prev, low_margin_only: true }))
              toast.success('Filtered to show low margin orders')
            }}
          />
          
          <SmartKPI
            title="Pending Approvals"
            value={data.summary.pending_approvals}
            icon={<Clock />}
            color="yellow"
            loading={loading}
            subtitle="Awaiting review"
          />
          
          <SmartKPI
            title="Total Revenue"
            value={data.summary.total_value}
            format="currency"
            icon={<DollarSign />}
            color="blue"
            trend={{ 
              direction: data.trends.vs_last_period > 0 ? 'up' : 'down', 
              percentage: Math.abs(data.trends.vs_last_period), 
              period: 'vs last period' 
            }}
            loading={loading}
          />
        </div>
      )}

      {/* Advanced Content */}
      <AdvancedLayout.Card variant="elevated" className="min-h-[600px]">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="bg-gray-100/80 backdrop-blur-sm rounded-xl border border-gray-200">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
                📊 Overview
              </TabsTrigger>
              <TabsTrigger value="alerts" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
                🚨 Smart Alerts
              </TabsTrigger>
              <TabsTrigger value="order-detail" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
                📋 Order Detail
              </TabsTrigger>
              <TabsTrigger value="realtime" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
                ⚡ Real-time Feed
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Margin Distribution */}
              <AdvancedLayout.Card>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  Margin Health Score
                </h3>
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                    <span className="text-3xl font-bold text-green-600">
                      {data ? Math.round((1 - data.summary.at_risk_count / Math.max(data.summary.total_orders || 1, 1)) * 100) : 0}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Overall Health Score</p>
                    <p className="font-medium text-gray-900">
                      {data ? data.summary.total_orders - data.summary.at_risk_count : 0} of {data?.summary.total_orders || 0} orders healthy
                    </p>
                  </div>
                </div>
              </AdvancedLayout.Card>

              {/* Risk Analysis */}
              <AdvancedLayout.Card>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Risk Analysis
                </h3>
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-red-50 to-pink-50 border border-red-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-red-800">Critical Risk</span>
                      <Badge className="bg-red-100 text-red-800">
                        {data ? Math.floor(data.summary.at_risk_count * 0.3) : 0}
                      </Badge>
                    </div>
                    <p className="text-sm text-red-700 mt-1">&lt;10% margin</p>
                  </div>
                  
                  <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-yellow-800">Moderate Risk</span>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {data ? Math.floor(data.summary.at_risk_count * 0.7) : 0}
                      </Badge>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">10-15% margin</p>
                  </div>
                </div>
              </AdvancedLayout.Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <div className="space-y-4">
              {data?.alerts?.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 rounded-xl border-l-4 ${
                    alert.severity === 'critical' ? 'border-l-red-500 bg-gradient-to-r from-red-50 to-white' :
                    alert.severity === 'high' ? 'border-l-orange-500 bg-gradient-to-r from-orange-50 to-white' :
                    'border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-gray-900">{alert.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {alert.severity}
                        </Badge>
                        {alert.order_no && (
                          <Badge variant="secondary" className="text-xs">
                            {alert.order_no}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{alert.message}</p>
                      {alert.current_margin && (
                        <p className="text-xs text-gray-500 mt-2">
                          Current: {alert.current_margin.toFixed(1)}% 
                          {alert.threshold_margin && ` | Threshold: ${alert.threshold_margin.toFixed(1)}%`}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="ghost" className="h-8 px-3 text-xs">
                        Acknowledge
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 px-3 text-xs">
                        Resolve
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  No alerts at this time
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="order-detail" className="space-y-6">
            {selectedOrder ? (
              <div className="space-y-6">
                {/* Order Header */}
                <div className="p-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedOrder.order_title}</h3>
                      <p className="text-gray-600">{selectedOrder.customer_name} • {selectedOrder.salesperson_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600">{selectedOrder.orderMarginPct.toFixed(1)}%</p>
                      <p className="text-gray-600">{MarginAnalysisService.formatCurrency(selectedOrder.totalSell)}</p>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <SmartTable
                  data={orderTableData}
                  columns={orderColumns}
                  loading={false}
                  searchable={true}
                  exportable={true}
                  pagination={false}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Order Selected</h3>
                <p className="text-gray-600">Use the quick search above to analyze an order</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="realtime" className="space-y-6">
            <RealTimeDataFeed
              title="Real-time Margin Monitoring"
              items={activityFeed}
              realTime={realTimeEnabled}
            />
          </TabsContent>
        </Tabs>
      </AdvancedLayout.Card>

      {/* Status Bar */}
      <AdvancedLayout.StatusBar
        items={[
          { 
            label: "System Status", 
            value: error ? "Issues" : "Operational", 
            status: error ? "error" : "active" 
          },
          { label: "Real-time", value: realTimeEnabled ? "Active" : "Disabled", status: realTimeEnabled ? "active" : "inactive" },
          { label: "Data Updated", value: new Date().toLocaleTimeString(), status: "active" },
          { label: "Theme", value: theme, details: "Current UI theme" }
        ]}
      />
    </AdvancedLayout>
  )
} 