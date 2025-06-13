import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Calendar, 
  Users, 
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  PieChart,
  Activity,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface TeamGoal {
  id: string;
  team_id: string;
  team_name: string;
  team_path: string;
  team_level: number;
  is_sales_team: boolean;
  goal_type: 'revenue' | 'margin' | 'deals' | 'custom';
  target_amount: number;
  current_amount: number;
  achievement_percentage: number;
  period_start: string;
  period_end: string;
  status: 'active' | 'completed' | 'at_risk' | 'behind';
  parent_goal_id?: string;
  child_goals?: TeamGoal[];
  last_updated: string;
  auto_rollup: boolean;
}

interface IndividualGoal {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  team_id: string;
  team_name: string;
  goal_type: 'revenue' | 'margin' | 'deals' | 'custom';
  target_amount: number;
  current_amount: number;
  achievement_percentage: number;
  period_start: string;
  period_end: string;
  status: 'active' | 'completed' | 'at_risk' | 'behind';
  last_updated: string;
}

interface GoalMetrics {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  atRiskGoals: number;
  averageAchievement: number;
  totalTargetValue: number;
  totalCurrentValue: number;
}

export function SmartGoalsManagement() {
  // State
  const [teamGoals, setTeamGoals] = useState<TeamGoal[]>([]);
  const [individualGoals, setIndividualGoals] = useState<IndividualGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('team-goals');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGoalType, setFilterGoalType] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [showCreateGoal, setShowCreateGoal] = useState(false);

  // Fetch goals data
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const token = localStorage.getItem('sb-access-token');
        
        // For now, create placeholder data since endpoints don't exist yet
        const placeholderTeamGoals: TeamGoal[] = [
          {
            id: '1',
            team_id: 'team-1',
            team_name: 'Sales Team West',
            team_path: '/Sales/West',
            team_level: 1,
            is_sales_team: true,
            goal_type: 'revenue',
            target_amount: 1000000,
            current_amount: 650000,
            achievement_percentage: 65,
            period_start: '2024-01-01',
            period_end: '2024-12-31',
            status: 'active',
            last_updated: new Date().toISOString(),
            auto_rollup: true,
            child_goals: []
          }
        ];

        const placeholderIndividualGoals: IndividualGoal[] = [
          {
            id: '1',
            user_id: 'user-1',
            user_name: 'John Doe',
            user_email: 'john@example.com',
            team_id: 'team-1',
            team_name: 'Sales Team West',
            goal_type: 'revenue',
            target_amount: 250000,
            current_amount: 175000,
            achievement_percentage: 70,
            period_start: '2024-01-01',
            period_end: '2024-12-31',
            status: 'active',
            last_updated: new Date().toISOString()
          }
        ];

        setTeamGoals(placeholderTeamGoals);
        setIndividualGoals(placeholderIndividualGoals);
      } catch (error) {
        console.error('Error fetching goals:', error);
        toast.error('Failed to load goals');
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  // Calculate metrics
  const metrics = useMemo((): GoalMetrics => {
    const allGoals = [...teamGoals, ...individualGoals];
    
    return {
      totalGoals: allGoals.length,
      activeGoals: allGoals.filter(g => g.status === 'active').length,
      completedGoals: allGoals.filter(g => g.status === 'completed').length,
      atRiskGoals: allGoals.filter(g => g.status === 'at_risk' || g.status === 'behind').length,
      averageAchievement: allGoals.length > 0 
        ? allGoals.reduce((sum, g) => sum + g.achievement_percentage, 0) / allGoals.length 
        : 0,
      totalTargetValue: allGoals.reduce((sum, g) => sum + g.target_amount, 0),
      totalCurrentValue: allGoals.reduce((sum, g) => sum + g.current_amount, 0)
    };
  }, [teamGoals, individualGoals]);

  // Filter goals
  const filteredTeamGoals = useMemo(() => {
    return teamGoals.filter(goal => {
      const matchesSearch = !searchTerm || 
        goal.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        goal.team_path.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !filterStatus || filterStatus === 'all' || goal.status === filterStatus;
      const matchesType = !filterGoalType || filterGoalType === 'all' || goal.goal_type === filterGoalType;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [teamGoals, searchTerm, filterStatus, filterGoalType]);

  const filteredIndividualGoals = useMemo(() => {
    return individualGoals.filter(goal => {
      const matchesSearch = !searchTerm || 
        goal.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        goal.team_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !filterStatus || filterStatus === 'all' || goal.status === filterStatus;
      const matchesType = !filterGoalType || filterGoalType === 'all' || goal.goal_type === filterGoalType;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [individualGoals, searchTerm, filterStatus, filterGoalType]);

  // Goal status configuration
  const getStatusConfig = (status: string) => {
    const configs = {
      active: { color: 'bg-blue-100 text-blue-800', icon: Activity, label: 'Active' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Completed' },
      at_risk: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'At Risk' },
      behind: { color: 'bg-red-100 text-red-800', icon: TrendingDown, label: 'Behind' }
    };
    return configs[status as keyof typeof configs] || configs.active;
  };

  // Achievement color based on percentage
  const getAchievementColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    if (percentage >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  // Goal type icon
  const getGoalTypeIcon = (type: string) => {
    const icons = {
      revenue: DollarSign,
      margin: BarChart3,
      deals: Target,
      custom: Award
    };
    return icons[type as keyof typeof icons] || Target;
  };

  // Update goal
  const updateGoal = async (goalId: string, updates: Partial<TeamGoal | IndividualGoal>) => {
    try {
      const token = localStorage.getItem('sb-access-token');
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error('Failed to update goal');

      // Update local state
      setTeamGoals(prev => prev.map(goal => 
        goal.id === goalId ? { ...goal, ...updates } : goal
      ));
      
      setIndividualGoals(prev => prev.map(goal => 
        goal.id === goalId ? { ...goal, ...updates } : goal
      ));
      
      toast.success('Goal updated successfully');
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal');
    }
  };

  // Team Goal Card Component
  const TeamGoalCard = ({ goal, depth = 0 }: { goal: TeamGoal; depth?: number }) => {
    const statusConfig = getStatusConfig(goal.status);
    const StatusIcon = statusConfig.icon;
    const GoalTypeIcon = getGoalTypeIcon(goal.goal_type);
    const achievementColor = getAchievementColor(goal.achievement_percentage);

    return (
      <Card className="mb-2" style={{ marginLeft: depth * 16 }}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3">
              <div className="flex items-center gap-2">
                <GoalTypeIcon className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-gray-500 font-mono">L{goal.team_level}</span>
              </div>
              
              <div>
                <h3 className="font-medium text-sm">{goal.team_name}</h3>
                <p className="text-xs text-gray-600 font-mono">{goal.team_path}</p>
                
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cn('text-xs px-1 py-0', statusConfig.color)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                  
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {goal.goal_type.charAt(0).toUpperCase() + goal.goal_type.slice(1)}
                  </Badge>
                  
                  {goal.is_sales_team && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">Sales Team</Badge>
                  )}
                  
                  {goal.auto_rollup && (
                    <Badge variant="outline" className="text-xs bg-purple-50 px-1 py-0">
                      <Zap className="h-3 w-3 mr-1" />
                      Auto Roll-up
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={cn('text-lg font-bold', achievementColor)}>
                {goal.achievement_percentage.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-600">
                ${(goal.current_amount/1000).toFixed(0)}k / ${(goal.target_amount/1000).toFixed(0)}k
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span className={achievementColor}>
                  {goal.achievement_percentage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(goal.achievement_percentage, 100)} 
                className="h-2"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <Label className="text-xs text-gray-500">Target</Label>
                <p className="font-medium">${(goal.target_amount/1000).toFixed(0)}k</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Current</Label>
                <p className="font-medium">${(goal.current_amount/1000).toFixed(0)}k</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Remaining</Label>
                <p className="font-medium">
                  ${Math.max(0, (goal.target_amount - goal.current_amount)/1000).toFixed(0)}k
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                <Calendar className="h-3 w-3 inline mr-1" />
                {new Date(goal.period_start).toLocaleDateString()} - {new Date(goal.period_end).toLocaleDateString()}
              </span>
              <span>
                <Clock className="h-3 w-3 inline mr-1" />
                Updated {new Date(goal.last_updated).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          {/* Child goals */}
          {goal.child_goals && goal.child_goals.length > 0 && (
            <div className="mt-4 pt-3 border-t">
              <h4 className="text-xs font-medium mb-2">Child Goals ({goal.child_goals.length})</h4>
              {goal.child_goals.map(childGoal => (
                <TeamGoalCard key={childGoal.id} goal={childGoal} depth={depth + 1} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Individual Goal Card Component
  const IndividualGoalCard = ({ goal }: { goal: IndividualGoal }) => {
    const statusConfig = getStatusConfig(goal.status);
    const StatusIcon = statusConfig.icon;
    const GoalTypeIcon = getGoalTypeIcon(goal.goal_type);
    const achievementColor = getAchievementColor(goal.achievement_percentage);

    return (
      <Card className="mb-2">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3">
              <GoalTypeIcon className="h-4 w-4 text-blue-600" />
              
              <div>
                <h3 className="font-medium text-sm">{goal.user_name}</h3>
                <p className="text-xs text-gray-600">{goal.user_email}</p>
                <p className="text-xs text-gray-500">{goal.team_name}</p>
                
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cn('text-xs px-1 py-0', statusConfig.color)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                  
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {goal.goal_type.charAt(0).toUpperCase() + goal.goal_type.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={cn('text-lg font-bold', achievementColor)}>
                {goal.achievement_percentage.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-600">
                ${(goal.current_amount/1000).toFixed(0)}k / ${(goal.target_amount/1000).toFixed(0)}k
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span className={achievementColor}>
                  {goal.achievement_percentage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(goal.achievement_percentage, 100)} 
                className="h-2"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <Label className="text-xs text-gray-500">Target</Label>
                <p className="font-medium">${(goal.target_amount/1000).toFixed(0)}k</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Current</Label>
                <p className="font-medium">${(goal.current_amount/1000).toFixed(0)}k</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Remaining</Label>
                <p className="font-medium">
                  ${Math.max(0, (goal.target_amount - goal.current_amount)/1000).toFixed(0)}k
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                <Calendar className="h-3 w-3 inline mr-1" />
                {new Date(goal.period_start).toLocaleDateString()} - {new Date(goal.period_end).toLocaleDateString()}
              </span>
              <span>
                <Clock className="h-3 w-3 inline mr-1" />
                Updated {new Date(goal.last_updated).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span>Loading goals...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <Card className="flex-shrink-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Smart Goals Management
          </CardTitle>
          <CardDescription>
            Intelligent goal tracking with automatic hierarchy roll-up and real-time performance monitoring
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-shrink-0">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-xl font-bold">{metrics.totalGoals}</p>
                <p className="text-xs text-gray-600">Total Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xl font-bold">{metrics.completedGoals}</p>
                <p className="text-xs text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="text-xl font-bold">{metrics.atRiskGoals}</p>
                <p className="text-xs text-gray-600">At Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-xl font-bold">{metrics.averageAchievement.toFixed(0)}%</p>
                <p className="text-xs text-gray-600">Avg Achievement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="flex-shrink-0">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by team, user, or goal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="behind">Behind</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterGoalType} onValueChange={setFilterGoalType}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="margin">Margin</SelectItem>
                <SelectItem value="deals">Deals</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={() => setShowCreateGoal(true)} className="h-9">
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Goals Tabs */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="team-goals" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Goals ({filteredTeamGoals.length})
            </TabsTrigger>
            <TabsTrigger value="individual-goals" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Individual Goals ({filteredIndividualGoals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team-goals" className="mt-4 flex-1 flex flex-col min-h-0">
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-lg">Team Goals with Hierarchy Roll-up</CardTitle>
                <CardDescription>
                  Automatic goal aggregation through team hierarchy using materialized paths
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                {filteredTeamGoals.length > 0 ? (
                  <div className="space-y-2 p-4 pt-0">
                    {filteredTeamGoals
                      .filter(goal => !goal.parent_goal_id) // Show only root goals
                      .map(goal => (
                        <TeamGoalCard key={goal.id} goal={goal} />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No team goals found matching the current filters</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="individual-goals" className="mt-4 flex-1 flex flex-col min-h-0">
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-lg">Individual Goals</CardTitle>
                <CardDescription>
                  Personal performance targets that roll up to team goals
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                {filteredIndividualGoals.length > 0 ? (
                  <div className="space-y-2 p-4 pt-0">
                    {filteredIndividualGoals.map(goal => (
                      <IndividualGoalCard key={goal.id} goal={goal} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No individual goals found matching the current filters</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 