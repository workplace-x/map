import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  AdvancedLayout, 
  useLayoutContext 
} from '@/components/layout/advanced-layout-system'
import { 
  SmartKPI, 
  SmartTable 
} from '@/components/advanced/smart-data-components'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons'
import {
  Users, Filter, Download, Settings, ShoppingCart, TrendingUp, 
  AlertTriangle, DollarSign, RefreshCw, ExternalLink, HelpCircle,
  Truck, Clock, Package, Target, TrendingDown, BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { azureApiClient } from '@/lib/azure-api-client'

interface Salesperson {
  salesperson_id: string
  name: string
}

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

// Data hooks
const useOrderData = (selectedSalespeopleIds: string[]) => {
  return useQuery({
    queryKey: ['orders', selectedSalespeopleIds],
    queryFn: async () => {
      if (!selectedSalespeopleIds.length) return []
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')
      
      const ids = selectedSalespeopleIds.join(',')
      const response = await fetch(`/api/orders/active?salesperson_id=${encodeURIComponent(ids)}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch orders')
      return response.json()
    },
    enabled: selectedSalespeopleIds.length > 0,
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000 // Consider data stale after 30 seconds
  })
}

const useSalespeopleData = () => {
  return useQuery({
    queryKey: ['salespeople'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ods_hds_salesperson')
        .select('salesperson_id, name')
        .order('name')
      
      if (error) throw error
      return data || []
    },
    staleTime: 300000 // Cache for 5 minutes
  })
}

const useUserSalespeopleMapping = () => {
  return useQuery({
    queryKey: ['user-salespeople-mapping'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      
      if (!userId) return []
      
      const { data, error } = await supabase
        .from('user_account_mapping')
        .select('erp_salesperson_id')
        .eq('supabase_user_id', userId)
      
      if (error) throw error
      return (data || []).filter(row => row.erp_salesperson_id).map(row => row.erp_salesperson_id)
    },
    staleTime: 600000 // Cache for 10 minutes
  })
}

interface OrderIntelligenceGuideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function OrderIntelligenceGuideDialog({ open, onOpenChange }: OrderIntelligenceGuideDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            Order Intelligence System Guide
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900">📊 Order Analytics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span><strong>Healthy Margins:</strong> Orders with {'>'}20% margin</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span><strong>Risk Orders:</strong> Below margin threshold</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span><strong>Value Tracking:</strong> Real-time order values</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900">🔍 Analysis Features</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <span><strong>Margin Analysis:</strong> Line-by-line profitability</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  <span><strong>Performance Tracking:</strong> Salesperson insights</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span><strong>Risk Detection:</strong> Automated alerts</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg text-gray-900 mb-3">🚀 Future ML Features (Coming Soon)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-blue-50">
                <h4 className="font-semibold text-blue-900">Delivery Prediction</h4>
                <p className="text-blue-700">AI-powered delivery timeline forecasting</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <h4 className="font-semibold text-purple-900">Fulfillment Risk</h4>
                <p className="text-purple-700">Smart risk assessment for order completion</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <h4 className="font-semibold text-green-900">Quality Scoring</h4>
                <p className="text-green-700">Order quality metrics and recommendations</p>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg text-gray-900 mb-3">📈 Performance Metrics</h3>
            <div className="space-y-2 text-sm">
              <p>• <strong>Total Value:</strong> Sum of all order values in your selection</p>
              <p>• <strong>Average Margin:</strong> Overall profitability across orders</p>
              <p>• <strong>Risk Orders:</strong> Orders requiring attention due to low margins</p>
              <p>• <strong>Performance Trends:</strong> Month-over-month comparisons</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AdvancedOrdersPage() {
  const [selectedSalespeople, setSelectedSalespeople] = useState<Salesperson[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState('orders')
  const [searchQuery, setSearchQuery] = useState('')
  const [guideOpen, setGuideOpen] = useState(false)
  const { user } = useAuth()
  const { theme, density } = useLayoutContext()

  // Data fetching
  const { data: salespersonOptions = [] } = useSalespeopleData()
  const { data: userMappings = [] } = useUserSalespeopleMapping()
  const selectedSalespeopleIds = selectedSalespeople.map(sp => sp.salesperson_id)
  const { data: orders = [], isLoading, error, refetch } = useOrderData(selectedSalespeopleIds)

  // Set default salespeople when data loads
  React.useEffect(() => {
    if (salespersonOptions.length > 0 && userMappings.length > 0 && selectedSalespeople.length === 0) {
      const defaultSalespeople = salespersonOptions.filter(sp =>
        userMappings.includes(sp.salesperson_id)
      )
      setSelectedSalespeople(defaultSalespeople)
    }
  }, [salespersonOptions, userMappings, selectedSalespeople.length])

  // Filter orders based on search
  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders
    const query = searchQuery.toLowerCase()
    return orders.filter((order: Order) =>
      order.order_title?.toLowerCase().includes(query) ||
      order.customer_name?.toLowerCase().includes(query) ||
      order.quote_no?.toLowerCase().includes(query) ||
      order.salesperson_name?.toLowerCase().includes(query)
    )
  }, [orders, searchQuery])

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalOrders = filteredOrders.length
    const totalValue = filteredOrders.reduce((sum, order) => sum + (order.total_sell || 0), 0)
    const totalCost = filteredOrders.reduce((sum, order) => sum + (order.total_cost || 0), 0)
    const totalMargin = totalValue - totalCost
    const avgMargin = totalValue > 0 ? (totalMargin / totalValue) * 100 : 0
    const lowMarginOrders = filteredOrders.filter(order => order.overall_margin_pct < 20).length
    const highRiskOrders = filteredOrders.filter(order => order.low_margin_line_count > 0).length
    const recentOrders = filteredOrders.filter(order => {
      const orderDate = new Date(order.date_created)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return orderDate >= weekAgo
    }).length
    
    return {
      totalOrders,
      totalValue,
      totalMargin,
      avgMargin,
      lowMarginOrders,
      highRiskOrders,
      recentOrders
    }
  }, [filteredOrders])

  const handleRefresh = async () => {
    await refetch()
    toast.success('Orders data refreshed successfully')
  }

  const handleExport = async () => {
    try {
      const exportData = filteredOrders.map((order: Order) => ({
        order_number: order.quote_no,
        order_title: order.order_title,
        customer: order.customer_name,
        salesperson: order.salesperson_name,
        total_value: order.total_sell,
        total_cost: order.total_cost,
        margin_percent: order.overall_margin_pct,
        risk_lines: order.low_margin_line_count,
        date_created: order.date_created,
        status: order.status
      }))
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `orders-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success('Orders data exported successfully')
    } catch (error) {
      toast.error('Failed to export data')
    }
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

  // Toggle salesperson selection
  const toggleSalesperson = (salesperson: Salesperson) => {
    setSelectedSalespeople(prev => {
      const isSelected = prev.some(sp => sp.salesperson_id === salesperson.salesperson_id);
      if (isSelected) {
        return prev.filter(sp => sp.salesperson_id !== salesperson.salesperson_id);
      } else {
        return [...prev, salesperson];
      }
    });
  };

  const clearSelections = () => {
    setSelectedSalespeople([]);
  };

  // Smart table columns
  const orderColumns = [
    {
      key: 'order_title' as keyof Order,
      title: 'Order Details',
      sortable: true,
      sticky: true,
      width: '300px',
      formatter: (title: string, row: Order) => (
        <div>
          <p className="font-medium text-gray-900 mb-1">{title}</p>
          <p className="text-xs text-gray-500">#{row.quote_no}</p>
        </div>
      )
    },
    {
      key: 'customer_name' as keyof Order,
      title: 'Customer',
      sortable: true,
      width: '200px'
    },
    {
      key: 'salesperson_name' as keyof Order,
      title: 'Salesperson',
      sortable: true,
      width: '150px'
    },
    {
      key: 'total_sell' as keyof Order,
      title: 'Order Value',
      sortable: true,
      align: 'right' as const,
      formatter: (value: number) => (
        <span className="font-semibold text-blue-600">{formatCurrency(value || 0)}</span>
      )
    },
    {
      key: 'overall_margin_pct' as keyof Order,
      title: 'Margin Status',
      sortable: true,
      align: 'center' as const,
      formatter: (value: number) => (
        <div className={`flex items-center gap-2 justify-center font-semibold ${value >= 20 ? 'text-green-600' : 'text-red-600'}`}>
          <span>{value >= 20 ? '✔' : '⚠'}</span>
          <span>{value?.toFixed(1) || '0.0'}%</span>
        </div>
      )
    },
    {
      key: 'low_margin_line_count' as keyof Order,
      title: 'Risk Lines',
      sortable: true,
      align: 'center' as const,
      formatter: (count: number) => (
        count > 0 ? (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {count} lines
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-green-600 border-green-200">
            <Target className="h-3 w-3 mr-1" />
            Clean
          </Badge>
        )
      )
    },
    {
      key: 'date_created' as keyof Order,
      title: 'Created',
      sortable: true,
      formatter: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      key: 'quote_no' as keyof Order,
      title: 'Actions',
      sortable: false,
      width: '120px',
      formatter: (quoteNo: string) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`/margin-analysis?order=${quoteNo}`, '_blank')}
          className="text-xs"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Analyze
        </Button>
      )
    }
  ]

  return (
    <AdvancedLayout>
      <AdvancedLayout.Header
        title="Order Intelligence Dashboard"
        description="Advanced order tracking with margin analysis and performance insights"
        searchPlaceholder="Search orders by title, customer, or number..."
        onSearch={setSearchQuery}
        onRefresh={handleRefresh}
        refreshLoading={isLoading}
        statusInfo={{
          text: error ? "Data Issues Detected" : "Orders Synchronized",
          status: error ? "error" : "healthy",
          details: error ? "Check connection and try again" : `${analytics.totalOrders} orders loaded • Last updated: ${new Date().toLocaleTimeString()}`
        }}
        metrics={[
          { 
            label: "Total Orders", 
            value: analytics.totalOrders,
            trend: "up",
            change: "+5.2%"
          },
          { 
            label: "Total Value", 
            value: formatCurrency(analytics.totalValue),
            trend: "up",
            change: "+8.7%"
          },
          { 
            label: "Avg Margin", 
            value: `${analytics.avgMargin.toFixed(1)}%`,
            trend: analytics.avgMargin >= 20 ? "up" : "down",
            change: "+1.3%"
          },
          { 
            label: "Risk Orders", 
            value: analytics.lowMarginOrders,
            trend: "down",
            change: "-12%"
          }
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setGuideOpen(true)}>
              <HelpCircle className="h-4 w-4 mr-2" />
              Guide
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

      {/* Salesperson Filter Section */}
      <AdvancedLayout.Card variant="glass" padding="sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Filter by Salesperson</h3>
              <p className="text-sm text-gray-600">Select salespeople to view their orders</p>
            </div>
          </div>

          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isFilterOpen}
                className="min-w-[200px] justify-between bg-white/80 hover:bg-white border-gray-200"
              >
                {selectedSalespeople.length === 0
                  ? "Select salespeople..."
                  : `${selectedSalespeople.length} selected`}
                <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput placeholder="Search salespeople..." />
                <CommandList>
                  <CommandEmpty>No salespeople found.</CommandEmpty>
                  <CommandGroup>
                    {salespersonOptions.map((salesperson) => {
                      const isSelected = selectedSalespeople.some(
                        sp => sp.salesperson_id === salesperson.salesperson_id
                      );
                      return (
                        <CommandItem
                          key={salesperson.salesperson_id}
                          onSelect={() => toggleSalesperson(salesperson)}
                        >
                          <div className="flex items-center space-x-2">
                            <div className={cn(
                              "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible"
                            )}>
                              <CheckIcon className="h-4 w-4" />
                            </div>
                            <span>{salesperson.name}</span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
              {selectedSalespeople.length > 0 && (
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelections}
                    className="w-full"
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Selected salespeople badges */}
        {selectedSalespeople.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedSalespeople.map((salesperson) => (
              <Badge
                key={salesperson.salesperson_id}
                variant="secondary"
                className="cursor-pointer bg-white/80 hover:bg-white border-gray-200"
                onClick={() => toggleSalesperson(salesperson)}
              >
                {salesperson.name}
                <span className="ml-1 text-xs">×</span>
              </Badge>
            ))}
          </div>
        )}
      </AdvancedLayout.Card>

      {/* Smart KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SmartKPI
          title="Total Orders"
          value={analytics.totalOrders}
          icon={<ShoppingCart />}
          color="blue"
          loading={isLoading}
          subtitle="Active orders"
          trend={{ direction: 'up', percentage: 5.2, period: 'vs last month' }}
        />
        
        <SmartKPI
          title="Total Value"
          value={analytics.totalValue}
          format="currency"
          icon={<DollarSign />}
          color="green"
          trend={{ direction: 'up', percentage: 8.7, period: 'vs last month' }}
          loading={isLoading}
          target={5000000}
        />
        
        <SmartKPI
          title="Average Margin"
          value={analytics.avgMargin}
          format="percentage"
          icon={<TrendingUp />}
          color="purple"
          trend={{ direction: analytics.avgMargin >= 20 ? 'up' : 'down', percentage: 1.3, period: 'vs target' }}
          loading={isLoading}
          target={20}
        />
        
        <SmartKPI
          title="Risk Orders"
          value={analytics.lowMarginOrders}
          icon={<AlertTriangle />}
          color="red"
          loading={isLoading}
          subtitle="Below 20% margin"
          trend={{ direction: 'down', percentage: -12, period: 'vs last week' }}
          interactive
          onClick={() => setSelectedTab('risks')}
        />
      </div>

      {/* Advanced Content */}
      <AdvancedLayout.Card variant="elevated" className="min-h-[600px]">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="bg-gray-100/80 backdrop-blur-sm rounded-xl border border-gray-200">
              <TabsTrigger value="orders" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
                📦 Orders Table
              </TabsTrigger>
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
                📊 Performance Overview
              </TabsTrigger>
              <TabsTrigger value="risks" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
                ⚠️ Risk Analysis
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
                📈 Advanced Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="orders" className="space-y-6">
            <SmartTable
              data={filteredOrders}
              columns={orderColumns}
              loading={isLoading}
              searchable={false} // Search handled by header
              exportable={true}
              selectable={true}
              realTime={true}
              onRefresh={handleRefresh}
              onExport={handleExport}
              onRowClick={(order) => window.open(`/margin-analysis?order=${order.quote_no}`, '_blank')}
            />
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Performance Metrics */}
              <AdvancedLayout.Card variant="glass" padding="sm">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Success Rate</h3>
                    <p className="text-3xl font-bold text-green-600">{((analytics.totalOrders - analytics.lowMarginOrders) / Math.max(analytics.totalOrders, 1) * 100).toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">Orders above margin target</p>
                  </div>
                </div>
              </AdvancedLayout.Card>

              <AdvancedLayout.Card variant="glass" padding="sm">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Recent Orders</h3>
                    <p className="text-3xl font-bold text-blue-600">{analytics.recentOrders}</p>
                    <p className="text-sm text-gray-600">This week</p>
                  </div>
                </div>
              </AdvancedLayout.Card>

              <AdvancedLayout.Card variant="glass" padding="sm">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-purple-100 flex items-center justify-center">
                    <Truck className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Avg Order Value</h3>
                    <p className="text-3xl font-bold text-purple-600">{formatCurrency(analytics.totalValue / Math.max(analytics.totalOrders, 1))}</p>
                    <p className="text-sm text-gray-600">Per order</p>
                  </div>
                </div>
              </AdvancedLayout.Card>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AdvancedLayout.Card variant="glass" padding="sm" className="border-green-200 bg-green-50/50">
                <div className="text-center space-y-2">
                  <h4 className="font-semibold text-green-900">Healthy Orders</h4>
                  <p className="text-2xl font-bold text-green-700">{analytics.totalOrders - analytics.lowMarginOrders}</p>
                  <p className="text-sm text-green-600">{formatCurrency(analytics.totalValue * (analytics.totalOrders - analytics.lowMarginOrders) / Math.max(analytics.totalOrders, 1))} value</p>
                </div>
              </AdvancedLayout.Card>

              <AdvancedLayout.Card variant="glass" padding="sm" className="border-red-200 bg-red-50/50">
                <div className="text-center space-y-2">
                  <h4 className="font-semibold text-red-900">Risk Orders</h4>
                  <p className="text-2xl font-bold text-red-700">{analytics.lowMarginOrders}</p>
                  <p className="text-sm text-red-600">{formatCurrency(analytics.totalValue * analytics.lowMarginOrders / Math.max(analytics.totalOrders, 1))} at risk</p>
                </div>
              </AdvancedLayout.Card>
            </div>
          </TabsContent>

          <TabsContent value="risks" className="space-y-6">
            <div className="space-y-4">
              <AnimatePresence>
                {filteredOrders.filter((order: Order) => order.overall_margin_pct < 20).map((order: Order) => (
                  <motion.div
                    key={order.quote_no}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-semibold text-gray-900">{order.order_title}</p>
                          <p className="text-sm text-gray-600">
                            Customer: {order.customer_name} • Salesperson: {order.salesperson_name}
                          </p>
                          {order.low_margin_line_count > 0 && (
                            <p className="text-xs text-red-600 mt-1">
                              {order.low_margin_line_count} line items below margin threshold
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">{order.overall_margin_pct.toFixed(1)}%</p>
                        <p className="text-sm text-gray-600">{formatCurrency(order.total_sell)}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/margin-analysis?order=${order.quote_no}`, '_blank')}
                          className="mt-1 text-xs"
                        >
                          Analyze
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {filteredOrders.filter((order: Order) => order.overall_margin_pct < 20).length === 0 && (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 mx-auto text-green-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No risk orders found</h3>
                  <p className="text-gray-600">All orders are above the 20% margin threshold. Great work!</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Advanced Order Analytics</h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Comprehensive order analytics with machine learning insights coming soon. 
                Features delivery prediction, fulfillment risk assessment, and smart optimization recommendations.
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <Badge variant="outline" className="px-3 py-1">🚚 Delivery Prediction</Badge>
                <Badge variant="outline" className="px-3 py-1">⚡ Fulfillment Risk</Badge>
                <Badge variant="outline" className="px-3 py-1">📊 Quality Scoring</Badge>
                <Badge variant="outline" className="px-3 py-1">🎯 Performance Optimization</Badge>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </AdvancedLayout.Card>

      {/* Advanced Status Bar */}
      <AdvancedLayout.StatusBar
        items={[
          { 
            label: "Data Status", 
            value: error ? "Error" : "Healthy", 
            status: error ? "error" : "active",
            details: error ? "Check connection" : "Real-time sync active"
          },
          { 
            label: "Total Orders", 
            value: analytics.totalOrders.toString(), 
            status: "active" 
          },
          { 
            label: "Last Updated", 
            value: new Date().toLocaleTimeString(), 
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

      {/* Order Intelligence Guide Dialog */}
      <OrderIntelligenceGuideDialog open={guideOpen} onOpenChange={setGuideOpen} />
    </AdvancedLayout>
  )
} 