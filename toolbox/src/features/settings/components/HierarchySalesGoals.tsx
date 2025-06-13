import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Building2, 
  ChevronDown, 
  ChevronRight, 
  Users, 
  Target, 
  TrendingUp,
  DollarSign,
  Percent,
  Award,
  Crown,
  Plus,
  Edit,
  Calculator,
  PiggyBank,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TeamHierarchyGoals, TeamTarget, MemberTarget, Team, TeamMember } from '../goals-management/types';

interface HierarchySalesGoalsProps {
  selectedYear?: number;
}

export function HierarchySalesGoals({ selectedYear = new Date().getFullYear() }: HierarchySalesGoalsProps) {
  // State
  const [hierarchyGoals, setHierarchyGoals] = useState<TeamHierarchyGoals[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showMemberGoals, setShowMemberGoals] = useState<string | null>(null);
  
  // Dialog states
  const [isCreatingTeamGoal, setIsCreatingTeamGoal] = useState(false);
  const [isCreatingMemberGoal, setIsCreatingMemberGoal] = useState(false);
  const [editingTeamGoal, setEditingTeamGoal] = useState<TeamTarget | null>(null);
  const [editingMemberGoal, setEditingMemberGoal] = useState<MemberTarget | null>(null);

  // Form states for team goals
  const [teamGoalForm, setTeamGoalForm] = useState({
    team_id: '',
    sales_target: '',
    gross_profit_percentage: '',
    design_allocation: '',
    pm_allocation: '',
    presidents_circle_target: ''
  });

  // Form states for member goals
  const [memberGoalForm, setMemberGoalForm] = useState({
    member_id: '',
    team_id: '',
    sales_target: '',
    gross_profit_percentage: '',
    design_allocation: '',
    pm_allocation: '',
    presidents_circle_target: ''
  });

  // Fetch hierarchy goals data
  useEffect(() => {
    const fetchHierarchyGoals = async () => {
      try {
        const token = localStorage.getItem('sb-access-token');
        
        // Fetch teams with hierarchy structure
        const teamsRes = await fetch('/api/teams-with-members', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!teamsRes.ok) throw new Error('Failed to fetch teams');
        const teamsData = await teamsRes.json();
        
        // Fetch team targets for the year
        const teamTargetsRes = await fetch(`/api/team-targets?year=${selectedYear}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const teamTargetsData = teamTargetsRes.ok ? await teamTargetsRes.json() : [];
        
        // Fetch member targets for the year
        const memberTargetsRes = await fetch(`/api/member-targets?year=${selectedYear}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const memberTargetsData = memberTargetsRes.ok ? await memberTargetsRes.json() : [];
        
        // Build hierarchy structure - only include sales teams
        const salesTeams = teamsData.filter((team: Team) => 
          team.is_sales_team
        );
        
        const hierarchyData = buildHierarchyGoals(salesTeams, teamTargetsData, memberTargetsData);
        setHierarchyGoals(hierarchyData);
        
        console.log('=== Hierarchy Sales Goals Loaded ===');
        console.log('Total teams from API:', teamsData.length);
        console.log('Sales teams count:', salesTeams.length);
        console.log('Sample sales teams:', salesTeams.slice(0, 3).map((t: any) => ({ id: t.id, name: t.name, is_sales_team: t.is_sales_team, parent_team_id: t.parent_team_id })));
        console.log('Team targets count:', teamTargetsData.length);
        console.log('Member targets count:', memberTargetsData.length);
        console.log('Hierarchy data count:', hierarchyData.length);
        console.log('Hierarchy data sample:', hierarchyData.slice(0, 2));
        
      } catch (error) {
        console.error('Error fetching hierarchy goals:', error);
        toast.error('Failed to load sales goals data');
      } finally {
        setLoading(false);
      }
    };

    fetchHierarchyGoals();
  }, [selectedYear]);

  // Build hierarchy goals structure
  const buildHierarchyGoals = useCallback((
    teams: Team[], 
    teamTargets: TeamTarget[], 
    memberTargets: MemberTarget[]
  ): TeamHierarchyGoals[] => {
    const teamMap = new Map<string, Team>();
    teams.forEach(team => teamMap.set(team.id, team));

    const buildTeamHierarchy = (team: Team): TeamHierarchyGoals => {
      const directTargets = teamTargets.find(tt => tt.team_id === team.id) || null;
      const teamMemberTargets = memberTargets.filter(mt => mt.team_id === team.id);
      
      // Get child teams
      const childTeams = teams
        .filter(t => t.parent_team_id === team.id)
        .map(buildTeamHierarchy);

      // Calculate rollup totals
      const rollupTotals = calculateRollupTotals(directTargets, teamMemberTargets, childTeams);

      return {
        team,
        direct_targets: directTargets,
        member_targets: teamMemberTargets,
        child_teams: childTeams,
        rollup_totals: rollupTotals,
        is_super_team_individual: team.is_super_team // Super teams treated as individuals
      };
    };

    // Return all sales teams - the hierarchy will be built in the component
    // For now, just return all sales teams to show something
    return teams.map(buildTeamHierarchy);
  }, []);

  // Calculate rollup totals for a team
  const calculateRollupTotals = (
    directTargets: TeamTarget | null,
    memberTargets: MemberTarget[],
    childTeams: TeamHierarchyGoals[]
  ) => {
    // Direct team totals
    const directSales = directTargets?.sales_target || 0;
    const directGpDollars = directTargets?.gross_profit_dollars || 0;
    const directDesign = directTargets?.design_allocation || 0;
    const directPm = directTargets?.pm_allocation || 0;
    const directPresCircle = directTargets?.presidents_circle_target || 0;

    // Member totals
    const memberSales = memberTargets.reduce((sum, mt) => sum + (mt.sales_target || 0), 0);
    const memberGpDollars = memberTargets.reduce((sum, mt) => sum + (mt.gross_profit_dollars || 0), 0);
    const memberDesign = memberTargets.reduce((sum, mt) => sum + (mt.design_allocation || 0), 0);
    const memberPm = memberTargets.reduce((sum, mt) => sum + (mt.pm_allocation || 0), 0);
    const memberPresCircle = memberTargets.reduce((sum, mt) => sum + (mt.presidents_circle_target || 0), 0);

    // Child teams totals
    const childSales = childTeams.reduce((sum, ct) => sum + ct.rollup_totals.sales_target_total, 0);
    const childGpDollars = childTeams.reduce((sum, ct) => sum + ct.rollup_totals.gross_profit_dollars_total, 0);
    const childDesign = childTeams.reduce((sum, ct) => sum + ct.rollup_totals.design_allocation_total, 0);
    const childPm = childTeams.reduce((sum, ct) => sum + ct.rollup_totals.pm_allocation_total, 0);
    const childPresCircle = childTeams.reduce((sum, ct) => sum + ct.rollup_totals.presidents_circle_total, 0);
    const childMemberCount = childTeams.reduce((sum, ct) => sum + ct.rollup_totals.member_count_total, 0);

    return {
      sales_target_total: directSales + memberSales + childSales,
      gross_profit_dollars_total: directGpDollars + memberGpDollars + childGpDollars,
      design_allocation_total: directDesign + memberDesign + childDesign,
      pm_allocation_total: directPm + memberPm + childPm,
      presidents_circle_total: directPresCircle + memberPresCircle + childPresCircle,
      member_count_total: memberTargets.length + childMemberCount
    };
  };

  // Format currency
  const formatCurrency = (value: number | null) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number | null) => {
    if (!value) return '0%';
    return `${value.toFixed(1)}%`;
  };

  // Team operations
  const toggleTeamExpansion = (teamId: string) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  // Create team goal
  const handleCreateTeamGoal = async () => {
    try {
      const token = localStorage.getItem('sb-access-token');
      const payload = {
        team_id: teamGoalForm.team_id,
        year: selectedYear,
        sales_target: teamGoalForm.sales_target ? parseFloat(teamGoalForm.sales_target) : null,
        gross_profit_percentage: teamGoalForm.gross_profit_percentage ? parseFloat(teamGoalForm.gross_profit_percentage) : null,
        design_allocation: teamGoalForm.design_allocation ? parseFloat(teamGoalForm.design_allocation) : null,
        pm_allocation: teamGoalForm.pm_allocation ? parseFloat(teamGoalForm.pm_allocation) : null,
        presidents_circle_target: teamGoalForm.presidents_circle_target ? parseFloat(teamGoalForm.presidents_circle_target) : null
      };

      const res = await fetch('/api/team-targets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create team goal');

      toast.success('Team goal created successfully');
      setIsCreatingTeamGoal(false);
      setTeamGoalForm({
        team_id: '',
        sales_target: '',
        gross_profit_percentage: '',
        design_allocation: '',
        pm_allocation: '',
        presidents_circle_target: ''
      });
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error creating team goal:', error);
      toast.error('Failed to create team goal');
    }
  };

  // Create member goal
  const handleCreateMemberGoal = async () => {
    try {
      const token = localStorage.getItem('sb-access-token');
      const payload = {
        member_id: memberGoalForm.member_id,
        team_id: memberGoalForm.team_id,
        year: selectedYear,
        sales_target: memberGoalForm.sales_target ? parseFloat(memberGoalForm.sales_target) : null,
        gross_profit_percentage: memberGoalForm.gross_profit_percentage ? parseFloat(memberGoalForm.gross_profit_percentage) : null,
        design_allocation: memberGoalForm.design_allocation ? parseFloat(memberGoalForm.design_allocation) : null,
        pm_allocation: memberGoalForm.pm_allocation ? parseFloat(memberGoalForm.pm_allocation) : null,
        presidents_circle_target: memberGoalForm.presidents_circle_target ? parseFloat(memberGoalForm.presidents_circle_target) : null
      };

      const res = await fetch('/api/member-targets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create member goal');

      toast.success('Member goal created successfully');
      setIsCreatingMemberGoal(false);
      setMemberGoalForm({
        member_id: '',
        team_id: '',
        sales_target: '',
        gross_profit_percentage: '',
        design_allocation: '',
        pm_allocation: '',
        presidents_circle_target: ''
      });
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error creating member goal:', error);
      toast.error('Failed to create member goal');
    }
  };

  // Team Hierarchy Card Component
  const TeamHierarchyCard = ({ teamGoal, depth = 0 }: { teamGoal: TeamHierarchyGoals; depth?: number }) => {
    const { team, direct_targets, member_targets, child_teams, rollup_totals, is_super_team_individual } = teamGoal;
    const isExpanded = expandedTeams.has(team.id);
    const hasChildren = child_teams.length > 0;
    const hasMembers = member_targets.length > 0;
    const showingMemberGoals = showMemberGoals === team.id;

    return (
      <div className={cn(
        'border rounded-md mb-2 transition-all duration-200',
        is_super_team_individual && 'border-purple-200 bg-purple-50'
      )} style={{ marginLeft: depth * 16 }}>
        <div className="p-4">
          {/* Team Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => toggleTeamExpansion(team.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              )}
              
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <h3 className="font-medium text-lg">{team.name}</h3>
                
                {team.is_super_team && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    Super Team
                  </Badge>
                )}
                
                {is_super_team_individual && (
                  <Badge variant="outline" className="text-xs">Individual Goals</Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!direct_targets && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTeamGoalForm({ ...teamGoalForm, team_id: team.id });
                    setIsCreatingTeamGoal(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Set Goals
                </Button>
              )}
              
              {hasMembers && (
                <Button
                  size="sm"
                  variant={showingMemberGoals ? "default" : "outline"}
                  onClick={() => setShowMemberGoals(showingMemberGoals ? null : team.id)}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Members ({member_targets.length})
                </Button>
              )}
            </div>
          </div>

          {/* Goals Summary */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-600">Sales Target</span>
              </div>
              <p className="text-lg font-bold text-blue-800">
                {formatCurrency(rollup_totals.sales_target_total)}
              </p>
              {direct_targets?.sales_target && (
                <p className="text-xs text-blue-600">
                  Direct: {formatCurrency(direct_targets.sales_target)}
                </p>
              )}
            </div>

            <div className="bg-green-50 p-3 rounded">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-600">Gross Profit $</span>
              </div>
              <p className="text-lg font-bold text-green-800">
                {formatCurrency(rollup_totals.gross_profit_dollars_total)}
              </p>
              {direct_targets?.gross_profit_percentage && (
                <p className="text-xs text-green-600">
                  {formatPercentage(direct_targets.gross_profit_percentage)} margin
                </p>
              )}
            </div>

            <div className="bg-orange-50 p-3 rounded">
              <div className="flex items-center gap-2 mb-1">
                <Calculator className="h-4 w-4 text-orange-600" />
                <span className="text-xs font-medium text-orange-600">Design Allocation</span>
              </div>
              <p className="text-lg font-bold text-orange-800">
                {formatCurrency(rollup_totals.design_allocation_total)}
              </p>
            </div>

            <div className="bg-indigo-50 p-3 rounded">
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-medium text-indigo-600">PM Allocation</span>
              </div>
              <p className="text-lg font-bold text-indigo-800">
                {formatCurrency(rollup_totals.pm_allocation_total)}
              </p>
            </div>

            <div className="bg-yellow-50 p-3 rounded">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-yellow-600" />
                <span className="text-xs font-medium text-yellow-600">President's Circle</span>
              </div>
              <p className="text-lg font-bold text-yellow-800">
                {formatCurrency(rollup_totals.presidents_circle_total)}
              </p>
            </div>
          </div>

          {/* Member Goals Table */}
          {showingMemberGoals && hasMembers && (
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Individual Member Goals</h4>
                <Button
                  size="sm"
                  onClick={() => {
                    setMemberGoalForm({ ...memberGoalForm, team_id: team.id });
                    setIsCreatingMemberGoal(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Member Goal
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-2">Member</th>
                      <th className="text-right p-2">Sales Target</th>
                      <th className="text-right p-2">GP %</th>
                      <th className="text-right p-2">GP $</th>
                      <th className="text-right p-2">Design</th>
                      <th className="text-right p-2">PM</th>
                      <th className="text-right p-2">Pres Circle</th>
                      <th className="text-center p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {member_targets.map(memberTarget => (
                      <tr key={memberTarget.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{memberTarget.member_name}</p>
                            <p className="text-xs text-gray-500">{memberTarget.member_email}</p>
                          </div>
                        </td>
                        <td className="text-right p-2">{formatCurrency(memberTarget.sales_target)}</td>
                        <td className="text-right p-2">{formatPercentage(memberTarget.gross_profit_percentage)}</td>
                        <td className="text-right p-2">{formatCurrency(memberTarget.gross_profit_dollars)}</td>
                        <td className="text-right p-2">{formatCurrency(memberTarget.design_allocation)}</td>
                        <td className="text-right p-2">{formatCurrency(memberTarget.pm_allocation)}</td>
                        <td className="text-right p-2">{formatCurrency(memberTarget.presidents_circle_target)}</td>
                        <td className="text-center p-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingMemberGoal(memberTarget)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Child Teams */}
        {hasChildren && isExpanded && (
          <div className="border-t">
            {child_teams.map(childTeam => (
              <TeamHierarchyCard key={childTeam.team.id} teamGoal={childTeam} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span>Loading hierarchy sales goals...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <Card className="flex-shrink-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Hierarchy Sales Goals - {selectedYear}
              </CardTitle>
              <CardDescription>
                Sales goals with automatic hierarchy roll-ups. Super teams are treated as individuals.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setExpandedTeams(new Set(hierarchyGoals.map(hg => hg.team.id)))}>
                Expand All
              </Button>
              <Button onClick={() => setExpandedTeams(new Set())}>
                Collapse All
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Sales Goals Hierarchy */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 overflow-y-auto p-0">
          <div className="space-y-2 p-4">
            {hierarchyGoals.map(teamGoal => (
              <TeamHierarchyCard key={teamGoal.team.id} teamGoal={teamGoal} />
            ))}
            
            {hierarchyGoals.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No sales teams found for hierarchy goals</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Team Goal Dialog */}
      <Dialog open={isCreatingTeamGoal} onOpenChange={setIsCreatingTeamGoal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Team Sales Goals</DialogTitle>
            <DialogDescription>
              Set sales targets and allocations for this team.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="sales-target">Sales Target</Label>
              <Input
                id="sales-target"
                type="number"
                value={teamGoalForm.sales_target}
                onChange={(e) => setTeamGoalForm({ ...teamGoalForm, sales_target: e.target.value })}
                placeholder="1000000"
              />
            </div>

            <div>
              <Label htmlFor="gp-percentage">Gross Profit Percentage</Label>
              <Input
                id="gp-percentage"
                type="number"
                step="0.1"
                value={teamGoalForm.gross_profit_percentage}
                onChange={(e) => setTeamGoalForm({ ...teamGoalForm, gross_profit_percentage: e.target.value })}
                placeholder="25.0"
              />
            </div>

            <div>
              <Label htmlFor="design-allocation">Design Allocation</Label>
              <Input
                id="design-allocation"
                type="number"
                value={teamGoalForm.design_allocation}
                onChange={(e) => setTeamGoalForm({ ...teamGoalForm, design_allocation: e.target.value })}
                placeholder="50000"
              />
            </div>

            <div>
              <Label htmlFor="pm-allocation">PM Allocation</Label>
              <Input
                id="pm-allocation"
                type="number"
                value={teamGoalForm.pm_allocation}
                onChange={(e) => setTeamGoalForm({ ...teamGoalForm, pm_allocation: e.target.value })}
                placeholder="75000"
              />
            </div>

            <div>
              <Label htmlFor="presidents-circle">President's Circle Target</Label>
              <Input
                id="presidents-circle"
                type="number"
                value={teamGoalForm.presidents_circle_target}
                onChange={(e) => setTeamGoalForm({ ...teamGoalForm, presidents_circle_target: e.target.value })}
                placeholder="500000"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingTeamGoal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTeamGoal}>
              Create Goals
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Member Goal Dialog */}
      <Dialog open={isCreatingMemberGoal} onOpenChange={setIsCreatingMemberGoal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Member Sales Goals</DialogTitle>
            <DialogDescription>
              Set individual sales targets and allocations for this team member.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="member-select">Team Member</Label>
              <Select 
                value={memberGoalForm.member_id} 
                onValueChange={(value) => setMemberGoalForm({ ...memberGoalForm, member_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {/* This would be populated with team members */}
                  <SelectItem value="member1">John Doe</SelectItem>
                  <SelectItem value="member2">Jane Smith</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="member-sales-target">Sales Target</Label>
              <Input
                id="member-sales-target"
                type="number"
                value={memberGoalForm.sales_target}
                onChange={(e) => setMemberGoalForm({ ...memberGoalForm, sales_target: e.target.value })}
                placeholder="250000"
              />
            </div>

            <div>
              <Label htmlFor="member-gp-percentage">Gross Profit Percentage</Label>
              <Input
                id="member-gp-percentage"
                type="number"
                step="0.1"
                value={memberGoalForm.gross_profit_percentage}
                onChange={(e) => setMemberGoalForm({ ...memberGoalForm, gross_profit_percentage: e.target.value })}
                placeholder="25.0"
              />
            </div>

            <div>
              <Label htmlFor="member-design-allocation">Design Allocation</Label>
              <Input
                id="member-design-allocation"
                type="number"
                value={memberGoalForm.design_allocation}
                onChange={(e) => setMemberGoalForm({ ...memberGoalForm, design_allocation: e.target.value })}
                placeholder="15000"
              />
            </div>

            <div>
              <Label htmlFor="member-pm-allocation">PM Allocation</Label>
              <Input
                id="member-pm-allocation"
                type="number"
                value={memberGoalForm.pm_allocation}
                onChange={(e) => setMemberGoalForm({ ...memberGoalForm, pm_allocation: e.target.value })}
                placeholder="20000"
              />
            </div>

            <div>
              <Label htmlFor="member-presidents-circle">President's Circle Target</Label>
              <Input
                id="member-presidents-circle"
                type="number"
                value={memberGoalForm.presidents_circle_target}
                onChange={(e) => setMemberGoalForm({ ...memberGoalForm, presidents_circle_target: e.target.value })}
                placeholder="150000"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingMemberGoal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateMemberGoal}>
              Create Goals
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 