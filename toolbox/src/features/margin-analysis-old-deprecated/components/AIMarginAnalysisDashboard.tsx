import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { 
  Search, 
  Brain, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  Target,
  Zap,
  Eye,
  Lightbulb,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Settings,
  Cpu,
  Sparkles,
  Rocket,
  Shield,
  Award,
  Clock,
  DollarSign,
  Users,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  Info,
  Star,
  Filter,
  Download,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MarginAnalysisService } from '../services'
import { 
  SmartSearchResult,
  MarginPrediction,
  AdvancedAnalytics,
  AIInsightsEngine,
  OptimizationSuggestion,
  RiskFactor,
  CompetitiveInsight,
  MLMarginModel
} from '../types'

interface AIMarginAnalysisDashboardProps {
  className?: string
}

export function AIMarginAnalysisDashboard({ className }: AIMarginAnalysisDashboardProps) {
  // Core state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SmartSearchResult[]>([])
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('search')
  const [loading, setLoading] = useState(false)
  
  // AI state
  const [predictions, setPredictions] = useState<MarginPrediction | null>(null)
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null)
  const [insights, setInsights] = useState<AIInsightsEngine | null>(null)
  const [mlModels, setMLModels] = useState<MLMarginModel[]>([])
  
  // UI state
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [aiProcessing, setAiProcessing] = useState(false)
  const [currentInsight, setCurrentInsight] = useState<string | null>(null)

  // Search handlers
  const handleIntelligentSearch = useCallback(async (query: string) => {
    if (!query.trim()) return
    
    setLoading(true)
    try {
      const results = await MarginAnalysisService.intelligentSearch(query, {
        search_type: 'all',
        include_ai_insights: true,
        limit: 10,
        min_relevance: 0.3
      })
      setSearchResults(results)
      toast.success(`Found ${results.length} relevant results with AI insights`)
    } catch (error) {
      toast.error('Search failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleQuoteAnalysis = useCallback(async (quoteId: string) => {
    setAiProcessing(true)
    setSelectedQuote(quoteId)
    
    try {
      // Parallel AI analysis
      const [predictionData, analyticsData, insightsData] = await Promise.all([
        MarginAnalysisService.getMarginPrediction({ quote_id: quoteId, historical_context: true }),
        MarginAnalysisService.getAdvancedAnalytics({ 
          time_period: '12_months',
          include_patterns: true,
          include_anomalies: true,
          include_forecasts: true
        }),
        MarginAnalysisService.getAIInsights({ 
          entity_type: 'quote',
          entity_id: quoteId,
          time_horizon: 'immediate'
        })
      ])
      
      setPredictions(predictionData)
      setAnalytics(analyticsData)
      setInsights(insightsData)
      setActiveTab('analysis')
      
      toast.success('AI analysis complete with high confidence predictions')
    } catch (error) {
      toast.error('AI analysis failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setAiProcessing(false)
    }
  }, [])

  // Load ML models on mount
  useEffect(() => {
    const loadMLModels = async () => {
      try {
        const models = await MarginAnalysisService.getMLModels()
        setMLModels(models)
      } catch (error) {
        console.error('Failed to load ML models:', error)
      }
    }
    loadMLModels()
  }, [])

  // AI capability score
  const aiCapability = useMemo(() => 
    MarginAnalysisService.getAICapabilityScore(), []
  )

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50", className)}>
      {/* Header with AI Branding */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AI Margin Intelligence
                  </h1>
                  <p className="text-sm text-gray-600">
                    Powered by {mlModels.filter(m => m.status === 'active').length} active ML models
                  </p>
                </div>
              </div>
              
              {/* AI Capability Score */}
              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg border">
                <Cpu className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">
                  AI Score: {aiCapability.overall_score}/100
                </span>
                <Badge variant="outline" className="text-xs">
                  {aiCapability.maturity_level}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIAssistant(true)}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                AI Assistant
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/70 backdrop-blur-sm">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Intelligent Search
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Analysis
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Smart Insights
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Predictions
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              ML Models
            </TabsTrigger>
          </TabsList>

          {/* Intelligent Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                    <Search className="h-5 w-5" />
                  </div>
                  Intelligent Margin Search
                </CardTitle>
                <CardDescription>
                  Search quotes, customers, vendors, or ask questions in natural language. AI will find relevant patterns and insights.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enhanced Search Input */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search quotes, ask 'Which customers have declining margins?' or 'Show me high-risk vendors'..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleIntelligentSearch(searchQuery)}
                    className="pl-12 pr-32 py-4 text-lg bg-white/90 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleIntelligentSearch(searchQuery)}
                      disabled={loading || !searchQuery.trim()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      {loading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Brain className="h-4 w-4" />
                      )}
                      AI Search
                    </Button>
                  </div>
                </div>

                {/* Quick Search Suggestions */}
                <div className="flex flex-wrap gap-2">
                  {[
                    "Show me quotes with margins below 15%",
                    "Which customers have improving margins?",
                    "Find vendors with pricing anomalies",
                    "Orders needing approval this week",
                    "Seasonal margin patterns"
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery(suggestion)
                        handleIntelligentSearch(suggestion)
                      }}
                      className="text-xs bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-purple-50"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>

                {/* Search Results */}
                <AnimatePresence>
                  {searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      <h3 className="text-lg font-semibold text-gray-900">
                        Search Results ({searchResults.length})
                      </h3>
                      
                      <div className="grid gap-4">
                        {searchResults.map((result) => (
                          <SearchResultCard
                            key={result.entity_id}
                            result={result}
                            onAnalyze={handleQuoteAnalysis}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            {predictions && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Prediction Summary */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="h-5 w-5 text-blue-600" />
                      Margin Prediction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-3">
                      <div className="text-3xl font-bold text-blue-600">
                        {predictions.predicted_margin_pct.toFixed(1)}%
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Badge variant="outline" className="bg-white/70">
                          {MarginAnalysisService.formatConfidence(predictions.confidence_score)} confidence
                        </Badge>
                      </div>
                      <Progress 
                        value={predictions.confidence_score * 100} 
                        className="h-3"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Factors */}
                <Card className="bg-gradient-to-br from-red-50 to-orange-100 border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Risk Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {predictions.risk_factors.slice(0, 3).map((risk, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className={cn(
                            "p-1 rounded-full",
                            risk.impact === 'high' ? 'bg-red-500' :
                            risk.impact === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                          )}>
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{risk.factor}</p>
                            <p className="text-xs text-gray-600 truncate">{risk.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Recommendations */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Lightbulb className="h-5 w-5 text-green-600" />
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {predictions.optimization_suggestions.slice(0, 3).map((suggestion, idx) => (
                        <div key={idx} className="p-3 bg-white/70 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-xs">
                              {suggestion.type}
                            </Badge>
                            <span className="text-sm font-medium text-green-600">
                              +{suggestion.potential_impact.toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{suggestion.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Detailed Analysis */}
            {predictions && (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Optimization Suggestions */}
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Rocket className="h-5 w-5 text-purple-600" />
                      Optimization Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {predictions.optimization_suggestions.map((suggestion, idx) => (
                        <OptimizationCard key={idx} suggestion={suggestion} />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Competitive Intelligence */}
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      Competitive Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {predictions.competitive_insights.map((insight, idx) => (
                        <CompetitiveInsightCard key={idx} insight={insight} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Smart Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            {insights && <SmartInsightsSection insights={insights} />}
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-6">
            {analytics && <PredictiveAnalyticsSection analytics={analytics} />}
          </TabsContent>

          {/* ML Models Tab */}
          <TabsContent value="models" className="space-y-6">
            <MLModelsSection models={mlModels} />
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Assistant Modal */}
      <AIAssistantModal 
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        onQuoteAnalysis={handleQuoteAnalysis}
      />

      {/* Processing Overlay */}
      {aiProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 shadow-2xl max-w-md mx-4">
            <div className="text-center space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full inline-block">
                <Brain className="h-8 w-8 text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                AI Analysis in Progress
              </h3>
              <p className="text-gray-600">
                Our AI models are analyzing margin patterns, risk factors, and optimization opportunities...
              </p>
              <div className="space-y-2">
                <Progress value={75} className="h-2" />
                <p className="text-sm text-gray-500">Processing with 4 ML models</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Supporting Components
function SearchResultCard({ result, onAnalyze }: { 
  result: SmartSearchResult
  onAnalyze: (id: string) => void 
}) {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                {result.type}
              </Badge>
              <span className="text-sm text-gray-600">
                Relevance: {(result.relevance_score * 100).toFixed(0)}%
              </span>
            </div>
            
            <h4 className="font-semibold text-gray-900">{result.title}</h4>
            <p className="text-sm text-gray-600">{result.description}</p>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span>{result.margin_data.current_margin.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span>Avg: {result.margin_data.historical_avg.toFixed(1)}%</span>
              </div>
              <Badge variant={
                result.margin_data.trend === 'up' ? 'default' :
                result.margin_data.trend === 'down' ? 'destructive' : 'secondary'
              } className="text-xs">
                {result.margin_data.trend === 'up' ? '↗' : 
                 result.margin_data.trend === 'down' ? '↘' : '→'} 
                {result.margin_data.trend}
              </Badge>
            </div>
            
            {result.ai_insights.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-3 mt-3">
                <p className="text-sm text-blue-800 font-medium mb-1">AI Insights:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  {result.ai_insights.slice(0, 2).map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Lightbulb className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2 ml-4">
            <Button
              size="sm"
              onClick={() => onAnalyze(result.entity_id)}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Analyze
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function OptimizationCard({ suggestion }: { suggestion: OptimizationSuggestion }) {
  return (
    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-white">
            {suggestion.type}
          </Badge>
          <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
            {suggestion.effort_level} effort
          </Badge>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-green-600">
            +{suggestion.potential_impact.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600">
            {MarginAnalysisService.formatConfidence(suggestion.confidence)} confidence
          </div>
        </div>
      </div>
      
      <p className="text-sm text-gray-700 mb-3">{suggestion.recommendation}</p>
      
      <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
        <div>
          <span className="font-medium">ROI:</span> {suggestion.expected_roi.toFixed(1)}x
        </div>
        <div>
          <span className="font-medium">Success Rate:</span> {suggestion.supporting_data.success_rate.toFixed(0)}%
        </div>
      </div>
    </div>
  )
}

function CompetitiveInsightCard({ insight }: { insight: CompetitiveInsight }) {
  return (
    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <div className="flex items-start justify-between mb-3">
        <Badge variant="outline" className="text-xs bg-white">
          {insight.insight_type.replace('_', ' ')}
        </Badge>
        <div className="text-right">
          <div className="text-lg font-bold text-blue-600">
            {insight.competitive_score}/10
          </div>
          <div className="text-xs text-gray-600">
            competitive score
          </div>
        </div>
      </div>
      
      <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
      
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center p-2 bg-white/50 rounded">
          <div className="font-medium">{insight.market_data.industry_avg_margin.toFixed(1)}%</div>
          <div className="text-gray-600">Industry Avg</div>
        </div>
        <div className="text-center p-2 bg-white/50 rounded">
          <Badge variant={
            insight.market_data.our_position === 'above' ? 'default' :
            insight.market_data.our_position === 'below' ? 'destructive' : 'secondary'
          } className="text-xs">
            {insight.market_data.our_position}
          </Badge>
        </div>
        <div className="text-center p-2 bg-white/50 rounded">
          <div className="font-medium">
            {insight.market_data.trend_direction === 'improving' ? '↗' :
             insight.market_data.trend_direction === 'declining' ? '↘' : '→'}
          </div>
          <div className="text-gray-600">{insight.market_data.trend_direction}</div>
        </div>
      </div>
    </div>
  )
}

function SmartInsightsSection({ insights }: { insights: AIInsightsEngine }) {
  return (
    <div className="space-y-6">
      {/* Margin Optimization */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Margin Optimization Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {insights.margin_optimization.immediate_opportunities.map((opportunity, idx) => (
              <div key={idx} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{opportunity.type.replace('_', ' ')}</h4>
                    <p className="text-sm text-gray-600">{opportunity.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      +{opportunity.potential_impact.toFixed(1)}%
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {opportunity.effort_required} effort
                    </Badge>
                  </div>
                </div>
                <Progress value={opportunity.success_probability * 100} className="h-2 mb-2" />
                <div className="text-xs text-gray-600">
                  Success probability: {(opportunity.success_probability * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Intelligence */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Customer Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.customer_intelligence.high_value_opportunities.slice(0, 3).map((opportunity, idx) => (
                <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{opportunity.customer_name}</h5>
                    <Badge variant="outline">{opportunity.opportunity_type}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{opportunity.approach_strategy}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span>Potential: {MarginAnalysisService.formatCurrency(opportunity.potential_value)}</span>
                    <span>Success: {(opportunity.success_probability * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              Vendor Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.vendor_intelligence.performance_rankings.slice(0, 3).map((vendor, idx) => (
                <div key={idx} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{vendor.vendor_name}</h5>
                    <div className="text-right">
                      <div className="text-sm font-bold text-purple-600">
                        {vendor.overall_score}/100
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {vendor.strategic_importance}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-medium">{vendor.margin_contribution.toFixed(1)}%</div>
                      <div className="text-gray-600">Margin</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{vendor.reliability_score}/10</div>
                      <div className="text-gray-600">Reliability</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">
                        {vendor.trend === 'improving' ? '↗' :
                         vendor.trend === 'declining' ? '↘' : '→'}
                      </div>
                      <div className="text-gray-600">{vendor.trend}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PredictiveAnalyticsSection({ analytics }: { analytics: AdvancedAnalytics }) {
  return (
    <div className="space-y-6">
      {/* Forecasts */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-blue-600" />
            Margin Forecasts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {analytics.predictive_analytics.margin_forecasts.map((forecast, idx) => (
              <div key={idx} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {forecast.entity_type} - {forecast.forecast_period}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Confidence: {forecast.confidence_interval.lower.toFixed(1)}% - {forecast.confidence_interval.upper.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {forecast.predicted_margin.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  <strong>Key Drivers:</strong> {forecast.key_drivers.slice(0, 3).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Anomalies */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Detected Anomalies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {analytics.anomaly_detection.margin_anomalies.map((anomaly, idx) => (
              <div key={idx} className={cn(
                "p-4 rounded-lg border",
                anomaly.severity === 'critical' ? 'bg-red-50 border-red-200' :
                anomaly.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                anomaly.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                'bg-gray-50 border-gray-200'
              )}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{anomaly.type.replace('_', ' ')}</h4>
                    <p className="text-sm text-gray-600">{anomaly.description}</p>
                  </div>
                  <Badge variant={
                    anomaly.severity === 'critical' ? 'destructive' :
                    anomaly.severity === 'high' ? 'destructive' :
                    anomaly.severity === 'medium' ? 'secondary' : 'outline'
                  }>
                    {anomaly.severity}
                  </Badge>
                </div>
                <div className="text-xs text-gray-600">
                  <div className="mb-1">
                    <strong>Deviation:</strong> {anomaly.deviation_pct.toFixed(1)}% from expected
                  </div>
                  <div>
                    <strong>Detected:</strong> {new Date(anomaly.detected_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MLModelsSection({ models }: { models: MLMarginModel[] }) {
  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-purple-600" />
            Machine Learning Models
          </CardTitle>
          <CardDescription>
            Active AI models powering intelligent margin analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {models.map((model) => (
              <div key={model.id} className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{model.name}</h4>
                    <p className="text-sm text-gray-600">{model.type.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      model.status === 'active' ? 'default' :
                      model.status === 'training' ? 'secondary' : 'outline'
                    }>
                      {model.status}
                    </Badge>
                    <div className="text-sm text-gray-600 mt-1">
                      {(model.accuracy * 100).toFixed(1)}% accuracy
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <Progress value={model.accuracy * 100} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>
                    <strong>Features:</strong> {model.features.length}
                  </div>
                  <div>
                    <strong>Last Trained:</strong> {new Date(model.last_trained).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AIAssistantModal({ isOpen, onClose, onQuoteAnalysis }: {
  isOpen: boolean
  onClose: () => void
  onQuoteAnalysis: (quoteId: string) => void
}) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI Margin Intelligence assistant. I can help you analyze quotes, identify opportunities, and provide insights. What would you like to explore?'
    }
  ])

  const handleSend = () => {
    if (!input.trim()) return
    
    setMessages(prev => [...prev, 
      { role: 'user', content: input },
      { 
        role: 'assistant', 
        content: 'I\'m analyzing your request with our latest AI models. Based on your query, I\'d recommend looking at quotes with declining margins and checking vendor performance patterns. Would you like me to run a specific analysis?'
      }
    ])
    setInput('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            AI Margin Assistant
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {messages.map((message, idx) => (
            <div key={idx} className={cn(
              "flex gap-3",
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}>
              <div className={cn(
                "max-w-[80%] rounded-lg p-3",
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              )}>
                {message.content}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2 pt-4 border-t">
          <Input
            placeholder="Ask about margins, quotes, or request analysis..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!input.trim()}>
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AIMarginAnalysisDashboard 