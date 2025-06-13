import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown,
  ChevronRight,
  Lock, 
  Unlock, 
  Edit, 
  Save, 
  X, 
  Calendar,
  TrendingUp,
  DollarSign,
  Target,
  AlertTriangle,
  Building2,
  Crown,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTH_ABBR = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// Types
interface TeamMember {
  azure_id: string;
  name: string;
  email: string;
}

interface Team {
  id: string;
  name: string;
  is_forecasted_team: boolean;
  parent_team_id?: string;
  members: TeamMember[];
  children: Team[];
  hierarchy_level: number;
  team_totals: {
    [month: number]: number;
  };
}

interface ForecastData {
  teams: Team[];
  totalsByMonth: {
    [month: number]: {
      actual: number;
      manual: number;
      variance: number;
    };
  };
  summary: {
    totalManual: number;
    totalActual: number;
    totalVariance: number;
    teamsWithForecasts: number;
  };
  year: number;
  lockSettings: any[];
}

interface HierarchyTeamForecastProps {
  selectedYear: number;
}

const HierarchyTeamForecast: React.FC<HierarchyTeamForecastProps> = ({ selectedYear }) => {
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ teamId: string; month: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [lockedCells, setLockedCells] = useState<Set<string>>(new Set());
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  // Utility functions
  const formatCurrency = (amount: number): string => {
    if (amount === 0) return '$0';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const isMonthPast = (month: number): boolean => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    return selectedYear < currentYear || (selectedYear === currentYear && month < currentMonth);
  };

  const getCellKey = (teamId: string, month: number): string => `${teamId}-${month}`;

  // Build hierarchical team structure
  const buildTeamHierarchy = (teams: any[]): Team[] => {
    const teamMap = new Map<string, Team>();
    const rootTeams: Team[] = [];

    // First pass: create all team nodes and normalize the data structure
    teams.forEach(team => {
      const teamNode: Team = {
        id: team.team_id,  // Use team_id from API
        name: team.team_name,  // Use team_name from API
        is_forecasted_team: team.is_forecasted_team || false,  // Use the field from API
            parent_team_id: team.parent_team_id,
        members: team.members || [],
            children: [],
        hierarchy_level: 0,
        team_totals: {}
          };
      teamMap.set(team.team_id, teamNode);  // Use team_id for map key
        });

    // Second pass: build parent-child relationships
    teams.forEach(team => {
      const teamNode = teamMap.get(team.team_id);
      if (teamNode) {
        // Only add as child if parent exists in our dataset
        if (team.parent_team_id && teamMap.has(team.parent_team_id)) {
          const parent = teamMap.get(team.parent_team_id);
          if (parent) {
            parent.children.push(teamNode);
            teamNode.hierarchy_level = parent.hierarchy_level + 1;
          }
        } else {
          // If parent doesn't exist in our data, treat as root team
          rootTeams.push(teamNode);
        }
        }
      });

    // Calculate hierarchy levels recursively
    const setHierarchyLevels = (teams: Team[], level: number = 0) => {
      teams.forEach(team => {
        team.hierarchy_level = level;
        setHierarchyLevels(team.children, level + 1);
      });
    };
    
    setHierarchyLevels(rootTeams);
    
    return rootTeams;
  };

  // Calculate team totals including children
  const calculateTeamTotals = (team: Team, apiData: any): void => {
    // Initialize monthly totals
            for (let month = 1; month <= 12; month++) {
      team.team_totals[month] = 0;
    }

    // Find the corresponding team data from API
    const apiTeam = apiData.teams.find((t: any) => t.team_id === team.id);
    
    // Add direct team forecasts if this team has forecast data
    if (apiTeam && apiTeam.months) {
      for (let month = 1; month <= 12; month++) {
        const monthData = apiTeam.months[month.toString()];
        if (monthData && monthData.forecasted_revenue) {
          team.team_totals[month] += monthData.forecasted_revenue;
        }
      }
    }

    // Calculate totals for children first, then add them to parent
    team.children.forEach(child => {
      calculateTeamTotals(child, apiData);
      // Add child totals to parent
      for (let month = 1; month <= 12; month++) {
        team.team_totals[month] += child.team_totals[month] || 0;
      }
    });
  };

  // Flatten hierarchical teams for table display
  const flattenTeamsForDisplay = (teams: Team[]): (Team & { displayType: 'team' | 'member' })[] => {
    const flatList: (Team & { displayType: 'team' | 'member' })[] = [];
    
    const addTeamAndChildren = (team: Team) => {
      // Add team header
      flatList.push({ ...team, displayType: 'team' });
      
      // Only add children if this team is expanded
      if (expandedTeams.has(team.id)) {
        // Add team members if they exist
        if (team.members.length > 0) {
          team.members.forEach(member => {
            flatList.push({
              ...team,
              id: `member-${member.azure_id}`,
              name: member.name,
              displayType: 'member',
              hierarchy_level: team.hierarchy_level + 1,
              is_forecasted_team: false,
              children: [],
              team_totals: {} // Members don't have monthly totals in manual forecast
            });
          });
        }
        
        // Add children teams
        team.children.forEach(child => {
          addTeamAndChildren(child);
        });
      }
    };
    
    teams.forEach(addTeamAndChildren);
    return flatList;
  };

  // Fetch hierarchical forecast data
  const fetchForecastData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/team-forecasts/matrix?year=${selectedYear}&forecast_type=manual`);
      if (!response.ok) {
        throw new Error(`Failed to fetch forecast data: ${response.status}`);
      }
      
      const data = await response.json();
      
      // The matrix endpoint returns data directly without a success wrapper
      if (!data.teams || !Array.isArray(data.teams)) {
        throw new Error('Invalid forecast data format');
      }

      // Build hierarchical structure
      const hierarchicalTeams = buildTeamHierarchy(data.teams);

      // Calculate team totals including rollups
      hierarchicalTeams.forEach(team => calculateTeamTotals(team, data));
      
      // Calculate overall totals using the monthly_totals from the API response
      const totalsByMonth: { [month: number]: { actual: number; manual: number; variance: number } } = {};
      for (let month = 1; month <= 12; month++) {
        const monthlyTotals = data.monthly_totals?.[month] || {};
        
        totalsByMonth[month] = {
          actual: 0, // No actual data in manual forecasts
          manual: monthlyTotals.total_revenue || 0,
          variance: 0
        };
      }

      const summary = {
        totalManual: Object.values(totalsByMonth).reduce((sum, month) => sum + month.manual, 0),
        totalActual: 0, // No actual data in manual forecasts
        totalVariance: 0,
        teamsWithForecasts: data.teams.filter((t: any) => 
          Object.values(t.months || {}).some((month: any) => 
            (month.forecasted_revenue || 0) > 0
          )
        ).length
      };

      setForecastData({
        teams: hierarchicalTeams,
        totalsByMonth,
        summary,
        year: data.year,
        lockSettings: data.lock_settings || []
      });

      // Expand all teams by default to show the hierarchy
      const allTeamIds = new Set<string>();
      const collectTeamIds = (teams: Team[]) => {
        teams.forEach(team => {
          allTeamIds.add(team.id);
          collectTeamIds(team.children);
        });
      };
      collectTeamIds(hierarchicalTeams);
      setExpandedTeams(allTeamIds);

    } catch (err) {
      console.error('Error fetching forecast data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch forecast data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecastData();
  }, [selectedYear]);

  // Toggle team expansion
  const toggleTeamExpansion = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
      } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading manual forecast data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
            return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchForecastData} variant="outline">
            Try Again
                    </Button>
        </CardContent>
      </Card>
    );
  }

  if (!forecastData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">No forecast data available</p>
        </CardContent>
      </Card>
    );
  }

  const displayTeams = flattenTeamsForDisplay(forecastData.teams);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Manual Forecast</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(forecastData.summary.totalManual)}
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
                <p className="text-sm text-muted-foreground">Teams with Forecasts</p>
                <p className="text-2xl font-bold text-green-600">
                  {forecastData.summary.teamsWithForecasts}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Year</p>
                <p className="text-2xl font-bold text-purple-600">
                  {selectedYear}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Variance</p>
                <p className={`text-2xl font-bold ${forecastData.summary.totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(forecastData.summary.totalVariance))}
                </p>
              </div>
              <TrendingUp className={`h-8 w-8 ${forecastData.summary.totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hierarchical Forecast Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Manual Team Forecast Management
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Team hierarchy with manual forecasts • {selectedYear} • {forecastData.summary.teamsWithForecasts} teams with forecasts
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Gray italic values are calculated roll-ups • White values are editable forecasts
              </p>
            </div>
              <div className="flex items-center gap-2">
              <Button onClick={() => setExpandedTeams(new Set())} variant="outline" size="sm">
                Collapse All
                </Button>
              <Button 
                onClick={() => {
                  const allTeamIds = new Set<string>();
                  const collectIds = (teams: Team[]) => {
                    teams.forEach(team => {
                      allTeamIds.add(team.id);
                      collectIds(team.children);
                    });
                  };
                  collectIds(forecastData.teams);
                  setExpandedTeams(allTeamIds);
                }} 
                variant="outline" 
                size="sm"
              >
                Expand All
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead>
                <tr className="bg-gray-50">
                    <th className="border-r p-3 bg-gray-100 text-left font-medium sticky left-0 z-10 min-w-[200px]">
                      Team
                    </th>
                    {MONTH_ABBR.map((month, index) => {
                      const monthNum = index + 1;
                      const isPast = isMonthPast(monthNum);
                    const currentMonth = new Date().getMonth() + 1;
                    const isCurrentYear = selectedYear === new Date().getFullYear();
                      
                      return (
                      <th
                        key={month}
                        className={cn(
                          "border p-2 text-center min-w-[100px] font-medium",
                          isPast && isCurrentYear
                            ? "bg-blue-50 text-blue-700" 
                            : "bg-gray-50 text-gray-700",
                          monthNum === currentMonth && isCurrentYear && "ring-2 ring-blue-400"
                        )}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">{month}</span>
                          <span className="text-xs text-muted-foreground">
                            {isPast && isCurrentYear ? 'ACTUAL' : 'FORECAST'}
                              </span>
                          </div>
                        </th>
                      );
                    })}
                  <th className="border p-2 text-center min-w-[120px] bg-yellow-50 font-medium">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">TOTAL</span>
                      <span className="text-xs text-muted-foreground">ANNUAL</span>
                    </div>
                    </th>
                  </tr>
                </thead>
                
                <tbody>
                {displayTeams.map((team, index) => {
                  const isTeamHeader = team.displayType === 'team';
                  const hasChildren = team.children.length > 0;
                  const isExpanded = expandedTeams.has(team.id);
                  const annualTotal = Object.values(team.team_totals).reduce((sum, val) => sum + val, 0);

                  return (
                    <tr key={`${team.id}-${index}`} className={cn(
                      "hover:bg-gray-50",
                      isTeamHeader ? "bg-blue-25" : "bg-white"
                    )}>
                      {/* Team/Member Name Column */}
                      <td className="border-r p-3 sticky left-0 z-10 bg-white">
                        <div 
                          className="flex items-center gap-2"
                          style={{ marginLeft: `${team.hierarchy_level * 20}px` }}
                        >
                          {isTeamHeader ? (
                            <>
                              {hasChildren && (
                                <button
                                  onClick={() => toggleTeamExpansion(team.id)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                              <Users className="h-4 w-4 text-blue-600" />
                              <span className="font-bold text-blue-700">{team.name}</span>
                              {hasChildren && (
                                <span className="text-xs text-gray-500">
                                  ({team.children.length} child{team.children.length !== 1 ? 'ren' : ''})
                                </span>
                              )}
                              {team.is_forecasted_team && (
                                <span title="Has forecasts">
                                  <Crown className="h-3 w-3 text-yellow-500" />
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="w-4 h-4" /> {/* Spacer for alignment */}
                              <div className="w-2 h-2 bg-gray-300 rounded-full" />
                              <span className="text-gray-700">{team.name}</span>
                              <span className="text-xs text-gray-500">Member</span>
                            </>
                          )}
                      </div>
                    </td>

                      {/* Monthly Columns */}
                      {MONTH_ABBR.map((month, monthIndex) => {
                        const monthNum = monthIndex + 1;
                        const isPast = isMonthPast(monthNum);
                        const cellKey = getCellKey(team.id, monthNum);
                        const isLocked = lockedCells.has(cellKey);
                        const isEditing = editingCell?.teamId === team.id && editingCell?.month === monthNum;
                        const monthValue = team.team_totals[monthNum] || 0;
                      
                      return (
                          <td
                            key={month}
                            className={cn(
                              "border p-2 text-center relative",
                              isPast ? "bg-blue-50" : "bg-gray-50",
                              isTeamHeader && !team.is_forecasted_team ? "text-gray-500 italic" : ""
                            )}
                          >
                            {isTeamHeader && team.is_forecasted_team && !isPast ? (
                              // Editable cells for teams with forecasts in future months
                              <div className="flex items-center justify-center gap-1">
                                {isEditing ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      className="w-20 p-1 text-sm border rounded"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          // Handle save logic here
                                          setEditingCell(null);
                                        } else if (e.key === 'Escape') {
                                          setEditingCell(null);
                                        }
                                      }}
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingCell(null)}
                                    >
                                      <Save className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <span
                                      className="cursor-pointer hover:bg-blue-100 px-1 rounded"
                                      onClick={() => {
                                        setEditingCell({ teamId: team.id, month: monthNum });
                                        setEditValue(formatCurrency(monthValue));
                                      }}
                                    >
                                      {formatCurrency(monthValue)}
                                    </span>
                                    <button
                                      onClick={() => {
                                        const newLocked = new Set(lockedCells);
                                        if (isLocked) {
                                          newLocked.delete(cellKey);
                                        } else {
                                          newLocked.add(cellKey);
                                        }
                                        setLockedCells(newLocked);
                                      }}
                                      className="text-gray-400 hover:text-gray-600"
                                    >
                                      {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                                    </button>
                                  </>
                                )}
                              </div>
                            ) : (
                              // Read-only cells
                              <span className={cn(
                                isTeamHeader && !team.is_forecasted_team ? "text-gray-500 italic" : "",
                                team.displayType === 'member' ? "text-gray-600" : ""
                              )}>
                                {formatCurrency(monthValue)}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Annual Total Column */}
                      <td className="border p-2 text-center bg-yellow-50 font-medium">
                        <span className={cn(
                          isTeamHeader && !team.is_forecasted_team ? "text-gray-500 italic" : "text-gray-900",
                          team.displayType === 'member' ? "text-gray-600" : ""
                        )}>
                          {formatCurrency(annualTotal)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Totals Row */}
              <tfoot>
                <tr className="bg-blue-100 font-bold">
                  <td className="border-r p-3 sticky left-0 z-10 bg-blue-100">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-700">COMPANY TOTAL</span>
                    </div>
                  </td>
                  {MONTH_ABBR.map((month, monthIndex) => {
                    const monthNum = monthIndex + 1;
                    const monthData = forecastData.totalsByMonth[monthNum];
                    return (
                      <td key={month} className="border p-2 text-center bg-blue-100">
                        <span className="text-blue-700 font-bold">
                          {formatCurrency(monthData?.manual || 0)}
                          </span>
                        </td>
                      );
                    })}
                  <td className="border p-2 text-center bg-blue-100">
                    <span className="text-blue-700 font-bold">
                      {formatCurrency(forecastData.summary.totalManual)}
                      </span>
                    </td>
                  </tr>
              </tfoot>
              </table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HierarchyTeamForecast; 