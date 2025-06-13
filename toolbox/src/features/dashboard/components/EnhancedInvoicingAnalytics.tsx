import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  DollarSign, TrendingUp, Users, Target, Trophy, Calendar, 
  BarChart3, PieChart, Eye, ChevronDown, ChevronRight, Filter,
  ArrowUpRight, ArrowDownRight, Activity, TrendingDown, Receipt,
  Clock, CreditCard, AlertTriangle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie,
  ComposedChart, Area, AreaChart
} from 'recharts'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tangram-marketing-functions.azurewebsites.net';

// Types for our enhanced invoicing analytics
interface InvoiceDetail {
  invoice_no: string
  order_no: string
  customer_name: string
  salesperson_name: string
  invoice_date: string
  invoice_total: number
  cost_of_goods: number
  gross_profit: number
  margin_percent: number
  payment_status?: string
  days_outstanding?: number
}

interface CustomerInvoiceBreakdown {
  customer_name: string
  total_invoiced: number
  invoice_count: number
  avg_invoice_size: number
  gross_profit: number
  margin_percent: number
  collection_rate?: number
}

interface InvoiceTimeSeriesData {
  date: string
  daily_invoicing: number
  cumulative_invoicing: number
  invoice_count: number
  avg_invoice_size: number
}

export default function EnhancedInvoicingAnalytics({ timeframe = 'monthly' }: { timeframe?: 'monthly' | 'yearly' }) {
  const [loading, setLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'overview' | 'customers' | 'aging' | 'salespeople' | 'timeline'>('overview')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [selectedFilters, setSelectedFilters] = useState({
    salesperson: '',
    customer: '',
    payment_status: '',
    date_range: timeframe === 'monthly' ? 'this_month' : 'this_year'
  })

  // Data states
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetail[]>([])
  const [customerBreakdown, setCustomerBreakdown] = useState<CustomerInvoiceBreakdown[]>([])
  const [salespersonBreakdown, setSalespersonBreakdown] = useState<any[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<InvoiceTimeSeriesData[]>([])
  const [summaryStats, setSummaryStats] = useState({
    total_invoicing: 0,
    total_invoices: 0,
    avg_invoice_size: 0,
    total_gross_profit: 0,
    avg_margin_percent: 0,
    growth_rate: 0,
    collection_rate: 0,
    avg_days_outstanding: 0
  })

  useEffect(() => {
    fetchEnhancedInvoicingData()
  }, [timeframe, selectedFilters])

  const fetchEnhancedInvoicingData = async () => {
    setLoading(true)
    try {
      const endpoint = timeframe === 'monthly' ? 'enhanced-monthly-invoicing' : 'enhanced-yearly-invoicing'
      const queryParams = new URLSearchParams(selectedFilters).toString()
      
      const [detailsRes, customersRes, salesRes, timelineRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/${endpoint}/details?${queryParams}`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/${endpoint}/customers?${queryParams}`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/${endpoint}/salespeople?${queryParams}`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/${endpoint}/timeline?${queryParams}`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/${endpoint}/summary?${queryParams}`).then(r => r.json())
      ])

      setInvoiceDetails(detailsRes.data || [])
      setCustomerBreakdown(customersRes.data || [])
      setSalespersonBreakdown(salesRes.data || [])
      setTimeSeriesData(timelineRes.data || [])
      setSummaryStats(summaryRes.data || summaryStats)
    } catch (error) {
      console.error('Failed to fetch enhanced invoicing data:', error)
    } finally {
      setLoading(false)
    }
  }

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

  // Enhanced Summary Cards for Invoicing
  const summaryCards = [
    {
      title: 'Total Invoicing',
      value: formatLargeNumber(summaryStats.total_invoicing),
      change: summaryStats.growth_rate,
      icon: Receipt,
      color: 'purple',
      subtitle: `${summaryStats.total_invoices} invoices`
    },
    {
      title: 'Average Invoice Size',
      value: formatCurrency(summaryStats.avg_invoice_size),
      change: 8.2,
      icon: DollarSign,
      color: 'blue',
      subtitle: 'per invoice'
    },
    {
      title: 'Collection Rate',
      value: `${summaryStats.collection_rate.toFixed(1)}%`,
      change: summaryStats.collection_rate - 90,
      icon: CreditCard,
      color: 'green',
      subtitle: 'payment efficiency'
    },
    {
      title: 'Days Outstanding',
      value: `${summaryStats.avg_days_outstanding.toFixed(0)} days`,
      change: -2.1,
      icon: Clock,
      color: 'orange',
      subtitle: 'average DSO'
    }
  ]

  // Chart Colors
  const chartColors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316']

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
              {timeframe === 'monthly' ? 'Monthly' : 'Yearly'} Invoicing Analytics
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
          <Tabs value={selectedView} onValueChange={(value: any) => setSelectedView(value)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">📊 Overview</TabsTrigger>
              <TabsTrigger value="customers">👥 Customers</TabsTrigger>
              <TabsTrigger value="aging">⏰ Aging</TabsTrigger>
              <TabsTrigger value="salespeople">🏆 Sales Team</TabsTrigger>
              <TabsTrigger value="timeline">📈 Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Distribution Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Invoice Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={customerBreakdown.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="customer_name" 
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          fontSize={12}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: any) => [formatLargeNumber(value), 'Invoiced']}
                          labelStyle={{ fontSize: '12px' }}
                        />
                        <Bar 
                          dataKey="total_invoiced" 
                          fill="#8B5CF6"
                          onClick={(data) => {
                            setSelectedFilters(prev => ({ ...prev, customer: data.customer_name }))
                            setSelectedView('customers')
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Payment Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Status Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="font-medium text-green-800">Paid</span>
                          </div>
                          <p className="text-2xl font-bold text-green-600">
                            {summaryStats.collection_rate.toFixed(1)}%
                          </p>
                          <p className="text-sm text-green-600">of total invoices</p>
                        </div>
                        
                        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span className="font-medium text-yellow-800">Outstanding</span>
                          </div>
                          <p className="text-2xl font-bold text-yellow-600">
                            {(100 - summaryStats.collection_rate).toFixed(1)}%
                          </p>
                          <p className="text-sm text-yellow-600">pending payment</p>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-blue-800">Average Collection Time</span>
                          <span className="font-bold text-blue-600">
                            {summaryStats.avg_days_outstanding.toFixed(0)} days
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(summaryStats.avg_days_outstanding / 45 * 100, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-blue-600 mt-1">Target: &lt;30 days</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Invoices Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Invoice</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Salesperson</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceDetails.slice(0, 10).map((invoice, index) => (
                          <motion.tr
                            key={invoice.invoice_no}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                            onClick={() => toggleRowExpansion(invoice.invoice_no)}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {expandedRows.has(invoice.invoice_no) ? (
                                  <ChevronDown className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-400" />
                                )}
                                <span className="font-medium text-purple-600">{invoice.invoice_no}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-900">{invoice.customer_name}</td>
                            <td className="py-3 px-4 text-gray-900">{invoice.salesperson_name}</td>
                            <td className="py-3 px-4 font-semibold">{formatCurrency(invoice.invoice_total)}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                (invoice.days_outstanding || 0) <= 30 ? 'bg-green-100 text-green-800' :
                                (invoice.days_outstanding || 0) <= 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {(invoice.days_outstanding || 0) <= 30 ? 'Current' :
                                 (invoice.days_outstanding || 0) <= 60 ? 'Past Due' : 'Overdue'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {new Date(invoice.invoice_date).toLocaleDateString()}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Invoice Performance Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Detailed customer invoice analytics coming up...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="aging" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Accounts Receivable Aging Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">AR aging analysis coming up...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="salespeople" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Team Invoice Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Sales team invoice analytics coming up...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Timeline Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Timeline analysis coming up...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 