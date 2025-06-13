import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { 
  Search, 
  Calendar,
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Users,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Award,
  FileText,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Settings,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Star,
  Zap,
  Shield,
  Handshake,
  Globe,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  Briefcase,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MarginAnalysisService } from '../services'

interface CDAIntelligenceDashboardProps {
  className?: string
}

// Sample data structure based on the CSV
interface CustomerCDA {
  cda: string
  description: string
  status: 'Won' | 'New' | 'Lost'
  type: 'Project' | 'Continuing' | 'Continuing (Signed)' | 'Marketing'
  customer: string
  list_value: number
  owner: string
  sales_region: string
  expiration: string
  ultimate_site: string
}

export function CDAIntelligenceDashboard({ className }: CDAIntelligenceDashboardProps) {
  // Core state
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  
  // Data state
  const [cdaAnalysis, setCDAAnalysis] = useState<any>(null)
  const [expirationDashboard, setExpirationDashboard] = useState<any>(null)
  const [regionalPerformance, setRegionalPerformance] = useState<any>(null)
  const [customerAnalysis, setCustomerAnalysis] = useState<any>(null)

  // Mock data for demonstration (in production, this would come from the CSV)
  const sampleCDAs: CustomerCDA[] = [
    {
      cda: '24Z04547',
      description: 'KinoD LLC / Furniture - Office / Arlington / United States / 2000 sqft',
      status: 'Won',
      type: 'Project',
      customer: 'KinoD',
      list_value: 153151,
      owner: 'Roshan.1.Hiremath',
      sales_region: 'South Central North America',
      expiration: '10/20/25',
      ultimate_site: 'KinoD (000041819417)'
    },
    {
      cda: '24Z01211',
      description: 'Mattel HQ 12 Floor Refresh',
      status: 'Won',
      type: 'Project',
      customer: 'Mattel Inc',
      list_value: 24776413,
      owner: 'Natalie.Rasho',
      sales_region: 'NorCal and Nevada',
      expiration: '6/30/26',
      ultimate_site: 'Mattel Inc (000004466721)'
    },
    {
      cda: '25Z01695',
      description: 'Irvine Re-stack - FURNITURE ONLY',
      status: 'New',
      type: 'Project',
      customer: 'The Capital Group Companies Inc',
      list_value: 34725165,
      owner: 'Jennifer.King',
      sales_region: 'SoCal and Hawaii',
      expiration: '6/15/26',
      ultimate_site: 'The Capital Group Companies Inc (000009459118)'
    }
  ]

  // Load comprehensive CDA data
  const loadCDAIntelligence = useCallback(async () => {
    setLoading(true)
    try {
      const [
        analysisData,
        expirationData,
        regionalData,
        customerData
      ] = await Promise.all([
        MarginAnalysisService.getRealCustomerCDAAnalysis({
          include_expiring_contracts: true,
          sales_region_filter: selectedRegion !== 'all' ? selectedRegion : undefined
        }),
        MarginAnalysisService.getCDAExpirationDashboard({
          timeline: '90_days',
          include_renewal_probability: true
        }),
        MarginAnalysisService.getRegionalCDAPerformance(
          selectedRegion !== 'all' ? selectedRegion : undefined
        ),
        // Mock customer analysis for now
        Promise.resolve({
          high_value_customers: [
            { customer: 'The Capital Group Companies Inc', total_cdas: 3, total_value: 86518116, relationship_strength: 9.2 },
            { customer: 'Mattel Inc', total_cdas: 2, total_value: 24801189, relationship_strength: 8.7 },
            { customer: 'Sony Interactive Entertainment LLC', total_cdas: 2, total_value: 2021889, relationship_strength: 8.1 }
          ]
        })
      ])

      setCDAAnalysis(analysisData)
      setExpirationDashboard(expirationData)
      setRegionalPerformance(regionalData)
      setCustomerAnalysis(customerData)
      
      toast.success('CDA intelligence loaded successfully')
    } catch (error) {
      toast.error('Failed to load CDA intelligence: ' + (error instanceof Error ? error.message : 'Unknown error'))
      
      // Mock data for demonstration
      setCDAAnalysis({
        active_cdas_summary: {
          total_active_cdas: 200,
          total_contract_value: 892750000,
          by_status: {
            'Won': { count: 145, value: 680250000 },
            'New': { count: 35, value: 152300000 },
            'Lost': { count: 20, value: 60200000 }
          },
          by_type: {
            'Project': { count: 120, value: 520150000 },
            'Continuing': { count: 45, value: 245800000 },
            'Continuing (Signed)': { count: 30, value: 115600000 },
            'Marketing': { count: 5, value: 11200000 }
          },
          by_region: {
            'SoCal and Hawaii': { count: 65, value: 298750000, owner_count: 15 },
            'NorCal and Nevada': { count: 48, value: 185600000, owner_count: 12 },
            'South Central North America': { count: 42, value: 175900000, owner_count: 14 },
            'New York-New Jersey': { count: 25, value: 125400000, owner_count: 8 },
            'Mid Atlantic North America': { count: 20, value: 107100000, owner_count: 7 }
          }
        }
      })
      
      setExpirationDashboard({
        expiration_summary: {
          total_expiring: 28,
          total_value_at_risk: 145800000,
          critical_renewals: 8,
          high_probability_losses: 3,
          avg_days_to_expiration: 67
        }
      })
    } finally {
      setLoading(false)
    }
  }, [selectedRegion])

  // Load data on mount and filter changes
  useEffect(() => {
    loadCDAIntelligence()
  }, [loadCDAIntelligence])

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    if (!cdaAnalysis) return null

    const summary = cdaAnalysis.active_cdas_summary
    return {
      total_cdas: summary.total_active_cdas,
      total_value: summary.total_contract_value,
      avg_contract_size: summary.total_contract_value / summary.total_active_cdas,
      won_rate: (summary.by_status.Won?.count || 0) / summary.total_active_cdas * 100,
      expiring_soon: expirationDashboard?.expiration_summary?.total_expiring || 0,
      at_risk_value: expirationDashboard?.expiration_summary?.total_value_at_risk || 0
    }
  }, [cdaAnalysis, expirationDashboard])

  // Filter CDAs based on search and filters
  const filteredCDAs = useMemo(() => {
    return sampleCDAs.filter(cda => {
      const matchesSearch = !searchQuery || 
        cda.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cda.cda.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cda.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesRegion = selectedRegion === 'all' || cda.sales_region === selectedRegion
      const matchesStatus = selectedStatus === 'all' || cda.status === selectedStatus
      
      return matchesSearch && matchesRegion && matchesStatus
    })
  }, [sampleCDAs, searchQuery, selectedRegion, selectedStatus])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Won': return 'text-green-600 bg-green-100'
      case 'New': return 'text-blue-600 bg-blue-100'
      case 'Lost': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const calculateDaysUntilExpiration = (expirationDate: string) => {
    try {
      const expDate = new Date(expirationDate)
      const today = new Date()
      const diffTime = expDate.getTime() - today.getTime()
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    } catch {
      return -1
    }
  }

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50", className)}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    CDA Intelligence Center
                  </h1>
                  <p className="text-sm text-gray-600">
                    Comprehensive analysis of {keyMetrics?.total_cdas || '200+'} active customer agreements
                  </p>
                </div>
              </div>
              
              {/* Key Metrics Overview */}
              {keyMetrics && (
                <div className="hidden lg:flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(keyMetrics.total_value)}
                    </div>
                    <div className="text-xs text-gray-600">Total Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {keyMetrics.won_rate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">
                      {keyMetrics.expiring_soon}
                    </div>
                    <div className="text-xs text-gray-600">Expiring Soon</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadCDAIntelligence}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search CDAs, customers, or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-sm"
            />
          </div>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-48 bg-white/80 backdrop-blur-sm">
              <SelectValue placeholder="Select Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="SoCal and Hawaii">SoCal and Hawaii</SelectItem>
              <SelectItem value="NorCal and Nevada">NorCal and Nevada</SelectItem>
              <SelectItem value="South Central North America">South Central NA</SelectItem>
              <SelectItem value="New York-New Jersey">New York-New Jersey</SelectItem>
              <SelectItem value="Mid Atlantic North America">Mid Atlantic NA</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-32 bg-white/80 backdrop-blur-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Won">Won</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/70 backdrop-blur-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="renewals" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Renewals
            </TabsTrigger>
            <TabsTrigger value="regional" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Regional
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Analysis
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <CDAOverviewSection 
              cdaAnalysis={cdaAnalysis}
              loading={loading}
              filteredCDAs={filteredCDAs}
              formatCurrency={formatCurrency}
              getStatusColor={getStatusColor}
            />
          </TabsContent>

          {/* Renewals Tab */}
          <TabsContent value="renewals" className="space-y-6">
            <CDAExpirationsSection 
              expirationDashboard={expirationDashboard}
              loading={loading}
              formatCurrency={formatCurrency}
              calculateDaysUntilExpiration={calculateDaysUntilExpiration}
            />
          </TabsContent>

          {/* Regional Tab */}
          <TabsContent value="regional" className="space-y-6">
            <RegionalPerformanceSection 
              regionalPerformance={regionalPerformance}
              loading={loading}
              formatCurrency={formatCurrency}
            />
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <CustomerIntelligenceSection 
              customerAnalysis={customerAnalysis}
              loading={loading}
              formatCurrency={formatCurrency}
            />
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <StrategicAnalysisSection 
              cdaAnalysis={cdaAnalysis}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Supporting Components
function CDAOverviewSection({ cdaAnalysis, loading, filteredCDAs, formatCurrency, getStatusColor }: any) {
  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <DollarSign className="h-5 w-5" />
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {cdaAnalysis ? formatCurrency(cdaAnalysis.active_cdas_summary.total_contract_value) : '--'}
            </div>
            <p className="text-sm text-green-600 mt-1">Active contracts</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <FileText className="h-5 w-5" />
              Active CDAs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">
              {cdaAnalysis ? cdaAnalysis.active_cdas_summary.total_active_cdas : '--'}
            </div>
            <p className="text-sm text-blue-600 mt-1">Customer agreements</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <TrendingUp className="h-5 w-5" />
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">
              {cdaAnalysis ? 
                ((cdaAnalysis.active_cdas_summary.by_status.Won?.count || 0) / cdaAnalysis.active_cdas_summary.total_active_cdas * 100).toFixed(1) + '%'
                : '--'}
            </div>
            <p className="text-sm text-purple-600 mt-1">Success rate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Building2 className="h-5 w-5" />
              Regions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">
              {cdaAnalysis ? Object.keys(cdaAnalysis.active_cdas_summary.by_region).length : '--'}
            </div>
            <p className="text-sm text-orange-600 mt-1">Sales territories</p>
          </CardContent>
        </Card>
      </div>

      {/* CDA Table */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Active Customer Agreements
          </CardTitle>
          <CardDescription>
            Current CDA portfolio with key details and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CDA</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Expiration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCDAs.slice(0, 10).map((cda: any) => (
                  <TableRow key={cda.cda}>
                    <TableCell className="font-mono text-sm">{cda.cda}</TableCell>
                    <TableCell className="font-medium">{cda.customer}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(cda.list_value)}</TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', getStatusColor(cda.status))}>
                        {cda.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{cda.type}</TableCell>
                    <TableCell className="text-sm">{cda.owner.split('.').join(' ')}</TableCell>
                    <TableCell className="text-sm">{cda.sales_region}</TableCell>
                    <TableCell className="text-sm">{cda.expiration}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CDAExpirationsSection({ expirationDashboard, loading, formatCurrency, calculateDaysUntilExpiration }: any) {
  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Contract Renewal Management</h3>
        <p className="text-gray-600">Expiration tracking and renewal strategies will be displayed here.</p>
      </div>
    </div>
  )
}

function RegionalPerformanceSection({ regionalPerformance, loading, formatCurrency }: any) {
  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Regional Performance Analysis</h3>
        <p className="text-gray-600">Regional insights and performance metrics will be displayed here.</p>
      </div>
    </div>
  )
}

function CustomerIntelligenceSection({ customerAnalysis, loading, formatCurrency }: any) {
  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  }

  return (
    <div className="space-y-6">
      {/* High Value Customers */}
      {customerAnalysis?.high_value_customers && (
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              High Value Customers
            </CardTitle>
            <CardDescription>
              Top customers by contract value and relationship strength
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerAnalysis.high_value_customers.map((customer: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Building2 className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{customer.customer}</h4>
                      <p className="text-sm text-gray-600">{customer.total_cdas} active CDAs</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{formatCurrency(customer.total_value)}</div>
                    <div className="text-sm text-gray-600">Relationship: {customer.relationship_strength}/10</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StrategicAnalysisSection({ cdaAnalysis, loading }: any) {
  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Strategic CDA Analysis</h3>
        <p className="text-gray-600">Advanced analytics and strategic insights will be displayed here.</p>
      </div>
    </div>
  )
}

export default CDAIntelligenceDashboard 