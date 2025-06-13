import React, { useState, useEffect, useMemo } from 'react'
import { 
  AdvancedLayout, 
  useLayoutContext,
  LayoutProvider
} from '@/components/layout/advanced-layout-system'
import { 
  SmartKPI, 
  SmartTable, 
  RealTimeDataFeed 
} from '@/components/advanced/smart-data-components'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  DollarSign, TrendingUp, Users, Target, Trophy, BarChart3,
  Calendar, RefreshCw, AlertCircle, CheckCircle, Activity,
  TrendingDown, Settings, Download, Zap, Star, Crown,
  Eye, Filter, ArrowUpRight, Clock, Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  useLeaderboardBookingsSales,
  useLeaderboardBookingsGP,
  useHealth,
  useTotalBookedThisYear,
  useTotalBookedThisMonth,
  useTotalBookedYesterday,
  useTotalBookedThisWeek,
  useTotalInvoicedThisYear,
  useTotalInvoicedThisMonth,
  useTotalInvoicedYesterday,
  useTotalInvoicedThisWeek
} from '@/hooks/api-hooks'
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import EnhancedBookingsAnalytics from '@/features/dashboard/components/EnhancedBookingsAnalytics'
import EnhancedInvoicingAnalytics from '@/features/dashboard/components/EnhancedInvoicingAnalytics'
import { useAzureAuthStore, usePermissions } from '@/stores/azureAuthStore'
import { cn } from '@/lib/utils'

// Utility functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatLargeNumber = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return formatCurrency(value);
};

const formatPercentage = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

// Enhanced trend data with more realistic patterns
const monthlyTrends = [
  { month: 'Jan', sales: 1200000, margin: 350000, bookings: 800000, target: 1100000 },
  { month: 'Feb', sales: 1350000, margin: 420000, bookings: 950000, target: 1200000 },
  { month: 'Mar', sales: 1180000, margin: 340000, bookings: 1100000, target: 1150000 },
  { month: 'Apr', sales: 1420000, margin: 450000, bookings: 1200000, target: 1300000 },
  { month: 'May', sales: 1680000, margin: 520000, bookings: 1350000, target: 1400000 },
  { month: 'Jun', sales: 1520000, margin: 480000, bookings: 1250000, target: 1350000 },
];

// Performance distribution data
const performanceData = [
  { name: 'Exceeding', value: 35, color: '#10B981' },
  { name: 'On Track', value: 45, color: '#3B82F6' },
  { name: 'At Risk', value: 15, color: '#F59E0B' },
  { name: 'Behind', value: 5, color: '#EF4444' }
];

// Mock real-time activity with more variety
const mockActivityFeed = [
  {
    id: '1',
    type: 'success' as const,
    message: 'New sale recorded: $85,000',
    timestamp: new Date(),
    details: 'John Smith - Manufacturing Equipment',
    user: 'John Smith',
    avatar: null
  },
  {
    id: '2',
    type: 'info' as const,
    message: 'Monthly target 78% achieved',
    timestamp: new Date(Date.now() - 300000),
    details: 'Sales team performance update',
    user: 'System',
    avatar: null
  },
  {
    id: '3',
    type: 'warning' as const,
    message: 'Low margin alert: Quote Q-2024-003',
    timestamp: new Date(Date.now() - 600000),
    details: 'Margin below 15% threshold',
    user: 'Alert System',
    avatar: null
  },
  {
    id: '4',
    type: 'success' as const,
    message: 'Team milestone reached: $2M quarterly',
    timestamp: new Date(Date.now() - 900000),
    details: 'West Coast team achievement',
    user: 'Team Lead',
    avatar: null
  }
];

export default function AdvancedExecutiveDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [activityFeed, setActivityFeed] = useState(mockActivityFeed)
  const [timeRange, setTimeRange] = useState('month')
  const { theme, density } = useLayoutContext()
  const { user } = useAzureAuthStore()
  const { hasPermission, isAdmin, isExecutive, isManager } = usePermissions()

  // Fetch all the leaderboard data
  const { data: bookingsSales = [], isLoading: loadingBookingsSales } = useLeaderboardBookingsSales();
  const { data: bookingsGP = [], isLoading: loadingBookingsGP } = useLeaderboardBookingsGP();
  
  // Fetch the booking data for LEFT two cards (keep as monthly/yearly for cards)
  const { data: monthlyBookingsData, isLoading: loadingMonthlyBookings } = useTotalBookedThisMonth();
  const { data: yearlyBookingsData, isLoading: loadingYearlyBookings } = useTotalBookedThisYear();
  
  // Fetch the invoicing data for RIGHT two cards (keep as monthly/yearly for cards)
  const { data: monthlyInvoicingData, isLoading: loadingMonthlyInvoicing } = useTotalInvoicedThisMonth();
  const { data: yearlyInvoicingData, isLoading: loadingYearlyInvoicing } = useTotalInvoicedThisYear();

  // Fetch the correct data for HEADER metrics
  const { data: yesterdayBookingsData, isLoading: loadingYesterdayBookings } = useTotalBookedYesterday();
  const { data: weeklyBookingsData, isLoading: loadingWeeklyBookings } = useTotalBookedThisWeek();
  const { data: yesterdayInvoicesData, isLoading: loadingYesterdayInvoices } = useTotalInvoicedYesterday();
  const { data: weeklyInvoicesData, isLoading: loadingWeeklyInvoices } = useTotalInvoicedThisWeek();
  
  // Health check
  const { data: health, isLoading: loadingHealth } = useHealth();

  // Extract the values and percentages from booking data (LEFT cards)
  const monthlyBookings = Number(monthlyBookingsData?.total || 0);
  const monthlyBookingsChange = Number(monthlyBookingsData?.percentage_change || 0);
  
  const yearlyBookings = Number(yearlyBookingsData?.total || 0);
  const yearlyBookingsChange = Number(yearlyBookingsData?.percentage_change || 0);

  // Extract the values and percentages from invoicing data (RIGHT cards)
  const monthlyInvoicing = Number(monthlyInvoicingData?.total || 0);
  const monthlyInvoicingChange = Number(monthlyInvoicingData?.percentage_change || 0);
  
  const yearlyInvoicing = Number(yearlyInvoicingData?.total || 0);
  const yearlyInvoicingChange = Number(yearlyInvoicingData?.percentage_change || 0);

  // Calculate derived metrics
  const analytics = useMemo(() => {
    // Ensure bookingsSales and bookingsGP are arrays
    const salesArray = Array.isArray(bookingsSales) ? bookingsSales : [];
    const gpArray = Array.isArray(bookingsGP) ? bookingsGP : [];
    
    const totalBookingsSales = salesArray.reduce((sum, entry) => sum + (entry?.value || 0), 0);
    const totalBookingsGP = gpArray.reduce((sum, entry) => sum + (entry?.value || 0), 0);
    const avgMarginPercent = totalBookingsSales > 0 ? (totalBookingsGP / totalBookingsSales) * 100 : 0;
    
    return {
      totalBookingsSales,
      totalBookingsGP,
      avgMarginPercent,
      activeSalespeople: salesArray.length,
      topPerformer: salesArray[0]?.salesperson_name || 'N/A'
    };
  }, [bookingsSales, bookingsGP]);

  // Get personalized greeting
  const getPersonalizedGreeting = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const name = user?.name?.split(' ')[0] || 'there';
    return `${greeting}, ${name}!`;
  };

  // Get role-based insights
  const getRoleBasedInsights = () => {
    if (isAdmin) {
      return [
        { label: 'System Health', value: '98.5%', trend: '+0.2%', color: 'green' },
        { label: 'Active Users', value: '247', trend: '+12', color: 'blue' },
        { label: 'Data Sync', value: '2min ago', trend: 'Real-time', color: 'purple' }
      ];
    } else if (isExecutive) {
      return [
        { label: 'Revenue Growth', value: '+18.2%', trend: 'YoY', color: 'green' },
        { label: 'Market Share', value: '23.4%', trend: '+1.2%', color: 'blue' },
        { label: 'Profit Margin', value: '31.8%', trend: '+2.1%', color: 'purple' }
      ];
    } else if (isManager) {
      return [
        { label: 'Team Performance', value: '92%', trend: '+5%', color: 'green' },
        { label: 'Pipeline Value', value: '$2.4M', trend: '+15%', color: 'blue' },
        { label: 'Close Rate', value: '34%', trend: '+3%', color: 'purple' }
      ];
    } else {
      return [
        { label: 'Personal Target', value: '78%', trend: '+12%', color: 'green' },
        { label: 'This Month', value: '$125K', trend: '+8%', color: 'blue' },
        { label: 'Rank', value: '#7', trend: '+2', color: 'purple' }
      ];
    }
  };

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newActivity = {
        id: Date.now().toString(),
        type: (Math.random() > 0.7 ? 'success' : 'info') as 'success' | 'info',
        message: Math.random() > 0.5 ? 
          `New sale recorded: ${formatLargeNumber(Math.floor(Math.random() * 200000))}` :
          `Monthly target ${Math.floor(Math.random() * 40 + 60)}% achieved`,
        timestamp: new Date(),
        details: 'Real-time business activity',
        user: 'System',
        avatar: null
      }
      setActivityFeed(prev => [newActivity, ...prev.slice(0, 9)])
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
    toast.success('Data refreshed successfully')
  }

  const handleExport = () => {
    toast.success('Export started - you will receive an email when complete')
  }

  // Prepare table data for leaderboards
  const leaderboardTableData = (Array.isArray(bookingsSales) ? bookingsSales : []).map((entry, index) => ({
    rank: index + 1,
    salesperson_name: entry?.salesperson_name || entry?.salesperson_id || 'Unknown',
    sales_value: entry?.value || 0,
    margin_value: (Array.isArray(bookingsGP) ? bookingsGP : []).find(gp => gp?.salesperson_id === entry?.salesperson_id)?.value || 0,
    margin_percent: (entry?.value || 0) > 0 ? (((Array.isArray(bookingsGP) ? bookingsGP : []).find(gp => gp?.salesperson_id === entry?.salesperson_id)?.value || 0) / (entry?.value || 1)) * 100 : 0
  }))

  const roleBasedInsights = getRoleBasedInsights();

  return (
    <LayoutProvider>
      <AdvancedLayout>
        <AdvancedLayout.Header
          title={getPersonalizedGreeting()}
          description="Your personalized business intelligence dashboard with real-time insights"
          searchPlaceholder="Search metrics, salespeople, or reports..."
          onSearch={(query) => console.log('Search:', query)}
          onRefresh={handleRefresh}
          refreshLoading={loading}
          statusInfo={{
            text: health?.status === 'ok' ? "All Systems Operational" : "System Issues Detected",
            status: health?.status === 'ok' ? "healthy" : "error",
            details: health?.status === 'ok' ? "Real-time data synchronization active" : "Some services may be unavailable"
          }}
          metrics={[
            { 
              label: "Yesterday's Bookings", 
              value: formatLargeNumber(yesterdayBookingsData?.total || 0)
            },
            { 
              label: "Weekly Bookings", 
              value: formatLargeNumber(weeklyBookingsData?.total || 0)
            },
            { 
              label: "Yesterday's Invoices", 
              value: formatLargeNumber(yesterdayInvoicesData?.total || 0)
            },
            { 
              label: "Weekly Invoicing", 
              value: formatLargeNumber(weeklyInvoicesData?.total || 0)
            }
          ]}
          actions={
            <>
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

        {/* Role-based Quick Insights */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {roleBasedInsights.map((insight, index) => (
            <motion.div
              key={insight.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-md hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{insight.label}</p>
                      <p className="text-2xl font-bold">{insight.value}</p>
                      <p className={cn(
                        "text-xs font-medium",
                        insight.color === 'green' ? 'text-green-600' :
                        insight.color === 'blue' ? 'text-blue-600' :
                        insight.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                      )}>
                        {insight.trend}
                      </p>
                    </div>
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      insight.color === 'green' ? 'bg-green-100' :
                      insight.color === 'blue' ? 'bg-blue-100' :
                      insight.color === 'purple' ? 'bg-purple-100' : 'bg-gray-100'
                    )}>
                      <Sparkles className={cn(
                        "w-6 h-6",
                        insight.color === 'green' ? 'text-green-600' :
                        insight.color === 'blue' ? 'text-blue-600' :
                        insight.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                      )} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Enhanced KPI Dashboard */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <SmartKPI
            title="Monthly Bookings"
            value={monthlyBookings}
            format="currency"
            icon={<DollarSign />}
            color="blue"
            trend={{ 
              direction: monthlyBookingsChange >= 0 ? 'up' : 'down', 
              percentage: monthlyBookingsChange, 
              period: 'vs previous month' 
            }}
            target={1000000}
            interactive
            loading={loadingMonthlyBookings}
            onClick={() => setSelectedTab('monthly-bookings')}
          />
          
          <SmartKPI
            title="Yearly Bookings"
            value={yearlyBookings}
            format="currency"
            icon={<TrendingUp />}
            color="green"
            trend={{ 
              direction: yearlyBookingsChange >= 0 ? 'up' : 'down', 
              percentage: yearlyBookingsChange, 
              period: 'vs previous year' 
            }}
            loading={loadingYearlyBookings}
            interactive
            onClick={() => setSelectedTab('yearly-bookings')}
          />
          
          <SmartKPI
            title="Monthly Invoicing"
            value={monthlyInvoicing}
            format="currency"
            icon={<Target />}
            color="purple"
            trend={{ 
              direction: monthlyInvoicingChange >= 0 ? 'up' : 'down', 
              percentage: monthlyInvoicingChange, 
              period: 'vs previous month' 
            }}
            loading={loadingMonthlyInvoicing}
            interactive
            onClick={() => setSelectedTab('monthly-invoicing')}
          />
          
          <SmartKPI
            title="Yearly Invoicing"
            value={yearlyInvoicing}
            format="currency"
            icon={<Trophy />}
            color="yellow"
            trend={{ 
              direction: yearlyInvoicingChange >= 0 ? 'up' : 'down', 
              percentage: yearlyInvoicingChange, 
              period: 'vs previous year' 
            }}
            loading={loadingYearlyInvoicing}
            interactive
            onClick={() => setSelectedTab('yearly-invoicing')}
          />
        </motion.div>

        {/* Enhanced Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <AdvancedLayout.Card variant="elevated" className="min-h-[700px]">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
              <div className="flex justify-center">
                <TabsList className="bg-gray-100/80 backdrop-blur-sm rounded-xl border border-gray-200 p-1">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium rounded-lg px-4 py-2">
                    📊 Smart Overview
                  </TabsTrigger>
                  <TabsTrigger value="performance" className="data-[state=active]:bg-green-600 data-[state=active]:text-white font-medium rounded-lg px-4 py-2">
                    🎯 Performance
                  </TabsTrigger>
                  <TabsTrigger value="leaderboards" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white font-medium rounded-lg px-4 py-2">
                    🏆 Leaderboards
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-medium rounded-lg px-4 py-2">
                    📈 Analytics
                  </TabsTrigger>
                  <TabsTrigger value="realtime" className="data-[state=active]:bg-red-600 data-[state=active]:text-white font-medium rounded-lg px-4 py-2">
                    ⚡ Real-time
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Performance Score */}
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                          <BarChart3 className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Team Performance Score</h3>
                          <p className="text-4xl font-bold text-blue-600 mb-1">92%</p>
                          <p className="text-sm text-gray-600">Above industry benchmark</p>
                          <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
                            <motion.div 
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full shadow-sm"
                              initial={{ width: 0 }}
                              animate={{ width: '92%' }}
                              transition={{ duration: 1, delay: 0.5 }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Revenue Growth */}
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                          <TrendingUp className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Revenue Growth</h3>
                          <p className="text-4xl font-bold text-green-600 mb-1">+18.2%</p>
                          <p className="text-sm text-gray-600">Year-over-year growth</p>
                          <div className="mt-4 flex items-center justify-center gap-1 text-sm text-green-600">
                            <TrendingUp className="h-4 w-4" />
                            <span>Consistent growth trend</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pipeline Health */}
                  <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                          <Activity className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Pipeline Health</h3>
                          <p className="text-4xl font-bold text-purple-600 mb-1">Excellent</p>
                          <p className="text-sm text-gray-600">Strong pipeline velocity</p>
                          <div className="mt-4 flex items-center justify-center gap-1 text-sm text-purple-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>All indicators green</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-lg border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        Revenue Trends
                      </CardTitle>
                      <CardDescription>Monthly performance vs targets</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsLineChart data={monthlyTrends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" stroke="#666" />
                          <YAxis stroke="#666" />
                          <Tooltip 
                            formatter={(value: any, name: string) => [
                              formatLargeNumber(value),
                              name === 'sales' ? 'Sales' : 
                              name === 'margin' ? 'Margin' : 
                              name === 'bookings' ? 'Bookings' : 'Target'
                            ]}
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }} />
                          <Line type="monotone" dataKey="margin" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }} />
                          <Line type="monotone" dataKey="target" stroke="#6B7280" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#6B7280', strokeWidth: 2, r: 3 }} />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                        Top Performers
                      </CardTitle>
                      <CardDescription>Leading sales team members</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(Array.isArray(bookingsSales) ? bookingsSales : []).slice(0, 5).map((entry, index) => (
                          <motion.div
                            key={entry?.salesperson_id || index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-100 hover:shadow-md transition-all duration-200"
                          >
                            <div className={cn(
                              "flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm shadow-sm",
                              index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                              index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                              index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                              'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
                            )}>
                              {index < 3 ? (index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉') : index + 1}
                            </div>
                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                {(entry?.salesperson_name || entry?.salesperson_id || '?')?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {entry?.salesperson_name || entry?.salesperson_id || 'Unknown Salesperson'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {formatLargeNumber(entry?.value || 0)} in sales
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                #{index + 1}
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-lg border-0">
                    <CardHeader>
                      <CardTitle>Performance Distribution</CardTitle>
                      <CardDescription>Team performance breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={performanceData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}%`}
                          >
                            {performanceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg border-0">
                    <CardHeader>
                      <CardTitle>Monthly Progress</CardTitle>
                      <CardDescription>Target achievement tracking</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Sales Target</span>
                          <span>78% Complete</span>
                        </div>
                        <Progress value={78} className="h-3" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Revenue Goal</span>
                          <span>85% Complete</span>
                        </div>
                        <Progress value={85} className="h-3" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Margin Target</span>
                          <span>92% Complete</span>
                        </div>
                        <Progress value={92} className="h-3" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Customer Acquisition</span>
                          <span>67% Complete</span>
                        </div>
                        <Progress value={67} className="h-3" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="leaderboards" className="space-y-6">
                <SmartTable
                  data={leaderboardTableData}
                  columns={[
                    {
                      key: 'rank' as keyof typeof leaderboardTableData[0],
                      title: 'Rank',
                      width: '80px',
                      formatter: (value: number) => (
                        <div className="flex items-center justify-center">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm",
                            value === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
                            value === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : 
                            value === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-gradient-to-br from-blue-400 to-blue-600'
                          )}>
                            {value <= 3 ? (value === 1 ? '🥇' : value === 2 ? '🥈' : '🥉') : value}
                          </div>
                        </div>
                      )
                    },
                    {
                      key: 'salesperson_name' as keyof typeof leaderboardTableData[0],
                      title: 'Salesperson',
                      formatter: (name: string) => (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                              {name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{name}</span>
                        </div>
                      )
                    },
                    {
                      key: 'sales_value' as keyof typeof leaderboardTableData[0],
                      title: 'Sales Value',
                      formatter: (value: number) => (
                        <span className="font-semibold text-blue-600">{formatLargeNumber(value)}</span>
                      ),
                      align: 'right' as const
                    },
                    {
                      key: 'margin_value' as keyof typeof leaderboardTableData[0],
                      title: 'Margin Value',
                      formatter: (value: number) => (
                        <span className="font-semibold text-green-600">{formatLargeNumber(value)}</span>
                      ),
                      align: 'right' as const
                    },
                    {
                      key: 'margin_percent' as keyof typeof leaderboardTableData[0],
                      title: 'Margin %',
                      formatter: (value: number) => (
                        <Badge variant={value >= 20 ? "default" : "destructive"} className={cn(
                          "font-semibold",
                          value >= 20 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        )}>
                          {value.toFixed(1)}%
                        </Badge>
                      ),
                      align: 'center' as const
                    }
                  ]}
                  loading={loadingBookingsSales || loadingBookingsGP}
                  searchable
                  sortable
                />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <EnhancedBookingsAnalytics />
                  <EnhancedInvoicingAnalytics />
                </div>
              </TabsContent>

              <TabsContent value="realtime" className="space-y-6">
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-600" />
                      Real-time Activity Feed
                    </CardTitle>
                    <CardDescription>Live updates from your business operations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      <AnimatePresence>
                        {activityFeed.map((activity, index) => (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "flex items-start gap-3 p-4 rounded-lg border-l-4 transition-all duration-200",
                              activity.type === 'success' ? 'bg-green-50 border-green-500' :
                              activity.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                              'bg-blue-50 border-blue-500'
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                              activity.type === 'success' ? 'bg-green-500' :
                              activity.type === 'warning' ? 'bg-yellow-500' :
                              'bg-blue-500'
                            )}>
                              {activity.type === 'success' ? (
                                <CheckCircle className="h-4 w-4 text-white" />
                              ) : activity.type === 'warning' ? (
                                <AlertCircle className="h-4 w-4 text-white" />
                              ) : (
                                <Activity className="h-4 w-4 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">{activity.message}</p>
                              <p className="text-sm text-gray-600">{activity.details}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>{activity.timestamp.toLocaleTimeString()}</span>
                                <span>•</span>
                                <span>{activity.user}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </AdvancedLayout.Card>
        </motion.div>
      </AdvancedLayout>
    </LayoutProvider>
  )
}