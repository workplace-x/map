import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  Brain, 
  Star, 
  Activity,
  BarChart3,
  Globe,
  Users,
  Zap,
  Shield,
  TrendingDown,
  CheckCircle,
  Clock,
  DollarSign,
  Crown
} from 'lucide-react';

interface IntelligentForecastDashboardProps {
  teamId: string;
  year: number;
}

interface EnhancedForecastData {
  success: boolean;
  teamId: string;
  year: number;
  forecast: {
    totalForecast: number;
    confidenceLevel: number;
    improvementVsBaseline: number;
    marketConditionsImpact: number;
    topRecommendation: string;
    keyInsights: string[];
  };
  actionableInsights: {
    highPriorityActions: Array<{
      id: string;
      name: string;
      amount: number;
      probability: number;
      confidence: number;
      explanation?: any;
      marketImpact?: number;
      accountHealth?: string;
      riskFactors?: string[];
      positiveFactors?: string[];
    }>;
    riskMitigationActions: Array<{
      id: string;
      name: string;
      amount: number;
      riskFactors: string[];
      mitigationActions: string[];
      accountRisk?: number;
      marketRisk?: number;
      riskNarrative?: string;
    }>;
    marketIntelligenceInsights?: {
      overallMarketScore: number;
      economicConditions: {
        score: number;
        outlook: string;
        trend: string;
      };
      competitiveEnvironment: {
        intensity: number;
        pressure: string;
        advantages: string[];
      };
      seasonalFactors: {
        quarter: number;
        quarterMultiplier: number;
        monthMultiplier: number;
        trend: string;
      };
    };
    confidenceDistribution: {
      high: number;
      medium: number;
      low: number;
    };
    accountHealthBreakdown: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
      unknown: number;
    };
    topRiskFactors: Array<{
      risk: string;
      count: number;
      mitigation: string;
    }>;
    marketImpactFactors: {
      economicImpact: number;
      competitiveImpact: number;
      seasonalImpact: number;
      territoryImpact: number;
    };
    performanceMetrics: {
      totalOpportunities: number;
      highConfidencePredictions: number;
      averageConfidence: number;
      totalPipelineValue: number;
      intelligentPrediction: number;
      improvementVsOriginal: number;
      newOpportunityPrediction: {
        predictedNewOpportunities: number;
        predictedNewOpportunityValue: number;
        confidence: number;
      };
    };
  };
  metadata: {
    generatedAt: string;
    predictionEngine: string;
    enhancementLevel: string;
  };
}

export default function IntelligentForecastDashboard({ teamId, year }: IntelligentForecastDashboardProps) {
  const [forecastData, setForecastData] = useState<EnhancedForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchForecastData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/predictive-forecasts/intelligent/${teamId}/${year}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setForecastData(data);
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to load forecast data');
      }
    } catch (err: any) {
      console.error('Error fetching enhanced forecast data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecastData();
  }, [teamId, year]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-6 w-6 animate-pulse text-purple-600" />
            <span className="text-lg font-medium">Generating Enhanced AI Forecast...</span>
          </div>
          <Progress value={65} className="w-64 mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">
            Analyzing with ML Ensemble, Market & Account Intelligence
          </p>
        </div>
      </div>
    );
  }

  if (error || !forecastData) {
    return (
      <Alert className="bg-red-50 border-red-200">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Error loading enhanced forecast:</strong> {error || 'Unknown error'}
          <button 
            onClick={fetchForecastData}
            className="ml-2 text-red-600 underline hover:no-underline"
          >
            Retry
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getHealthColor = (category: string) => {
    switch (category) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (level: number) => {
    if (level > 0.7) return 'text-red-600';
    if (level > 0.5) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* AI Methodology Explanation */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-purple-600" />
            Enhanced AI Methodology & Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-700">🧠 ML Ensemble Engine:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong>5 ML Models:</strong> Random Forest, XGBoost, Neural Network, LSTM, Bayesian</li>
                <li>• <strong>Dynamic Weighting:</strong> Models adjust based on confidence levels</li>
                <li>• <strong>25+ Features:</strong> Relationship depth, buyer behavior, deal momentum</li>
                <li>• <strong>Ensemble Confidence:</strong> Smart agreement-based scoring</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-700">🌍 Market & Account Intelligence:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong>Market Conditions:</strong> Economic indicators, industry trends</li>
                <li>• <strong>Account Health:</strong> Loyalty scoring, engagement tracking</li>
                <li>• <strong>Risk Assessment:</strong> 7 risk factors with mitigation strategies</li>
                <li>• <strong>Competitive Intel:</strong> Territory analysis, market positioning</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Engine Status:</span>
              <Badge variant={forecastData.metadata.enhancementLevel === 'full' ? 'default' : 'secondary'}>
                {forecastData.metadata.enhancementLevel === 'full' ? '🚀 Full Enhancement' : '⚠️ Basic Mode'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">AI Forecast</p>
                <p className="text-2xl font-bold">{formatCurrency(forecastData.forecast.totalForecast)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">AI Confidence</p>
                <p className="text-2xl font-bold">{forecastData.forecast.confidenceLevel}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <div className="flex items-center gap-1">
                <p className="text-sm text-muted-foreground">vs Baseline</p>
                  <div className="group relative">
                    <span className="text-xs text-blue-500 cursor-help">ⓘ</span>
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded p-2 whitespace-nowrap z-10">
                      AI-enhanced vs original Salesforce probability-based forecast
                    </div>
                  </div>
                </div>
                <p className="text-2xl font-bold">{forecastData.forecast.improvementVsBaseline > 0 ? '+' : ''}{forecastData.forecast.improvementVsBaseline}%</p>
                <p className="text-xs text-muted-foreground">
                  {forecastData.forecast.improvementVsBaseline > 0 ? 'Higher than' : 'Lower than'} standard forecast
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Market Impact</p>
                <p className="text-2xl font-bold">{forecastData.forecast.marketConditionsImpact > 0 ? '+' : ''}{forecastData.forecast.marketConditionsImpact}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Insights Tabs */}
      <Tabs defaultValue="priority" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="priority">High Priority</TabsTrigger>
          <TabsTrigger value="risks">Risk Mitigation</TabsTrigger>
          <TabsTrigger value="market">Market Intel</TabsTrigger>
          <TabsTrigger value="analytics">ML Analytics</TabsTrigger>
          <TabsTrigger value="insights">Key Insights</TabsTrigger>
        </TabsList>

        {/* High Priority Actions */}
        <TabsContent value="priority" className="space-y-4">
          <Alert className="bg-green-50 border-green-200">
            <Target className="h-4 w-4" />
            <AlertDescription>
              <strong>High Priority Opportunities (80%+ AI confidence)</strong> - These deals have optimal conditions across ML models, market factors, and account intelligence.
            </AlertDescription>
          </Alert>
          <div className="space-y-3">
            {forecastData.actionableInsights.highPriorityActions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No high-priority opportunities identified</p>
            ) : (
              forecastData.actionableInsights.highPriorityActions.slice(0, 10).map((action, index) => (
                <Card key={action.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-lg">{action.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            Priority #{index + 1}
                          </Badge>
                          <Badge className={getHealthColor(action.accountHealth || 'unknown')}>
                            {(action.accountHealth || 'Unknown').charAt(0).toUpperCase() + (action.accountHealth || 'unknown').slice(1)} Health
                          </Badge>
                        </div>
                        </div>

                      {/* Key Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm text-blue-600 font-medium">Deal Value</p>
                          <p className="text-xl font-bold text-blue-800">{formatCurrency(action.amount)}</p>
                          <p className="text-xs text-blue-600">Expected Close</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-sm text-green-600 font-medium">AI Probability</p>
                          <p className="text-xl font-bold text-green-800">{(action.probability * 100).toFixed(1)}%</p>
                          <p className="text-xs text-green-600">ML Ensemble</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-sm text-purple-600 font-medium">Confidence</p>
                          <p className="text-xl font-bold text-purple-800">{(action.confidence * 100).toFixed(1)}%</p>
                          <p className="text-xs text-purple-600">Data Quality</p>
                      </div>
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <p className="text-sm text-orange-600 font-medium">Expected Value</p>
                          <p className="text-xl font-bold text-orange-800">{formatCurrency(action.amount * action.probability)}</p>
                          <p className="text-xs text-orange-600">Risk-Adjusted</p>
                        </div>
                      </div>

                      {/* AI Reasoning Section */}
                      {action.explanation && (
                        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                          <div className="flex items-start gap-3">
                            <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-blue-800 mb-2">🤖 AI Analysis & Reasoning:</p>
                              <p className="text-sm text-blue-700 mb-3">{action.explanation.summary}</p>
                              
                              {/* AI Narrative Section */}
                              {action.explanation.aiNarrative && (
                                <div className="mb-3 p-3 bg-white/80 rounded border border-blue-300">
                                  <p className="text-xs font-medium text-purple-700 mb-1">🎯 Strategic AI Insights:</p>
                                  <p className="text-xs text-gray-800 leading-relaxed">{action.explanation.aiNarrative}</p>
                        </div>
                              )}
                              
                              {action.explanation.keyFactors && action.explanation.keyFactors.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-purple-700">Key Contributing Factors:</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {action.explanation.keyFactors.slice(0, 4).map((factor: any, i: number) => (
                                      <div key={i} className="bg-white/60 p-2 rounded text-xs">
                                        <span className="font-medium text-purple-600">{factor.category}:</span>
                                        <span className="text-gray-700 ml-1">{factor.factor}</span>
                                        {factor.impact && (
                                          <span className="text-green-600 ml-1">
                                            ({(factor.impact * 100).toFixed(0)}% impact)
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Market Intelligence Insights */}
                      {action.marketImpact && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-800">Market Intelligence Impact</span>
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              {action.marketImpact > 0 ? '+' : ''}{(action.marketImpact * 100).toFixed(1)}%
                            </Badge>
                          </div>
                          <p className="text-xs text-green-700">
                            Current market conditions are {action.marketImpact > 0 ? 'favorable' : 'challenging'} for this deal type and territory.
                          </p>
                        </div>
                      )}

                      {/* Timeline and Risk Analysis */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {/* Risk Factors */}
                        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                          <h5 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            Risk Factors
                          </h5>
                          {action.riskFactors && action.riskFactors.length > 0 ? (
                            <div className="space-y-1">
                              {action.riskFactors.slice(0, 3).map((risk, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                  <span className="text-xs text-red-700 capitalize">
                                    {risk.replace(/_/g, ' ')}
                                  </span>
                                </div>
                              ))}
                              {action.riskFactors.length > 3 && (
                                <div className="text-xs text-red-600 font-medium">
                                  +{action.riskFactors.length - 3} more risks identified
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-red-600">No significant risks identified</p>
                          )}
                        </div>

                        {/* Positive Factors */}
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <h5 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Success Factors
                          </h5>
                          {action.positiveFactors && action.positiveFactors.length > 0 ? (
                            <div className="space-y-1">
                              {action.positiveFactors.slice(0, 3).map((factor, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                  <span className="text-xs text-green-700 capitalize">
                                    {factor.replace(/_/g, ' ')}
                                  </span>
                                </div>
                              ))}
                              {action.positiveFactors.length > 3 && (
                                <div className="text-xs text-green-600 font-medium">
                                  +{action.positiveFactors.length - 3} more advantages
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-green-600">Standard success indicators</p>
                          )}
                        </div>
                      </div>

                      {/* Action Recommendations */}
                      {action.explanation?.recommendations && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <h5 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            Recommended Actions
                          </h5>
                          <div className="space-y-1">
                            {action.explanation.recommendations.slice(0, 3).map((rec: any, i: number) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="text-blue-600 font-bold text-xs mt-0.5">{i + 1}.</span>
                                <span className="text-xs text-blue-700">{rec}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Risk Mitigation */}
        <TabsContent value="risks" className="space-y-4">
          <Alert className="bg-red-50 border-red-200">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Risk Mitigation Actions</strong> - Opportunities with identified risk factors requiring immediate attention to prevent revenue loss.
            </AlertDescription>
          </Alert>
          <div className="space-y-3">
            {forecastData.actionableInsights.riskMitigationActions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No immediate risk mitigation required</p>
            ) : (
              forecastData.actionableInsights.riskMitigationActions.slice(0, 10).map((risk, index) => (
                <Card key={risk.id} className="p-4 border-l-4 border-red-400">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-lg">{risk.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-red-600 border-red-300">
                          Risk Alert #{index + 1}
                        </Badge>
                        <Badge variant="destructive" className="font-bold">
                          {formatCurrency(risk.amount)} at Risk
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Risk Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <p className="text-sm text-red-600 font-medium">Deal Value</p>
                        <p className="text-xl font-bold text-red-800">{formatCurrency(risk.amount)}</p>
                        <p className="text-xs text-red-600">Revenue at Risk</p>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                        <p className="text-sm text-orange-600 font-medium">Account Risk</p>
                        <p className="text-xl font-bold text-orange-800">
                          {risk.accountRisk ? `${(risk.accountRisk * 100).toFixed(0)}%` : 'N/A'}
                        </p>
                        <p className="text-xs text-orange-600">Account Health</p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-600 font-medium">Market Risk</p>
                        <p className="text-xl font-bold text-yellow-800">
                          {risk.marketRisk ? `${(risk.marketRisk * 100).toFixed(0)}%` : 'N/A'}
                        </p>
                        <p className="text-xs text-yellow-600">Market Conditions</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <p className="text-sm text-purple-600 font-medium">Urgency Level</p>
                        <p className="text-xl font-bold text-purple-800">
                          {risk.riskFactors.length > 3 ? 'Critical' : risk.riskFactors.length > 1 ? 'High' : 'Medium'}
                        </p>
                        <p className="text-xs text-purple-600">Action Required</p>
                      </div>
                    </div>

                    {/* AI Risk Analysis Section */}
                    <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-800 mb-2">🚨 AI Risk Assessment:</p>
                          <p className="text-sm text-red-700 mb-3">
                            This opportunity shows {risk.riskFactors.length} critical risk factor{risk.riskFactors.length !== 1 ? 's' : ''} 
                            that could significantly impact deal closure. Immediate intervention recommended to mitigate revenue loss.
                          </p>
                          
                          {/* AI Risk Narrative Section */}
                          {risk.riskNarrative && (
                            <div className="mb-3 p-3 bg-white/80 rounded border border-red-300">
                              <p className="text-xs font-medium text-red-700 mb-1">🎯 Strategic Risk Analysis:</p>
                              <p className="text-xs text-gray-800 leading-relaxed">{risk.riskNarrative}</p>
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-orange-700">Risk Factor Analysis:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {risk.riskFactors.slice(0, 4).map((factor: any, i: number) => (
                                <div key={i} className="bg-white/60 p-2 rounded text-xs border border-red-200">
                                  <span className="font-medium text-red-600">Risk:</span>
                                  <span className="text-gray-700 ml-1 capitalize">{factor.replace(/_/g, ' ')}</span>
                                  <span className="text-red-600 ml-1">(Critical)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Risk Timeline and Urgency */}
                    <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-semibold text-orange-800">Urgency Assessment</span>
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          {risk.riskFactors.includes('churn_risk') ? 'Immediate Action' : 
                           risk.riskFactors.includes('competitive_pressure') ? 'This Week' : 
                           'Next 30 Days'}
                        </Badge>
                      </div>
                      <p className="text-xs text-orange-700">
                        Based on risk factors identified, this deal requires attention within the specified timeframe to prevent loss.
                      </p>
                    </div>

                    {/* Detailed Risk and Mitigation Analysis */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Risk Factors Detail */}
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h5 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          Identified Risk Factors
                        </h5>
                        <div className="space-y-2">
                          {risk.riskFactors.map((factor: any, i: number) => (
                            <div key={i} className="bg-white p-2 rounded border border-red-200">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-red-700 capitalize">
                              {factor.replace(/_/g, ' ')}
                                </span>
                                <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">
                                  {risk.riskFactors.indexOf(factor) === 0 ? 'Primary' : 'Secondary'}
                                </span>
                              </div>
                              <p className="text-xs text-red-600">
                                {factor === 'churn_risk' ? 'Account showing signs of disengagement' :
                                 factor === 'competitive_pressure' ? 'Strong competitive threat detected' :
                                 factor === 'budget_risk' ? 'Budget constraints or approval issues' :
                                 factor === 'timeline_risk' ? 'Deal timeline compressed or extended' :
                                 'Risk factor requires immediate attention'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Mitigation Actions Detail */}
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h5 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          Recommended Mitigation Actions
                        </h5>
                        <div className="space-y-2">
                          {risk.mitigationActions.map((action: any, i: number) => (
                            <div key={i} className="bg-white p-2 rounded border border-green-200">
                              <div className="flex items-start gap-2">
                                <span className="text-green-600 font-bold text-xs mt-0.5 bg-green-200 rounded-full w-4 h-4 flex items-center justify-center">
                                  {i + 1}
                                </span>
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-green-700">{action}</p>
                                  <p className="text-xs text-green-600 mt-1">
                                    {i === 0 ? 'Priority action - start immediately' :
                                     i === 1 ? 'Secondary action - implement within 48 hours' :
                                     'Follow-up action - complete within week'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Success Probability and Recovery Plan */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h5 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        Recovery Probability & Action Plan
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-xs text-blue-600">Recovery Probability</p>
                          <p className="text-lg font-bold text-blue-800">
                            {risk.riskFactors.length <= 1 ? '80%' : 
                             risk.riskFactors.length <= 2 ? '65%' : 
                             risk.riskFactors.length <= 3 ? '45%' : '25%'}
                          </p>
                          </div>
                        <div className="text-center">
                          <p className="text-xs text-blue-600">Estimated Timeline</p>
                          <p className="text-lg font-bold text-blue-800">
                            {risk.riskFactors.includes('churn_risk') ? '1-2 weeks' : '2-4 weeks'}
                          </p>
                          </div>
                        <div className="text-center">
                          <p className="text-xs text-blue-600">Resource Priority</p>
                          <p className="text-lg font-bold text-blue-800">
                            {risk.amount > 500000 ? 'Executive' : risk.amount > 100000 ? 'Manager' : 'Standard'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Executive Summary for High-Value Deals */}
                    {risk.amount > 250000 && (
                      <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <h5 className="text-sm font-semibold text-purple-800 mb-2 flex items-center gap-1">
                          <Crown className="h-4 w-4" />
                          Executive Alert - High-Value Deal at Risk
                        </h5>
                        <p className="text-xs text-purple-700">
                          This {formatCurrency(risk.amount)} opportunity requires executive attention due to significant revenue impact. 
                          Recommend immediate escalation to senior leadership and deployment of specialized resources.
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Market Intelligence */}
        <TabsContent value="market" className="space-y-4">
          {forecastData.actionableInsights.marketIntelligenceInsights ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Economic Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Overall Score</span>
                    <Badge className={
                      forecastData.actionableInsights.marketIntelligenceInsights.economicConditions.score > 0.7 
                        ? 'bg-green-100 text-green-800' 
                        : forecastData.actionableInsights.marketIntelligenceInsights.economicConditions.score > 0.5
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }>
                      {(forecastData.actionableInsights.marketIntelligenceInsights.economicConditions.score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Outlook</span>
                    <span className="capitalize font-medium">
                      {forecastData.actionableInsights.marketIntelligenceInsights.economicConditions.outlook}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Trend</span>
                    <span className="capitalize">
                      {forecastData.actionableInsights.marketIntelligenceInsights.economicConditions.trend}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-orange-600" />
                    Competitive Environment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Intensity</span>
                    <span className={`font-semibold ${getRiskColor(1 - forecastData.actionableInsights.marketIntelligenceInsights.competitiveEnvironment.intensity)}`}>
                      {(forecastData.actionableInsights.marketIntelligenceInsights.competitiveEnvironment.intensity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pressure</span>
                    <Badge variant="outline" className="capitalize">
                      {forecastData.actionableInsights.marketIntelligenceInsights.competitiveEnvironment.pressure}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Key Advantages:</p>
                    <div className="space-y-1">
                      {forecastData.actionableInsights.marketIntelligenceInsights.competitiveEnvironment.advantages.map((advantage, i) => (
                        <p key={i} className="text-sm text-green-600">• {advantage}</p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    Seasonal Factors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Current Quarter</span>
                    <Badge>Q{forecastData.actionableInsights.marketIntelligenceInsights.seasonalFactors.quarter}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Quarter Multiplier</span>
                    <span className="font-semibold">
                      {(forecastData.actionableInsights.marketIntelligenceInsights.seasonalFactors.quarterMultiplier * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Month Multiplier</span>
                    <span className="font-semibold">
                      {(forecastData.actionableInsights.marketIntelligenceInsights.seasonalFactors.monthMultiplier * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Trend</span>
                    <span className="capitalize">
                      {forecastData.actionableInsights.marketIntelligenceInsights.seasonalFactors.trend.replace(/_/g, ' ')}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-green-600" />
                    Market Impact Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Economic Impact</span>
                      <span className="font-semibold">{(forecastData.actionableInsights.marketImpactFactors.economicImpact * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={forecastData.actionableInsights.marketImpactFactors.economicImpact * 100} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Competitive Advantage</span>
                      <span className="font-semibold">{(forecastData.actionableInsights.marketImpactFactors.competitiveImpact * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={forecastData.actionableInsights.marketImpactFactors.competitiveImpact * 100} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Seasonal Advantage</span>
                      <span className="font-semibold">{(forecastData.actionableInsights.marketImpactFactors.seasonalImpact * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={forecastData.actionableInsights.marketImpactFactors.seasonalImpact * 100} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Territory Health</span>
                      <span className="font-semibold">{(forecastData.actionableInsights.marketImpactFactors.territoryImpact * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={forecastData.actionableInsights.marketImpactFactors.territoryImpact * 100} />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Market intelligence data not available. System is running in basic prediction mode.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* ML Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  ML Confidence Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      High Confidence (80%+)
                    </span>
                    <Badge className="bg-green-100 text-green-800">
                      {forecastData.actionableInsights.confidenceDistribution.high}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-yellow-600" />
                      Medium Confidence (60-80%)
                    </span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {forecastData.actionableInsights.confidenceDistribution.medium}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      Low Confidence (&lt;60%)
                    </span>
                    <Badge className="bg-red-100 text-red-800">
                      {forecastData.actionableInsights.confidenceDistribution.low}
                    </Badge>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Average Confidence</span>
                    <span className="text-lg font-bold text-purple-600">
                      {(forecastData.actionableInsights.performanceMetrics.averageConfidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Account Health Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(forecastData.actionableInsights.accountHealthBreakdown).map(([category, count]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="capitalize flex items-center gap-2">
                      {category === 'excellent' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {category === 'good' && <TrendingUp className="h-4 w-4 text-blue-600" />}
                      {category === 'fair' && <Activity className="h-4 w-4 text-yellow-600" />}
                      {category === 'poor' && <TrendingDown className="h-4 w-4 text-red-600" />}
                      {category === 'unknown' && <AlertTriangle className="h-4 w-4 text-gray-600" />}
                      {category}
                    </span>
                    <Badge className={getHealthColor(category)}>
                      {count}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  Top Risk Factors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {forecastData.actionableInsights.topRiskFactors.slice(0, 5).map((risk, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium capitalize">
                        {risk.risk.replace(/_/g, ' ')}
                      </span>
                      <Badge variant="outline" className="text-red-600 border-red-300">
                        {risk.count} occurrences
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{risk.mitigation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Opportunities</p>
                    <p className="text-xl font-bold">{forecastData.actionableInsights.performanceMetrics.totalOpportunities}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">High Confidence</p>
                    <p className="text-xl font-bold text-green-600">
                      {forecastData.actionableInsights.performanceMetrics.highConfidencePredictions}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pipeline Value</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(forecastData.actionableInsights.performanceMetrics.totalPipelineValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">AI Improvement</p>
                    <p className="text-lg font-bold text-blue-600">
                      {forecastData.actionableInsights.performanceMetrics.improvementVsOriginal > 0 ? '+' : ''}
                      {(forecastData.actionableInsights.performanceMetrics.improvementVsOriginal * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Key Insights */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {forecastData.forecast.keyInsights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Top Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-4">
                  <Badge className="text-lg px-4 py-2 mb-4" variant="outline">
                    {forecastData.forecast.topRecommendation.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Based on comprehensive ML analysis, market conditions, and account intelligence
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  New Opportunity Prediction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Predicted New Opportunities</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {forecastData.actionableInsights.performanceMetrics.newOpportunityPrediction.predictedNewOpportunities}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Predicted Value</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(forecastData.actionableInsights.performanceMetrics.newOpportunityPrediction.predictedNewOpportunityValue)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Prediction Confidence</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(forecastData.actionableInsights.performanceMetrics.newOpportunityPrediction.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Methodology:</strong> Uses historical half-yearly churn analysis to predict opportunities 
                    that will be both created and closed within {year}, based on 3+ years of historical patterns.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Metadata Footer */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Generated: {new Date(forecastData.metadata.generatedAt).toLocaleString()}</span>
            <span>Engine: {forecastData.metadata.predictionEngine}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 