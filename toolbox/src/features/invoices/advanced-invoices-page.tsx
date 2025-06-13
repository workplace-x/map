import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  AdvancedLayout, 
  LayoutProvider,
  useLayoutContext 
} from '@/components/layout/advanced-layout-system'
import { 
  SmartKPI, 
  SmartTable 
} from '@/components/advanced/smart-data-components'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons'
import {
  Receipt, Filter, Download, Settings, CreditCard, TrendingUp, 
  AlertTriangle, DollarSign, RefreshCw, ExternalLink, HelpCircle,
  Calendar, Clock, FileText, Target, TrendingDown, BarChart3,
  CheckCircle, XCircle, AlertCircle, Brain, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { azureApiClient } from '@/lib/azure-api-client'

interface Salesperson {
  salesperson_id: string
  name: string
}

interface InvoiceIntelligenceData {
  invoice_no: string
  customer_name: string
  salesperson_name: string
  invoice_date: string
  due_date: string
  invoice_amount: number
  payment_status: string
  days_outstanding: number
  payment_prediction: {
    payment_probability: number
    confidence_score: number
    expected_payment_date: string
    risk_factors: string[]
  }
  credit_analysis: {
    credit_score: number
    credit_risk: string
    payment_history_score: number
    financial_stability: string
  }
  collection_intelligence: {
    collection_priority: string
    collection_success_probability: number
    recommended_actions: string[]
    optimal_follow_up_date: string
  }
  cash_flow_analysis: {
    revenue_recognition_impact: number
    working_capital_impact: number
    cash_flow_timing: string
  }
  margin_amount: number
  margin_percent: number
}

interface Invoice {
  invoice_no: string
  invoice_title: string
  customer_name: string
  salesperson_name: string
  invoice_date: string
  due_date: string
  invoice_amount: number
  payment_status: string
  days_outstanding: number
  payment_terms: string
  total_margin: number
  margin_percent: number
  // ML Intelligence fields
  payment_prediction?: {
    payment_probability: number
    confidence_score: number
    expected_payment_date: string
    risk_factors: string[]
  }
  credit_analysis?: {
    credit_score: number
    credit_risk: string
    payment_history_score: number
    financial_stability: string
  }
  collection_intelligence?: {
    collection_priority: string
    collection_success_probability: number
    recommended_actions: string[]
    optimal_follow_up_date: string
  }
  cash_flow_analysis?: {
    revenue_recognition_impact: number
    working_capital_impact: number
    cash_flow_timing: string
  }
}

// API service for Invoice Intelligence
const invoiceIntelligenceApi = {
  async getInvoices(params: any = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    
    const response = await fetch(`https://tangram-marketing-functions.azurewebsites.net/api/invoice-intelligence-fast?${searchParams}`)
    if (!response.ok) {
      throw new Error('Failed to fetch invoice intelligence data')
    }
    return response.json()
  },

  async getStatus() {
    const response = await fetch('https://tangram-marketing-functions.azurewebsites.net/api/invoice-intelligence-fast/status')
    if (!response.ok) {
      throw new Error('Failed to fetch invoice intelligence status')
    }
    return response.json()
  },

  async getInsights() {
    const response = await fetch('https://tangram-marketing-functions.azurewebsites.net/api/invoice-intelligence-fast/insights')
    if (!response.ok) {
      throw new Error('Failed to fetch invoice intelligence insights')
    }
    return response.json()
  },

  async getInvoiceDetails(invoiceNo: string) {
    const response = await fetch(`https://tangram-marketing-functions.azurewebsites.net/api/invoice-intelligence-fast/${invoiceNo}`)
    if (!response.ok) {
      throw new Error('Failed to fetch invoice details')
    }
    return response.json()
  }
}

// Data hooks using Invoice Intelligence ML API
const useInvoiceIntelligenceData = (filters: any = {}) => {
  return useQuery({
    queryKey: ['invoice-intelligence', filters],
    queryFn: () => invoiceIntelligenceApi.getInvoices(filters),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000 // Consider data stale after 30 seconds
  })
}

const useInvoiceIntelligenceStatus = () => {
  return useQuery({
    queryKey: ['invoice-intelligence-status'],
    queryFn: () => invoiceIntelligenceApi.getStatus(),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000
  })
}

const useInvoiceIntelligenceInsights = () => {
  return useQuery({
    queryKey: ['invoice-intelligence-insights'],
    queryFn: () => invoiceIntelligenceApi.getInsights(),
    refetchInterval: 60000,
    staleTime: 30000
  })
}

const useSalespeopleData = () => {
  return useQuery({
    queryKey: ['salespeople'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ods_hds_salesperson')
        .select('salesperson_id, name')
        .order('name')
      
      if (error) throw error
      return data || []
    },
    staleTime: 300000 // Cache for 5 minutes
  })
}

const useUserSalespeopleMapping = () => {
  return useQuery({
    queryKey: ['user-salespeople-mapping'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      
      if (!userId) return []
      
      const { data, error } = await supabase
        .from('user_account_mapping')
        .select('erp_salesperson_id')
        .eq('supabase_user_id', userId)
      
      if (error) throw error
      return (data || []).filter(row => row.erp_salesperson_id).map(row => row.erp_salesperson_id)
    },
    staleTime: 600000 // Cache for 10 minutes
  })
}

interface InvoiceIntelligenceGuideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function InvoiceIntelligenceGuideDialog({ open, onOpenChange }: InvoiceIntelligenceGuideDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI-Powered Invoice Intelligence System Guide
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg text-gray-900 mb-2 flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              🤖 AI-Powered Features
            </h3>
            <p className="text-sm text-gray-700">
              This system uses advanced machine learning to analyze payment patterns, predict collection outcomes, and optimize cash flow management.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900">💳 Payment Prediction</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span><strong>High Probability:</strong> ≥70% payment likelihood</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span><strong>Medium Probability:</strong> 40-69% payment likelihood</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <span><strong>Low Probability:</strong> {'<'}40% payment likelihood</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span><strong>Risk Factors:</strong> Late payment indicators</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900">📊 Credit Analysis</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <span><strong>Credit Scoring:</strong> AI-powered creditworthiness assessment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  <span><strong>Payment History:</strong> Historical payment pattern analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <span><strong>Financial Stability:</strong> Customer financial health tracking</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg text-gray-900 mb-3">🎯 Collection Intelligence</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-blue-50">
                <h4 className="font-semibold text-blue-900">Collection Priority</h4>
                <p className="text-blue-700">AI-optimized follow-up prioritization</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <h4 className="font-semibold text-purple-900">Success Probability</h4>
                <p className="text-purple-700">ML-predicted collection success rates</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <h4 className="font-semibold text-green-900">Recommended Actions</h4>
                <p className="text-green-700">Smart follow-up strategy recommendations</p>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg text-gray-900 mb-3">📈 Advanced Analytics</h3>
            <div className="space-y-2 text-sm">
              <p>• <strong>Cash Flow Impact:</strong> Revenue recognition and working capital analysis</p>
              <p>• <strong>Risk Assessment:</strong> Multi-factor payment risk evaluation</p>
              <p>• <strong>Aging Intelligence:</strong> Automatic aging bucket optimization</p>
              <p>• <strong>Dispute Prediction:</strong> Early dispute detection and prevention</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AdvancedInvoicesPage() {
  const [selectedSalespeople, setSelectedSalespeople] = useState<Salesperson[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState('invoices')
  const [searchQuery, setSearchQuery] = useState('')
  const [guideOpen, setGuideOpen] = useState(false)
  const [paymentProbabilityFilter, setPaymentProbabilityFilter] = useState('')
  const [creditRiskFilter, setCreditRiskFilter] = useState('')
  const [collectionPriorityFilter, setCollectionPriorityFilter] = useState('')
  const { user } = useAuth()
  const { theme, density } = useLayoutContext()

  // Data fetching with Invoice Intelligence ML API
  const { data: salespersonOptions = [] } = useSalespeopleData()
  const { data: userMappings = [] } = useUserSalespeopleMapping()
  const { data: statusData } = useInvoiceIntelligenceStatus()
  const { data: insightsData } = useInvoiceIntelligenceInsights()
  
  // Build filters for Invoice Intelligence API
  const apiFilters = useMemo(() => {
    const filters: any = {}
    if (searchQuery) filters.search = searchQuery
    if (paymentProbabilityFilter) filters.payment_probability = paymentProbabilityFilter
    if (creditRiskFilter) filters.credit_risk = creditRiskFilter
    if (collectionPriorityFilter) filters.collection_priority = collectionPriorityFilter
    return filters
  }, [searchQuery, paymentProbabilityFilter, creditRiskFilter, collectionPriorityFilter])
  
  const { data: invoiceIntelligenceResponse, isLoading, error, refetch } = useInvoiceIntelligenceData(apiFilters)
  
  // Extract invoices from API response
  const invoices = useMemo(() => {
    if (!invoiceIntelligenceResponse?.invoices) return []
    
    // Convert Invoice Intelligence data to Invoice format
    return invoiceIntelligenceResponse.invoices.map((item: any) => ({
      invoice_no: item.invoice_no,
      invoice_title: `Invoice ${item.invoice_no}`,
      customer_name: item.customer_name,
      salesperson_name: item.salesperson_name,
      invoice_date: item.invoice_date,
      due_date: item.due_date,
      invoice_amount: item.invoice_value,
      payment_status: item.payment_status,
      days_outstanding: item.days_outstanding,
      payment_terms: item.payment_terms || 'Net 30',
      total_margin: item.margin_amount,
      margin_percent: item.margin_percent,
      payment_prediction: {
        payment_probability: item.payment_prediction?.payment_probability || 0,
        confidence_score: item.payment_prediction?.payment_confidence || 0,
        expected_payment_date: item.payment_prediction?.expected_payment_date || '',
        risk_factors: item.payment_prediction?.risk_factors || []
      },
      credit_analysis: {
        credit_score: item.credit_risk?.credit_score || 0,
        credit_risk: item.credit_risk?.risk_level || 'medium',
        payment_history_score: item.customer_payment_behavior?.historical_payment_score || 0,
        financial_stability: item.credit_risk?.creditworthiness || 'unknown'
      },
      collection_intelligence: {
        collection_priority: item.collection_analysis?.collection_priority || 'medium',
        collection_success_probability: item.collection_analysis?.collection_success_probability || 0,
        recommended_actions: item.recommended_actions || [],
        optimal_follow_up_date: item.collection_analysis?.escalation_timeline || 'unknown'
      },
      cash_flow_analysis: {
        revenue_recognition_impact: item.cash_flow_analysis?.revenue_recognition_date || 0,
        working_capital_impact: item.cash_flow_analysis?.working_capital_impact || 0,
        cash_flow_timing: item.cash_flow_analysis?.cash_conversion_days || 'unknown'
      }
    }))
  }, [invoiceIntelligenceResponse])

  // Set default salespeople when data loads
  React.useEffect(() => {
    if (salespersonOptions.length > 0 && userMappings.length > 0 && selectedSalespeople.length === 0) {
      const defaultSalespeople = salespersonOptions.filter(sp =>
        userMappings.includes(sp.salesperson_id)
      )
      setSelectedSalespeople(defaultSalespeople)
    }
  }, [salespersonOptions, userMappings, selectedSalespeople.length])

  // Calculate analytics with ML insights
  const analytics = useMemo(() => {
    const totalInvoices = invoices.length
    const totalAmount = invoices.reduce((sum, invoice) => sum + (invoice.invoice_amount || 0), 0)
    const totalOutstanding = invoices
      .filter(invoice => invoice.payment_status !== 'paid')
      .reduce((sum, invoice) => sum + (invoice.invoice_amount || 0), 0)
    const overdueInvoices = invoices.filter(invoice => invoice.payment_status === 'overdue').length
    const avgDaysOutstanding = invoices.length > 0 
      ? invoices.reduce((sum, invoice) => sum + (invoice.days_outstanding || 0), 0) / invoices.length
      : 0
    const paidInvoices = invoices.filter(invoice => invoice.payment_status === 'paid').length
    const collectionRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0
    const totalMargin = invoices.reduce((sum, invoice) => sum + (invoice.total_margin || 0), 0)
    
    // ML-powered insights
    const highRiskInvoices = invoices.filter(invoice => 
      invoice.credit_analysis?.credit_risk === 'high' || invoice.payment_prediction?.payment_probability < 0.4
    ).length
    
    const avgPaymentProbability = invoices.length > 0
      ? invoices.reduce((sum, invoice) => sum + (invoice.payment_prediction?.payment_probability || 0), 0) / invoices.length * 100
      : 0
    
    return {
      totalInvoices,
      totalAmount,
      totalOutstanding,
      overdueInvoices,
      avgDaysOutstanding,
      collectionRate,
      totalMargin,
      highRiskInvoices,
      avgPaymentProbability
    }
  }, [invoices])

  const handleRefresh = async () => {
    await refetch()
    toast.success('Invoice Intelligence data refreshed successfully')
  }

  const handleExport = async () => {
    try {
      const exportData = invoices.map((invoice: Invoice) => ({
        invoice_number: invoice.invoice_no,
        invoice_title: invoice.invoice_title,
        customer: invoice.customer_name,
        salesperson: invoice.salesperson_name,
        invoice_amount: invoice.invoice_amount,
        payment_status: invoice.payment_status,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        days_outstanding: invoice.days_outstanding,
        payment_terms: invoice.payment_terms,
        margin_amount: invoice.total_margin,
        margin_percent: invoice.margin_percent
      }))
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoices-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success('Invoice data exported successfully')
    } catch (error) {
      toast.error('Failed to export data')
    }
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

  // Toggle salesperson selection
  const toggleSalesperson = (salesperson: Salesperson) => {
    setSelectedSalespeople(prev => {
      const isSelected = prev.some(sp => sp.salesperson_id === salesperson.salesperson_id);
      if (isSelected) {
        return prev.filter(sp => sp.salesperson_id !== salesperson.salesperson_id);
      } else {
        return [...prev, salesperson];
      }
    });
  };

  const clearSelections = () => {
    setSelectedSalespeople([]);
  };

  const formatPaymentStatus = (status: string) => {
    const config = {
      paid: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" />, label: 'Paid' },
      pending: { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3" />, label: 'Pending' },
      partial: { color: 'bg-orange-100 text-orange-800', icon: <AlertCircle className="h-3 w-3" />, label: 'Partial' },
      overdue: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" />, label: 'Overdue' }
    }
    const statusConfig = config[status as keyof typeof config] || config.pending
    
    return (
      <Badge className={`${statusConfig.color} border-none flex items-center gap-1`}>
        {statusConfig.icon}
        {statusConfig.label}
      </Badge>
    )
  }

  // Smart table columns with ML intelligence
  const invoiceColumns = [
    {
      key: 'invoice_no' as keyof Invoice,
      title: 'Invoice Details',
      sortable: true,
      sticky: true,
      width: '200px',
      formatter: (invoiceNo: string, row: Invoice) => (
        <div>
          <p className="font-medium text-gray-900 mb-1">{invoiceNo}</p>
          <p className="text-xs text-gray-500">{row.invoice_title}</p>
        </div>
      )
    },
    {
      key: 'customer_name' as keyof Invoice,
      title: 'Customer',
      sortable: true,
      width: '180px'
    },
    {
      key: 'salesperson_name' as keyof Invoice,
      title: 'Salesperson',
      sortable: true,
      width: '150px'
    },
    {
      key: 'invoice_amount' as keyof Invoice,
      title: 'Amount',
      sortable: true,
      align: 'right' as const,
      formatter: (value: number) => (
        <span className="font-semibold text-blue-600">{formatCurrency(value || 0)}</span>
      )
    },
    {
      key: 'payment_status' as keyof Invoice,
      title: 'Status',
      sortable: true,
      align: 'center' as const,
      formatter: formatPaymentStatus
    },
    {
      key: 'payment_prediction' as keyof Invoice,
      title: 'Payment Probability',
      sortable: false,
      align: 'center' as const,
      formatter: (prediction: any) => {
        if (!prediction) return <span className="text-xs text-gray-400">N/A</span>
        const probability = prediction.payment_probability * 100
        const color = probability >= 70 ? 'text-green-600' : probability >= 40 ? 'text-orange-600' : 'text-red-600'
        return (
          <div className="text-center">
            <div className={`font-semibold ${color}`}>{probability.toFixed(1)}%</div>
            <div className="text-xs text-gray-500">Confidence: {(prediction.confidence_score * 100).toFixed(0)}%</div>
          </div>
        )
      }
    },
    {
      key: 'credit_analysis' as keyof Invoice,
      title: 'Credit Risk',
      sortable: false,
      align: 'center' as const,
      formatter: (analysis: any) => {
        if (!analysis) return <span className="text-xs text-gray-400">N/A</span>
        const riskColors = {
          low: 'bg-green-100 text-green-800',
          medium: 'bg-orange-100 text-orange-800',
          high: 'bg-red-100 text-red-800'
        }
        const color = riskColors[analysis.credit_risk as keyof typeof riskColors] || riskColors.medium
        return (
          <div className="text-center">
            <Badge className={`${color} border-none text-xs`}>
              {analysis.credit_risk?.toUpperCase()}
            </Badge>
            <div className="text-xs text-gray-500 mt-1">Score: {analysis.credit_score}</div>
          </div>
        )
      }
    },
    {
      key: 'collection_intelligence' as keyof Invoice,
      title: 'Collection Priority',
      sortable: false,
      align: 'center' as const,
      formatter: (collection: any) => {
        if (!collection) return <span className="text-xs text-gray-400">N/A</span>
        const priorityColors = {
          high: 'bg-red-100 text-red-800',
          medium: 'bg-orange-100 text-orange-800',
          low: 'bg-green-100 text-green-800'
        }
        const color = priorityColors[collection.collection_priority as keyof typeof priorityColors] || priorityColors.medium
        return (
          <div className="text-center">
            <Badge className={`${color} border-none text-xs`}>
              {collection.collection_priority?.toUpperCase()}
            </Badge>
            <div className="text-xs text-gray-500 mt-1">
              Success: {(collection.collection_success_probability * 100).toFixed(0)}%
            </div>
          </div>
        )
      }
    },
    {
      key: 'days_outstanding' as keyof Invoice,
      title: 'Days Outstanding',
      sortable: true,
      align: 'center' as const,
      formatter: (days: number) => (
        <span className={`font-semibold ${days > 30 ? 'text-red-600' : days > 0 ? 'text-orange-600' : 'text-green-600'}`}>
          {days} days
        </span>
      )
    },
    {
      key: 'due_date' as keyof Invoice,
      title: 'Due Date',
      sortable: true,
      formatter: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      key: 'margin_percent' as keyof Invoice,
      title: 'Margin %',
      sortable: true,
      align: 'center' as const,
      formatter: (value: number) => (
        <span className="font-semibold text-purple-600">{value?.toFixed(1) || '0.0'}%</span>
      )
    }
  ]

  return (
    <LayoutProvider>
      <AdvancedLayout>
        <AdvancedLayout.Header
          title="Invoice Intelligence Dashboard"
          description="Advanced invoice tracking with payment analytics and cash flow insights"
          searchPlaceholder="Search invoices by number, customer, or title..."
          onSearch={setSearchQuery}
          onRefresh={handleRefresh}
          refreshLoading={isLoading}
          statusInfo={{
            text: error ? "Data Issues Detected" : "Invoice Intelligence Active",
            status: error ? "error" : "healthy",
            details: error ? "Check connection and try again" : `${analytics.totalInvoices} invoices loaded • ML API active`
          }}
          metrics={[
            { 
              label: "Total Invoices", 
              value: analytics.totalInvoices,
              trend: "up",
              change: "+3.2%"
            },
            { 
              label: "Outstanding", 
              value: formatCurrency(analytics.totalOutstanding),
              trend: "down",
              change: "-8.4%"
            },
            { 
              label: "Avg Payment Probability", 
              value: `${analytics.avgPaymentProbability.toFixed(1)}%`,
              trend: analytics.avgPaymentProbability >= 70 ? "up" : "down",
              change: "+5.2%"
            },
            { 
              label: "High Risk Invoices", 
              value: analytics.highRiskInvoices,
              trend: "down",
              change: "-12%"
            }
          ]}
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => setGuideOpen(true)}>
                <Brain className="h-4 w-4 mr-2" />
                AI Guide
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

        {/* Salesperson Filter Section */}
        <AdvancedLayout.Card variant="glass" padding="sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-100 text-green-600">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Filter by Salesperson</h3>
              <p className="text-sm text-gray-600">Select salespeople to view their invoices</p>
            </div>
          </div>

          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isFilterOpen}
                className="min-w-[200px] justify-between bg-white/80 hover:bg-white border-gray-200"
              >
                {selectedSalespeople.length === 0
                  ? "Select salespeople..."
                  : `${selectedSalespeople.length} selected`}
                <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput placeholder="Search salespeople..." />
                <CommandList>
                  <CommandEmpty>No salespeople found.</CommandEmpty>
                  <CommandGroup>
                    {salespersonOptions.map((salesperson) => {
                      const isSelected = selectedSalespeople.some(
                        sp => sp.salesperson_id === salesperson.salesperson_id
                      );
                      return (
                        <CommandItem
                          key={salesperson.salesperson_id}
                          onSelect={() => toggleSalesperson(salesperson)}
                        >
                          <div className="flex items-center space-x-2">
                            <div className={cn(
                              "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible"
                            )}>
                              <CheckIcon className="h-4 w-4" />
                            </div>
                            <span>{salesperson.name}</span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
              {selectedSalespeople.length > 0 && (
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelections}
                    className="w-full"
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Selected salespeople badges */}
        {selectedSalespeople.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedSalespeople.map((salesperson) => (
              <Badge
                key={salesperson.salesperson_id}
                variant="secondary"
                className="cursor-pointer bg-white/80 hover:bg-white border-gray-200"
                onClick={() => toggleSalesperson(salesperson)}
              >
                {salesperson.name}
                <span className="ml-1 text-xs">×</span>
              </Badge>
            ))}
          </div>
        )}
      </AdvancedLayout.Card>

      {/* Smart KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SmartKPI
          title="Total Amount"
          value={analytics.totalAmount}
          format="currency"
          icon={<Receipt />}
          color="green"
          loading={isLoading}
          subtitle="All invoices"
          trend={{ direction: 'up', percentage: 6.8, period: 'vs last month' }}
        />
        
        <SmartKPI
          title="Outstanding"
          value={analytics.totalOutstanding}
          format="currency"
          icon={<Clock />}
          color="orange"
          trend={{ direction: 'down', percentage: -8.4, period: 'vs last month' }}
          loading={isLoading}
          subtitle="Unpaid invoices"
        />
        
        <SmartKPI
          title="Collection Rate"
          value={analytics.collectionRate}
          format="percentage"
          icon={<Target />}
          color="blue"
          trend={{ direction: analytics.collectionRate >= 85 ? 'up' : 'down', percentage: 2.1, period: 'vs target' }}
          loading={isLoading}
          target={85}
        />
        
        <SmartKPI
          title="Overdue Invoices"
          value={analytics.overdueInvoices}
          icon={<AlertTriangle />}
          color="red"
          loading={isLoading}
          subtitle="Past due date"
          trend={{ direction: 'down', percentage: -15, period: 'vs last week' }}
          interactive
          onClick={() => setSelectedTab('overdue')}
        />
      </div>

      {/* Advanced Content */}
      <AdvancedLayout.Card variant="elevated" className="min-h-[600px]">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Invoice Intelligence
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              ML Analytics
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Collection Intelligence
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="space-y-6">
            {/* ML-powered filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Payment Probability</label>
                <select 
                  value={paymentProbabilityFilter} 
                  onChange={(e) => setPaymentProbabilityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Probabilities</option>
                  <option value="high">High (≥70%)</option>
                  <option value="medium">Medium (40-69%)</option>
                  <option value="low">Low (&lt;40%)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Credit Risk</label>
                <select 
                  value={creditRiskFilter} 
                  onChange={(e) => setCreditRiskFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Risk Levels</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Collection Priority</label>
                <select 
                  value={collectionPriorityFilter} 
                  onChange={(e) => setCollectionPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setPaymentProbabilityFilter('')
                    setCreditRiskFilter('')
                    setCollectionPriorityFilter('')
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            <SmartTable
              data={invoices}
              columns={invoiceColumns}
              loading={isLoading}
              emptyState={{
                icon: <Receipt className="h-12 w-12 text-gray-400" />,
                title: "No invoices found",
                description: "Try adjusting your search or filter criteria."
              }}
              globalSearch={false} // We handle search via API
              enableExport={true}
              enableColumnVisibility={true}
              enableDensity={true}
              stickyHeader={true}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Advanced Invoice Analytics</h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Comprehensive invoice analytics with machine learning insights coming soon. 
                Features payment prediction, credit risk scoring, and collection optimization.
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <Badge variant="outline" className="px-3 py-1">💳 Payment Prediction</Badge>
                <Badge variant="outline" className="px-3 py-1">📊 Credit Risk Scoring</Badge>
                <Badge variant="outline" className="px-3 py-1">🎯 Collection Optimization</Badge>
                <Badge variant="outline" className="px-3 py-1">📈 Cash Flow Forecasting</Badge>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="collections" className="space-y-6">
            {/* Collection Intelligence content */}
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {/* AI Insights content */}
          </TabsContent>
        </Tabs>
      </AdvancedLayout.Card>

      {/* Advanced Status Bar */}
      <AdvancedLayout.StatusBar
        items={[
          { 
            label: "Data Status", 
            value: error ? "Error" : "ML API active", 
            status: error ? "error" : "healthy",
            details: error ? "Check connection" : "ML API active"
          },
          { 
            label: "Total Invoices", 
            value: analytics.totalInvoices.toString(), 
            status: "active" 
          },
          { 
            label: "Collection Rate", 
            value: `${analytics.collectionRate.toFixed(1)}%`, 
            status: analytics.collectionRate >= 85 ? "active" : "warning" 
          },
          { 
            label: "Theme", 
            value: theme, 
            details: "Current UI theme" 
          },
          { 
            label: "Density", 
            value: density, 
            details: "Current layout density" 
          }
        ]}
      />

        {/* Invoice Intelligence Guide Dialog */}
        <InvoiceIntelligenceGuideDialog open={guideOpen} onOpenChange={setGuideOpen} />
      </AdvancedLayout>
    </LayoutProvider>
  )
} 