import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  TrendingUp, TrendingDown, AlertTriangle, DollarSign, 
  Users, Filter, Download, RefreshCw, Zap, Clock, Target, Search, Calculator, ArrowUp, ArrowDown,
  Eye, BarChart3, PieChart, LineChart, Settings, Bell, CheckCircle
} from 'lucide-react'
import { MarginAnalysisService } from '../services'
import { 
  MarginAnalysisResponse, 
  MarginAlert, 
  PeriodType, 
  FilterState,
  KPICardData 
} from '../types'
import { toast } from 'sonner'

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

interface KPICardProps extends KPICardData {
  icon: React.ReactNode
  onAction?: () => void
  index?: number
}

function KPICard({ title, value, change, subtitle, trend, icon, color, urgent, actionable, onAction, index = 0 }: KPICardProps) {
  const colorClasses = {
    green: 'from-emerald-50 to-emerald-100 border-emerald-200/60',
    red: 'from-red-50 to-red-100 border-red-200/60',
    yellow: 'from-amber-50 to-amber-100 border-amber-200/60',
    blue: 'from-blue-50 to-blue-100 border-blue-200/60'
  }

  const iconColors = {
    green: 'text-emerald-600 bg-emerald-100',
    red: 'text-red-600 bg-red-100', 
    yellow: 'text-amber-600 bg-amber-100',
    blue: 'text-blue-600 bg-blue-100'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="group"
    >
      <Card className={cn(
        `bg-gradient-to-br backdrop-blur-sm border transition-all duration-300 hover:shadow-lg rounded-2xl`,
        colorClasses[color],
        urgent && 'ring-2 ring-red-400 shadow-red-100'
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                'p-3 rounded-xl transition-transform group-hover:scale-110',
                iconColors[color]
              )}>
                {icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
                {change && (
                  <div className={cn(
                    'flex items-center gap-1 text-sm font-medium',
                    trend === 'up' ? 'text-emerald-600' : 'text-red-500'
                  )}>
                    {trend === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {change}
                  </div>
                )}
                {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
              </div>
            </div>
            {actionable && onAction && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onAction}
                className="bg-white/80 hover:bg-white border-white/60 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface AlertItemProps {
  alert: MarginAlert
  onAcknowledge: (alertId: string) => void
  onResolve: (alertId: string) => void
  index?: number
}

function AlertItem({ alert, onAcknowledge, onResolve, index = 0 }: AlertItemProps) {
  const severityColors = {
    high: 'border-l-red-500 bg-red-50/50',
    medium: 'border-l-yellow-500 bg-yellow-50/50',
    low: 'border-l-blue-500 bg-blue-50/50',
    critical: 'border-l-red-600 bg-red-50/70'
  }

  const severityIcons = {
    high: <AlertTriangle className="h-4 w-4 text-red-600" />,
    medium: <Clock className="h-4 w-4 text-yellow-600" />,
    low: <Target className="h-4 w-4 text-blue-600" />,
    critical: <AlertTriangle className="h-4 w-4 text-red-700" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="group"
    >
      <Card className={cn(
        'border-l-4 transition-all duration-200 hover:shadow-md',
        severityColors[alert.severity]
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {severityIcons[alert.severity]}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-gray-900 mb-1">{alert.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {alert.order_no && <span>Order: {alert.order_no}</span>}
                  {alert.current_margin && <span>Margin: {alert.current_margin.toFixed(1)}%</span>}
                  <span>{new Date(alert.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAcknowledge(alert.id)}
                className="h-7 px-2 text-xs"
              >
                <Bell className="h-3 w-3 mr-1" />
                Acknowledge
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onResolve(alert.id)}
                className="h-7 px-2 text-xs text-green-600 hover:text-green-700"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Resolve
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface QuickOrderLookupProps {
  onOrderFound: (order: OrderMarginResponse) => void
}

function QuickOrderLookup({ onOrderFound }: QuickOrderLookupProps) {
  const [orderNumber, setOrderNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastSearched, setLastSearched] = useState<OrderMarginResponse | null>(null)

  const searchOrder = async () => {
    if (!orderNumber.trim()) {
      toast.error('Please enter an order number')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/orders/${orderNumber.trim()}/margin`)
      
      if (response.ok) {
        const orderData = await response.json()
        setLastSearched(orderData)
        onOrderFound(orderData)
        toast.success(`Order ${orderNumber} found!`)
      } else if (response.status === 404) {
        toast.error(`Order ${orderNumber} not found`)
      } else {
        toast.error('Error searching for order')
      }
    } catch (error) {
      toast.error('Failed to search order')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchOrder()
    }
  }

  return (
    <Card className="border-2 border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 rounded-xl bg-blue-600 text-white">
            <Search className="h-5 w-5" />
          </div>
          Quick Order Lookup
        </CardTitle>
        <CardDescription className="text-gray-600">
          Enter an order or quote number for instant line-by-line margin analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Input
            placeholder="Enter order number (e.g., 12345, Q-67890)"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 h-12 text-base border-gray-200 focus:border-blue-400 focus:ring-blue-400/20"
          />
          <Button 
            onClick={searchOrder} 
            disabled={loading}
            className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2">Search</span>
          </Button>
        </div>
        
        {lastSearched && (
          <div className="p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900 text-lg">{lastSearched.order_title}</p>
                <p className="text-sm text-gray-600">{lastSearched.customer_name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {lastSearched.orderMarginPct.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600 font-medium">
                  {MarginAnalysisService.formatCurrency(lastSearched.totalSell)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
              {lastSearched.lines?.length || 0} line items • Click "Orders" tab for detailed breakdown
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function MarginAnalysisDashboard() {
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

  const handleOrderFound = (order: OrderMarginResponse) => {
    setSelectedOrder(order)
    // Auto-switch to the Orders tab to show the details
    const ordersTab = document.querySelector('[value="orders"]') as HTMLElement
    if (ordersTab) {
      ordersTab.click()
    }
  }

  const handleAlertAction = async (alertId: string, action: 'acknowledge' | 'resolve') => {
    try {
      const userId = 'current-user-id' // Would come from auth context
      
      if (action === 'acknowledge') {
        await MarginAnalysisService.acknowledgeAlert(alertId, userId)
        toast.success('Alert acknowledged')
      } else {
        await MarginAnalysisService.resolveAlert(alertId, userId)
        toast.success('Alert resolved')
      }
      
      // Refresh data
      fetchData()
    } catch (err) {
      toast.error(`Failed to ${action} alert`)
    }
  }

  const handleRefresh = () => {
    fetchData()
    toast.success('Data refreshed')
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

  useEffect(() => {
    fetchData()
  }, [period, filters])

  // Auto-refresh every 30 seconds if real-time is enabled
  useEffect(() => {
    if (!realTimeEnabled) return

    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [realTimeEnabled, period, filters])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span>Loading margin analysis...</span>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-8">
        {/* Modern Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                Margin Analysis
              </h1>
              <p className="text-gray-600 text-lg">Real-time insights and intelligent workflow automation</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-3 py-1 bg-white/60 border-gray-200">
                <div className={`w-2 h-2 rounded-full mr-2 ${realTimeEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                {realTimeEnabled ? 'Live' : 'Manual'}
              </Badge>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={toggleRealTime}
                  className="bg-white/60 hover:bg-white border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {realTimeEnabled ? 'Disable' : 'Enable'} Live
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white/60 hover:bg-white border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white/60 hover:bg-white border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button 
                  variant="gradient"
                  size="sm" 
                  onClick={handleRefresh} 
                  disabled={loading}
                  className="shadow-lg hover:shadow-xl"
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Order Lookup - PROMINENTLY FEATURED */}
          <QuickOrderLookup onOrderFound={handleOrderFound} />
        </motion.div>

        {/* Modern Period Selector */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/40"
        >
          <div className="flex gap-2">
            {(['this_month', 'this_year', 'last_30_days', 'this_quarter'] as PeriodType[]).map((p, index) => (
              <motion.div
                key={p}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Button
                  variant={period === p ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'transition-all duration-200',
                    period === p 
                      ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg' 
                      : 'bg-white/80 hover:bg-white border-gray-200 text-gray-700 hover:shadow-md'
                  )}
                >
                  {p.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* KPI Cards - Modern Grid */}
        {data && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <KPICard
              title="Average Margin"
              value={`${data.summary.avg_margin_pct.toFixed(1)}%`}
              change={data.trends.trend_pct > 0 ? `+${data.trends.trend_pct.toFixed(1)}%` : `${data.trends.trend_pct.toFixed(1)}%`}
              trend={data.trends.margin_trend === 'improving' ? 'up' : data.trends.margin_trend === 'declining' ? 'down' : undefined}
              icon={<TrendingUp className="h-6 w-6" />}
              color="green"
              index={0}
            />
            <KPICard
              title="At Risk Orders"
              value={data.summary.at_risk_count.toString()}
              subtitle="Below 15% margin"
              icon={<AlertTriangle className="h-6 w-6" />}
              color="red"
              urgent={data.summary.at_risk_count > 10}
              actionable
              onAction={() => {
                setFilters(prev => ({ ...prev, low_margin_only: true }))
                toast.success('Filtered to show low margin orders')
              }}
              index={1}
            />
            <KPICard
              title="Pending Approvals"
              value={data.summary.pending_approvals.toString()}
              subtitle="Awaiting review"
              icon={<Clock className="h-6 w-6" />}
              color="yellow"
              actionable
              onAction={() => {
                toast.info('Navigate to approvals tab')
              }}
              index={2}
            />
            <KPICard
              title="Total Revenue"
              value={MarginAnalysisService.formatCurrency(data.summary.total_value)}
              change={data.trends.vs_last_period > 0 ? `+${data.trends.vs_last_period.toFixed(1)}%` : `${data.trends.vs_last_period.toFixed(1)}%`}
              trend={data.trends.vs_last_period > 0 ? 'up' : 'down'}
              icon={<DollarSign className="h-6 w-6" />}
              color="blue"
              index={3}
            />
          </motion.div>
        )}

        {/* Modern Tabs */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <Tabs defaultValue="overview" className="w-full">
            <div className="bg-gray-50/50 px-8 pt-8">
              <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm rounded-xl border border-gray-200">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium"
                >
                  📊 Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="alerts"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium"
                >
                  🚨 Alerts
                </TabsTrigger>
                <TabsTrigger 
                  value="orders"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium"
                >
                  📋 Orders
                </TabsTrigger>
                <TabsTrigger 
                  value="approvals"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium"
                >
                  ⏳ Approvals
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="p-8 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Alerts */}
                {data && data.alerts.length > 0 && (
                  <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 rounded-2xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 rounded-xl bg-red-100 text-red-600">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        Active Alerts
                        <Badge className="bg-red-100 text-red-700 border-red-200">
                          {data.alerts.length}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Real-time alerts requiring attention
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-80 overflow-y-auto">
                        {data.alerts.slice(0, 5).map((alert, index) => (
                          <AlertItem
                            key={alert.id}
                            alert={alert}
                            onAcknowledge={(id) => handleAlertAction(id, 'acknowledge')}
                            onResolve={(id) => handleAlertAction(id, 'resolve')}
                            index={index}
                          />
                        ))}
                        {data.alerts.length > 5 && (
                          <div className="text-center pt-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-white hover:bg-gray-50 border-gray-200"
                            >
                              View All {data.alerts.length} Alerts
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Top Performers */}
                {data && data.top_performers.length > 0 && (
                  <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 rounded-2xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 rounded-xl bg-green-100 text-green-600">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        Top Performers
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Highest margin performers this {period.replace('_', ' ')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {data.top_performers.map((performer, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </div>
                              <span className="font-semibold text-gray-900">{performer.salesperson_name}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">{performer.margin_pct}%</p>
                              <p className="text-sm text-gray-600 font-medium">
                                {MarginAnalysisService.formatCurrency(performer.total_sell)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* At Risk Orders - Full Width */}
              {data && data.at_risk_orders.length > 0 && (
                <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 rounded-xl bg-red-100 text-red-600">
                        <Target className="h-5 w-5" />
                      </div>
                      At Risk Orders
                      <Badge className="bg-red-100 text-red-700 border-red-200">
                        {data.at_risk_orders.length}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Orders below 15% margin requiring immediate attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.at_risk_orders.slice(0, 9).map((order) => (
                        <div 
                          key={order.order_no} 
                          className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-bold text-gray-900">{order.order_no}</p>
                              <p className="text-sm text-gray-600 font-medium">{order.customer_name}</p>
                              <p className="text-xs text-gray-500">{order.salesperson_name}</p>
                            </div>
                            <Badge 
                              variant={order.margin_pct < 10 ? 'destructive' : 'secondary'}
                              className="font-bold"
                            >
                              {order.margin_pct.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              {MarginAnalysisService.formatCurrency(order.total_sell)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="alerts" className="p-8">
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 rounded-2xl">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Alert Management</h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
                    Comprehensive alert management with intelligent filtering,
                    escalation rules, and real-time notifications for proactive margin monitoring.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Badge variant="outline" className="px-3 py-1">Smart Escalation</Badge>
                    <Badge variant="outline" className="px-3 py-1">Real-time Notifications</Badge>
                    <Badge variant="outline" className="px-3 py-1">Custom Thresholds</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="p-8">
              {selectedOrder ? (
                <div className="space-y-8">
                  {/* Modern Order Header */}
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg rounded-2xl">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                            Order #{selectedOrder.order_no}
                          </CardTitle>
                          <CardDescription className="text-lg text-gray-700">
                            {selectedOrder.order_title}
                          </CardDescription>
                          <p className="text-gray-600 mt-1">
                            {selectedOrder.customer_name} • {selectedOrder.salesperson_name}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedOrder(null)}
                          className="bg-white/80 hover:bg-white border-gray-200"
                        >
                          ← Back to Overview
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm">
                          <p className="text-sm font-medium text-gray-600 mb-2">Total Revenue</p>
                          <p className="text-3xl font-bold text-gray-900">
                            {MarginAnalysisService.formatCurrency(selectedOrder.totalSell)}
                          </p>
                        </div>
                        <div className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm">
                          <p className="text-sm font-medium text-gray-600 mb-2">Total Margin</p>
                          <p className="text-3xl font-bold text-green-600">
                            {MarginAnalysisService.formatCurrency(selectedOrder.totalSell - selectedOrder.totalCost)}
                          </p>
                        </div>
                        <div className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm">
                          <p className="text-sm font-medium text-gray-600 mb-2">Margin %</p>
                          <p className={`text-3xl font-bold ${selectedOrder.orderMarginPct >= 15 ? 'text-green-600' : selectedOrder.orderMarginPct >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {selectedOrder.orderMarginPct.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Modern Line-by-Line Analysis */}
                  <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 rounded-2xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                          <Calculator className="h-5 w-5" />
                        </div>
                        Line-by-Line Analysis
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {selectedOrder.lines?.length || 0} line items with detailed margin breakdown
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left p-4 font-semibold text-gray-700">Line</th>
                              <th className="text-left p-4 font-semibold text-gray-700">Item</th>
                              <th className="text-left p-4 font-semibold text-gray-700">Description</th>
                              <th className="text-right p-4 font-semibold text-gray-700">Qty</th>
                              <th className="text-right p-4 font-semibold text-gray-700">Unit Sell</th>
                              <th className="text-right p-4 font-semibold text-gray-700">Unit Cost</th>
                              <th className="text-right p-4 font-semibold text-gray-700">Line Total</th>
                              <th className="text-right p-4 font-semibold text-gray-700">Margin %</th>
                              <th className="text-left p-4 font-semibold text-gray-700">Vendor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrder.lines?.map((line, index) => {
                              const lineTotal = line.unit_sell * line.qty_ordered
                              const marginColor = line.margin_pct >= 15 ? 'text-green-600' : 
                                                line.margin_pct >= 10 ? 'text-yellow-600' : 'text-red-600'
                              
                              return (
                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                  <td className="p-4 font-medium">{line.line_no}</td>
                                  <td className="p-4 font-mono text-sm bg-gray-50 rounded">{line.item_no}</td>
                                  <td className="p-4 max-w-xs">
                                    <div className="truncate" title={line.description}>
                                      {line.description}
                                    </div>
                                  </td>
                                  <td className="p-4 text-right font-medium">{line.qty_ordered}</td>
                                  <td className="p-4 text-right font-medium">
                                    {MarginAnalysisService.formatCurrency(line.unit_sell)}
                                  </td>
                                  <td className="p-4 text-right font-medium">
                                    {MarginAnalysisService.formatCurrency(line.unit_cost)}
                                  </td>
                                  <td className="p-4 text-right font-bold text-gray-900">
                                    {MarginAnalysisService.formatCurrency(lineTotal)}
                                  </td>
                                  <td className={`p-4 text-right font-bold ${marginColor}`}>
                                    {line.margin_pct.toFixed(1)}%
                                  </td>
                                  <td className="p-4 text-sm text-gray-600">
                                    {line.vendor_name || 'N/A'}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Modern Summary */}
                      <div className="mt-6 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900">Order Summary</span>
                          <div className="flex gap-8 text-right">
                            <div>
                              <p className="text-sm text-gray-600">Total Revenue</p>
                              <p className="text-lg font-bold">{MarginAnalysisService.formatCurrency(selectedOrder.totalSell)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Total Cost</p>
                              <p className="text-lg font-bold">{MarginAnalysisService.formatCurrency(selectedOrder.totalCost)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Margin</p>
                              <p className={`text-xl font-bold ${selectedOrder.orderMarginPct >= 15 ? 'text-green-600' : selectedOrder.orderMarginPct >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {selectedOrder.orderMarginPct.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 rounded-2xl">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <Target className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Order Analysis</h3>
                    <p className="text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
                      Use the Quick Order Lookup above to search for specific orders,
                      or browse orders from the dashboard overview for detailed line-by-line analysis.
                    </p>
                    <div className="flex justify-center gap-4">
                      <Badge variant="outline" className="px-3 py-1">Line-by-line Analysis</Badge>
                      <Badge variant="outline" className="px-3 py-1">Vendor Information</Badge>
                      <Badge variant="outline" className="px-3 py-1">Margin Health</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="approvals" className="p-8">
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 rounded-2xl">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Approval Workflow</h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
                    Streamlined approval process with intelligent routing, bulk actions,
                    custom thresholds, and automated workflows for efficient margin management.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Badge variant="outline" className="px-3 py-1">Smart Routing</Badge>
                    <Badge variant="outline" className="px-3 py-1">Bulk Actions</Badge>
                    <Badge variant="outline" className="px-3 py-1">Custom Thresholds</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Modern Status Bar */}
        {data && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/40">
            <div className="text-center text-sm text-gray-600 flex items-center justify-center gap-6">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Last updated: {new Date(data.last_updated).toLocaleString()}
              </span>
              <span>Period: {period.replace('_', ' ')}</span>
              <span>Orders: {data.summary.total_orders}</span>
              <span className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${realTimeEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                {realTimeEnabled ? 'Live Updates' : 'Manual Mode'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 