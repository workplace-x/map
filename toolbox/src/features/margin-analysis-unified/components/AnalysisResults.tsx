import React, { useState } from 'react'
import { ArrowLeft, AlertTriangle, TrendingUp, TrendingDown, CheckCircle, XCircle, Brain, Target, History, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AnalysisResultsProps {
  data: any // Using any to handle the unified structure flexibly
  onBackToSearch: () => void
}

export function AnalysisResults({ data, onBackToSearch }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState('overall')
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null)

  // Handle undefined/null data gracefully
  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBackToSearch}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analysis Data Not Available</h3>
          <p className="text-muted-foreground">The analysis data is missing or incomplete.</p>
        </div>
      </div>
    )
  }

  // The data IS the analysis object directly
  const analysis = data
  const orderInfo = analysis.order_info || {}
  const customerInfo = analysis.customer_info || {}
  const financialInfo = analysis.financial_analysis || {}
  const vendorAnalysis = analysis.vendor_analysis || []
  const aiInsights = analysis.ai_insights || {}
  const approvalInfo = analysis.approval_info || {}
  const salespersonInfo = analysis.salesperson_info || {}

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getMarginColor = (margin: number, target: number = 15) => {
    if (margin >= target) return 'text-green-600'
    if (margin >= target * 0.9) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  const orderType = orderInfo.order_type === 'O' ? 'Order' : 'Quote'
  const marginPct = financialInfo.margin_pct || 0
  const targetMargin = 15 // Default target margin
  const customerAvgMargin = customerInfo.historical_metrics?.avg_margin_pct || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBackToSearch}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
          <div>
            <h2 className="text-2xl font-bold">
              {orderType} {orderInfo.order_no}
            </h2>
            <p className="text-muted-foreground">
              {customerInfo.customer_name || 'Unknown Customer'} • {salespersonInfo.name || 'Unknown Salesperson'}
            </p>
          </div>
        </div>
        
        {approvalInfo.required && (
          <Badge variant="destructive" className="px-3 py-1">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Approval Required ({approvalInfo.level})
          </Badge>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{orderType} Value</p>
                <p className="text-2xl font-bold">{formatCurrency(financialInfo.total_sell)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Margin</p>
                <p className={`text-2xl font-bold ${getMarginColor(marginPct, targetMargin)}`}>
                  {marginPct.toFixed(1)}%
                </p>
              </div>
              {marginPct >= targetMargin ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Target Margin</p>
                <p className="text-2xl font-bold">{targetMargin.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Customer Avg</p>
                <p className="text-2xl font-bold">{customerAvgMargin.toFixed(1)}%</p>
              </div>
              <History className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights Alert */}
      {aiInsights.key_findings && aiInsights.key_findings.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center">
            <Brain className="h-5 w-5 mr-2 text-blue-500" />
            Key Findings
          </h3>
          <div className="grid gap-2">
            {aiInsights.key_findings.map((finding: string, index: number) => (
              <Alert key={index} className="bg-blue-50 border-blue-200">
                <AlertDescription>
                  <div className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span>{finding}</span>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overall">Overall Analysis</TabsTrigger>
          <TabsTrigger value="vendors">Vendors ({vendorAnalysis.length})</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Overall Analysis Tab */}
        <TabsContent value="overall" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sell</p>
                    <p className="text-xl font-semibold">{formatCurrency(financialInfo.total_sell)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-xl font-semibold">{formatCurrency(financialInfo.total_cost)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Margin</p>
                    <p className="text-xl font-semibold">{formatCurrency(financialInfo.total_margin)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Line Count</p>
                    <p className="text-xl font-semibold">{financialInfo.line_count || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  Customer History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-xl font-semibold">{customerInfo.historical_metrics?.total_orders || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-xl font-semibold">{formatCurrency(customerInfo.historical_metrics?.total_value)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Margin</p>
                    <p className="text-xl font-semibold">{customerAvgMargin.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last 12 Months</p>
                    <p className="text-xl font-semibold">{customerInfo.historical_metrics?.last_12_months?.orders || 0} orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Performance Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span>vs Target ({targetMargin.toFixed(1)}%)</span>
                  <span className={getMarginColor(marginPct, targetMargin)}>
                    {(marginPct - targetMargin > 0 ? '+' : '')}
                    {(marginPct - targetMargin).toFixed(1)}%
                  </span>
                </div>
                <Progress value={Math.min((marginPct / targetMargin) * 100, 100)} className="h-2" />
              </div>

              {customerAvgMargin > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span>vs Customer Historical ({customerAvgMargin.toFixed(1)}%)</span>
                    <span className={getMarginColor(marginPct, customerAvgMargin)}>
                      {(marginPct - customerAvgMargin > 0 ? '+' : '')}
                      {(marginPct - customerAvgMargin).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={Math.min((marginPct / customerAvgMargin) * 100, 100)} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aiInsights.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-4">
          {vendorAnalysis.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No vendor analysis data available</p>
              </CardContent>
            </Card>
          ) : (
            vendorAnalysis.map((vendor: any, index: number) => {
              const isExpanded = expandedVendor === vendor.vnd_no;
              
              const getPerformanceColor = (current: number, historical: number) => {
                const diff = current - historical;
                if (diff > 5) return 'text-green-600 bg-green-50';
                if (diff > 2) return 'text-green-600';
                if (diff > -2) return 'text-yellow-600';
                if (diff > -5) return 'text-orange-600';
                return 'text-red-600 bg-red-50';
              };

              const getPerformanceIcon = (performanceVsHistory: string) => {
                switch (performanceVsHistory) {
                  case 'significantly_better': return <TrendingUp className="h-4 w-4 text-green-600" />;
                  case 'better': return <TrendingUp className="h-4 w-4 text-green-500" />;
                  case 'similar': return <CheckCircle className="h-4 w-4 text-yellow-500" />;
                  case 'worse': return <TrendingDown className="h-4 w-4 text-orange-500" />;
                  case 'significantly_worse': return <TrendingDown className="h-4 w-4 text-red-600" />;
                  default: return null;
                }
              };
              
              return (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-2">
                        <h4 className="font-semibold">{vendor.vendor_name}</h4>
                        <p className="text-sm text-muted-foreground">Vendor #{vendor.vnd_no}</p>
                        <Badge variant={
                          vendor.performance_rating === 'excellent' ? 'default' :
                          vendor.performance_rating === 'good' ? 'secondary' :
                          vendor.performance_rating === 'fair' ? 'outline' : 'destructive'
                        } className="mt-2">
                          {vendor.performance_rating}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Current Order</p>
                        <p className="text-sm">Value: {formatCurrency(vendor.order_value)}</p>
                        <p className="text-sm">Lines: {vendor.line_count}</p>
                        <p className={`text-sm font-semibold ${getPerformanceColor(vendor.current_margin_pct || 0, vendor.historical_margin_pct)}`}>
                          {(vendor.current_margin_pct || 0).toFixed(1)}% margin
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Historical Performance</p>
                        <p className={`font-semibold ${vendor.historical_margin_pct > 20 ? 'text-green-600' : vendor.historical_margin_pct > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {vendor.historical_margin_pct.toFixed(1)}% avg margin
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vendor.historical_orders_count || 0} orders ({vendor.historical_lines_count || 0} lines)
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Performance vs History</p>
                        <div className="flex items-center space-x-2">
                          {getPerformanceIcon(vendor.performance_vs_history)}
                          <span className={`text-sm font-semibold ${getPerformanceColor(vendor.current_margin_pct || 0, vendor.historical_margin_pct)}`}>
                            {vendor.margin_difference > 0 ? '+' : ''}{(vendor.margin_difference || 0).toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">
                          {vendor.performance_vs_history?.replace('_', ' ')}
                        </p>
                        {vendor.order_line_details && vendor.order_line_details.length > 0 && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setExpandedVendor(isExpanded ? null : vendor.vnd_no)}
                            className="mt-2"
                          >
                            {isExpanded ? 'Hide' : 'View'} Order Lines ({vendor.order_line_details.length})
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Expanded Order Lines Section */}
                    {isExpanded && vendor.order_line_details && vendor.order_line_details.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h5 className="text-sm font-medium mb-3">Order Line Details:</h5>
                        <div className="max-h-96 overflow-y-auto space-y-2">
                          {vendor.order_line_details.slice(0, 100).map((line: any, lineIndex: number) => (
                            <div key={lineIndex} className="bg-gray-50 p-3 rounded-md text-sm">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <div>
                                  <p className="font-medium">Order #{line.order_no}</p>
                                  <p className="text-xs text-muted-foreground">Line {line.line_no}</p>
                                  <p className="text-xs text-muted-foreground">{line.date_entered}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Item</p>
                                  <p className="font-medium">{line.item_no}</p>
                                  <p className="text-xs">Qty: {line.qty_ordered}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Pricing</p>
                                  <p className="text-xs">Sell: {formatCurrency(line.unit_sell)}</p>
                                  <p className="text-xs">Cost: {formatCurrency(line.unit_cost)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Line Performance</p>
                                  <p className="font-semibold">{formatCurrency(line.line_value)}</p>
                                  <p className={`text-xs font-semibold ${line.line_margin_pct > 20 ? 'text-green-600' : line.line_margin_pct > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {line.line_margin_pct.toFixed(1)}% margin
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {vendor.order_line_details.length > 100 && (
                            <p className="text-xs text-muted-foreground text-center py-2">
                              Showing 100 of {vendor.order_line_details.length} order lines
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {vendor.recommendations && vendor.recommendations.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h5 className="text-sm font-medium mb-2">Recommendations:</h5>
                        <ul className="text-sm space-y-1">
                          {vendor.recommendations.map((rec: string, recIndex: number) => (
                            <li key={recIndex} className="flex items-start space-x-2">
                              <div className="h-1.5 w-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Overall Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Badge variant={
                    aiInsights.overall_assessment === 'excellent' ? 'default' :
                    aiInsights.overall_assessment === 'good' ? 'secondary' :
                    aiInsights.overall_assessment === 'needs_improvement' ? 'outline' : 'destructive'
                  } className="text-lg px-3 py-1">
                    {aiInsights.overall_assessment?.toUpperCase() || 'UNKNOWN'}
                  </Badge>
                </div>
                
                {aiInsights.opportunities && aiInsights.opportunities.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Opportunities:</p>
                    <ul className="space-y-1">
                      {aiInsights.opportunities.map((opportunity: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{opportunity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Risk Factors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Risk Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiInsights.risk_factors && aiInsights.risk_factors.length > 0 ? (
                  <ul className="space-y-2">
                    {aiInsights.risk_factors.map((risk: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{risk}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No significant risk factors identified</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* All Recommendations */}
          {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {aiInsights.recommendations.map((recommendation: string, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{recommendation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 