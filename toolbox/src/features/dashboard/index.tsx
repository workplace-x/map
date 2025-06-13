import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ModernPageLayout, ModernCard, ModernStatusBar } from '@/components/layout/modern-page-layout'
import { Overview } from './components/overview'
import { LeaderboardCard } from './components/recent-sales'
import BookingsThisMonthTable from './components/BookingsThisMonthTable'
import InvoicesThisMonthTable from './components/InvoicesThisMonthTable'
import MonthlyBookingsOverview from './components/MonthlyBookingsOverview'
import YearlyBookingsOverview from './components/YearlyBookingsOverview'
import MonthlyInvoicingOverview from './components/MonthlyInvoicingOverview'
import YearlyInvoicingOverview from './components/YearlyInvoicingOverview'
import React, { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Users, Activity, Download, X } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tangram-marketing-functions.azurewebsites.net';

// Type for API response
interface APIResponse {
  total: number
  comparison_total?: number
  percentage_change?: number
}

// Format currency values
const formatCurrency = (value: number | null) => {
  if (value === null) return '—'
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })
}

// Modern KPI Card component with trend support
const KPICard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  loading = false,
  color = 'blue',
  trend,
  onClick
}: {
  title: string
  value: string
  subtitle?: string
  icon: any
  loading?: boolean
  color?: 'blue' | 'green' | 'purple' | 'orange'
  trend?: {
    percentage: number
    direction: 'up' | 'down'
    period: string
  }
  onClick?: () => void
}) => {
  const colorClasses = {
    blue: 'from-blue-50 to-indigo-50 border-blue-200/60 text-blue-600',
    green: 'from-emerald-50 to-green-50 border-emerald-200/60 text-emerald-600',
    purple: 'from-purple-50 to-violet-50 border-purple-200/60 text-purple-600',
    orange: 'from-orange-50 to-amber-50 border-orange-200/60 text-orange-600'
  }

  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] rounded-2xl ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl bg-white/70 backdrop-blur-sm ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-24 mb-1"></div>
                  {subtitle && <div className="h-4 bg-gray-200 rounded w-16"></div>}
                  {trend && <div className="h-4 bg-gray-200 rounded w-20 mt-1"></div>}
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
                  {trend && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${trend.direction === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {trend.direction === 'up' ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{Math.abs(trend.percentage).toFixed(1)}% {trend.period}</span>
                    </div>
                  )}
                  {subtitle && !trend && <p className="text-xs text-gray-500">{subtitle}</p>}
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const [bookedMonthData, setBookedMonthData] = useState<APIResponse | null>(null)
  const [bookedYearData, setBookedYearData] = useState<APIResponse | null>(null)
  const [invoicedMonthData, setInvoicedMonthData] = useState<APIResponse | null>(null)
  const [invoicedYearData, setInvoicedYearData] = useState<APIResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [selectedKPI, setSelectedKPI] = useState<'monthly-bookings' | 'yearly-bookings' | 'monthly-invoicing' | 'yearly-invoicing' | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [bookedMonthRes, bookedYearRes, invoicedMonthRes, invoicedYearRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/total-booked-this-month`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/total-booked-this-year`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/total-invoiced-this-month`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/total-invoiced-this-year`).then(r => r.json())
      ])
      
      setBookedMonthData(bookedMonthRes)
      setBookedYearData(bookedYearRes)
      setInvoicedMonthData(invoicedMonthRes)
      setInvoicedYearData(invoicedYearRes)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <ModernPageLayout
      title="Dashboard"
      description="Business intelligence and performance overview"
      showRefresh
      onRefresh={fetchData}
      refreshLoading={loading}
      statusInfo={{
        text: "System Healthy",
        status: "healthy"
      }}
      actions={
        <Button variant="outline" size="sm" className="bg-white/60 hover:bg-white border-gray-200 shadow-sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      }
    >
      {/* Modern KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Monthly Bookings"
          value={formatCurrency(bookedMonthData?.total || null)}
          icon={DollarSign}
          loading={loading}
          color="blue"
          trend={bookedMonthData?.percentage_change !== undefined ? {
            percentage: bookedMonthData.percentage_change,
            direction: bookedMonthData.percentage_change >= 0 ? 'up' : 'down',
            period: 'vs last month'
          } : undefined}
          onClick={() => setSelectedKPI('monthly-bookings')}
        />
        <KPICard
          title="Yearly Bookings"
          value={formatCurrency(bookedYearData?.total || null)}
          icon={TrendingUp}
          loading={loading}
          color="green"
          trend={bookedYearData?.percentage_change !== undefined ? {
            percentage: bookedYearData.percentage_change,
            direction: bookedYearData.percentage_change >= 0 ? 'up' : 'down',
            period: 'vs last year'
          } : undefined}
          onClick={() => setSelectedKPI('yearly-bookings')}
        />
        <KPICard
          title="Monthly Invoicing"
          value={formatCurrency(invoicedMonthData?.total || null)}
          icon={Users}
          loading={loading}
          color="purple"
          trend={invoicedMonthData?.percentage_change !== undefined ? {
            percentage: invoicedMonthData.percentage_change,
            direction: invoicedMonthData.percentage_change >= 0 ? 'up' : 'down',
            period: 'vs last month'
          } : undefined}
          onClick={() => setSelectedKPI('monthly-invoicing')}
        />
        <KPICard
          title="Yearly Invoicing"
          value={formatCurrency(invoicedYearData?.total || null)}
          icon={Activity}
          loading={loading}
          color="orange"
          trend={invoicedYearData?.percentage_change !== undefined ? {
            percentage: invoicedYearData.percentage_change,
            direction: invoicedYearData.percentage_change >= 0 ? 'up' : 'down',
            period: 'vs last year'
          } : undefined}
          onClick={() => setSelectedKPI('yearly-invoicing')}
        />
      </div>

      {/* Modern Tabs Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content Area - Dynamic based on selected KPI */}
        <div className="lg:col-span-8">
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 rounded-2xl">
            <CardHeader className='pb-4'>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                    <Activity className="h-5 w-5" />
                  </div>
                  {selectedKPI ? (
                    <>
                      {selectedKPI === 'monthly-bookings' && 'Monthly Bookings Overview'}
                      {selectedKPI === 'yearly-bookings' && 'Yearly Bookings Overview'}
                      {selectedKPI === 'monthly-invoicing' && 'Monthly Invoicing Overview'}
                      {selectedKPI === 'yearly-invoicing' && 'Yearly Invoicing Overview'}
                    </>
                  ) : (
                    "This Month's Activity"
                  )}
                </CardTitle>
                {selectedKPI && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedKPI(null)}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear Selection
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedKPI ? (
                // Show selected KPI overview
                <div className="min-h-[400px]">
                  {selectedKPI === 'monthly-bookings' && <MonthlyBookingsOverview />}
                  {selectedKPI === 'yearly-bookings' && <YearlyBookingsOverview />}
                  {selectedKPI === 'monthly-invoicing' && <MonthlyInvoicingOverview />}
                  {selectedKPI === 'yearly-invoicing' && <YearlyInvoicingOverview />}
                </div>
              ) : (
                // Show default tab content when no KPI is selected
                <Tabs defaultValue='bookings' className='w-full'>
                  <div className="flex justify-center mb-6">
                    <TabsList className='bg-gray-100/80 backdrop-blur-sm rounded-xl border border-gray-200'>
                      <TabsTrigger 
                        value='bookings'
                        className="data-[state=active]:bg-purple-600 data-[state=active]:text-white font-medium"
                      >
                        📋 Bookings
                      </TabsTrigger>
                      <TabsTrigger 
                        value='invoices'
                        className="data-[state=active]:bg-purple-600 data-[state=active]:text-white font-medium"
                      >
                        🧾 Invoices
                      </TabsTrigger>
                      <TabsTrigger 
                        value='opportunities'
                        className="data-[state=active]:bg-purple-600 data-[state=active]:text-white font-medium"
                      >
                        🎯 Opportunities
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value='bookings' className='mt-4' forceMount>
                    <BookingsThisMonthTable />
                  </TabsContent>
                  <TabsContent value='invoices' className='mt-4' forceMount>
                    <InvoicesThisMonthTable />
                  </TabsContent>
                  <TabsContent value='opportunities' className='mt-4' forceMount>
                    <div className='text-center text-muted-foreground py-8'>
                      Opportunities table coming soon...
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Content */}
        <div className="lg:col-span-4 space-y-6">
          {/* Chart and Leaderboard Grid */}
          <Card className='bg-white/90 backdrop-blur-sm shadow-lg border-0 rounded-2xl'>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className='pl-2'>
              <Overview />
            </CardContent>
          </Card>
          
          <Card className='bg-white/90 backdrop-blur-sm shadow-lg border-0 rounded-2xl'>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-xl bg-green-100 text-green-600">
                  <Users className="h-5 w-5" />
                </div>
                Leaderboard
              </CardTitle>
              <CardDescription className="text-gray-600">
                Top 5 salespeople this month by sales and gross profit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaderboardCard />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modern Status Bar */}
      <ModernStatusBar 
        items={[
          { label: "Last Updated", value: lastUpdated.toLocaleTimeString(), status: "active" },
          { label: "Active Period", value: "This Month" },
          { label: "Data Source", value: "Live API" },
          { label: "Refresh", value: "Auto (5min)", status: "active" }
        ]}
      />

      <style>{`
        [data-slot='tabs-content']:not([data-state='active']) {
          display: none !important;
        }
      `}</style>
    </ModernPageLayout>
  )
}
