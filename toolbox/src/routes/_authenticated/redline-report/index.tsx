import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useMemo, useEffect } from 'react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BarChart, TrendingUp, DollarSign, Target, Users, 
  Settings, Download, RefreshCw, Filter, Trophy,
  TrendingDown, Clock, AlertTriangle, CheckCircle, Brain, Calendar, Award, Crown, Star
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// API service for Redline Report
const redlineReportApi = {
  async getRedlineReport(year = new Date().getFullYear()) {
    const response = await fetch(`/api/redline-report?year=${year}`)
    if (!response.ok) {
      throw new Error('Failed to fetch redline report data')
    }
    return response.json()
  },

  async getTeamSummary(year = new Date().getFullYear()) {
    const response = await fetch(`/api/redline-report/teams?year=${year}`)
    if (!response.ok) {
      throw new Error('Failed to fetch team summary data')
    }
    return response.json()
  },

  async getStatus() {
    const response = await fetch('/api/redline-report/status')
    if (!response.ok) {
      throw new Error('Failed to fetch redline report status')
    }
    return response.json()
  }
}

// Data hooks
const useRedlineReport = (year: number) => {
  return useQuery({
    queryKey: ['redline-report', year],
    queryFn: () => redlineReportApi.getRedlineReport(year),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000 // Consider data stale after 2 minutes
  })
}

const useTeamSummary = (year: number) => {
  return useQuery({
    queryKey: ['redline-report-teams', year],
    queryFn: () => redlineReportApi.getTeamSummary(year),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000
  })
}

function RedlineReport() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedTab, setSelectedTab] = useState('overview')
  const [teamFilter, setTeamFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Data fetching
  const { data: reportData, isLoading, error, refetch } = useRedlineReport(selectedYear)
  const { data: teamData } = useTeamSummary(selectedYear)

  // Filter salespeople data
  const filteredSalespeople = useMemo(() => {
    if (!reportData?.salespeople) return []
    
    let filtered = reportData.salespeople
    
    if (teamFilter) {
      filtered = filtered.filter((person: any) => person.team_name === teamFilter)
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((person: any) => 
        person.salesperson_name.toLowerCase().includes(query) ||
        person.team_name.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [reportData?.salespeople, teamFilter, searchQuery])

  // Calculate analytics
  const analytics = useMemo(() => {
    if (!reportData?.summary) return null
    
    const summary = reportData.summary
    const salesGoalPct = summary.total_sales_goal > 0 ? 
      (summary.total_annual_sales / summary.total_sales_goal) * 100 : 0
    const gpGoalPct = summary.total_gp_goal > 0 ? 
      (summary.total_annual_gp / summary.total_gp_goal) * 100 : 0
    const marginPct = summary.total_annual_sales > 0 ? 
      (summary.total_annual_gp / summary.total_annual_sales) * 100 : 0
    
    return {
      totalSalespeople: summary.total_salespeople,
      totalSales: summary.total_annual_sales,
      totalGP: summary.total_annual_gp,
      salesGoal: summary.total_sales_goal,
      gpGoal: summary.total_gp_goal,
      salesGoalPct: salesGoalPct,
      gpGoalPct: gpGoalPct,
      marginPct: marginPct,
      avgSalesToGoal: summary.avg_sales_to_goal,
      avgGPToGoal: summary.avg_gp_to_goal
    }
  }, [reportData])

  const handleRefresh = async () => {
    await refetch()
    toast.success('Redline report data refreshed successfully')
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

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  // Get performance badge
  const getPerformanceBadge = (percentage: number) => {
    if (percentage >= 100) {
      return <Badge className="bg-green-100 text-green-800 border-none">On Track</Badge>
    } else if (percentage >= 75) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-none">Behind</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800 border-none">At Risk</Badge>
    }
  }

  // Table columns for salespeople view
  const salespeopleColumns = [
    {
      key: 'salesperson_name' as const,
      title: 'Salesperson',
      sortable: true,
      sticky: true,
      width: '200px',
      formatter: (name: string, row: any) => (
        <div>
          <p className="font-medium text-gray-900 mb-1">{name}</p>
          <p className="text-xs text-gray-500">{row.team_name}</p>
        </div>
      )
    },
    {
      key: 'annual_sales' as const,
      title: 'Annual Sales',
      sortable: true,
      align: 'right' as const,
      formatter: (value: number) => (
        <span className="font-bold text-purple-600">{formatCurrency(value || 0)}</span>
      )
    },
    {
      key: 'annual_gp' as const,
      title: 'Total GP',
      sortable: true,
      align: 'right' as const,
      formatter: (value: number) => (
        <span className="font-semibold text-green-600">{formatCurrency(value || 0)}</span>
      )
    },
    {
      key: 'sales_to_goal_pct' as const,
      title: 'Sales to Goal',
      sortable: true,
      align: 'center' as const,
      formatter: (value: number, row: any) => (
        <div className="text-center">
          <div className="font-semibold">{formatPercentage(value || 0)}</div>
          <div className="mt-1">{getPerformanceBadge(value || 0)}</div>
        </div>
      )
    },
    {
      key: 'gp_to_goal_pct' as const,
      title: 'GP to Goal',
      sortable: true,
      align: 'center' as const,
      formatter: (value: number) => (
        <div className="text-center">
          <div className="font-semibold">{formatPercentage(value || 0)}</div>
          <div className="mt-1">{getPerformanceBadge(value || 0)}</div>
        </div>
      )
    },
    {
      key: 'margin_pct' as const,
      title: 'Benchmark',
      sortable: true,
      align: 'center' as const,
      formatter: (value: number) => (
        <span className="font-semibold text-orange-600">{formatPercentage(value || 0)}</span>
      )
    }
  ]

  // Get available years
  const availableYears = [
    new Date().getFullYear(),
    new Date().getFullYear() - 1,
    new Date().getFullYear() - 2
  ]

  // Get unique teams
  const availableTeams = useMemo(() => {
    if (!reportData?.salespeople) return []
    const teams = [...new Set(reportData.salespeople.map((p: any) => p.team_name))].filter(Boolean)
    return teams.sort()
  }, [reportData])

  // Presidents Circle data
  const [presidentsCircleData, setPresidentsCircleData] = useState(null)
  const [presidentsCircleLoading, setPresidentsCircleLoading] = useState(false)
  const [presidentsCircleError, setPresidentsCircleError] = useState(null)

  const fetchPresidentsCircleData = async () => {
    try {
      setPresidentsCircleLoading(true)
      const response = await fetch(`/api/redline-report/presidents-circle?year=${selectedYear}`)
      if (!response.ok) throw new Error('Failed to fetch Presidents Circle data')
      const data = await response.json()
      setPresidentsCircleData(data)
    } catch (err) {
      setPresidentsCircleError(err instanceof Error ? err.message : String(err))
    } finally {
      setPresidentsCircleLoading(false)
    }
  }

  useEffect(() => {
    fetchPresidentsCircleData()
  }, [selectedYear])

  // Quarterly data
  const [quarterlyData, setQuarterlyData] = useState(null)
  const [quarterlyLoading, setQuarterlyLoading] = useState(false)
  const [quarterlyError, setQuarterlyError] = useState(null)

  const fetchQuarterlyData = async () => {
    try {
      setQuarterlyLoading(true)
      const response = await fetch(`/api/redline-report/quarterly?year=${selectedYear}`)
      if (!response.ok) throw new Error('Failed to fetch quarterly data')
      const data = await response.json()
      setQuarterlyData(data)
    } catch (err) {
      setQuarterlyError(err instanceof Error ? err.message : String(err))
    } finally {
      setQuarterlyLoading(false)
    }
  }

  useEffect(() => {
    fetchQuarterlyData()
  }, [selectedYear])

  // Overview Tab Component
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Annual Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData?.summary?.total_revenue ? formatCurrency(reportData.summary.total_revenue) : '$0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {reportData?.summary?.total_salespeople || 0} salespeople
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gross Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData?.summary?.total_gp ? formatCurrency(reportData.summary.total_gp) : '$0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {reportData?.summary?.total_revenue ? 
                formatPercentage((reportData.summary.total_gp / reportData.summary.total_revenue) * 100) : '0%'} margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamData?.summary?.total_teams || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {teamData?.summary?.total_members || 0} total members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData?.data?.length ? 
                formatCurrency(reportData.data.reduce((sum, sp) => sum + sp.average_deal_size, 0) / reportData.data.length) : 
                '$0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Annual Performance
          </CardTitle>
          <CardDescription>
            Annual sales and GP performance by team for {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Total Sales</TableHead>
                <TableHead>Total GP</TableHead>
                <TableHead>GP %</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamData?.teams?.map((team) => (
                <TableRow key={team.team_id}>
                  <TableCell className="font-medium">{team.team_name}</TableCell>
                  <TableCell>{team.member_count}</TableCell>
                  <TableCell>{formatCurrency(team.total_sales)}</TableCell>
                  <TableCell>{formatCurrency(team.total_gp)}</TableCell>
                  <TableCell>{formatPercentage(team.gp_percentage)}</TableCell>
                  <TableCell>
                    {team.total_sales > 1000000 ? 
                      <Badge className="bg-green-100 text-green-800">Strong</Badge> :
                      <Badge variant="secondary">Developing</Badge>
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // Quarterly Tab Component
  const QuarterlyTab = () => (
    <div className="space-y-6">
      {/* Quarterly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quarterlyData?.data?.quarterly_totals && Object.entries(quarterlyData.data.quarterly_totals).map(([quarter, data]) => (
          <Card key={quarter}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{quarter} {selectedYear}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.total_sales)}</div>
              <p className="text-xs text-muted-foreground">
                {data.active_salespeople} active salespeople
              </p>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(data.gp_percentage)} GP margin
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quarterly Performance Chart/Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quarterly Performance Breakdown
          </CardTitle>
          <CardDescription>
            Individual salesperson performance by quarter for {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Salesperson ID</TableHead>
                <TableHead>Q1 Sales</TableHead>
                <TableHead>Q2 Sales</TableHead>
                <TableHead>Q3 Sales</TableHead>
                <TableHead>Q4 Sales</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quarterlyData?.data?.salespeople && Object.values(quarterlyData.data.salespeople).slice(0, 20).map((person) => (
                <TableRow key={person.salesperson_id}>
                  <TableCell className="font-medium">{person.salesperson_id}</TableCell>
                  <TableCell>{formatCurrency(person.Q1?.sales || 0)}</TableCell>
                  <TableCell>{formatCurrency(person.Q2?.sales || 0)}</TableCell>
                  <TableCell>{formatCurrency(person.Q3?.sales || 0)}</TableCell>
                  <TableCell>{formatCurrency(person.Q4?.sales || 0)}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency((person.Q1?.sales || 0) + (person.Q2?.sales || 0) + (person.Q3?.sales || 0) + (person.Q4?.sales || 0))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // Presidents Circle Tab Component
  const PresidentsCircleTab = () => (
    <div className="space-y-6">
      {/* Presidents Circle Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified Members</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {presidentsCircleData?.summary?.total_qualified || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Top performers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Circle Sales</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {presidentsCircleData?.summary?.total_sales ? formatCurrency(presidentsCircleData.summary.total_sales) : '$0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Elite performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Circle Sales</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {presidentsCircleData?.summary?.avg_sales ? formatCurrency(presidentsCircleData.summary.avg_sales) : '$0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per member
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Circle GP</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {presidentsCircleData?.summary?.total_gp ? formatCurrency(presidentsCircleData.summary.total_gp) : '$0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total gross profit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Qualification Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Qualification Criteria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Sales Threshold</h4>
              <p className="text-2xl font-bold text-green-600">
                {presidentsCircleData?.criteria?.min_sales_threshold ? 
                  formatCurrency(presidentsCircleData.criteria.min_sales_threshold) : '$2,000,000'}
              </p>
              <p className="text-sm text-muted-foreground">Minimum annual sales</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Top Percentile</h4>
              <p className="text-2xl font-bold text-blue-600">
                {presidentsCircleData?.criteria?.top_percentile ? 
                  formatPercentage(presidentsCircleData.criteria.top_percentile * 100) : '20%'}
              </p>
              <p className="text-sm text-muted-foreground">Or top performers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Presidents Circle Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Presidents Circle Members
          </CardTitle>
          <CardDescription>
            Elite performers who qualified for Presidents Circle in {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Salesperson ID</TableHead>
                <TableHead>Total Sales</TableHead>
                <TableHead>Gross Profit</TableHead>
                <TableHead>GP %</TableHead>
                <TableHead>Avg Deal Size</TableHead>
                <TableHead>Strongest Quarter</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {presidentsCircleData?.data?.map((person, index) => (
                <TableRow key={person.salesperson_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                      {index === 1 && <Trophy className="h-4 w-4 text-gray-400" />}
                      {index === 2 && <Award className="h-4 w-4 text-orange-500" />}
                      #{index + 1}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{person.salesperson_id}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(person.total_sales)}</TableCell>
                  <TableCell>{formatCurrency(person.total_gp)}</TableCell>
                  <TableCell>{formatPercentage(person.gp_percentage)}</TableCell>
                  <TableCell>{formatCurrency(person.average_deal_size)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{person.strongest_quarter}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                      Presidents Circle
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <AdvancedLayout>
      <AdvancedLayout.Header
        title="Redline Report"
        description="As of 6/10/2025"
        searchPlaceholder="Search salespeople by name or team..."
        onSearch={setSearchQuery}
        onRefresh={handleRefresh}
        refreshLoading={isLoading}
        statusInfo={{
          text: error ? "Data Issues Detected" : "Redline Report Active",
          status: error ? "error" : "healthy",
          details: error ? "Check connection and try again" : `${analytics?.totalSalespeople || 0} salespeople tracked • ${selectedYear} data`
        }}
        metrics={analytics ? [
          { 
            label: "Total Sales", 
            value: formatCurrency(analytics.totalSales),
            trend: analytics.salesGoalPct >= 100 ? "up" : "down",
            change: `${analytics.salesGoalPct.toFixed(1)}% to goal`
          },
          { 
            label: "Total GP", 
            value: formatCurrency(analytics.totalGP),
            trend: analytics.gpGoalPct >= 100 ? "up" : "down",
            change: `${analytics.gpGoalPct.toFixed(1)}% to goal`
          },
          { 
            label: "Avg Margin", 
            value: formatPercentage(analytics.marginPct),
            trend: analytics.marginPct >= 20 ? "up" : "down",
            change: analytics.marginPct >= 20 ? "Healthy" : "Below target"
          },
          { 
            label: "Salespeople", 
            value: analytics.totalSalespeople,
            trend: "neutral",
            change: `${teamData?.teams?.length || 0} teams`
          }
        ] : []}
        actions={
          <>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
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

      <AdvancedLayout.Card variant="elevated" className="min-h-[600px]">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Overview (Team Annual)
            </TabsTrigger>
            <TabsTrigger value="quarterly" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Quarterly Redline
            </TabsTrigger>
            <TabsTrigger value="presidents-circle" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Presidents Circle
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Loading overview data...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center text-red-600 p-8">
                <p>Error loading data: {error}</p>
                <Button onClick={handleRefresh} className="mt-4">Try Again</Button>
              </div>
            ) : (
              <OverviewTab />
            )}
          </TabsContent>

          <TabsContent value="quarterly" className="space-y-6">
            {quarterlyLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Loading quarterly data...</p>
                </div>
              </div>
            ) : quarterlyError ? (
              <div className="text-center text-red-600 p-8">
                <p>Error loading data: {quarterlyError}</p>
                <Button onClick={fetchQuarterlyData} className="mt-4">Try Again</Button>
              </div>
            ) : (
              <QuarterlyTab />
            )}
          </TabsContent>

          <TabsContent value="presidents-circle" className="space-y-6">
            {presidentsCircleLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Loading Presidents Circle data...</p>
                </div>
              </div>
            ) : presidentsCircleError ? (
              <div className="text-center text-red-600 p-8">
                <p>Error loading data: {presidentsCircleError}</p>
                <Button onClick={fetchPresidentsCircleData} className="mt-4">Try Again</Button>
              </div>
            ) : (
              <PresidentsCircleTab />
            )}
          </TabsContent>
        </Tabs>
      </AdvancedLayout.Card>
    </AdvancedLayout>
  )
}

export const Route = createFileRoute('/_authenticated/redline-report/')({
  component: RedlineReport,
}) 