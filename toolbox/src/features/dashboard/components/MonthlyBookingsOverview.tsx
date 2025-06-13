import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, TrendingUp, Users, Target, Trophy, Calendar } from 'lucide-react'
import BookingsThisMonthTable from './BookingsThisMonthTable'

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

export default function MonthlyBookingsOverview() {
  const [loading, setLoading] = useState(true)
  const [topSalespeople, setTopSalespeople] = useState<TopPerformer[]>([])
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
  const [totalBookings, setTotalBookings] = useState(0)
  const [totalGP, setTotalGP] = useState(0)
  const [orderCount, setOrderCount] = useState(0)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [salesRes, customersRes, summaryRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/bookings-leaderboard-sales-this-month`).then(r => r.json()),
          fetch(`${API_BASE_URL}/api/top-customers-bookings-this-month`).then(r => r.json()),
          fetch(`${API_BASE_URL}/api/total-booked-this-month`).then(r => r.json())
        ])
        
        setTopSalespeople(Array.isArray(salesRes) ? salesRes.slice(0, 5) : [])
        setTopCustomers(Array.isArray(customersRes) ? customersRes.slice(0, 5) : [])
        setTotalBookings(summaryRes.total || 0)
        setOrderCount(summaryRes.order_count || 0)
      } catch (error) {
        console.error('Failed to fetch monthly bookings overview:', error)
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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/60">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Volume</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBookings)}</p>
                <p className="text-xs text-gray-500">{orderCount} orders</p>
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
                <p className="text-sm font-medium text-gray-600">Avg Order Size</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orderCount > 0 ? formatCurrency(totalBookings / orderCount) : '$0'}
                </p>
                <p className="text-xs text-gray-500">per order</p>
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
                <p className="text-sm font-medium text-gray-600">Active Salespeople</p>
                <p className="text-2xl font-bold text-gray-900">{topSalespeople.length}</p>
                <p className="text-xs text-gray-500">with bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Salespeople */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSalespeople.map((person, index) => (
                <div key={person.salesperson_name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Badge variant={index === 0 ? "default" : "secondary"} className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium text-gray-900">{person.salesperson_name}</p>
                      <p className="text-sm text-gray-500">{person.order_count} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(person.total_bookings)}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(person.total_gp)} GP</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Top Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCustomers.map((customer, index) => (
                <div key={customer.customer_name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Badge variant={index === 0 ? "default" : "secondary"} className="w-8 h-8 rounded-full flex items-center justify-center">
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

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-500" />
            Monthly Bookings Detail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BookingsThisMonthTable />
        </CardContent>
      </Card>
    </div>
  )
} 