import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  DollarSign, TrendingUp, Users, Target, Trophy, Calendar, 
  BarChart3, PieChart, Eye, ChevronDown, ChevronRight, Filter,
  ArrowUpRight, ArrowDownRight, Activity, TrendingDown,
  Building2, Truck, ShoppingCart, Package, UserCheck, Percent
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie,
  ComposedChart, Area, AreaChart, Treemap
} from 'recharts'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tangram-marketing-functions.azurewebsites.net';

// Types for our enhanced analytics
interface BookingDetail {
  order_no: string
  customer_name: string
  salesperson_name: string
  book_date: string
  order_total: number
  gross_profit: number
  margin_percent: number
  product_category?: string
  territory?: string
  order_type?: string
}

interface CustomerBreakdown {
  customer_name: string
  total_bookings: number
  order_count: number
  avg_order_size: number
  gross_profit: number
  margin_percent: number
  growth_rate?: number
}

interface ProductBreakdown {
  product_category: string
  total_bookings: number
  order_count: number
  margin_percent: number
  growth_rate?: number
}

interface SalespersonBreakdown {
  salesperson_name: string
  total_bookings: number
  order_count: number
  gross_profit: number
  avg_deal_size: number
  win_rate?: number
  pipeline_value?: number
}

interface TimeSeriesData {
  date: string
  daily_bookings: number
  cumulative_bookings: number
  order_count: number
  avg_order_size: number
}

interface BookingsData {
  total_bookings: number;
  total_orders: number;
  avg_order_size: number;
  total_gross_profit: number;
  avg_margin_percent: number;
  growth_rate: number;
}

interface CustomerData {
  customer_name: string;
  total_bookings: number;
  order_count: number;
  avg_order_size: number;
  gross_profit: number;
  margin_percent: number;
}

interface VendorData {
  vendor_name: string;
  total_bookings: number;
  order_count: number;
  avg_order_size: number;
  gross_profit: number;
  margin_percent: number;
}

interface SalespersonData {
  salesperson_name: string;
  total_bookings: number;
  order_count: number;
  avg_deal_size: number;
  gross_profit: number;
}

interface TimelineData {
  date: string;
  daily_bookings: number;
  order_count: number;
  avg_order_size: number;
}

interface RecentOrderData {
  order_no: string;
  customer_name: string;
  salesperson_name: string;
  book_date: string;
  order_total: number;
  gross_profit: number;
  margin_percent: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

// Custom treemap content component
const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, index, payload } = props;
  
  // Safety check for payload and required properties
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  
  if (!payload.customer_name || typeof payload.customer_name !== 'string') {
    return null;
  }
  
  if (!payload.total_bookings || typeof payload.total_bookings !== 'number') {
    return null;
  }
  
  const { customer_name, total_bookings } = payload;
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: COLORS[index % COLORS.length],
          stroke: '#fff',
          strokeWidth: 2,
          strokeOpacity: 1,
        }}
      />
      {width > 100 && height > 50 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#fff"
          fontSize="12"
          fontWeight="bold"
        >
          <tspan x={x + width / 2} dy="-10">
            {customer_name.length > 15 ? customer_name.substring(0, 15) + '...' : customer_name}
          </tspan>
          <tspan x={x + width / 2} dy="20">
            ${(total_bookings / 1000).toFixed(0)}K
          </tspan>
        </text>
      )}
    </g>
  );
};

export default function EnhancedBookingsAnalytics({ timeframe = 'monthly' }: { timeframe?: 'monthly' | 'yearly' }) {
  const [loading, setLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'overview' | 'customers' | 'products' | 'salespeople' | 'timeline'>('overview')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [selectedFilters, setSelectedFilters] = useState({
    salesperson: '',
    customer: '',
    product_category: '',
    date_range: timeframe === 'monthly' ? 'this_month' : 'this_year'
  })

  // Data states
  const [bookingDetails, setBookingDetails] = useState<BookingDetail[]>([])
  const [customerBreakdown, setCustomerBreakdown] = useState<CustomerBreakdown[]>([])
  const [productBreakdown, setProductBreakdown] = useState<ProductBreakdown[]>([])
  const [salespersonBreakdown, setSalespersonBreakdown] = useState<SalespersonBreakdown[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [summaryStats, setSummaryStats] = useState({
    total_bookings: 0,
    total_orders: 0,
    avg_order_size: 0,
    total_gross_profit: 0,
    avg_margin_percent: 0,
    growth_rate: 0
  })

  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<BookingsData | null>(null);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [salespeople, setSalespeople] = useState<SalespersonData[]>([]);
  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrderData[]>([]);

  useEffect(() => {
    fetchEnhancedBookingsData()
    fetchData()
  }, [timeframe, selectedFilters])

  const fetchEnhancedBookingsData = async () => {
    setLoading(true)
    try {
      const endpoint = timeframe === 'monthly' ? 'enhanced-monthly-bookings' : 'enhanced-yearly-bookings'
      const queryParams = new URLSearchParams(selectedFilters).toString()
      
      const [detailsRes, customersRes, productsRes, salesRes, timelineRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/${endpoint}/details?${queryParams}`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/${endpoint}/customers?${queryParams}`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/${endpoint}/products?${queryParams}`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/${endpoint}/salespeople?${queryParams}`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/${endpoint}/timeline?${queryParams}`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/${endpoint}/summary?${queryParams}`).then(r => r.json())
      ])

      setBookingDetails(detailsRes.data || [])
      setCustomerBreakdown(customersRes.data || [])
      setProductBreakdown(productsRes.data || [])
      setSalespersonBreakdown(salesRes.data || [])
      setTimeSeriesData(timelineRes.data || [])
      setSummaryStats(summaryRes.data || summaryStats)
    } catch (error) {
      console.error('Failed to fetch enhanced bookings data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const endpoints = [
        'https://tangram-marketing-functions.azurewebsites.net/api/enhanced-monthly-bookings/summary',
        'https://tangram-marketing-functions.azurewebsites.net/api/enhanced-monthly-bookings/customers',
        'https://tangram-marketing-functions.azurewebsites.net/api/enhanced-monthly-bookings/vendors',
        'https://tangram-marketing-functions.azurewebsites.net/api/enhanced-monthly-bookings/salespeople',
        'https://tangram-marketing-functions.azurewebsites.net/api/enhanced-monthly-bookings/timeline',
        'https://tangram-marketing-functions.azurewebsites.net/api/enhanced-monthly-bookings/recent-orders'
      ];

      const responses = await Promise.all(
        endpoints.map(endpoint => 
          fetch(endpoint).then(res => res.json())
        )
      );

      const [summaryRes, customersRes, vendorsRes, salespeopleRes, timelineRes, ordersRes] = responses;

      if (summaryRes.success) setData(summaryRes.data);
      if (customersRes.success) setCustomers(customersRes.data);
      if (vendorsRes.success) setVendors(vendorsRes.data);
      if (salespeopleRes.success) setSalespeople(salespeopleRes.data);
      if (timelineRes.success) setTimeline(timelineRes.data);
      if (ordersRes.success) setRecentOrders(ordersRes.data);

    } catch (error) {
      console.error('Error fetching bookings analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  const formatLargeNumber = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return formatCurrency(value);
  }

  const toggleRowExpansion = (rowId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId)
    } else {
      newExpanded.add(rowId)
    }
    setExpandedRows(newExpanded)
  }

  // Enhanced Summary Cards
  const summaryCards = [
    {
      title: 'Total Bookings',
      value: formatLargeNumber(summaryStats.total_bookings),
      change: summaryStats.growth_rate,
      icon: DollarSign,
      color: 'blue',
      subtitle: `${summaryStats.total_orders} orders`
    },
    {
      title: 'Average Deal Size',
      value: formatCurrency(summaryStats.avg_order_size),
      change: 12.5,
      icon: TrendingUp,
      color: 'green',
      subtitle: 'per order'
    },
    {
      title: 'Gross Profit',
      value: formatLargeNumber(summaryStats.total_gross_profit),
      change: summaryStats.avg_margin_percent,
      icon: Target,
      color: 'purple',
      subtitle: `${summaryStats.avg_margin_percent.toFixed(1)}% margin`
    },
    {
      title: 'Active Customers',
      value: customerBreakdown.length,
      change: 8.3,
      icon: Users,
      color: 'orange',
      subtitle: 'with orders'
    }
  ]

  // Chart Colors
  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-xl"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {summaryCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`bg-gradient-to-br from-${card.color}-50 to-${card.color}-100 border-${card.color}-200/60`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-${card.color}-100 text-${card.color}-600`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    <div className="flex items-center gap-1 text-sm">
                      {card.change > 0 ? (
                        <ArrowUpRight className="h-3 w-3 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-600" />
                      )}
                      <span className={card.change > 0 ? 'text-green-600' : 'text-red-600'}>
                        {Math.abs(card.change).toFixed(1)}%
                      </span>
                      <span className="text-gray-500">{card.subtitle}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Interactive Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">
              {timeframe === 'monthly' ? 'Monthly' : 'Yearly'} Bookings Analytics
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm">
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
              <TabsTrigger value="salesteam">Sales Team</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="orders">Recent Orders</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                        <p className="text-2xl font-bold">{formatCurrency(data?.total_bookings || 0)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="flex items-center mt-2">
                      {(data?.growth_rate || 0) >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                      )}
                      <span className={`text-sm ${(data?.growth_rate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(data?.growth_rate || 0).toFixed(1)}%
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">vs last month</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                        <p className="text-2xl font-bold">{data?.total_orders || 0}</p>
                      </div>
                      <ShoppingCart className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Avg Order Size</p>
                        <p className="text-2xl font-bold">{formatCurrency(data?.avg_order_size || 0)}</p>
                      </div>
                      <Package className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Gross Profit</p>
                        <p className="text-2xl font-bold">{formatCurrency(data?.total_gross_profit || 0)}</p>
                      </div>
                      <Percent className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="mt-2">
                      <Badge variant="secondary">
                        {(data?.avg_margin_percent || 0).toFixed(1)}% Margin
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Customers (Current Month)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {customers.slice(0, 5).map((customer, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{customer.customer_name}</p>
                            <p className="text-sm text-muted-foreground">{customer.order_count} orders</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(customer.total_bookings)}</p>
                            <p className="text-sm text-muted-foreground">{customer.margin_percent.toFixed(1)}% margin</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Salespeople (Current Month)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {salespeople.slice(0, 5).map((person, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{person.salesperson_name}</p>
                            <p className="text-sm text-muted-foreground">{person.order_count} orders</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(person.total_bookings)}</p>
                            <p className="text-sm text-muted-foreground">Avg: {formatCurrency(person.avg_deal_size)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="customers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Customer Bookings Treemap
                  </CardTitle>
                  <CardDescription>
                    Visual representation of bookings by customer size. Click to drill down.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {customers.length > 0 ? (
                    <div style={{ width: '100%', height: '400px' }}>
                      <ResponsiveContainer>
                        <Treemap
                          data={customers.slice(0, 20)}
                          dataKey="total_bookings"
                          aspectRatio={4/3}
                          stroke="#fff"
                          fill="#8884d8"
                          content={<CustomTreemapContent />}
                        />
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Customer Data</h3>
                        <p className="text-gray-500">
                          {loading ? 'Loading customer data...' : 'No customer bookings found for the selected period.'}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Customer Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Customer</th>
                          <th className="text-right p-2">Bookings</th>
                          <th className="text-right p-2">Orders</th>
                          <th className="text-right p-2">Avg Order</th>
                          <th className="text-right p-2">Gross Profit</th>
                          <th className="text-right p-2">Margin %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.map((customer, index) => (
                          <tr key={index} className="border-b hover:bg-muted">
                            <td className="p-2 font-medium">{customer.customer_name}</td>
                            <td className="p-2 text-right">{formatCurrency(customer.total_bookings)}</td>
                            <td className="p-2 text-right">{customer.order_count}</td>
                            <td className="p-2 text-right">{formatCurrency(customer.avg_order_size)}</td>
                            <td className="p-2 text-right">{formatCurrency(customer.gross_profit)}</td>
                            <td className="p-2 text-right">{customer.margin_percent.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vendors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Vendor Performance
                  </CardTitle>
                  <CardDescription>
                    Analysis of bookings by vendor partnerships
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ width: '100%', height: '400px' }}>
                    <ResponsiveContainer>
                      <BarChart data={vendors.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="vendor_name" 
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [formatCurrency(value), 'Bookings']}
                        />
                        <Bar dataKey="total_bookings" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vendor Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Vendor</th>
                          <th className="text-right p-2">Bookings</th>
                          <th className="text-right p-2">Orders</th>
                          <th className="text-right p-2">Avg Order</th>
                          <th className="text-right p-2">Gross Profit</th>
                          <th className="text-right p-2">Margin %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendors.map((vendor, index) => (
                          <tr key={index} className="border-b hover:bg-muted">
                            <td className="p-2 font-medium">{vendor.vendor_name}</td>
                            <td className="p-2 text-right">{formatCurrency(vendor.total_bookings)}</td>
                            <td className="p-2 text-right">{vendor.order_count}</td>
                            <td className="p-2 text-right">{formatCurrency(vendor.avg_order_size)}</td>
                            <td className="p-2 text-right">{formatCurrency(vendor.gross_profit)}</td>
                            <td className="p-2 text-right">{vendor.margin_percent.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="salesteam" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Sales Team Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ width: '100%', height: '400px' }}>
                    <ResponsiveContainer>
                      <BarChart data={salespeople.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="salesperson_name" 
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [formatCurrency(value), 'Bookings']}
                        />
                        <Bar dataKey="total_bookings" fill="#ffc658" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sales Team Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Salesperson</th>
                          <th className="text-right p-2">Total Bookings</th>
                          <th className="text-right p-2">Orders</th>
                          <th className="text-right p-2">Avg Deal Size</th>
                          <th className="text-right p-2">Gross Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salespeople.map((person, index) => (
                          <tr key={index} className="border-b hover:bg-muted">
                            <td className="p-2 font-medium">{person.salesperson_name}</td>
                            <td className="p-2 text-right">{formatCurrency(person.total_bookings)}</td>
                            <td className="p-2 text-right">{person.order_count}</td>
                            <td className="p-2 text-right">{formatCurrency(person.avg_deal_size)}</td>
                            <td className="p-2 text-right">{formatCurrency(person.gross_profit)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Daily Bookings Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ width: '100%', height: '400px' }}>
                    <ResponsiveContainer>
                      <LineChart data={timeline}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => formatDate(value)}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => formatDate(value)}
                          formatter={(value: number) => [formatCurrency(value), 'Daily Bookings']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="daily_bookings" 
                          stroke="#8884d8" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Recent Orders (Last 30 Days)
                  </CardTitle>
                  <CardDescription>
                    Latest order activity with detailed breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Order #</th>
                          <th className="text-left p-2">Customer</th>
                          <th className="text-left p-2">Salesperson</th>
                          <th className="text-right p-2">Date</th>
                          <th className="text-right p-2">Order Total</th>
                          <th className="text-right p-2">Gross Profit</th>
                          <th className="text-right p-2">Margin %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order, index) => (
                          <tr key={index} className="border-b hover:bg-muted">
                            <td className="p-2 font-mono text-sm">{order.order_no}</td>
                            <td className="p-2">{order.customer_name}</td>
                            <td className="p-2">{order.salesperson_name}</td>
                            <td className="p-2 text-right">{formatDate(order.book_date)}</td>
                            <td className="p-2 text-right font-medium">{formatCurrency(order.order_total)}</td>
                            <td className="p-2 text-right">{formatCurrency(order.gross_profit)}</td>
                            <td className="p-2 text-right">
                              <Badge 
                                variant={order.margin_percent > 30 ? "default" : order.margin_percent > 15 ? "secondary" : "destructive"}
                              >
                                {order.margin_percent.toFixed(1)}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 