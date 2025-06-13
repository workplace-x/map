import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, DollarSign, Users, Target, Trophy,
  BarChart3, Calendar, RefreshCw, AlertCircle, CheckCircle,
  Activity, Settings, Download, Eye, Filter, Zap, Clock,
  ArrowUpRight, ArrowDownRight, Minus, ChevronRight
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'

// Types
interface KPIData {
  title: string
  value: string | number
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
  target?: number
  icon: React.ReactNode
  color: string
  subtitle?: string
}

interface TeamMember {
  id: string
  name: string
  role: string
  avatar?: string
  performance: number
  revenue: number
  deals: number
  trend: 'up' | 'down' | 'stable'
}

interface RecentActivity {
  id: string
  type: 'sale' | 'meeting' | 'proposal' | 'contract'
  title: string
  description: string
  amount?: number
  timestamp: Date
  user: string
  status: 'completed' | 'pending' | 'in-progress'
}

// Mock data
const kpiData: KPIData[] = [
  {
    title: 'Total Revenue',
    value: '$2.4M',
    change: 12.5,
    changeType: 'increase',
    target: 85,
    icon: <DollarSign className="h-5 w-5" />,
    color: 'emerald',
    subtitle: 'vs last month'
  },
  {
    title: 'Active Deals',
    value: 147,
    change: -3.2,
    changeType: 'decrease',
    target: 92,
    icon: <Target className="h-5 w-5" />,
    color: 'blue',
    subtitle: 'in pipeline'
  },
  {
    title: 'Team Performance',
    value: '94%',
    change: 8.1,
    changeType: 'increase',
    target: 94,
    icon: <Users className="h-5 w-5" />,
    color: 'purple',
    subtitle: 'efficiency score'
  },
  {
    title: 'Conversion Rate',
    value: '68%',
    change: 0,
    changeType: 'neutral',
    target: 68,
    icon: <Trophy className="h-5 w-5" />,
    color: 'orange',
    subtitle: 'lead to close'
  }
]

const revenueData = [
  { month: 'Jan', revenue: 180000, target: 200000, deals: 12 },
  { month: 'Feb', revenue: 220000, target: 210000, deals: 15 },
  { month: 'Mar', revenue: 190000, target: 220000, deals: 11 },
  { month: 'Apr', revenue: 280000, target: 230000, deals: 18 },
  { month: 'May', revenue: 320000, target: 240000, deals: 22 },
  { month: 'Jun', revenue: 290000, target: 250000, deals: 19 }
]

const topPerformers: TeamMember[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'Senior Sales Manager',
    performance: 142,
    revenue: 485000,
    deals: 28,
    trend: 'up'
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Account Executive',
    performance: 128,
    revenue: 392000,
    deals: 24,
    trend: 'up'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    role: 'Business Development',
    performance: 115,
    revenue: 318000,
    deals: 19,
    trend: 'stable'
  }
]

const recentActivities: RecentActivity[] = [
  {
    id: '1',
    type: 'sale',
    title: 'Healthcare Project Closed',
    description: 'Regional Medical Center - Phase 2',
    amount: 125000,
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    user: 'Sarah Johnson',
    status: 'completed'
  },
  {
    id: '2',
    type: 'proposal',
    title: 'Corporate Office Proposal',
    description: 'Tech Startup - 15,000 sq ft',
    amount: 89000,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    user: 'Michael Chen',
    status: 'pending'
  },
  {
    id: '3',
    type: 'meeting',
    title: 'Client Discovery Call',
    description: 'Educational Institution - Initial consultation',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    user: 'Emily Rodriguez',
    status: 'completed'
  }
]

// Utility functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatRelativeTime = (date: Date) => {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h ago`
  } else {
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }
}

// Components
const KPICard: React.FC<{ data: KPIData; index: number }> = ({ data, index }) => {
  const colorClasses = {
    emerald: 'from-emerald-50 to-green-50 border-emerald-200/60 text-emerald-700',
    blue: 'from-blue-50 to-indigo-50 border-blue-200/60 text-blue-700',
    purple: 'from-purple-50 to-violet-50 border-purple-200/60 text-purple-700',
    orange: 'from-orange-50 to-amber-50 border-orange-200/60 text-orange-700'
  }

  const iconBgClasses = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
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
        'bg-gradient-to-br backdrop-blur-sm border transition-all duration-300 hover:shadow-lg',
        colorClasses[data.color as keyof typeof colorClasses]
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={cn(
              'p-3 rounded-xl transition-transform group-hover:scale-110',
              iconBgClasses[data.color as keyof typeof iconBgClasses]
            )}>
              {data.icon}
            </div>
            <div className="flex items-center gap-1 text-sm">
              {data.changeType === 'increase' && <ArrowUpRight className="h-4 w-4 text-green-600" />}
              {data.changeType === 'decrease' && <ArrowDownRight className="h-4 w-4 text-red-600" />}
              {data.changeType === 'neutral' && <Minus className="h-4 w-4 text-gray-600" />}
              <span className={cn(
                'font-medium',
                data.changeType === 'increase' && 'text-green-600',
                data.changeType === 'decrease' && 'text-red-600',
                data.changeType === 'neutral' && 'text-gray-600'
              )}>
                {data.change > 0 ? '+' : ''}{data.change}%
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600">{data.title}</h3>
            <p className="text-2xl font-bold text-gray-900">{data.value}</p>
            {data.subtitle && (
              <p className="text-xs text-gray-500">{data.subtitle}</p>
            )}
            {data.target && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress to target</span>
                  <span>{data.target}%</span>
                </div>
                <Progress value={data.target} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const PerformanceChart: React.FC = () => {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Revenue Performance</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5% vs last period
            </Badge>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `$${value/1000}k`} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                labelStyle={{ color: '#1e293b' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fill="url(#revenueGradient)" 
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="#ef4444" 
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

const TopPerformersCard: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Top Performers</CardTitle>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {topPerformers.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  'absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center',
                  member.trend === 'up' && 'bg-green-500',
                  member.trend === 'down' && 'bg-red-500',
                  member.trend === 'stable' && 'bg-gray-500'
                )}>
                  {member.trend === 'up' && <TrendingUp className="h-2 w-2 text-white" />}
                  {member.trend === 'down' && <TrendingDown className="h-2 w-2 text-white" />}
                  {member.trend === 'stable' && <Minus className="h-2 w-2 text-white" />}
                </div>
              </div>
              <div>
                <p className="font-medium text-sm">{member.name}</p>
                <p className="text-xs text-gray-500">{member.role}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-sm">{formatCurrency(member.revenue)}</p>
              <p className="text-xs text-gray-500">{member.deals} deals</p>
            </div>
          </motion.div>
        ))}
        <Button variant="ghost" className="w-full mt-4" size="sm">
          View All Team Members
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  )
}

const ActivityFeed: React.FC = () => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'proposal': return <Clock className="h-4 w-4 text-blue-600" />
      case 'meeting': return <Users className="h-4 w-4 text-purple-600" />
      case 'contract': return <Trophy className="h-4 w-4 text-orange-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="default" className="bg-green-100 text-green-800 text-xs">Completed</Badge>
      case 'pending': return <Badge variant="outline" className="text-yellow-800 border-yellow-300 text-xs">Pending</Badge>
      case 'in-progress': return <Badge variant="outline" className="text-blue-800 border-blue-300 text-xs">In Progress</Badge>
      default: return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          <Button variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50/50 transition-colors"
            >
              <div className="mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm truncate">{activity.title}</p>
                  {getStatusBadge(activity.status)}
                </div>
                <p className="text-xs text-gray-600 mb-1">{activity.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{activity.user}</span>
                  <span>{formatRelativeTime(activity.timestamp)}</span>
                </div>
                {activity.amount && (
                  <p className="text-sm font-semibold text-green-600 mt-1">
                    {formatCurrency(activity.amount)}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        <Button variant="ghost" className="w-full mt-4" size="sm">
          View All Activities
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  )
}

// Main Component
export const ExecutiveOverview: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState('30d')

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Overview</h1>
          <p className="text-gray-600 mt-1">Real-time business intelligence and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={timeRange} onValueChange={setTimeRange}>
            <TabsList className="bg-gray-100">
              <TabsTrigger value="7d" className="text-xs">7D</TabsTrigger>
              <TabsTrigger value="30d" className="text-xs">30D</TabsTrigger>
              <TabsTrigger value="90d" className="text-xs">90D</TabsTrigger>
              <TabsTrigger value="1y" className="text-xs">1Y</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={kpi.title} data={kpi} index={index} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PerformanceChart />
        <TopPerformersCard />
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed />
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="gradient" className="w-full justify-start" size="lg">
              <Zap className="h-5 w-5 mr-3" />
              Generate Monthly Report
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-3" />
              Schedule Team Meeting
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Target className="h-4 w-4 mr-3" />
              Review Pipeline
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="h-4 w-4 mr-3" />
              View Detailed Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ExecutiveOverview 