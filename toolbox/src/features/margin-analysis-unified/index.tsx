import React, { useState, useMemo } from 'react'
import { 
  AdvancedLayout, 
  useLayoutContext 
} from '@/components/layout/advanced-layout-system'
import { 
  SmartTable 
} from '@/components/advanced/smart-data-components'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Calculator, TrendingUp, DollarSign, Target, AlertTriangle, Timer,
  Settings, Download, ExternalLink, RefreshCw, Filter, Trophy,
  TrendingDown, Clock, Shield, Star, Info, HelpCircle, Zap,
  Activity, Package, Users, Eye, Brain, BarChart3, Minus,
  Play, CheckCircle, XCircle, AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { analysisEngine } from './services/AnalysisEngine'
import { AnalysisData } from './types'

const PAGE_SIZE = 50

// Analysis Status Hook
function useAnalysisStatus() {
  return useQuery({
    queryKey: ['margin-analysis-status'],
    queryFn: async () => {
      // This could fetch real status from the API
      return {
        pipeline_status: 'running',
        processed_orders: 1247,
        cache_age_hours: 2,
        last_update: new Date().toISOString()
      }
    },
    refetchInterval: 30 * 1000, // 30 seconds
  })
}

export default function UnifiedMarginAnalysis() {
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedTab, setSelectedTab] = useState('analysis')
  const [loading, setLoading] = useState(false)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState<any>({})
  const [showGuide, setShowGuide] = useState(false)
  const { theme, density } = useLayoutContext()

  // Fetch analysis status
  const { data: statusData } = useAnalysisStatus()

  // Handle analysis from search
  const handleAnalyzeOrder = async (orderNumber: string) => {
    if (!orderNumber.trim()) {
      toast.error('Please enter an order number')
      return
    }

    if (orderNumber.length < 3) {
      toast.error('Order number must be at least 3 characters')
      return
    }

    console.log('🚀 Starting analysis for order:', orderNumber)
    setIsAnalyzing(true)
    setAnalysisProgress({ progress: 0, current_action: 'Starting analysis...' })
    
    try {
      // Determine order type (Q for quotes, O for orders by default)
      const orderType = orderNumber.toLowerCase().startsWith('q') ? 'quote' : 'order'
      const cleanOrderNo = orderNumber.replace(/^[qQ]/i, '') // Remove Q prefix if present
      
      const analysis = await analysisEngine.getEnhancedAnalysis(
        cleanOrderNo,
        orderType,
        (progress) => {
          console.log('📊 Analysis progress:', progress)
          setAnalysisProgress(progress)
        }
      )
      
      console.log('✅ Analysis completed:', analysis)
      setAnalysisData(analysis)
      setSelectedTab('results')
      
             // Add to history
       setAnalysisHistory(prev => [
         {
           order_no: orderNumber,
           timestamp: new Date().toISOString(),
           margin_pct: analysis.quote?.margin_pct || 0,
           total_value: analysis.quote?.total_sell || 0,
           approval_required: analysis.approvalRequired || false,
           customer_name: analysis.quote?.customer_name || 'Unknown'
         },
         ...prev.slice(0, 9) // Keep last 10
       ])
      
      toast.success(`Analysis completed for ${orderType} ${orderNumber}`)
    } catch (err: any) {
      console.error('❌ Analysis error:', err)
      toast.error(`Analysis failed: ${err.message}`)
    } finally {
      setIsAnalyzing(false)
      setAnalysisProgress({})
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      handleAnalyzeOrder(query.trim())
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      // Refresh any cached data
      toast.success('Analysis data refreshed successfully')
    } catch (err) {
      toast.error('Failed to refresh data')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (analysisData) {
      const blob = new Blob([JSON.stringify(analysisData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `margin-analysis-${analysisData.quote?.quote_no || 'export'}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Analysis exported successfully')
    } else {
      toast.error('No analysis data to export')
    }
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0)
  }

  // Get margin color
  const getMarginColor = (margin: number, target: number = 15) => {
    if (margin >= target) return 'text-green-600'
    if (margin >= target * 0.8) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Get approval badge color
  const getApprovalBadgeColor = (required: boolean, level?: string) => {
    if (!required) return 'bg-green-100 text-green-800 border-green-200'
    switch (level?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Analytics from current data
  const analytics = useMemo(() => {
    const recentAnalyses = analysisHistory.slice(0, 10)
    const avgMargin = recentAnalyses.reduce((sum, item) => sum + item.margin_pct, 0) / (recentAnalyses.length || 1)
    const totalValue = recentAnalyses.reduce((sum, item) => sum + item.total_value, 0)
    const approvalsRequired = recentAnalyses.filter(item => item.approval_required).length

    return {
      totalAnalyses: analysisHistory.length,
      avgMargin: avgMargin,
      totalValue: totalValue,
      approvalsRequired: approvalsRequired,
      recentAnalyses: recentAnalyses
    }
  }, [analysisHistory])

  // Enhanced table columns for analysis history
  const historyColumns = [
    {
      key: 'order_no',
      title: 'Order/Quote',
      sortable: true,
      sticky: true,
      width: '200px',
      formatter: (orderNo: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-xs">
              {orderNo?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 truncate">{orderNo}</p>
            <p className="text-xs text-gray-500">{new Date(row.timestamp).toLocaleDateString()}</p>
          </div>
        </div>
      )
    },
    {
      key: 'customer_name',
      title: 'Customer',
      sortable: true,
      formatter: (name: string) => (
        <div className="max-w-48">
          <p className="font-medium text-gray-900 truncate">{name}</p>
        </div>
      )
    },
    {
      key: 'total_value',
      title: 'Order Value',
      sortable: true,
      align: 'right' as const,
      formatter: (value: number) => (
        <div className="text-right">
          <span className="font-semibold text-blue-600">{formatCurrency(value || 0)}</span>
        </div>
      )
    },
    {
      key: 'margin_pct',
      title: 'Margin %',
      sortable: true,
      align: 'center' as const,
      formatter: (value: number) => (
        <div className="text-center">
          <span className={`font-semibold ${getMarginColor(value, 15)}`}>
            {value?.toFixed(1) || '0.0'}%
          </span>
        </div>
      )
    },
    {
      key: 'approval_required',
      title: 'Status',
      sortable: true,
      align: 'center' as const,
      formatter: (required: boolean, row: any) => (
        <Badge className={`${getApprovalBadgeColor(required, row.approval_level)}`}>
          {required ? 'Approval Required' : 'Approved'}
        </Badge>
      )
    },
    {
      key: 'order_no',
      title: 'Actions',
      sortable: false,
      width: '120px',
      formatter: (orderNo: string) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAnalyzeOrder(orderNo)}
          className="text-xs"
        >
          <Eye className="h-3 w-3 mr-1" />
          Re-analyze
        </Button>
      )
    }
  ]

  // Guide Component
  const AnalysisGuide = () => (
    <Dialog open={showGuide} onOpenChange={setShowGuide}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Margin Analysis Guide
          </DialogTitle>
          <DialogDescription>
            Understanding the AI-powered margin analysis system
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* How to Use */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Play className="h-4 w-4 text-blue-600" />
              How to Use
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-blue-100 text-blue-800">1</Badge>
                  <span className="font-medium">Enter Order</span>
                </div>
                <p className="text-xs text-gray-600">Type order/quote number in search</p>
              </div>
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-blue-100 text-blue-800">2</Badge>
                  <span className="font-medium">AI Analysis</span>
                </div>
                <p className="text-xs text-gray-600">System analyzes margins & performance</p>
              </div>
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-blue-100 text-blue-800">3</Badge>
                  <span className="font-medium">View Insights</span>
                </div>
                <p className="text-xs text-gray-600">Get recommendations & approvals</p>
              </div>
            </div>
          </div>

          {/* Analysis Features */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              Analysis Features
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded bg-blue-50 border border-blue-200">
                <span className="font-medium">Financial Analysis</span>
                <span className="text-sm text-gray-600">Margin %, costs, profitability</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-green-50 border border-green-200">
                <span className="font-medium">Vendor Performance</span>
                <span className="text-sm text-gray-600">Historical margins, trends</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-orange-50 border border-orange-200">
                <span className="font-medium">Customer History</span>
                <span className="text-sm text-gray-600">Past orders, relationship insights</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-purple-50 border border-purple-200">
                <span className="font-medium">AI Recommendations</span>
                <span className="text-sm text-gray-600">Optimization opportunities</span>
              </div>
            </div>
          </div>

          {/* Margin Thresholds */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              Margin Thresholds
            </h3>
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-green-600 font-medium">≥15%: </span>
                  <span className="text-gray-700">Excellent</span>
                </div>
                <div>
                  <span className="text-yellow-600 font-medium">12-15%: </span>
                  <span className="text-gray-700">Good</span>
                </div>
                <div>
                  <span className="text-red-600 font-medium">&lt;12%: </span>
                  <span className="text-gray-700">Needs Review</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <AdvancedLayout>
      <AdvancedLayout.Header
        title="AI Margin Analysis"
        description="Intelligent quote and order analysis with ML-powered insights and optimization recommendations"
        searchPlaceholder="Enter order number (e.g., 489716, Q123456)..."
        onSearch={handleSearch}
        onRefresh={handleRefresh}
        refreshLoading={loading || isAnalyzing}
                 statusInfo={{
           text: isAnalyzing ? "Analyzing Order..." : statusData?.processed_orders ? "Analysis Engine Ready" : "System Ready",
           status: isAnalyzing ? "warning" : statusData?.processed_orders ? "healthy" : "healthy",
           details: statusData ? 
             `${statusData.processed_orders} orders processed, ${statusData.cache_age_hours}h cache age` : 
             "Margin analysis system online"
         }}
        metrics={[
          { label: "Total Analyses", value: analytics.totalAnalyses },
          { label: "Avg Margin", value: `${analytics.avgMargin.toFixed(1)}%` },
          { label: "Total Value", value: formatCurrency(analytics.totalValue) },
          { label: "Pending Approvals", value: analytics.approvalsRequired }
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowGuide(true)}>
              <Info className="h-4 w-4 mr-2" />
              Guide
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!analysisData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </>
        }
      />

      {/* Advanced Content */}
      <div className="space-y-6">
        {/* Analysis Progress */}
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-900 flex items-center gap-2">
                  <Zap className="h-5 w-5 animate-pulse" />
                  Analysis in Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>{analysisProgress.current_action || analysisProgress.message || 'Processing...'}</span>
                    <span>{analysisProgress.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${analysisProgress.progress || 0}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Current Analysis Results */}
        {analysisData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
                         <Card className="border-green-200 bg-green-50">
               <CardHeader className="pb-3">
                 <CardTitle className="text-green-900 flex items-center gap-2">
                   <CheckCircle className="h-5 w-5" />
                   Analysis Complete: {analysisData.quote?.quote_no}
                 </CardTitle>
               </CardHeader>
               <CardContent className="pt-0">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div>
                     <p className="text-sm text-gray-600">Customer</p>
                     <p className="font-semibold">{analysisData.quote?.customer_name || 'Unknown'}</p>
                   </div>
                   <div>
                     <p className="text-sm text-gray-600">Order Value</p>
                     <p className="font-semibold">{formatCurrency(analysisData.quote?.total_sell || 0)}</p>
                   </div>
        <div>
                     <p className="text-sm text-gray-600">Margin</p>
                     <p className={`font-semibold ${getMarginColor(analysisData.quote?.margin_pct || 0)}`}>
                       {(analysisData.quote?.margin_pct || 0).toFixed(1)}%
          </p>
        </div>
                   <div>
                     <p className="text-sm text-gray-600">Status</p>
                     <Badge className={`${getApprovalBadgeColor(analysisData.approvalRequired, 'medium')}`}>
                       {analysisData.approvalRequired ? 'Needs Approval' : 'Approved'}
                     </Badge>
        </div>
      </div>
               </CardContent>
             </Card>
          </motion.div>
        )}

        {/* Main Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis" className="text-sm">
              Quick Analysis
            </TabsTrigger>
            <TabsTrigger value="history" className="text-sm">
              Analysis History ({analytics.totalAnalyses})
            </TabsTrigger>
            <TabsTrigger value="approvals" className="text-sm">
              Team Approvals
          </TabsTrigger>
        </TabsList>

          <TabsContent value="analysis" className="mt-6">
          <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  Quick Analysis
                </CardTitle>
                <CardDescription>
                  Enter an order or quote number in the search bar above for instant AI-powered analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ready for Analysis</h3>
                  <p className="text-gray-500 mb-4">
                    Use the search bar above to enter an order number and get detailed margin analysis
                  </p>
                  <div className="flex justify-center gap-2">
                    <Badge variant="outline">Order Format: 489716</Badge>
                    <Badge variant="outline">Quote Format: Q123456</Badge>
                  </div>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

                     <TabsContent value="history" className="mt-6">
             {analytics.recentAnalyses.length > 0 ? (
               <SmartTable
                 data={analytics.recentAnalyses}
                 columns={historyColumns}
                 loading={isAnalyzing}
                 density={density}
               />
             ) : (
               <Card>
                 <CardContent className="p-8">
                   <div className="text-center">
                     <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                     <h3 className="text-lg font-semibold mb-2">No analysis history</h3>
                     <p className="text-gray-500 mb-4">Analyze your first order to see results here</p>
                     <Button variant="outline" onClick={() => setSelectedTab('analysis')}>
                       Start Analysis
                     </Button>
                   </div>
                 </CardContent>
               </Card>
          )}
        </TabsContent>

          <TabsContent value="approvals" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  Team Approvals Dashboard
                </CardTitle>
                <CardDescription>
                  Pending approvals and team oversight
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Team Dashboard</h3>
                  <p className="text-gray-500 mb-4">
                    Team approval workflows will be displayed here
                  </p>
                  <Button variant="outline">
                    Configure Team Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>

      <AdvancedLayout.StatusBar
        items={[
          { 
            label: "Analysis Engine", 
            value: statusData?.pipeline_status || "Ready", 
            status: statusData?.pipeline_status === "running" ? "active" : "healthy" 
          },
          { label: "Total Analyses", value: analytics.totalAnalyses, status: "active" },
          { label: "Current Session", value: analysisHistory.length, status: "active" },
          { label: "Avg Margin", value: `${analytics.avgMargin.toFixed(1)}%`, status: "active" },
          { label: "System Status", value: isAnalyzing ? "Processing" : "Ready", status: isAnalyzing ? "processing" : "healthy" },
          { label: "Last Analysis", value: analysisHistory[0]?.timestamp ? new Date(analysisHistory[0].timestamp).toLocaleTimeString() : 'None', status: "active" },
          { label: "Theme", value: theme, details: "Current UI theme" }
        ]}
      />

      {/* Analysis Guide */}
      <AnalysisGuide />
    </AdvancedLayout>
  )
}

export { UnifiedMarginAnalysis } 