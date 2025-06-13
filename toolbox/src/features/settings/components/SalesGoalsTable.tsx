import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Building2, 
  Users, 
  Target, 
  DollarSign,
  Percent,
  Save,
  Plus,
  Home,
  Calculator,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SalesGoalsTableProps {
  selectedYear?: number;
}

interface TeamGoal {
  id?: string;
  team_id: string;
  team_name: string;
  // Annual targets (primary inputs)
  annual_sell_dollars: number | null;
  annual_margin_percentage: number | null;
  annual_gp_dollars: number | null; // Calculated
  // Additional allocations
  presidents_circle_target: number | null;
  design_allocation: number | null;
  pm_allocation: number | null;
  is_dirty?: boolean; // For tracking changes
}

interface MemberGoal {
  id?: string;
  member_id: string;
  member_name: string;
  member_email?: string;
  team_id: string;
  team_name: string;
  // Quarterly targets (calculated from annual)
  quarterly_sell_dollars: number | null;
  quarterly_margin_percentage: number | null;
  quarterly_gp_dollars: number | null; // Calculated
  // Annual targets (primary inputs)
  annual_sell_dollars: number | null;
  annual_margin_percentage: number | null;
  annual_gp_dollars: number | null; // Calculated
  // Additional allocations
  presidents_circle_target: number | null;
  design_allocation: number | null;
  pm_allocation: number | null;
  is_house_account?: boolean;
  is_dirty?: boolean; // For tracking changes
}

interface TeamSummary {
  team_id: string;
  team_name: string;
  members: MemberGoal[];
  // Calculated totals
  quarterly_sell_total: number;
  quarterly_gp_total: number;
  quarterly_margin_avg: number;
  annual_sell_total: number;
  annual_gp_total: number;
  annual_margin_avg: number;
  presidents_circle_total: number;
  design_allocation_total: number;
  pm_allocation_total: number;
}

interface TeamHierarchy {
  team: any;
  members: MemberGoal[];
  children: TeamHierarchy[];
  summary: TeamSummary;
  depth: number;
}

export function SalesGoalsTable({ selectedYear = new Date().getFullYear() }: SalesGoalsTableProps) {
  const [memberGoals, setMemberGoals] = useState<MemberGoal[]>([]);
  const [teamGoals, setTeamGoals] = useState<TeamGoal[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [activeInput, setActiveInput] = useState<string | null>(null); // Track which input is being edited

  // Generate a unique house account UUID for a team
  const generateHouseAccountUUID = (teamId: string) => {
    // House accounts use NULL member_id in the database
    // This function now returns a special identifier for UI purposes only
    return `house-account-${teamId}`;
  };
  
  // Helper function to check if a member is a house account
  const isHouseAccountMember = (memberId: string | undefined | null) => memberId && memberId.startsWith('house-account-');

  // Fetch data
  useEffect(() => {
    const fetchGoalsData = async () => {
      try {
        const token = localStorage.getItem('sb-access-token');
        
        // Fetch teams with members and hierarchy - include super teams
        const teamsRes = await fetch('/api/teams-with-members', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!teamsRes.ok) throw new Error('Failed to fetch teams');
        const allTeamsData = await teamsRes.json();
        
        // Fetch existing team targets for the year (for super teams)
        const teamTargetsRes = await fetch(`/api/team-targets?year=${selectedYear}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const teamTargetsData = teamTargetsRes.ok ? await teamTargetsRes.json() : [];
        
        // Fetch existing member targets for the year
        const targetsRes = await fetch(`/api/member-targets?year=${selectedYear}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const targetsData = targetsRes.ok ? await targetsRes.json() : [];
        
        // Build member goals structure and team goals structure
        const goals: MemberGoal[] = [];
        const teamGoalsData: TeamGoal[] = [];
        
        // Filter teams: include all sales teams and all super teams (but respect hierarchy)
        // Super teams should appear at top of their parent team, not at the very top
        const filteredTeamsData = allTeamsData.filter((team: any) => 
          team.is_sales_team || 
          (team.is_super_team && allTeamsData.some((t: any) => t.is_sales_team && t.id === team.parent_team_id))
        );
        
        // Store teams data for hierarchy building
        setTeams(filteredTeamsData);
        
        filteredTeamsData.forEach((team: any) => {
          if (team.is_super_team) {
            // For super teams, create team-level goals
            const existingTeamTarget = teamTargetsData.find((t: any) => 
              t.team_id === team.id
            );
            
            teamGoalsData.push({
              id: existingTeamTarget?.id,
              team_id: team.id,
              team_name: team.name,
              // Annual targets (primary inputs)
              annual_sell_dollars: existingTeamTarget?.sales_target || null,
              annual_margin_percentage: existingTeamTarget?.gross_profit_percentage || null,
              annual_gp_dollars: existingTeamTarget?.gross_profit_dollars || null,
              // Additional allocations
              presidents_circle_target: existingTeamTarget?.presidents_circle_target || null,
              design_allocation: existingTeamTarget?.design_allocation || null,
              pm_allocation: existingTeamTarget?.pm_allocation || null
            });
            
            // Still add members to goals but as non-editable (for display only)
            if (team.members) {
              team.members.forEach((member: any) => {
                goals.push({
                  member_id: member.azure_id,
                  member_name: member.name,
                  member_email: member.email,
                  team_id: team.id,
                  team_name: team.name,
                  annual_sell_dollars: null,
                  annual_margin_percentage: null,
                  annual_gp_dollars: null,
                  quarterly_sell_dollars: null,
                  quarterly_margin_percentage: null,
                  quarterly_gp_dollars: null,
                  presidents_circle_target: null,
                  design_allocation: null,
                  pm_allocation: null,
                  is_house_account: false
                });
              });
            }
          } else {
            // For regular teams, create member-level goals
            if (team.members) {
              team.members.forEach((member: any) => {
                const existingTarget = targetsData.find((t: any) => 
                  t.member_id === member.azure_id && t.team_id === team.id
                );
                
                goals.push({
                  id: existingTarget?.id,
                  member_id: member.azure_id,
                  member_name: member.name,
                  member_email: member.email,
                  team_id: team.id,
                  team_name: team.name,
                  // Annual targets (primary inputs)
                  annual_sell_dollars: existingTarget?.sales_target || null,
                  annual_margin_percentage: existingTarget?.gross_profit_percentage || null,
                  annual_gp_dollars: existingTarget?.gross_profit_dollars || null,
                  // Quarterly targets (calculated from annual)
                  quarterly_sell_dollars: existingTarget?.sales_target ? existingTarget.sales_target / 4 : null,
                  quarterly_margin_percentage: existingTarget?.gross_profit_percentage || null,
                  quarterly_gp_dollars: existingTarget?.gross_profit_dollars ? existingTarget.gross_profit_dollars / 4 : null,
                  // Additional allocations
                  presidents_circle_target: existingTarget?.presidents_circle_target || null,
                  design_allocation: existingTarget?.design_allocation || null,
                  pm_allocation: existingTarget?.pm_allocation || null,
                  is_house_account: false
                });
              });
            }
            
            // Add house account if team has one
            if (team.house_account_erp_id || team.house_account_salesforce_id) {
              const houseAccountUUID = generateHouseAccountUUID(team.id);
              const houseTarget = targetsData.find((t: any) => 
                t.team_id === team.id && t.member_id === null
              );
              
              goals.push({
                id: houseTarget?.id,
                member_id: houseAccountUUID, // UI identifier only
                member_name: 'House Account',
                member_email: undefined,
                team_id: team.id,
                team_name: team.name,
                // Annual targets (primary inputs)
                annual_sell_dollars: houseTarget?.sales_target || null,
                annual_margin_percentage: houseTarget?.gross_profit_percentage || null,
                annual_gp_dollars: houseTarget?.gross_profit_dollars || null,
                // Quarterly targets (calculated from annual)
                quarterly_sell_dollars: houseTarget?.sales_target ? houseTarget.sales_target / 4 : null,
                quarterly_margin_percentage: houseTarget?.gross_profit_percentage || null,
                quarterly_gp_dollars: houseTarget?.gross_profit_dollars ? houseTarget.gross_profit_dollars / 4 : null,
                // Additional allocations
                presidents_circle_target: houseTarget?.presidents_circle_target || null,
                design_allocation: houseTarget?.design_allocation || null,
                pm_allocation: houseTarget?.pm_allocation || null,
                is_house_account: true
              });
            }
          }
        });
        
        setMemberGoals(goals);
        setTeamGoals(teamGoalsData);
        
        // Debug logging
        console.log('=== Sales Goals Data Loaded ===');
        console.log('Total goals loaded:', goals.length);
        console.log('Goals with sales targets:', goals.filter(g => g.annual_sell_dollars).length);
        console.log('Sample goals with data:', goals.filter(g => g.annual_sell_dollars).slice(0, 3).map(g => ({
          member_name: g.member_name,
          team_name: g.team_name,
          annual_sell_dollars: g.annual_sell_dollars,
          annual_margin_percentage: g.annual_margin_percentage,
          annual_gp_dollars: g.annual_gp_dollars
        })));
        console.log('Member targets from API:', targetsData.length, 'records');
        
        // Expand sales teams initially for better UX (super teams start collapsed since they're now collapsible)
        const salesTeamsToExpand = filteredTeamsData.filter((t: any) => t.is_sales_team && !t.is_super_team).map((t: any) => t.id);
        setExpandedTeams(new Set(salesTeamsToExpand));
        
      } catch (error) {
        console.error('Error fetching goals data:', error);
        toast.error('Failed to load sales goals data');
      } finally {
        setLoading(false);
      }
    };

    fetchGoalsData();
  }, [selectedYear]);

  // Build team hierarchy
  const buildTeamHierarchy = (teams: any[], memberGoals: MemberGoal[], teamGoals: TeamGoal[], parentId: string | null = null, depth: number = 0): TeamHierarchy[] => {
    return teams
      .filter(team => team.parent_team_id === parentId)
      // Sort teams: super teams first within their parent, then regular teams alphabetically
      .sort((a, b) => {
        if (a.is_super_team && !b.is_super_team) return -1;
        if (!a.is_super_team && b.is_super_team) return 1;
        return a.name.localeCompare(b.name);
      })
      .map(team => {
        const teamMembers = memberGoals.filter(goal => goal.team_id === team.id);
        const teamGoal = teamGoals.find(goal => goal.team_id === team.id);
        const children = buildTeamHierarchy(teams, memberGoals, teamGoals, team.id, depth + 1);
        
        // Calculate team summary including children
        let directTotals;
        if (team.is_super_team && teamGoal) {
          // For super teams, use team-level goals
          directTotals = {
            annual_sell_total: teamGoal.annual_sell_dollars || 0,
            annual_gp_total: teamGoal.annual_gp_dollars || 0,
            presidents_circle_total: teamGoal.presidents_circle_target || 0,
            design_allocation_total: teamGoal.design_allocation || 0,
            pm_allocation_total: teamGoal.pm_allocation || 0,
          };
        } else {
          // For regular teams, use member-level goals
          directTotals = calculateTeamTotals(teamMembers);
        }
        
        const childTotals = children.reduce((acc, child) => ({
          annual_sell_total: acc.annual_sell_total + child.summary.annual_sell_total,
          annual_gp_total: acc.annual_gp_total + child.summary.annual_gp_total,
          presidents_circle_total: acc.presidents_circle_total + child.summary.presidents_circle_total,
          design_allocation_total: acc.design_allocation_total + child.summary.design_allocation_total,
          pm_allocation_total: acc.pm_allocation_total + child.summary.pm_allocation_total,
        }), {
          annual_sell_total: 0,
          annual_gp_total: 0,
          presidents_circle_total: 0,
          design_allocation_total: 0,
          pm_allocation_total: 0,
        });

        const totalSell = directTotals.annual_sell_total + childTotals.annual_sell_total;
        const totalGp = directTotals.annual_gp_total + childTotals.annual_gp_total;

        const summary: TeamSummary = {
          team_id: team.id,
          team_name: team.name,
          members: teamMembers,
          quarterly_sell_total: totalSell / 4,
          quarterly_gp_total: totalGp / 4,
          quarterly_margin_avg: totalSell > 0 ? (totalGp / totalSell) * 100 : 0,
          annual_sell_total: totalSell,
          annual_gp_total: totalGp,
          annual_margin_avg: totalSell > 0 ? (totalGp / totalSell) * 100 : 0,
          presidents_circle_total: directTotals.presidents_circle_total + childTotals.presidents_circle_total,
          design_allocation_total: directTotals.design_allocation_total + childTotals.design_allocation_total,
          pm_allocation_total: directTotals.pm_allocation_total + childTotals.pm_allocation_total,
        };

        return {
          team,
          members: teamMembers,
          children,
          summary,
          depth
        };
      });
  };

  const calculateTeamTotals = (members: MemberGoal[]) => {
    return {
      annual_sell_total: members.reduce((sum, m) => sum + (m.annual_sell_dollars || 0), 0),
      annual_gp_total: members.reduce((sum, m) => sum + (m.annual_gp_dollars || 0), 0),
      presidents_circle_total: members.reduce((sum, m) => sum + (m.presidents_circle_target || 0), 0),
      design_allocation_total: members.reduce((sum, m) => sum + (m.design_allocation || 0), 0),
      pm_allocation_total: members.reduce((sum, m) => sum + (m.pm_allocation || 0), 0),
    };
  };

  // Calculate team hierarchy
  const teamHierarchy = useMemo(() => {
    return buildTeamHierarchy(teams, memberGoals, teamGoals);
  }, [teams, memberGoals, teamGoals]);

  // Calculate grand totals
  const grandTotals = useMemo(() => {
    const calculateHierarchyTotals = (hierarchy: TeamHierarchy[]): any => {
      return hierarchy.reduce((acc, team) => ({
        annual_sell_total: acc.annual_sell_total + team.summary.annual_sell_total,
        annual_gp_total: acc.annual_gp_total + team.summary.annual_gp_total,
        presidents_circle_total: acc.presidents_circle_total + team.summary.presidents_circle_total,
        design_allocation_total: acc.design_allocation_total + team.summary.design_allocation_total,
        pm_allocation_total: acc.pm_allocation_total + team.summary.pm_allocation_total,
      }), {
        annual_sell_total: 0,
        annual_gp_total: 0,
        presidents_circle_total: 0,
        design_allocation_total: 0,
        pm_allocation_total: 0,
      });
    };

    const totals = calculateHierarchyTotals(teamHierarchy);
    
    return {
      ...totals,
      annual_margin_avg: totals.annual_sell_total > 0 ? (totals.annual_gp_total / totals.annual_sell_total) * 100 : 0,
    };
  }, [teamHierarchy]);

  // Toggle team expansion
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

  // Render team hierarchy recursively
  const renderTeamHierarchy = (hierarchy: TeamHierarchy[]): React.ReactNode => {
    return hierarchy.map(teamNode => {
      const isExpanded = expandedTeams.has(teamNode.team.id);
      const hasMembers = teamNode.members.length > 0;
      const hasChildren = teamNode.children.length > 0;
      const indentStyle = { paddingLeft: `${teamNode.depth * 16 + 12}px` };
      const isSuper = teamNode.team.is_super_team;
      
      // Super teams and regular expanded teams should show members
      // Regular teams should show children when expanded
      const shouldShowMembers = hasMembers && isExpanded;
      const shouldShowChildren = !isSuper && isExpanded && hasChildren;
      
      // Get team goal for super teams
      const teamGoal = teamGoals.find(goal => goal.team_id === teamNode.team.id);

      return (
        <React.Fragment key={teamNode.team.id}>
          {/* Team Header Row */}
          <tr className={cn(
            "border-b border-gray-200",
            isSuper ? "bg-purple-50" : "bg-gray-50"
          )}>
            <td className="p-3" style={indentStyle}>
              <div className="flex items-center gap-2">
                {(hasMembers || hasChildren) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => toggleTeamExpansion(teamNode.team.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                )}
                {isSuper && !(hasMembers || hasChildren) && (
                  <div className="h-5 w-5 flex items-center justify-center">
                    <Users className="h-3 w-3 text-purple-600" />
                  </div>
                )}
                {!isSuper && <Building2 className="h-4 w-4 text-blue-600" />}
                <span className={cn(
                  "font-semibold",
                  isSuper ? "text-purple-900" : "text-gray-900"
                )}>{teamNode.team.name}</span>
                {teamNode.team.is_super_team && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                    Super Team
                  </Badge>
                )}
                {isSuper && (
                  <span className="text-xs text-purple-600 ml-2">
                    (Team goals • {teamNode.members.length} members)
                  </span>
                )}
              </div>
            </td>
            
            {/* For super teams, make the header row editable */}
            {isSuper ? (
              <>
                {/* Annual Sell Dollars - Editable */}
                <td className="p-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <Input
                      type="text"
                      value={getInputValue(
                        `team-${teamNode.team.id}-annual_sell_dollars`,
                        teamGoal?.annual_sell_dollars,
                        activeInput === `team-${teamNode.team.id}-annual_sell_dollars`
                      )}
                      onFocus={() => setActiveInput(`team-${teamNode.team.id}-annual_sell_dollars`)}
                      onBlur={() => setActiveInput(null)}
                      onChange={(e) => updateTeamGoal(teamNode.team.id, 'annual_sell_dollars', e.target.value)}
                      className="text-right w-40 pl-8"
                      placeholder="0"
                    />
                  </div>
                </td>
                
                {/* Annual Margin % - Editable */}
                <td className="p-3">
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      value={formatPercentageInput(teamGoal?.annual_margin_percentage || null)}
                      onChange={(e) => updateTeamGoal(teamNode.team.id, 'annual_margin_percentage', e.target.value)}
                      className="text-right w-20 pr-6"
                      placeholder="0"
                    />
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">%</span>
                  </div>
                </td>
                
                {/* Annual GP Dollars - Calculated */}
                <td className="p-3 text-right font-medium text-purple-700">
                  {formatCurrency(teamGoal?.annual_gp_dollars || null)}
                </td>
                
                {/* President's Circle - Editable */}
                <td className="p-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <Input
                      type="text"
                      value={getInputValue(
                        `team-${teamNode.team.id}-presidents_circle_target`,
                        teamGoal?.presidents_circle_target,
                        activeInput === `team-${teamNode.team.id}-presidents_circle_target`
                      )}
                      onFocus={() => setActiveInput(`team-${teamNode.team.id}-presidents_circle_target`)}
                      onBlur={() => setActiveInput(null)}
                      onChange={(e) => updateTeamGoal(teamNode.team.id, 'presidents_circle_target', e.target.value)}
                      className="text-right w-36 pl-8"
                      placeholder="0"
                    />
                  </div>
                </td>
                
                {/* Design Allocation - Editable */}
                <td className="p-3">
                  <Input
                    type="number"
                    value={teamGoal?.design_allocation || ''}
                    onChange={(e) => updateTeamGoal(teamNode.team.id, 'design_allocation', e.target.value)}
                    className="text-right w-32"
                    placeholder="0"
                  />
                </td>
                
                {/* PM Allocation - Editable */}
                <td className="p-3">
                  <Input
                    type="number"
                    value={teamGoal?.pm_allocation || ''}
                    onChange={(e) => updateTeamGoal(teamNode.team.id, 'pm_allocation', e.target.value)}
                    className="text-right w-32"
                    placeholder="0"
                  />
                </td>
              </>
            ) : (
              <>
                {/* For regular teams, show calculated totals */}
                <td className={cn(
                  "p-3 text-right font-semibold",
                  isSuper ? "text-purple-700" : "text-blue-700"
                )}>
                  {formatCurrency(teamNode.summary.annual_sell_total)}
                </td>
                <td className={cn(
                  "p-3 text-right font-semibold",
                  isSuper ? "text-purple-700" : "text-blue-700"
                )}>
                  {teamNode.summary.annual_margin_avg.toFixed(2)}%
                </td>
                <td className={cn(
                  "p-3 text-right font-semibold",
                  isSuper ? "text-purple-700" : "text-green-700"
                )}>
                  {formatCurrency(teamNode.summary.annual_gp_total)}
                </td>
                <td className={cn(
                  "p-3 text-right font-semibold",
                  isSuper ? "text-purple-700" : "text-blue-700"
                )}>
                  {formatCurrency(teamNode.summary.presidents_circle_total)}
                </td>
                <td className={cn(
                  "p-3 text-right font-semibold",
                  isSuper ? "text-purple-700" : "text-blue-700"
                )}>
                  {formatCurrency(teamNode.summary.design_allocation_total)}
                </td>
                <td className={cn(
                  "p-3 text-right font-semibold",
                  isSuper ? "text-purple-700" : "text-blue-700"
                )}>
                  {formatCurrency(teamNode.summary.pm_allocation_total)}
                </td>
              </>
            )}
          </tr>

          {/* Child Teams (super teams) - render BEFORE members */}
          {shouldShowChildren && renderTeamHierarchy(teamNode.children)}

          {/* Team Members - for super teams show as info only when expanded, for regular teams show as editable when expanded */}
          {shouldShowMembers && teamNode.members
            .sort((a, b) => {
              // Put house accounts last within members
              if (isHouseAccountMember(a.member_id) && !isHouseAccountMember(b.member_id)) return 1;
              if (!isHouseAccountMember(a.member_id) && isHouseAccountMember(b.member_id)) return -1;
              return a.member_name.localeCompare(b.member_name);
            })
            .map((member, index) => {
              // Debug logging for undefined member_id
              if (!member.member_id) {
                console.log('Member with undefined member_id:', {
                  member_name: member.member_name,
                  team_id: member.team_id,
                  team_name: member.team_name,
                  member_email: member.member_email,
                  is_house_account: member.is_house_account,
                  member: member
                });
              }
              
              return (
              <tr 
                key={`${member.member_id || 'undefined'}-${member.team_id || 'no-team'}-${index}`}
                className={cn(
                  "border-b transition-colors",
                  member.is_dirty && "bg-yellow-50 border-yellow-200",
                  isHouseAccountMember(member.member_id) && "bg-blue-50",
                  isSuper ? "bg-purple-25 opacity-75" : "hover:bg-gray-50"
                )}
              >
                <td className="p-3" style={{ paddingLeft: `${(teamNode.depth + 1) * 16 + 12}px` }}>
                  <div className="flex items-center gap-2">
                    {isHouseAccountMember(member.member_id) ? (
                      <Home className="h-4 w-4 text-blue-600" />
                    ) : isSuper ? (
                      <Users className="h-3 w-3 text-purple-400" />
                    ) : (
                      <Users className="h-4 w-4 text-gray-400" />
                    )}
                    <div>
                      <p className={cn(
                        "font-medium",
                        isSuper && "text-purple-700 text-sm"
                      )}>{member.member_name}</p>
                      <p className="text-xs text-gray-500">{member.member_email}</p>
                      {isSuper && (
                        <p className="text-xs text-purple-500 italic">Member of super team</p>
                      )}
                    </div>
                  </div>
                </td>
                
                {isSuper ? (
                  /* For super team members, show as read-only info */
                  <>
                    <td className="p-3 text-right text-gray-400 text-sm">—</td>
                    <td className="p-3 text-right text-gray-400 text-sm">—</td>
                    <td className="p-3 text-right text-gray-400 text-sm">—</td>
                    <td className="p-3 text-right text-gray-400 text-sm">—</td>
                    <td className="p-3 text-right text-gray-400 text-sm">—</td>
                    <td className="p-3 text-right text-gray-400 text-sm">—</td>
                  </>
                ) : (
                  /* For regular team members, show editable fields */
                  <>
                    {/* Annual Sell Dollars */}
                    <td className="p-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <Input
                          type="text"
                          value={getInputValue(
                            `member-${member.member_id}-${member.team_id}-annual_sell_dollars`,
                            member.annual_sell_dollars,
                            activeInput === `member-${member.member_id}-${member.team_id}-annual_sell_dollars`
                          )}
                          onFocus={() => setActiveInput(`member-${member.member_id}-${member.team_id}-annual_sell_dollars`)}
                          onBlur={() => setActiveInput(null)}
                          onChange={(e) => updateMemberGoal(member.member_id, member.team_id, 'annual_sell_dollars', e.target.value)}
                          className="text-right w-40 pl-8"
                          placeholder="0"
                        />
                      </div>
                    </td>
                    
                    {/* Annual Margin % */}
                    <td className="p-3">
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.1"
                          value={formatPercentageInput(member.annual_margin_percentage || null)}
                          onChange={(e) => updateMemberGoal(member.member_id, member.team_id, 'annual_margin_percentage', e.target.value)}
                          className="text-right w-20 pr-6"
                          placeholder="0"
                        />
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">%</span>
                      </div>
                    </td>
                    
                    {/* Annual GP Dollars (calculated) */}
                    <td className="p-3 text-right font-medium text-green-700">
                      {formatCurrency(member.annual_gp_dollars || null)}
                    </td>
                    
                    {/* President's Circle */}
                    <td className="p-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <Input
                          type="text"
                          value={getInputValue(
                            `member-${member.member_id}-${member.team_id}-presidents_circle_target`,
                            member.presidents_circle_target,
                            activeInput === `member-${member.member_id}-${member.team_id}-presidents_circle_target`
                          )}
                          onFocus={() => setActiveInput(`member-${member.member_id}-${member.team_id}-presidents_circle_target`)}
                          onBlur={() => setActiveInput(null)}
                          onChange={(e) => updateMemberGoal(member.member_id, member.team_id, 'presidents_circle_target', e.target.value)}
                          className="text-right w-36 pl-8"
                          placeholder="0"
                        />
                      </div>
                    </td>
                    
                    {/* Design Allocation */}
                    <td className="p-3">
                      <Input
                        type="number"
                        value={member.design_allocation || ''}
                        onChange={(e) => updateMemberGoal(member.member_id, member.team_id, 'design_allocation', e.target.value)}
                        className="text-right w-32"
                        placeholder="0"
                      />
                    </td>
                    
                    {/* PM Allocation */}
                    <td className="p-3">
                      <Input
                        type="number"
                        value={member.pm_allocation || ''}
                        onChange={(e) => updateMemberGoal(member.member_id, member.team_id, 'pm_allocation', e.target.value)}
                        className="text-right w-32"
                        placeholder="0"
                      />
                    </td>
                  </>
                )}
              </tr>
              );
            })}
        </React.Fragment>
      );
    });
  };

  // Update a member goal
  const updateMemberGoal = (memberId: string, teamId: string, field: string, value: string) => {
    setMemberGoals(prev => prev.map(goal => {
      if (goal.member_id === memberId && goal.team_id === teamId) {
        let parsedValue;
        
        // Use currency parsing for currency fields
        if (field === 'annual_sell_dollars' || field === 'presidents_circle_target' || field === 'design_allocation' || field === 'pm_allocation') {
          parsedValue = parseCurrencyInput(value);
        } else {
          parsedValue = value ? parseFloat(value) : null;
        }
        
        const updated = { 
          ...goal, 
          [field]: parsedValue,
          is_dirty: true 
        };
        
        // Auto-calculate quarterly and GP dollars when annual values change
        if (field === 'annual_sell_dollars') {
          const annualSell = parsedValue || 0;
          updated.quarterly_sell_dollars = annualSell / 4;
          updated.annual_gp_dollars = annualSell * ((updated.annual_margin_percentage || 0) / 100);
          updated.quarterly_gp_dollars = updated.annual_gp_dollars / 4;
        }
        
        if (field === 'annual_margin_percentage') {
          const marginPct = parsedValue || 0;
          updated.quarterly_margin_percentage = marginPct;
          updated.annual_gp_dollars = (updated.annual_sell_dollars || 0) * (marginPct / 100);
          updated.quarterly_gp_dollars = updated.annual_gp_dollars / 4;
        }
        
        return updated;
      }
      return goal;
    }));
  };

  // Update a team goal (for super teams)
  const updateTeamGoal = (teamId: string, field: string, value: string) => {
    setTeamGoals(prev => prev.map(goal => {
      if (goal.team_id === teamId) {
        let parsedValue;
        
        // Use currency parsing for currency fields
        if (field === 'annual_sell_dollars' || field === 'presidents_circle_target' || field === 'design_allocation' || field === 'pm_allocation') {
          parsedValue = parseCurrencyInput(value);
        } else {
          parsedValue = value ? parseFloat(value) : null;
        }
        
        const updated = { 
          ...goal, 
          [field]: parsedValue,
          is_dirty: true 
        };
        
        // Auto-calculate GP dollars when annual values change
        if (field === 'annual_sell_dollars') {
          const annualSell = parsedValue || 0;
          updated.annual_gp_dollars = annualSell * ((updated.annual_margin_percentage || 0) / 100);
        }
        
        if (field === 'annual_margin_percentage') {
          const marginPct = parsedValue || 0;
          updated.annual_gp_dollars = (updated.annual_sell_dollars || 0) * (marginPct / 100);
        }
        
        return updated;
      }
      return goal;
    }));
  };

  // Save changes
  const saveChanges = async () => {
    const dirtyMemberGoals = memberGoals.filter(g => g.is_dirty);
    const dirtyTeamGoals = teamGoals.filter(g => g.is_dirty);
    
    if (dirtyMemberGoals.length === 0 && dirtyTeamGoals.length === 0) {
      toast.info('No changes to save');
      return;
    }

    console.log('Saving changes:', {
      dirtyMemberGoals: dirtyMemberGoals.length,
      dirtyTeamGoals: dirtyTeamGoals.length,
      memberGoals: dirtyMemberGoals,
      teamGoals: dirtyTeamGoals
    });

    setSaving(true);
    try {
      const token = localStorage.getItem('sb-access-token');
      
      console.log('=== SAVE DEBUG INFO ===');
      console.log('Token from localStorage:', token);
      console.log('Token type:', typeof token);
      console.log('Token length:', token?.length);
      if (token) {
        console.log('Token preview:', token.substring(0, 100) + '...');
        try {
          const tokenParts = token.split('.');
          console.log('Token parts count:', tokenParts.length);
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('Token payload preview:', {
              iss: payload.iss,
              sub: payload.sub,
              email: payload.email,
              exp: payload.exp,
              iat: payload.iat
            });
            console.log('Token expires at:', new Date(payload.exp * 1000));
            console.log('Token is expired:', payload.exp * 1000 < Date.now());
          }
        } catch (e) {
          console.error('Error parsing token:', e);
        }
      }
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Save member goals
      for (const goal of dirtyMemberGoals) {
        const payload = {
          member_id: isHouseAccountMember(goal.member_id) ? null : goal.member_id, // Use NULL for house accounts
          team_id: goal.team_id,
          year: selectedYear,
          sales_target: goal.annual_sell_dollars,
          gross_profit_percentage: goal.annual_margin_percentage,
          presidents_circle_target: goal.presidents_circle_target,
          design_allocation: goal.design_allocation,
          pm_allocation: goal.pm_allocation
        };

        console.log(`Saving member goal for ${goal.member_name}:`, payload);

        let response;
        if (goal.id) {
          // Update existing
          response = await fetch(`/api/member-targets/${goal.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
        } else {
          // Create new
          response = await fetch('/api/member-targets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to save member goal for ${goal.member_name}:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            url: response.url,
            headers: Object.fromEntries(response.headers.entries())
          });
          throw new Error(`Failed to save member goal for ${goal.member_name}: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const savedGoal = await response.json();
        console.log(`Successfully saved member goal for ${goal.member_name}:`, savedGoal);
        
        // Update the goal in state with the saved ID if it was a new record
        if (!goal.id && savedGoal.id) {
          setMemberGoals(prev => prev.map(g => 
            g.member_id === goal.member_id && g.team_id === goal.team_id 
              ? { ...g, id: savedGoal.id, is_dirty: false }
              : g
          ));
        }
      }
      
      // Save team goals
      for (const goal of dirtyTeamGoals) {
        const payload = {
          team_id: goal.team_id,
          year: selectedYear,
          sales_target: goal.annual_sell_dollars,
          gross_profit_percentage: goal.annual_margin_percentage,
          presidents_circle_target: goal.presidents_circle_target,
          design_allocation: goal.design_allocation,
          pm_allocation: goal.pm_allocation
        };

        console.log(`Saving team goal for ${goal.team_name}:`, payload);

        let response;
        if (goal.id) {
          // Update existing
          response = await fetch(`/api/team-targets/${goal.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
        } else {
          // Create new
          response = await fetch('/api/team-targets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to save team goal for ${goal.team_name}:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            url: response.url,
            headers: Object.fromEntries(response.headers.entries())
          });
          throw new Error(`Failed to save team goal for ${goal.team_name}: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const savedGoal = await response.json();
        console.log(`Successfully saved team goal for ${goal.team_name}:`, savedGoal);
        
        // Update the goal in state with the saved ID if it was a new record
        if (!goal.id && savedGoal.id) {
          setTeamGoals(prev => prev.map(g => 
            g.team_id === goal.team_id 
              ? { ...g, id: savedGoal.id, is_dirty: false }
              : g
          ));
        }
      }
      
      // Clear dirty flags for all goals (both updated and newly created)
      setMemberGoals(prev => prev.map(g => ({ ...g, is_dirty: false })));
      setTeamGoals(prev => prev.map(g => ({ ...g, is_dirty: false })));
      
      console.log('All goals saved successfully');
      toast.success(`Saved ${dirtyMemberGoals.length + dirtyTeamGoals.length} goal updates`);
      
    } catch (error) {
      console.error('Error saving goals:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to save changes: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // Format currency input value for display
  const formatCurrencyInput = (value: number | null | undefined) => {
    if (!value) return '';
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Parse currency input value from user input
  const parseCurrencyInput = (value: string) => {
    if (!value) return null;
    // Remove all non-numeric characters except decimal points
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(numericValue);
    return isNaN(parsed) ? null : parsed;
  };

  // Format currency
  const formatCurrency = (value: number | null) => {
    if (!value) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage input value
  const formatPercentageInput = (value: number | null) => {
    return value ? value.toString() : '';
  };

  // Get dirty goals count
  const dirtyCount = memberGoals.filter(g => g.is_dirty).length + teamGoals.filter(g => g.is_dirty).length;

  // Get input value - use raw value when editing, formatted when not
  const getInputValue = (fieldKey: string, rawValue: number | null | undefined, isActive: boolean) => {
    if (isActive) {
      // Return raw number as string when actively editing
      return rawValue ? rawValue.toString() : '';
    } else {
      // Return formatted value when not editing
      return formatCurrencyInput(rawValue);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span>Loading sales goals...</span>
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
                Sales Goals & Targets - {selectedYear}
              </CardTitle>
              <CardDescription>
                Individual member goals that automatically roll up to team totals. Similar to your Excel workflow.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setExpandedTeams(new Set(teams.filter(t => t.is_sales_team).map(t => t.id)))}
              >
                Expand All
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setExpandedTeams(new Set())}
              >
                Collapse All
              </Button>
              <Button 
                onClick={saveChanges} 
                disabled={saving || dirtyCount === 0}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : `Save Changes${dirtyCount > 0 ? ` (${dirtyCount})` : ''}`}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Sales Goals Table */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 flex flex-col min-h-0 p-0">
          <div className="flex-1 min-h-0 relative">
            <div className="absolute inset-0 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b sticky top-0 z-10">
                  <tr>
                    <th className="text-left p-3 font-medium">Team / Salesperson</th>
                    <th className="text-right p-3 font-medium">Annual Sell $</th>
                    <th className="text-right p-3 font-medium">Margin %</th>
                    <th className="text-right p-3 font-medium">Annual GP $</th>
                    <th className="text-right p-3 font-medium">President's Circle</th>
                    <th className="text-right p-3 font-medium">Design Allocation</th>
                    <th className="text-right p-3 font-medium">PM Allocation</th>
                  </tr>
                </thead>
                <tbody>
                  {renderTeamHierarchy(teamHierarchy)}
                  
                  {/* Grand Totals Row */}
                  {teamHierarchy.length > 0 && (
                    <tr className="bg-blue-100 border-t-4 border-blue-500 font-bold text-blue-900 sticky bottom-0">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-blue-700" />
                          <span className="font-bold text-lg">TOTALS</span>
                        </div>
                      </td>
                      <td className="p-3 text-right text-blue-800 font-bold">
                        {formatCurrency(grandTotals.annual_sell_total)}
                      </td>
                      <td className="p-3 text-right text-blue-800 font-bold">
                        {grandTotals.annual_margin_avg.toFixed(2)}%
                      </td>
                      <td className="p-3 text-right text-green-800 font-bold">
                        {formatCurrency(grandTotals.annual_gp_total)}
                      </td>
                      <td className="p-3 text-right text-blue-800 font-bold">
                        {formatCurrency(grandTotals.presidents_circle_total)}
                      </td>
                      <td className="p-3 text-right text-blue-800 font-bold">
                        {formatCurrency(grandTotals.design_allocation_total)}
                      </td>
                      <td className="p-3 text-right text-blue-800 font-bold">
                        {formatCurrency(grandTotals.pm_allocation_total)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
 