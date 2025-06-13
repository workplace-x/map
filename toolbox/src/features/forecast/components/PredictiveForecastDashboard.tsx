import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Calendar,
  Users,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Database,
  Clock,
  Brain,
  Target,
  BarChart3,
  CheckCircle,
  Zap,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ComprehensiveForecastTable from './ComprehensiveForecastTable';
import IntelligentForecastDashboard from './IntelligentForecastDashboard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ComparisonForecastTable from './ComparisonForecastTable';

// Types
interface PredictiveForecast {
  id: string;
  salesforce_user_id: string;
  forecast_month: number;
  forecast_year: number;
  predicted_revenue: number;
  predicted_bookings: number;
  predicted_gp_dollars: number;
  predicted_opportunities_count: number;
  confidence_score: number;
  model_version: string;
  model_type: string;
  features_used: string[];
  seasonal_adjustments: number;
  created_at: string;
}

interface TeamPredictiveForecast {
  id: string;
  team_id: string;
  forecast_month: number;
  forecast_year: number;
  predicted_revenue: number;
  predicted_bookings: number;
  predicted_gp_dollars: number;
  team_avg_confidence: number;
  team_member_count: number;
  contributing_members: number;
  manual_forecast_variance: number;
  manual_forecast_amount: number;
}

interface SalespersonPerformance {
  id: string;
  salesforce_user_id: string;
  overall_win_rate: number;
  avg_sales_cycle_days: number;
  total_amount_won: number;
  performance_trend_slope: number;
  win_rate_0_50k: number;
  win_rate_50k_200k: number;
  win_rate_200k_500k: number;
  win_rate_500k_1m: number;
  win_rate_1m_plus: number;
}

interface ForecastComparison {
  month: number;
  manual_forecast: number;
  predictive_forecast: number;
  variance: number;
  confidence: number;
  is_locked: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Debounced toast to prevent rapid successive notifications
let toastTimeout: NodeJS.Timeout | null = null;
const debouncedToast = {
  success: (message: string) => {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.success(message), 100);
  },
  error: (message: string) => {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.error(message), 100);
  }
};

const PredictiveForecastDashboard = React.memo(() => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generatingPredictions, setGeneratingPredictions] = useState(false);
  
  // Data states
  const [teams, setTeams] = useState<any[]>([]);
  const [teamPredictions, setTeamPredictions] = useState<TeamPredictiveForecast[]>([]);
  const [memberPredictions, setMemberPredictions] = useState<PredictiveForecast[]>([]);
  const [forecastComparison, setForecastComparison] = useState<ForecastComparison[]>([]);
  const [performanceAnalysis, setPerformanceAnalysis] = useState<SalespersonPerformance[]>([]);

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear + i);

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const token = localStorage.getItem('sb-access-token');
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('/api/teams', { headers });
        if (response.ok) {
          const data = await response.json();
          setTeams(data.filter((team: any) => team.is_sales_team && !team.is_super_team));
          if (data.length > 0 && !selectedTeam) {
            setSelectedTeam(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
        debouncedToast.error('Failed to load teams');
      }
    };

    fetchTeams();
  }, []);

  // Fetch predictive forecasts - memoized to prevent unnecessary re-renders
  const fetchPredictiveForecasts = useCallback(async () => {
    if (!selectedTeam) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('sb-access-token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Use Promise.all for better performance
      const [teamResponse, comparisonResponse] = await Promise.all([
        fetch(`/api/predictive-forecasts/team-predictions/${selectedTeam}?year=${selectedYear}`, { headers }),
        fetch(`/api/predictive-forecasts/comparison/${selectedTeam}?year=${selectedYear}`, { headers })
      ]);
      
      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeamPredictions(teamData.team_predictions || []);
        setMemberPredictions(teamData.member_predictions || []);
      }

      if (comparisonResponse.ok) {
        const comparisonData = await comparisonResponse.json();
        setForecastComparison(comparisonData.comparison || []);
      }

    } catch (error) {
      console.error('Error fetching forecasts:', error);
      debouncedToast.error('Failed to load predictive forecasts');
    } finally {
      setLoading(false);
    }
  }, [selectedTeam, selectedYear]);

  useEffect(() => {
    if (selectedTeam) {
      fetchPredictiveForecasts();
    }
  }, [selectedTeam, selectedYear, fetchPredictiveForecasts]);

  // Generate predictions for all team members - memoized and debounced
  const generateTeamPredictions = useCallback(async () => {
    if (!selectedTeam || generatingPredictions) return;

    setGeneratingPredictions(true);
    try {
      const token = localStorage.getItem('sb-access-token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Generate team-level predictions (this will internally handle individual member predictions)
      const teamResponse = await fetch('/api/predictive-forecasts/generate-team-prediction', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          team_id: selectedTeam,
          forecast_year: selectedYear
        })
      });

      if (teamResponse.ok) {
        const result = await teamResponse.json();
        debouncedToast.success(`Generated ${result.generated_count} monthly predictions for ${result.contributing_members} team members`);
        
        // Debounce the refresh to prevent rapid state updates
        setTimeout(() => {
          fetchPredictiveForecasts();
        }, 100);
      } else {
        const error = await teamResponse.json();
        debouncedToast.error(`Failed to generate predictions: ${error.error || 'Unknown error'}`);
      }

    } catch (error) {
      console.error('Error generating predictions:', error);
      debouncedToast.error('Failed to generate predictions');
    } finally {
      setGeneratingPredictions(false);
    }
  }, [selectedTeam, selectedYear, generatingPredictions, fetchPredictiveForecasts]);

  // Format currency - memoized to prevent recreation on every render
  const formatCurrency = useCallback((value: number | null | undefined): string => {
    if (value === null || value === undefined || value === 0) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  // Calculate summary statistics - optimized with proper memoization
  const summaryStats = useMemo(() => {
    // Early return if no data to prevent unnecessary calculations
    if (!teamPredictions.length && !forecastComparison.length) {
      return {
        totalPredicted: 0,
        totalManual: 0,
        avgConfidence: 0,
        variance: 0,
        predictionsAvailable: 0,
        totalMembers: 0,
        contributingMembers: 0
      };
    }

    const totalPredicted = teamPredictions.reduce((sum, pred) => sum + (pred.predicted_revenue || 0), 0);
    const totalManual = forecastComparison.reduce((sum, comp) => sum + (comp.manual_forecast || 0), 0);
    const avgConfidence = teamPredictions.length > 0 
      ? teamPredictions.reduce((sum, pred) => sum + (pred.team_avg_confidence || 0), 0) / teamPredictions.length 
      : 0;
    const variance = totalManual > 0 ? ((totalPredicted - totalManual) / totalManual) * 100 : 0;

    return {
      totalPredicted,
      totalManual,
      avgConfidence,
      variance,
      predictionsAvailable: teamPredictions.length,
      totalMembers: teamPredictions[0]?.team_member_count || 0,
      contributingMembers: teamPredictions[0]?.contributing_members || 0
    };
  }, [teamPredictions, forecastComparison]);

  // Optimize member predictions grouping - memoized to prevent expensive recalculation
  const groupedMemberPredictions = useMemo(() => {
    if (!memberPredictions.length) return {};
    
    return memberPredictions.reduce((acc, pred) => {
      if (!acc[pred.salesforce_user_id]) {
        acc[pred.salesforce_user_id] = [];
      }
      acc[pred.salesforce_user_id].push(pred);
      return acc;
    }, {} as Record<string, PredictiveForecast[]>);
  }, [memberPredictions]);

  // Pre-calculate member summary stats to avoid repeated calculations in render
  const memberSummaryStats = useMemo(() => {
    return Object.entries(groupedMemberPredictions).map(([userId, predictions]) => ({
      userId,
      predictions: predictions.sort((a, b) => a.forecast_month - b.forecast_month),
      annualTotal: predictions.reduce((sum, p) => sum + p.predicted_revenue, 0),
      avgConfidence: predictions.reduce((sum, p) => sum + p.confidence_score, 0) / predictions.length
    }));
  }, [groupedMemberPredictions]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Predictive Forecast</h2>
          <p className="text-muted-foreground">
            AI-powered revenue predictions and actionable insights
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Brain className="h-3 w-3" />
            AI-Enhanced
          </Badge>
          <Badge variant="secondary">
            {teamPredictions.length} Team Predictions
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="table" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="table">Comprehensive Table</TabsTrigger>
              <TabsTrigger value="intelligence" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Intelligence
              </TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
            </TabsList>

            {/* Comprehensive Table Tab */}
            <TabsContent value="table">
              <ComprehensiveForecastTable />
            </TabsContent>

            {/* AI Intelligence Tab */}
            <TabsContent value="intelligence">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">AI-Powered Sales Intelligence</h3>
                  <p className="text-muted-foreground mb-4">
                    Company-wide machine learning analysis of historical patterns, account behavior, and opportunity stages
                  </p>
                </div>
                
                <IntelligentForecastDashboard 
                  teamId="all" 
                  year={selectedYear}
                />
              </div>
            </TabsContent>

            {/* Comparison Tab */}
            <TabsContent value="comparison">
              <ComparisonForecastTable selectedYear={selectedYear} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
});

// Add display name for better debugging
PredictiveForecastDashboard.displayName = 'PredictiveForecastDashboard';

export default PredictiveForecastDashboard; 