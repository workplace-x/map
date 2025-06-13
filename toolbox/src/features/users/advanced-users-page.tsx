import React, { useState, useEffect, useMemo } from 'react'
import { 
  AdvancedLayout, 
  useLayoutContext 
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
import {
  Users, Shield, Activity, Settings, Download, RefreshCw, 
  UserCheck, UserX, Clock, AlertTriangle, TrendingUp, 
  Eye, Edit, UserPlus, Crown, Zap, BarChart3
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'user' | 'viewer'
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  avatar?: string
  department?: string
  team?: string
  last_login?: Date
  created_at: Date
  permissions: string[]
  activity_score?: number
  login_frequency?: number
  performance_rating?: number
}

interface UserActivity {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  user_name: string
  message: string
  timestamp: Date
  details?: string
}

const PAGE_SIZE = 50

export default function AdvancedUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState('users')
  const [userActivity, setUserActivity] = useState<UserActivity[]>([])
  const { theme, density } = useLayoutContext()

  // Mock user activity feed
  const mockActivity: UserActivity[] = [
    {
      id: '1',
      type: 'success',
      user_name: 'Sarah Chen',
      message: 'User created new project dashboard',
      timestamp: new Date(),
      details: 'Project Alpha dashboard created'
    },
    {
      id: '2',
      type: 'info',
      user_name: 'Mike Johnson',
      message: 'Role updated to Manager',
      timestamp: new Date(Date.now() - 300000),
      details: 'Promoted from User to Manager'
    },
    {
      id: '3',
      type: 'warning',
      user_name: 'Emma Davis',
      message: 'Multiple failed login attempts',
      timestamp: new Date(Date.now() - 600000),
      details: '5 failed attempts detected'
    },
    {
      id: '4',
      type: 'success',
      user_name: 'James Wilson',
      message: 'Completed security training',
      timestamp: new Date(Date.now() - 900000),
      details: 'Security certification achieved'
    }
  ]

  // Enhanced mock user data
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      email: 'sarah.chen@company.com',
      role: 'admin',
      status: 'active',
      department: 'Engineering',
      team: 'Platform Team',
      last_login: new Date(Date.now() - 3600000),
      created_at: new Date('2023-01-15'),
      permissions: ['read', 'write', 'admin', 'manage_users'],
      activity_score: 95,
      login_frequency: 28,
      performance_rating: 4.8
    },
    {
      id: '2',
      name: 'Mike Johnson',
      email: 'mike.johnson@company.com',
      role: 'manager',
      status: 'active',
      department: 'Sales',
      team: 'Enterprise Sales',
      last_login: new Date(Date.now() - 7200000),
      created_at: new Date('2023-03-10'),
      permissions: ['read', 'write', 'manage_team'],
      activity_score: 87,
      login_frequency: 22,
      performance_rating: 4.5
    },
    {
      id: '3',
      name: 'Emma Davis',
      email: 'emma.davis@company.com',
      role: 'user',
      status: 'active',
      department: 'Marketing',
      team: 'Content Team',
      last_login: new Date(Date.now() - 14400000),
      created_at: new Date('2023-06-20'),
      permissions: ['read', 'write'],
      activity_score: 72,
      login_frequency: 18,
      performance_rating: 4.2
    },
    {
      id: '4',
      name: 'James Wilson',
      email: 'james.wilson@company.com',
      role: 'user',
      status: 'pending',
      department: 'Operations',
      team: 'Support Team',
      created_at: new Date('2024-01-10'),
      permissions: ['read'],
      activity_score: 45,
      login_frequency: 5,
      performance_rating: 3.8
    },
    {
      id: '5',
      name: 'Lisa Rodriguez',
      email: 'lisa.rodriguez@company.com',
      role: 'viewer',
      status: 'inactive',
      department: 'Finance',
      team: 'Accounting',
      last_login: new Date(Date.now() - 2592000000), // 30 days ago
      created_at: new Date('2022-11-05'),
      permissions: ['read'],
      activity_score: 15,
      login_frequency: 2,
      performance_rating: 3.2
    }
  ]

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.status === 'active').length
    const pendingUsers = users.filter(u => u.status === 'pending').length
    const adminUsers = users.filter(u => u.role === 'admin').length
    const avgActivityScore = users.reduce((sum, u) => sum + (u.activity_score || 0), 0) / Math.max(users.length, 1)
    const recentLogins = users.filter(u => u.last_login && u.last_login > new Date(Date.now() - 86400000)).length // 24h
    
    return {
      totalUsers,
      activeUsers,
      pendingUsers,
      adminUsers,
      avgActivityScore,
      recentLogins
    }
  }, [users])

  // Fetch users data
  const fetchUsers = async (searchQuery: string = '') => {
    setLoading(true)
    setError(null)
    
    try {
      // For demo purposes, use mock data with realistic loading simulation
      await new Promise(resolve => setTimeout(resolve, 600))
      
      let filteredData = mockUsers
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        filteredData = mockUsers.filter(user => 
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.department?.toLowerCase().includes(query) ||
          user.role.toLowerCase().includes(query)
        )
      }
      
      setUsers(filteredData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load users'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    setUserActivity(mockActivity)
  }, [])

  // Simulate real-time activity updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newActivity: UserActivity = {
        id: Date.now().toString(),
        type: (Math.random() > 0.7 ? 'warning' : 'success') as 'success' | 'warning',
        user_name: mockUsers[Math.floor(Math.random() * mockUsers.length)].name,
        message: Math.random() > 0.5 ? 
          'User logged in from new device' :
          `Completed task: ${Math.random() > 0.5 ? 'Document Review' : 'Data Analysis'}`,
        timestamp: new Date(),
        details: 'Real-time user activity'
      }
      setUserActivity(prev => [newActivity, ...prev.slice(0, 9)])
    }, 20000)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    await fetchUsers()
    toast.success('User data refreshed successfully')
  }

  const handleExport = () => {
    toast.success('Export started - you will receive an email when complete')
  }

  const handleSearch = (query: string) => {
    fetchUsers(query)
  }

  const handleUserAction = (action: string, user: User) => {
    toast.success(`${action} action performed for ${user.name}`)
  }

  // Smart table columns for users
  const userColumns = [
    {
      key: 'name' as keyof User,
      title: 'User Details',
      sortable: true,
      sticky: true,
      width: '280px',
      formatter: (name: string, row: User) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={row.avatar} alt={name} />
            <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-gray-900">{name}</p>
            <p className="text-sm text-gray-500">{row.email}</p>
            {row.department && (
              <Badge variant="outline" className="text-xs mt-1">{row.department}</Badge>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'role' as keyof User,
      title: 'Role',
      sortable: true,
      align: 'center' as const,
      formatter: (role: string) => (
        <Badge
          variant="outline"
          className={`${
            role === 'admin' ? 'border-purple-500 text-purple-700 bg-purple-50' :
            role === 'manager' ? 'border-blue-500 text-blue-700 bg-blue-50' :
            role === 'user' ? 'border-green-500 text-green-700 bg-green-50' :
            'border-gray-500 text-gray-700 bg-gray-50'
          }`}
        >
          {role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
          {role === 'manager' && <Shield className="h-3 w-3 mr-1" />}
          {role.toUpperCase()}
        </Badge>
      )
    },
    {
      key: 'status' as keyof User,
      title: 'Status',
      sortable: true,
      align: 'center' as const,
      formatter: (status: string) => (
        <Badge
          variant="outline"
          className={`${
            status === 'active' ? 'border-green-500 text-green-700 bg-green-50' :
            status === 'pending' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
            status === 'suspended' ? 'border-red-500 text-red-700 bg-red-50' :
            'border-gray-500 text-gray-700 bg-gray-50'
          }`}
        >
          {status === 'active' && <UserCheck className="h-3 w-3 mr-1" />}
          {status === 'inactive' && <UserX className="h-3 w-3 mr-1" />}
          {status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
          {status.toUpperCase()}
        </Badge>
      )
    },
    {
      key: 'activity_score' as keyof User,
      title: 'Activity Score',
      sortable: true,
      align: 'center' as const,
      formatter: (score: number) => (
        <div className="flex items-center justify-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xs border-2 ${
            score >= 80 ? 'border-green-500 text-green-700 bg-green-50' :
            score >= 60 ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
            'border-red-500 text-red-700 bg-red-50'
          }`}>
            {score}%
          </div>
        </div>
      )
    },
    {
      key: 'last_login' as keyof User,
      title: 'Last Login',
      sortable: true,
      formatter: (date: Date) => (
        <div className="text-sm">
          {date ? (
            <>
              <p>{date.toLocaleDateString()}</p>
              <p className="text-gray-500">{date.toLocaleTimeString()}</p>
            </>
          ) : (
            <span className="text-gray-400">Never</span>
          )}
        </div>
      )
    },
    {
      key: 'permissions' as keyof User,
      title: 'Permissions',
      sortable: false,
      formatter: (permissions: string[]) => (
        <div className="flex flex-wrap gap-1">
          {permissions.slice(0, 2).map((perm, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {perm}
            </Badge>
          ))}
          {permissions.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{permissions.length - 2}
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'id' as keyof User,
      title: 'Actions',
      sortable: false,
      width: '150px',
      formatter: (id: string, row: User) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleUserAction('View', row)}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleUserAction('Edit', row)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  // Role distribution data for charts
  const roleData = useMemo(() => {
    const roles = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(roles).map(([role, count]) => ({
      role: role.charAt(0).toUpperCase() + role.slice(1),
      count,
      color: role === 'admin' ? '#8B5CF6' : 
             role === 'manager' ? '#3B82F6' : 
             role === 'user' ? '#10B981' : '#6B7280'
    }))
  }, [users])

  // Department distribution
  const departmentData = useMemo(() => {
    return Object.entries(
      users.reduce((acc, user) => {
        const dept = user.department || 'Unassigned'
        acc[dept] = (acc[dept] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).map(([department, count]) => ({ department, count }))
  }, [users])

  return (
    <AdvancedLayout>
      <AdvancedLayout.Header
        title="Advanced User Management"
        description="Comprehensive user administration with intelligent insights and activity monitoring"
        searchPlaceholder="Search users, emails, or departments..."
        onSearch={handleSearch}
        onRefresh={handleRefresh}
        refreshLoading={loading}
        statusInfo={{
          text: error ? "Data Issues Detected" : "User Data Synchronized",
          status: error ? "error" : "healthy",
          details: error ? error : "All user metrics up to date"
        }}
        metrics={[
          { label: "Total Users", value: analytics.totalUsers },
          { label: "Active Users", value: analytics.activeUsers },
          { label: "Avg Activity", value: `${analytics.avgActivityScore.toFixed(0)}%` },
          { label: "Recent Logins", value: analytics.recentLogins }
        ]}
        actions={
          <>
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
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

      {/* Smart KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SmartKPI
          title="Total Users"
          value={analytics.totalUsers}
          icon={<Users />}
          color="blue"
          loading={loading}
          subtitle="All registered users"
        />
        
        <SmartKPI
          title="Active Users"
          value={analytics.activeUsers}
          icon={<UserCheck />}
          color="green"
          trend={{ direction: 'up', percentage: 8.3, period: 'vs last month' }}
          loading={loading}
        />
        
        <SmartKPI
          title="Average Activity"
          value={analytics.avgActivityScore}
          format="percentage"
          icon={<Activity />}
          color="purple"
          trend={{ direction: 'up', percentage: 5.2, period: 'vs last week' }}
          loading={loading}
          target={85}
        />
        
        <SmartKPI
          title="Pending Approvals"
          value={analytics.pendingUsers}
          icon={<Clock />}
          color="yellow"
          loading={loading}
          subtitle="Awaiting activation"
          interactive
          onClick={() => {
            setSelectedTab('analytics')
            toast.success('Viewing pending user approvals')
          }}
        />
      </div>

      {/* Advanced Content */}
      <AdvancedLayout.Card variant="elevated" className="min-h-[600px]">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="bg-gray-100/80 backdrop-blur-sm rounded-xl border border-gray-200">
              <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
                👥 User Directory
              </TabsTrigger>
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
                📊 Analytics Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
                🔍 Advanced Analytics
              </TabsTrigger>
              <TabsTrigger value="realtime" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium">
                ⚡ Activity Feed
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="users" className="space-y-6">
            <SmartTable
              data={users}
              columns={userColumns}
              loading={loading}
              searchable={true}
              exportable={true}
              selectable={true}
              realTime={true}
              pageSize={PAGE_SIZE}
              onRefresh={handleRefresh}
              onExport={handleExport}
              onRowClick={(user) => toast.success(`Viewing details for ${user.name}`)}
            />
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Role Distribution */}
              <AdvancedLayout.Card>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Role Distribution
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, 'Users']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {roleData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.role}</span>
                      </div>
                      <span className="text-sm font-medium">{item.count} users</span>
                    </div>
                  ))}
                </div>
              </AdvancedLayout.Card>

              {/* Department Distribution */}
              <AdvancedLayout.Card>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Department Overview
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={departmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </AdvancedLayout.Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Users */}
              <AdvancedLayout.Card>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  Pending User Approvals
                </h3>
                <div className="space-y-4">
                  {users.filter(u => u.status === 'pending').map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleUserAction('Approve', user)}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleUserAction('Reject', user)}>
                            Reject
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {users.filter(u => u.status === 'pending').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                        <UserCheck className="h-8 w-8 text-green-600" />
                      </div>
                      <p>All user registrations are up to date</p>
                    </div>
                  )}
                </div>
              </AdvancedLayout.Card>

              {/* Inactive Users */}
              <AdvancedLayout.Card>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <UserX className="h-5 w-5 text-red-600" />
                  Inactive Users
                </h3>
                <div className="space-y-4">
                  {users.filter(u => u.status === 'inactive').map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-red-50 border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 opacity-50">
                            <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-600">
                              Last login: {user.last_login ? user.last_login.toLocaleDateString() : 'Never'}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleUserAction('Reactivate', user)}>
                          Reactivate
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AdvancedLayout.Card>
            </div>
          </TabsContent>

          <TabsContent value="realtime" className="space-y-6">
            <RealTimeDataFeed
              title="Real-time User Activity"
              items={userActivity}
              realTime={true}
            />
          </TabsContent>
        </Tabs>
      </AdvancedLayout.Card>

      {/* Status Bar */}
      <AdvancedLayout.StatusBar
        items={[
          { 
            label: "Data Status", 
            value: error ? "Issues" : "Synchronized", 
            status: error ? "error" : "active" 
          },
          { label: "Total Users", value: analytics.totalUsers, status: "active" },
          { label: "Active Now", value: analytics.recentLogins, status: "active" },
          { label: "Last Updated", value: new Date().toLocaleTimeString(), status: "active" },
          { label: "Theme", value: theme, details: "Current UI theme" }
        ]}
      />
    </AdvancedLayout>
  )
} 