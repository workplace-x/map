import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar,
  DollarSign,
  BarChart3,
  Users,
  AlertTriangle,
  CheckCircle,
  Search,
  Download,
  RefreshCw,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronDown,
  ChevronRight,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Types
interface GapReportRow {
  salesperson_name: string;
  salesperson_team: string;
  team_id?: string;
  annual_sales: number;
  sales_goal: number;
  benchmark: number;
  sales_gap: number;
  benchmark_gap: number;
  sixty_ninety_ops: number;
  actual_plus_ops: number;
  forecast_gap: number;
  // New AI-powered fields
  ai_predicted_remaining: number;
  actual_plus_ai: number;
  ai_forecast_gap: number;
  ai_confidence: number;
  // Existing fields
  booking_percentage: number;
  margin_goal: number;
  actual_gp: number;
  achievement_percentage: number;
  year_progress: number;
  // Hierarchy fields
  hierarchy_level?: number;
  parent_team_id?: string;
  is_team_header?: boolean;
  has_children?: boolean;
}

interface GapReportData {
  rows: GapReportRow[];
  summary: {
    total_annual_sales: number;
    total_sales_goal: number;
    total_benchmark: number;
    total_sales_gap: number;
    total_benchmark_gap: number;
    total_sixty_ninety_ops: number;
    total_actual_plus_ops: number;
    total_forecast_gap: number;
    // AI-powered totals
    total_ai_predicted_remaining: number;
    total_actual_plus_ai: number;
    total_ai_forecast_gap: number;
    avg_achievement_percentage: number;
    salespeople_count: number;
    teams_count: number;
  };
  year_progress: number;
  last_updated: string;
  metadata?: {
    ai_integration?: string;
    team_hierarchy?: string;
  };
}

interface GapReportDashboardProps {
  selectedYear?: number;
}

const GapReportDashboard: React.FC<GapReportDashboardProps> = ({ 
  selectedYear = new Date().getFullYear() 
}) => {
  const [gapData, setGapData] = useState<GapReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof GapReportRow>('ai_forecast_gap');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  // Calculate year progress
  const yearProgress = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    if (selectedYear !== currentYear) return 100; // If not current year, assume complete
    
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear + 1, 0, 1);
    const progress = (now.getTime() - yearStart.getTime()) / (yearEnd.getTime() - yearStart.getTime());
    return Math.round(progress * 100);
  }, [selectedYear]);

  // Fetch gap report data
  const fetchGapData = async () => {
    try {
      setLoading(true);
      console.log(`🔄 Fetching gap report for ${selectedYear}...`);
      const response = await fetch(`/api/gap-report?year=${selectedYear}`);
      if (!response.ok) throw new Error('Failed to fetch gap report data');
      
      const data = await response.json();
      console.log(`✅ Gap report received:`, data.summary);
      setGapData(data);

      // Expand all teams by default to show hierarchy
      if (data.rows) {
        const teamIds = new Set(
          data.rows
            .filter((row: GapReportRow) => row.is_team_header)
            .map((row: GapReportRow) => row.team_id || row.salesperson_name)
        );
        setExpandedTeams(teamIds);
      }
      
    } catch (error) {
      console.error('Error fetching gap data:', error);
      toast.error('Failed to load gap report data');
      setGapData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGapData();
  }, [selectedYear]);

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getGapColor = (gap: number) => {
    if (gap > 0) return 'text-green-600';
    if (gap < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGapIcon = (gap: number) => {
    if (gap > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (gap < 0) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  // Toggle team expansion
  const toggleTeam = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  // Get visible rows based on team expansion state
  const getVisibleRows = () => {
    if (!gapData?.rows) return [];
    
    const areAllAncestorsExpanded = (row: GapReportRow): boolean => {
      if (!row.parent_team_id) return true; // Root items always visible
      
      const parentExpanded = expandedTeams.has(row.parent_team_id);
      if (!parentExpanded) return false;
      
      // Find parent and check recursively
      const parentRow = gapData.rows.find(r => 
        r.is_team_header && (r.team_id === row.parent_team_id || r.salesperson_name === row.parent_team_id)
      );
      
      if (parentRow) {
        return areAllAncestorsExpanded(parentRow);
      }
      
      return true;
    };
    
    return gapData.rows.filter(areAllAncestorsExpanded);
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    const visibleRows = getVisibleRows();
    
    let filtered = visibleRows.filter(row => {
      const matchesSearch = row.salesperson_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           row.salesperson_team.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTeam = filterTeam === 'all' || row.salesperson_team === filterTeam;
      return matchesSearch && matchesTeam;
    });

    // Sort data
    filtered.sort((a, b) => {
      // Keep team headers before their members
      if (a.is_team_header && !b.is_team_header && a.team_id === b.parent_team_id) return -1;
      if (b.is_team_header && !a.is_team_header && b.team_id === a.parent_team_id) return 1;
      
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      const aNum = Number(aValue);
      const bNum = Number(bValue);
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    });

    return filtered;
  }, [gapData, searchTerm, filterTeam, sortField, sortDirection, expandedTeams]);

  // Get unique teams for filter
  const teams = useMemo(() => {
    if (!gapData) return [];
    return Array.from(new Set(gapData.rows.map(row => row.salesperson_team))).sort();
  }, [gapData]);

  const handleSort = (field: keyof GapReportRow) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!gapData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load gap report data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  const isAiEnhanced = gapData.metadata?.ai_integration === 'enabled';
  const hasHierarchy = gapData.metadata?.team_hierarchy === 'enabled';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Gap Report
            {isAiEnhanced && <Brain className="h-6 w-6 text-purple-600" />}
          </h2>
          <p className="text-muted-foreground">
            {isAiEnhanced ? 'AI-Enhanced' : 'Traditional'} sales performance analysis vs goals and benchmarks for {selectedYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {yearProgress}% Year Complete
          </Badge>
          <Badge variant="secondary">
            {gapData.summary.salespeople_count} Salespeople
          </Badge>
          {isAiEnhanced && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              <Brain className="h-3 w-3 mr-1" />
              AI Enhanced
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={fetchGapData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Annual Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(gapData.summary.total_annual_sales)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPercentage(gapData.summary.avg_achievement_percentage)} of goal
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sales Gap</p>
                <p className={cn("text-2xl font-bold", getGapColor(gapData.summary.total_sales_gap))}>
                  {formatCurrency(Math.abs(gapData.summary.total_sales_gap))}
                </p>
                <div className="flex items-center gap-1">
                  {getGapIcon(gapData.summary.total_sales_gap)}
                  <p className="text-xs text-muted-foreground">
                    {gapData.summary.total_sales_gap < 0 ? 'Behind Goal' : 'Ahead of Goal'}
                  </p>
                </div>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {isAiEnhanced && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">AI Predicted Remaining</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(gapData.summary.total_ai_predicted_remaining)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ML-powered forecast
                  </p>
                </div>
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isAiEnhanced ? 'AI Forecast Gap' : 'Forecast Gap'}
                </p>
                <p className={cn(
                  "text-2xl font-bold", 
                  getGapColor(isAiEnhanced ? gapData.summary.total_ai_forecast_gap : gapData.summary.total_forecast_gap)
                )}>
                  {formatCurrency(Math.abs(isAiEnhanced ? gapData.summary.total_ai_forecast_gap : gapData.summary.total_forecast_gap))}
                </p>
                <div className="flex items-center gap-1">
                  {getGapIcon(isAiEnhanced ? gapData.summary.total_ai_forecast_gap : gapData.summary.total_forecast_gap)}
                  <p className="text-xs text-muted-foreground">
                    With {isAiEnhanced ? 'AI' : 'Pipeline'}
                  </p>
                </div>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search salespeople or teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterTeam} onValueChange={setFilterTeam}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gap Report Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Gap Analysis by Salesperson
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th 
                    className="border border-gray-200 dark:border-gray-700 p-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('salesperson_name')}
                  >
                    <div className="flex items-center gap-2">
                      Salesperson/Team
                      {sortField === 'salesperson_name' && (
                        sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="border border-gray-200 dark:border-gray-700 p-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('annual_sales')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Annual Sales
                      {sortField === 'annual_sales' && (
                        sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="border border-gray-200 dark:border-gray-700 p-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('sales_goal')}
                  >
                    Sales Goal
                  </th>
                  <th 
                    className="border border-gray-200 dark:border-gray-700 p-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('benchmark')}
                  >
                    Benchmark
                  </th>
                  <th 
                    className="border border-gray-200 dark:border-gray-700 p-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('sales_gap')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Sales Gap
                      {sortField === 'sales_gap' && (
                        sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="border border-gray-200 dark:border-gray-700 p-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('benchmark_gap')}
                  >
                    Benchmark Gap
                  </th>
                  <th 
                    className="border border-gray-200 dark:border-gray-700 p-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('ai_predicted_remaining')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      AI Remaining
                    </div>
                  </th>
                  <th 
                    className="border border-gray-200 dark:border-gray-700 p-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('actual_plus_ai')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      Actual + AI
                    </div>
                  </th>
                  <th 
                    className="border border-gray-200 dark:border-gray-700 p-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('ai_forecast_gap')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      AI Forecast Gap
                      {sortField === 'ai_forecast_gap' && (
                        sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="border border-gray-200 dark:border-gray-700 p-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('ai_confidence')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      AI Confidence
                    </div>
                  </th>
                  <th 
                    className="border border-gray-200 dark:border-gray-700 p-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('booking_percentage')}
                  >
                    Booking %
                  </th>
                </tr>
              </thead>
              <tbody>
                {processedData.map((row, index) => (
                  <tr 
                    key={index} 
                    className={cn(
                      "hover:bg-gray-50 dark:hover:bg-gray-800",
                      row.is_team_header ? "bg-blue-50 font-semibold cursor-pointer hover:bg-blue-100" : ""
                    )}
                    onClick={row.is_team_header ? () => toggleTeam(row.team_id || row.salesperson_name) : undefined}
                  >
                    <td className="border border-gray-200 dark:border-gray-700 p-3">
                      <div className="flex items-center gap-2">
                        <div 
                          style={{ marginLeft: `${(row.hierarchy_level || 0) * 20}px` }} 
                          className="flex items-center gap-2"
                        >
                          {row.is_team_header ? (
                            <>
                              {row.has_children && (
                                expandedTeams.has(row.team_id || row.salesperson_name) ? 
                                  <ChevronDown className="h-4 w-4 text-blue-600" /> : 
                                  <ChevronRight className="h-4 w-4 text-blue-600" />
                              )}
                              <Users className="h-4 w-4 text-blue-600" />
                              <span className="font-bold text-blue-700">{row.salesperson_name}</span>
                            </>
                          ) : (
                            <div className="ml-2">
                              <div className="font-medium">{row.salesperson_name}</div>
                              <div className="text-sm text-muted-foreground">{row.salesperson_team}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 p-3 text-right font-medium">
                      {formatCurrency(row.annual_sales)}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 p-3 text-right">
                      {formatCurrency(row.sales_goal)}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 p-3 text-right">
                      {formatCurrency(row.benchmark)}
                    </td>
                    <td className={cn("border border-gray-200 dark:border-gray-700 p-3 text-right font-medium", getGapColor(row.sales_gap))}>
                      <div className="flex items-center justify-end gap-1">
                        {getGapIcon(row.sales_gap)}
                        {formatCurrency(Math.abs(row.sales_gap))}
                      </div>
                    </td>
                    <td className={cn("border border-gray-200 dark:border-gray-700 p-3 text-right", getGapColor(row.benchmark_gap))}>
                      <div className="flex items-center justify-end gap-1">
                        {getGapIcon(row.benchmark_gap)}
                        {formatCurrency(Math.abs(row.benchmark_gap))}
                      </div>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 p-3 text-right bg-purple-50 dark:bg-purple-900/20">
                      <div className="flex items-center justify-end gap-1">
                        <div className="w-1 h-1 bg-purple-600 rounded-full"></div>
                        {formatCurrency(row.ai_predicted_remaining)}
                      </div>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 p-3 text-right font-medium bg-purple-50 dark:bg-purple-900/20">
                      <div className="flex items-center justify-end gap-1">
                        <div className="w-1 h-1 bg-purple-600 rounded-full"></div>
                        {formatCurrency(row.actual_plus_ai)}
                      </div>
                    </td>
                    <td className={cn("border border-gray-200 dark:border-gray-700 p-3 text-right font-medium bg-purple-50 dark:bg-purple-900/20", getGapColor(row.ai_forecast_gap))}>
                      <div className="flex items-center justify-end gap-1">
                        <div className="w-1 h-1 bg-purple-600 rounded-full"></div>
                        {getGapIcon(row.ai_forecast_gap)}
                        {formatCurrency(Math.abs(row.ai_forecast_gap))}
                      </div>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 p-3 text-right bg-purple-50 dark:bg-purple-900/20">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-1 h-1 bg-purple-600 rounded-full"></div>
                        <div className="flex items-center gap-1">
                          <Progress value={row.ai_confidence * 100} className="w-16" />
                          <span className="text-sm">{formatPercentage(row.ai_confidence * 100)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={row.booking_percentage} className="w-16" />
                        <span className="text-sm">{formatPercentage(row.booking_percentage)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Footer */}
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardContent className="p-4">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>
              Showing {processedData.length} of {gapData.rows.length} salespeople 
              • Last updated: {new Date(gapData.last_updated).toLocaleString()}
            </span>
            <span>
              Year Progress: {yearProgress}% • {gapData.summary.teams_count} Teams
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GapReportDashboard; 