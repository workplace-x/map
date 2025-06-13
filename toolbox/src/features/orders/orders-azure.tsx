import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ModernPageLayout } from '@/components/layout/modern-page-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Filter, Download, RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react'
import { azureApi } from '@/lib/azureApiClient'
import { toast } from 'sonner'

interface Order {
  quote_no: string
  order_title: string
  customer_name: string
  salesperson_name: string
  date_created: string
  total_sell: number
  total_cost: number
  overall_margin_pct: number
  low_margin_line_count: number
  status: string
}

// Format currency
const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return '$0'
  return value.toLocaleString('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

export default function OrdersAzure() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalValue = orders.reduce((sum, order) => sum + (order.total_sell || 0), 0)
    const lowMarginOrders = orders.filter(order => order.overall_margin_pct < 20).length
    const avgMargin = orders.length > 0 
      ? orders.reduce((sum, order) => sum + (order.overall_margin_pct || 0), 0) / orders.length
      : 0

    return {
      totalOrders: orders.length,
      totalValue,
      lowMarginOrders,
      avgMargin
    }
  }, [orders])

  // Fetch orders from Azure Functions
  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await azureApi.getOrders()
      setOrders(data?.orders || [])
      setLastUpdated(new Date())
      
      if (data?.orders?.length > 0) {
        toast.success(`Loaded ${data.orders.length} orders from Azure`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load orders'
      setError(message)
      toast.error(`Azure API Error: ${message}`)
      console.error('Orders fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  if (loading) {
    return (
      <ModernPageLayout
        title="Orders"
        description="Loading orders from Azure..."
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading from Azure Functions...</p>
          </div>
        </div>
      </ModernPageLayout>
    )
  }

  if (error) {
    return (
      <ModernPageLayout
        title="Orders"
        description="Error loading orders"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Orders</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchOrders} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </ModernPageLayout>
    )
  }

  return (
    <ModernPageLayout
      title="Orders"
      description="Browse and analyze your active orders powered by Azure"
      showRefresh
      onRefresh={fetchOrders}
      refreshLoading={loading}
      statusInfo={{
        text: error ? "Azure API Issues" : "Azure Connected",
        status: error ? "error" : "healthy"
      }}
      actions={
        <Button variant="outline" size="sm" className="bg-white/60 hover:bg-white border-gray-200 shadow-sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      }
      headerContent={
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Azure-Powered Orders</h3>
              <p className="text-sm text-gray-600">Real-time data from Azure Functions + PostgreSQL</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Azure Functions Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>PostgreSQL Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      }
    >
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/60 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/70 backdrop-blur-sm text-blue-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{summaryStats.totalOrders}</p>
                <p className="text-xs text-gray-500">From Azure DB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200/60 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/70 backdrop-blur-sm text-emerald-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Value</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(summaryStats.totalValue)}</p>
                <p className="text-xs text-gray-500">Live from PostgreSQL</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200/60 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/70 backdrop-blur-sm text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Low Margin Orders</p>
                <p className="text-3xl font-bold text-gray-900">{summaryStats.lowMarginOrders}</p>
                <p className="text-xs text-gray-500">Low margin orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200/60 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/70 backdrop-blur-sm text-purple-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Avg Margin</p>
                <p className="text-3xl font-bold text-gray-900">{summaryStats.avgMargin.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">Across all orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="rounded-2xl border-gray-200/60 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <p className="text-sm text-gray-600">Powered by Azure Functions + PostgreSQL</p>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {orders.length} orders loaded
            </Badge>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-600 mb-4">No orders are available for your account.</p>
              <Button onClick={fetchOrders} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Order #</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Value</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Margin %</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map((order, index) => (
                    <tr key={order.quote_no} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">{order.quote_no}</td>
                      <td className="py-3 px-4">{order.order_title || 'N/A'}</td>
                      <td className="py-3 px-4">{order.customer_name || 'N/A'}</td>
                      <td className="py-3 px-4 font-semibold">{formatCurrency(order.total_sell)}</td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${
                          (order.overall_margin_pct || 0) >= 20 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(order.overall_margin_pct || 0).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs">
                          {order.status || 'Active'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </ModernPageLayout>
  )
} 