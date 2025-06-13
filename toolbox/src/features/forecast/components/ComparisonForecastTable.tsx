import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Brain,
  Calendar,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];

interface ComparisonData {
  month: number;
  monthName: string;
  manual_forecast: number;
  ai_prediction: number;
  variance: number | null;
  variance_percentage: number | null;
  ai_confidence: number;
  is_locked: boolean;
  is_historical: boolean;
}

interface ComparisonSummary {
  totalManual: number;
  totalAI: number;
  totalVariance: number;
  avgConfidence: number;
  monthsCompared: number;
}

interface ComparisonForecastTableProps {
  selectedYear: number;
}

export default function ComparisonForecastTable({ selectedYear }: ComparisonForecastTableProps) {
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [summary, setSummary] = useState<ComparisonSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComparisonData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch both comprehensive AI forecast and manual forecast data
      const [aiResponse, manualResponse] = await Promise.all([
        fetch(`/api/predictive-forecasts/comprehensive-forecast/${selectedYear}`),
        fetch(`/api/team-forecasts/matrix?year=${selectedYear}&forecast_type=manual`)
      ]);

      if (!aiResponse.ok || !manualResponse.ok) {
        throw new Error('Failed to fetch forecast data');
      }

      const aiData = await aiResponse.json();
      const manualData = await manualResponse.json();

      // Process and compare the data
      const currentMonth = new Date().getMonth() + 1;
      const comparison: ComparisonData[] = [];

      for (let month = 1; month <= 12; month++) {
        const isHistorical = month < currentMonth;
        
        // Calculate manual total for this month
        const manualTotal = manualData.teams?.reduce((sum: number, team: any) => {
          const monthData = team.months?.[month];
          return sum + (monthData?.forecasted_revenue || 0);
        }, 0) || 0;

        // Calculate AI prediction total for this month
        const aiTotal = aiData.forecast_table?.filter((item: any) => item.type === 'team')
          .reduce((sum: number, team: any) => {
            const monthAmount = team.months?.[month] || 0;
            return sum + monthAmount;
          }, 0) || 0;

        // Calculate variance
        const variance = manualTotal > 0 ? aiTotal - manualTotal : null;
        const variancePercentage = manualTotal > 0 ? ((aiTotal - manualTotal) / manualTotal) * 100 : null;

        comparison.push({
          month,
          monthName: MONTH_NAMES[month - 1],
          manual_forecast: manualTotal,
          ai_prediction: aiTotal,
          variance,
          variance_percentage: variancePercentage,
          ai_confidence: 0.75, // Default confidence, could be calculated more precisely
          is_locked: isHistorical,
          is_historical: isHistorical
        });
      }

      // Calculate summary statistics
      const summaryStats: ComparisonSummary = {
        totalManual: comparison.reduce((sum, item) => sum + item.manual_forecast, 0),
        totalAI: comparison.reduce((sum, item) => sum + item.ai_prediction, 0),
        totalVariance: 0,
        avgConfidence: comparison.reduce((sum, item) => sum + item.ai_confidence, 0) / 12,
        monthsCompared: comparison.filter(item => item.manual_forecast > 0 || item.ai_prediction > 0).length
      };
      
      summaryStats.totalVariance = summaryStats.totalManual > 0 ? 
        ((summaryStats.totalAI - summaryStats.totalManual) / summaryStats.totalManual) * 100 : 0;

      setComparisonData(comparison);
      setSummary(summaryStats);

    } catch (err: any) {
      console.error('Error fetching comparison data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisonData();
  }, [selectedYear]);

  const formatCurrency = (value: number): string => {
    if (value === 0) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading forecast comparison...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchComparisonData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Manual Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(summary?.totalManual || 0)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Prediction</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(summary?.totalAI || 0)}
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
                <p className="text-sm text-muted-foreground">Variance</p>
                <p className={cn(
                  "text-2xl font-bold",
                  (summary?.totalVariance || 0) > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {summary?.totalVariance ? 
                    `${summary.totalVariance > 0 ? '+' : ''}${summary.totalVariance.toFixed(1)}%` : 
                    '0%'
                  }
                </p>
              </div>
              {(summary?.totalVariance || 0) > 0 ? 
                <TrendingUp className="h-8 w-8 text-green-600" /> :
                <TrendingDown className="h-8 w-8 text-red-600" />
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Confidence</p>
                <p className="text-2xl font-bold text-green-600">
                  {((summary?.avgConfidence || 0) * 100).toFixed(0)}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Manual vs AI Forecast Comparison ({selectedYear})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Compare manual team forecasts with AI predictions by month
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-3 text-left">Month</th>
                  <th className="border p-3 text-right bg-blue-50">Manual Forecast</th>
                  <th className="border p-3 text-right bg-purple-50">AI Prediction</th>
                  <th className="border p-3 text-right">Variance</th>
                  <th className="border p-3 text-center">AI Confidence</th>
                  <th className="border p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row) => (
                  <tr key={row.month} className="hover:bg-gray-50">
                    <td className="border p-3 font-medium">
                      {row.monthName}
                    </td>
                    <td className="border p-3 text-right bg-blue-25">
                      {formatCurrency(row.manual_forecast)}
                    </td>
                    <td className="border p-3 text-right font-medium text-purple-600 bg-purple-25">
                      {formatCurrency(row.ai_prediction)}
                    </td>
                    <td className={cn(
                      "border p-3 text-right font-medium",
                      row.variance !== null ? (
                        row.variance > 0 ? "text-green-600" : "text-red-600"
                      ) : "text-gray-500"
                    )}>
                      {row.variance_percentage !== null ? 
                        `${row.variance_percentage > 0 ? '+' : ''}${row.variance_percentage.toFixed(1)}%` : 
                        '—'
                      }
                    </td>
                    <td className="border p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Progress value={row.ai_confidence * 100} className="w-16" />
                        <span className="text-sm">{(row.ai_confidence * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="border p-3 text-center">
                      {row.is_historical ? (
                        <Badge variant="secondary">Historical</Badge>
                      ) : row.is_locked ? (
                        <Badge variant="destructive">Locked</Badge>
                      ) : (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50 font-bold">
                  <td className="border p-3">TOTAL</td>
                  <td className="border p-3 text-right">
                    {formatCurrency(summary?.totalManual || 0)}
                  </td>
                  <td className="border p-3 text-right text-purple-600">
                    {formatCurrency(summary?.totalAI || 0)}
                  </td>
                  <td className={cn(
                    "border p-3 text-right",
                    (summary?.totalVariance || 0) > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {summary?.totalVariance ? 
                      `${summary.totalVariance > 0 ? '+' : ''}${summary.totalVariance.toFixed(1)}%` : 
                      '0%'
                    }
                  </td>
                  <td className="border p-3 text-center">
                    {((summary?.avgConfidence || 0) * 100).toFixed(0)}%
                  </td>
                  <td className="border p-3 text-center">
                    <Badge>{summary?.monthsCompared || 0} months</Badge>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 