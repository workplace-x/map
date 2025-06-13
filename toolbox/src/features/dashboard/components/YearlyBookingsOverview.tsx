import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, TrendingUp, Users, Target, Trophy, Calendar, BarChart3 } from 'lucide-react'
import { Overview } from './overview'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tangram-marketing-functions.azurewebsites.net';

interface TopPerformer {
  salesperson_name: string
  total_bookings: number
  total_gp: number
  order_count: number
}

interface TopCustomer {
  customer_name: string
  total_bookings: number
  order_count: number
}

interface MonthlyData {
  month: number
  total_booked: number
}

export default function YearlyBookingsOverview() {
  const [loading, setLoading] = useState(true)
  const [topSalespeople, setTopSalespeople] = useState<TopPerformer[]>([])
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
  const [totalBookings, setTotalBookings] = useState(0)
  const [yearData, setYearData] = useState<MonthlyData[]>([])
  const [percentageChange, setPercentageChange] = useState(0)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [salesRes, customersRes, summaryRes, monthlyRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/bookings-leaderboard-sales-this-year`).then(r => r.json()),
          fetch(`${API_BASE_URL}/api/top-customers-bookings-this-year`).then(r => r.json()),
          fetch(`${API_BASE_URL}/api/total-booked-this-year`).then(r => r.json()),
          fetch(`${API_BASE_URL}/api/bookings-by-month-this-year`).then(r => r.json())
        ])
        
        setTopSalespeople(Array.isArray(salesRes) ? salesRes.slice(0, 5) : [])
        setTopCustomers(Array.isArray(customersRes) ? customersRes.slice(0, 5) : [])
        setTotalBookings(summaryRes.total || 0)
        setPercentageChange(summaryRes.percentage_change || 0)
        setYearData(monthlyRes.bookings || [])
      } catch (error) {
        console.error('Failed to fetch yearly bookings overview:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  const totalOrders = topSalespeople.reduce((sum, sp) => sum + sp.order_count, 0)
  const avgOrderSize = totalOrders > 0 ? totalBookings / totalOrders : 0
  const strongestMonth = yearData.reduce((max, month) => 
    month.total_booked > max.total_booked ? month : max, 
    { month: 0, total_booked: 0 }
  )
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded-xl"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/60">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Volume</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBookings)}</p>
                <p className="text-xs text-gray-500">{totalOrders} orders YTD</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/60">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-100 text-green-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">YoY Growth</p>
                <p className="text-2xl font-bold text-gray-900">
                  {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">vs last year</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200/60">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Size</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(avgOrderSize)}</p>
                <p className="text-xs text-gray-500">per order</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200/60">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Strongest Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {strongestMonth.month ? monthNames[strongestMonth.month - 1] : 'N/A'}
                </p>
                <p className="text-xs text-gray-500">{formatCurrency(strongestMonth.total_booked)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Monthly Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Overview />
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Top Performers (YTD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSalespeople.map((person, index) => (
                <div key={person.salesperson_name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Badge variant={index === 0 ? "default" : "secondary"} className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{person.salesperson_name}</p>
                      <p className="text-xs text-gray-500">{person.order_count} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 text-sm">{formatCurrency(person.total_bookings)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Top Customers (Year to Date)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topCustomers.map((customer, index) => (
              <div key={customer.customer_name} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <Badge variant={index < 3 ? "default" : "secondary"} className="w-8 h-8 rounded-full flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium text-gray-900">{customer.customer_name}</p>
                    <p className="text-sm text-gray-500">{customer.order_count} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(customer.total_bookings)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 