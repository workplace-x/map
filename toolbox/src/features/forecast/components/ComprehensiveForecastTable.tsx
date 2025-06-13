import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Brain, CheckCircle, Target, Calendar, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTH_ABBREVIATIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

interface MonthlyData {
  month: string;
  monthIndex: number;
  isHistorical: boolean;
  actualAmount?: number;
  predictedAmount?: number;
  type: 'actual' | 'predicted';
  dealCount: number;
}

interface Salesperson {
  type?: 'team_header' | 'member';
  team_id?: string;
  team_name?: string;
  id: string;
  azure_id?: string;
  name: string;
  email: string;
  monthlyData: MonthlyData[];
  totals: {
    actual: number;
    predicted: number;
    combined: number;
  };
  isTeamHeader?: boolean;
  hierarchy_level?: number;
  parent_team_id?: string;
  has_children?: boolean;
  analytics?: any; // Analytics data from backend
}

interface ComprehensiveForecastData {
  year: number;
  teamId: string;
  teamName: string;
  currentMonth: number;
  salespeople: Salesperson[];
  teamTotals: {
    actual: number;
    predicted: number;
    combined: number;
  };
}

export default function ComprehensiveForecastTable() {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [data, setData] = useState<ComprehensiveForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  const transformMonthsToMonthlyData = (months: any, currentMonth: number): MonthlyData[] => {
    return MONTH_ABBREVIATIONS.map((month, index) => {
      const monthIndex = index + 1;
      const monthAmount = months?.[monthIndex] || 0; // months is like {1: 12345, 2: 23456, ...}
      const isHistorical = monthIndex < currentMonth;
      
      return {
        month,
        monthIndex,
        isHistorical,
        actualAmount: isHistorical ? monthAmount : undefined,
        predictedAmount: !isHistorical ? monthAmount : undefined,
        type: isHistorical ? 'actual' : 'predicted',
        dealCount: 0 // Not available in this API structure
      };
    });
  };

  const fetchForecastData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('sb-access-token');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch(`/api/predictive-forecasts/comprehensive-forecast/${selectedYear}?force_refresh=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Debug: Log the actual API response structure
      console.log('🔍 Full API Response:', JSON.stringify(result, null, 2));
      console.log('🔍 forecast_table:', result.forecast_table);
      
      // The predictive-forecasts endpoint has a different structure
      // It returns forecast_table directly, not wrapped in a success/data structure
      const forecastData = result;
      
      // Check if forecastData exists and has expected structure
      if (!forecastData || !forecastData.forecast_table) {
        console.warn('No forecast table received from API');
        // Create minimal working data structure
        setData({
          year: selectedYear,
          teamId: 'all-teams',
          teamName: 'All Sales Teams',
          currentMonth: new Date().getMonth() + 1,
          salespeople: [],
          teamTotals: {
            actual: 0,
            predicted: 0,
            combined: 0
          }
        });
        return;
      }
      
      const transformedData: ComprehensiveForecastData = {
        year: selectedYear,
        teamId: 'all-teams',
        teamName: 'All Sales Teams',
        currentMonth: new Date().getMonth() + 1,
        salespeople: [],
        teamTotals: {
          actual: 0,
          predicted: 0,
          combined: 0
        }
      };

      // Process forecast_table data
      if (forecastData.forecast_table && Array.isArray(forecastData.forecast_table)) {
        console.log('📊 Processing forecast_table with', forecastData.forecast_table.length, 'items');
        
        // Debug: Log the hierarchy structure from backend
        console.log('🔍 Hierarchy structure from backend:');
        forecastData.forecast_table.forEach((item: any, index: number) => {
          console.log(`  ${index}: ${item.type} - "${item.team_name || item.member_name}" (id: ${item.team_id || item.salesforce_user_id}, parent: ${item.parent_team_id}, level: ${item.hierarchy_level})`);
        });
        
        // Process forecast_table items in order (backend already provides proper hierarchy)
        forecastData.forecast_table.forEach((item: any) => {
          const monthlyData = transformMonthsToMonthlyData(item.months || {}, transformedData.currentMonth);
          
          if (item.type === 'team') {
            // Team header
            const teamHeader: Salesperson = {
              id: item.team_id || `team-${Math.random()}`,
              azure_id: undefined,
              name: item.team_name || 'Unknown Team',
              email: '',
              type: 'team_header',
              isTeamHeader: true,
              hierarchy_level: item.hierarchy_level || 0,
              parent_team_id: item.parent_team_id,
              has_children: item.has_children || false,
              monthlyData: monthlyData,
              totals: {
                actual: item.actual_ytd || 0,
                predicted: item.predicted_remaining || 0,
                combined: item.annual_total || 0
              }
            };
            
            transformedData.salespeople.push(teamHeader);
            
          } else if (item.type === 'member') {
            // Team member
            const member: Salesperson = {
              id: item.salesforce_user_id || `member-${Math.random()}`,
              azure_id: item.azure_id,
              name: item.member_name || 'Unknown Person',
              email: '',
              type: 'member',
              isTeamHeader: false,
              hierarchy_level: item.hierarchy_level || 1,
              parent_team_id: item.parent_team_id || item.team_id,
              has_children: false,
              monthlyData: monthlyData,
              totals: {
                actual: item.actual_ytd || 0,
                predicted: item.predicted_remaining || 0,
                combined: item.annual_total || 0
              },
              analytics: item.analytics // Preserve analytics data from backend
            };
            
            transformedData.salespeople.push(member);
          }
        });
      } else {
        console.warn('No forecast_table data found in API response');
      }

      // Calculate team totals from members only (not team headers to avoid double counting)
      transformedData.teamTotals = {
        actual: transformedData.salespeople
          .filter(sp => sp.type === 'member')
          .reduce((sum, sp) => sum + (sp.totals.actual || 0), 0),
        predicted: transformedData.salespeople
          .filter(sp => sp.type === 'member')
          .reduce((sum, sp) => sum + (sp.totals.predicted || 0), 0),
        combined: transformedData.salespeople
          .filter(sp => sp.type === 'member')
          .reduce((sum, sp) => sum + (sp.totals.combined || 0), 0)
      };

      setData(transformedData);
      
      // Set all teams as expanded by default
      const teamIds = new Set(
        transformedData.salespeople
          .filter(sp => sp.type === 'team_header')
          .map(sp => sp.id)
      );
      setExpandedTeams(teamIds);
      
    } catch (err: any) {
      console.error('Error fetching comprehensive forecast data:', err);
      setError('Failed to load comprehensive forecast data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecastData();
  }, [selectedYear]);

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || value === 0) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyAbbrev = (value: number | null | undefined): string => {
    if (value === null || value === undefined || value === 0) return '—';
    
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    } else {
      return formatCurrency(value);
    }
  };

  const toggleRow = (salespersonId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(salespersonId)) {
      newExpanded.delete(salespersonId);
    } else {
      newExpanded.add(salespersonId);
    }
    setExpandedRows(newExpanded);
  };

  const toggleTeam = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    const wasExpanded = newExpanded.has(teamId);
    
    if (wasExpanded) {
      newExpanded.delete(teamId);
      console.log(`🔽 Collapsing team: ${teamId}`);
    } else {
      newExpanded.add(teamId);
      console.log(`🔼 Expanding team: ${teamId}`);
    }
    
    console.log('📋 Current expanded teams:', Array.from(newExpanded));
    setExpandedTeams(newExpanded);
    
    // Debug: Log which items should be visible after this change
    setTimeout(() => {
      const visibleItems = getVisibleSalespeople();
      console.log(`👁️ Visible items after toggle (${visibleItems.length} total):`);
      visibleItems.forEach((item, idx) => {
        console.log(`  ${idx}: ${item.type} - "${item.name}" (parent: ${item.parent_team_id})`);
      });
    }, 100);
  };

  const getVisibleSalespeople = () => {
    if (!data?.salespeople) return [];
    
    // Helper function to check if ALL ancestor teams in the chain are expanded
    const areAllAncestorsExpanded = (item: Salesperson): boolean => {
      // If item has no parent, it's a root item - always visible
      if (!item.parent_team_id) {
        return true;
      }
      
      // Check if direct parent is expanded
      const parentExpanded = expandedTeams.has(item.parent_team_id);
      if (!parentExpanded) {
        return false; // Parent is collapsed, so this item should be hidden
      }
      
      // Find the parent team and recursively check its ancestors
      const parentTeam = data.salespeople.find(sp => 
        sp.type === 'team_header' && sp.id === item.parent_team_id
      );
      
      if (parentTeam) {
        // Recursively check if all ancestors of the parent are expanded
        return areAllAncestorsExpanded(parentTeam);
      }
      
      // If we can't find the parent team, assume it's expanded
      return true;
    };
    
    // Filter items based on their ancestor expansion state
    return data.salespeople.filter(areAllAncestorsExpanded);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Comprehensive Forecast Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading comprehensive forecast data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Comprehensive Forecast Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchForecastData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            Comprehensive Forecast Table
          </h2>
          <p className="text-muted-foreground">
            Monthly breakdown by salesperson • All Sales Teams • {data.salespeople.filter(sp => sp.type !== 'team_header').length} salespeople
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={fetchForecastData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actual YTD</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.teamTotals.actual)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Predicted</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(data.teamTotals.predicted)}
                </p>
              </div>
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Full Year Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data.teamTotals.combined)}
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Month</p>
                <p className="text-2xl font-bold text-gray-600">
                  {MONTH_ABBREVIATIONS[data.currentMonth - 1]} {data.year}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{selectedYear} Monthly Sales Forecast by Salesperson</span>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge variant="outline" className="bg-green-50">Actual</Badge>
              <Badge variant="outline" className="bg-purple-50">AI Predicted</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-3 text-left w-64">Salesperson</th>
                  {MONTH_ABBREVIATIONS.map((month, index) => (
                    <th key={month} className="border p-2 text-center w-20 text-xs">
                      <div>{month}</div>
                      <div className="text-xs text-muted-foreground">
                        {index < data.currentMonth - 1 ? 'ACT' : 'PRED'}
                      </div>
                    </th>
                  ))}
                  <th className="border p-3 text-center w-32">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {getVisibleSalespeople().map((salesperson, index) => (
                  <React.Fragment key={salesperson.id}>
                    <tr 
                      className={cn(
                        salesperson.type === 'team_header' 
                          ? "bg-blue-50 font-semibold cursor-pointer hover:bg-blue-100" 
                          : "hover:bg-gray-50 cursor-pointer",
                        salesperson.type === 'member' && index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                      )}
                      onClick={salesperson.type === 'team_header' ? () => toggleTeam(salesperson.id) : () => toggleRow(salesperson.id)}
                    >
                      <td className="border p-3">
                        <div className="flex items-center gap-2">
                          {salesperson.type === 'team_header' ? (
                            <div 
                              style={{ marginLeft: `${(salesperson.hierarchy_level || 0) * 20}px` }} 
                              className="flex items-center gap-2"
                            >
                              {salesperson.has_children && (
                                expandedTeams.has(salesperson.id) ? 
                                  <ChevronDown className="h-4 w-4 text-blue-600" /> : 
                                  <ChevronRight className="h-4 w-4 text-blue-600" />
                              )}
                              <Users className="h-4 w-4 text-blue-600" />
                              <span className="font-bold text-blue-700">{salesperson.name}</span>
                              {salesperson.has_children && (
                                <span className="text-xs text-blue-500 ml-1">
                                  ({expandedTeams.has(salesperson.id) ? 'expanded' : 'collapsed'})
                                </span>
                              )}
                            </div>
                          ) : (
                            <div style={{ marginLeft: `${(salesperson.hierarchy_level || 1) * 20}px` }} className="flex items-center gap-2">
                              {expandedRows.has(salesperson.id) ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                              }
                              <div className="ml-2">
                                <div className="font-medium">{salesperson.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {salesperson.email}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      {salesperson.monthlyData.map((monthData) => {
                        const value = monthData.actualAmount || monthData.predictedAmount || 0;
                        const isHistorical = monthData.isHistorical;
                        return (
                          <td 
                            key={monthData.month} 
                            className={cn(
                              "border p-2 text-center text-sm",
                              salesperson.type === 'team_header' 
                                ? "bg-blue-50 font-semibold"
                                : isHistorical ? "bg-green-50" : "bg-purple-50"
                            )}
                          >
                            {formatCurrencyAbbrev(value)}
                          </td>
                        );
                      })}
                      <td className={cn(
                        "border p-3 text-center",
                        salesperson.type === 'team_header' ? "font-bold text-blue-600" : "font-medium"
                      )}>
                        {formatCurrency(salesperson.totals.combined)}
                      </td>
                    </tr>

                    {salesperson.type === 'member' && expandedRows.has(salesperson.id) && (
                      <tr className="bg-gray-100">
                        <td colSpan={14} className="border p-4">
                          <div className="space-y-4">
                            <h4 className="font-medium text-lg flex items-center gap-2">
                              <Users className="h-5 w-5" />
                              Analysis for {salesperson.name}
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              {/* YTD Performance */}
                              <div className="bg-white p-4 rounded-lg border">
                                <h5 className="font-medium text-green-700 mb-2">📈 YTD Performance</h5>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span>Actual YTD:</span>
                                    <span className="font-medium text-green-600">
                                      {formatCurrency(salesperson.totals.actual)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Predicted Remaining:</span>
                                    <span className="font-medium text-purple-600">
                                      {formatCurrency(salesperson.totals.predicted)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Total Forecast:</span>
                                    <span className="font-bold text-blue-600">
                                      {formatCurrency(salesperson.totals.combined)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Pipeline Analytics */}
                              {salesperson.analytics && (
                                <div className="bg-white p-4 rounded-lg border">
                                  <h5 className="font-medium text-blue-700 mb-2">🎯 Pipeline Health</h5>
                                  <div className="space-y-1 text-sm">
                                    {salesperson.analytics.pipeline_value && (
                                      <div className="flex justify-between">
                                        <span>Current Pipeline:</span>
                                        <span className="font-medium text-blue-600">
                                          {formatCurrency(salesperson.analytics.pipeline_value)}
                                        </span>
                                      </div>
                                    )}
                                    {salesperson.analytics.opportunity_count && (
                                      <div className="flex justify-between">
                                        <span>Active Opportunities:</span>
                                        <span className="font-medium">
                                          {salesperson.analytics.opportunity_count}
                                        </span>
                                      </div>
                                    )}
                                    {salesperson.analytics.avg_deal_size && (
                                      <div className="flex justify-between">
                                        <span>Avg Deal Size:</span>
                                        <span className="font-medium">
                                          {formatCurrency(salesperson.analytics.avg_deal_size)}
                                        </span>
                                      </div>
                                    )}
                                    {salesperson.analytics.close_rate && (
                                      <div className="flex justify-between">
                                        <span>Win Rate:</span>
                                        <span className="font-medium text-green-600">
                                          {(salesperson.analytics.close_rate * 100).toFixed(1)}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Performance Metrics */}
                              {salesperson.analytics && (
                                <div className="bg-white p-4 rounded-lg border">
                                  <h5 className="font-medium text-purple-700 mb-2">📊 Performance</h5>
                                  <div className="space-y-1 text-sm">
                                    {salesperson.analytics.avg_sales_cycle && (
                                      <div className="flex justify-between">
                                        <span>Avg Sales Cycle:</span>
                                        <span className="font-medium">
                                          {Math.round(salesperson.analytics.avg_sales_cycle)} days
                                        </span>
                                      </div>
                                    )}
                                    {salesperson.analytics.conversion_rate && (
                                      <div className="flex justify-between">
                                        <span>Conversion Rate:</span>
                                        <span className="font-medium">
                                          {(salesperson.analytics.conversion_rate * 100).toFixed(1)}%
                                        </span>
                                      </div>
                                    )}
                                    {salesperson.analytics.quarterly_trend && (
                                      <div className="flex justify-between">
                                        <span>Quarterly Trend:</span>
                                        <span className={cn(
                                          "font-medium",
                                          salesperson.analytics.quarterly_trend > 0 ? "text-green-600" : "text-red-600"
                                        )}>
                                          {salesperson.analytics.quarterly_trend > 0 ? '+' : ''}{(salesperson.analytics.quarterly_trend * 100).toFixed(1)}%
                                        </span>
                                      </div>
                                    )}
                                    {salesperson.analytics.confidence_score && (
                                      <div className="flex justify-between">
                                        <span>AI Confidence:</span>
                                        <span className="font-medium text-purple-600">
                                          {(salesperson.analytics.confidence_score * 100).toFixed(0)}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Activity & Trends */}
                              {salesperson.analytics && (
                                <div className="bg-white p-4 rounded-lg border">
                                  <h5 className="font-medium text-orange-700 mb-2">🔥 Activity</h5>
                                  <div className="space-y-1 text-sm">
                                    {salesperson.analytics.recent_wins && (
                                      <div className="flex justify-between">
                                        <span>Recent Wins:</span>
                                        <span className="font-medium text-green-600">
                                          {salesperson.analytics.recent_wins}
                                        </span>
                                      </div>
                                    )}
                                    {salesperson.analytics.deals_closing_soon && (
                                      <div className="flex justify-between">
                                        <span>Closing This Month:</span>
                                        <span className="font-medium text-orange-600">
                                          {salesperson.analytics.deals_closing_soon}
                                        </span>
                                      </div>
                                    )}
                                    {salesperson.analytics.at_risk_deals && (
                                      <div className="flex justify-between">
                                        <span>At Risk Deals:</span>
                                        <span className="font-medium text-red-600">
                                          {salesperson.analytics.at_risk_deals}
                                        </span>
                                      </div>
                                    )}
                                    {salesperson.analytics.last_activity && (
                                      <div className="flex justify-between">
                                        <span>Last Activity:</span>
                                        <span className="font-medium text-gray-600">
                                          {new Date(salesperson.analytics.last_activity).toLocaleDateString()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Additional insights if available */}
                            {salesperson.analytics?.insights && (
                              <div className="bg-white p-4 rounded-lg border">
                                <h5 className="font-medium text-gray-700 mb-2">💡 AI Insights</h5>
                                <div className="text-sm text-gray-600">
                                  {salesperson.analytics.insights}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground space-y-1">
        <p><strong>Data Sources:</strong> Actual closed won revenue (historical) + AI predictions using close dates (future)</p>
        <p><strong>Current Month:</strong> {MONTH_ABBREVIATIONS[data.currentMonth - 1]} {data.year} • Historical data shown in green, AI predictions in purple</p>
        <p><strong>Generated:</strong> {new Date().toLocaleString()} • Click team headers to expand/collapse • Click salesperson rows for details</p>
      </div>
    </div>
  );
} 