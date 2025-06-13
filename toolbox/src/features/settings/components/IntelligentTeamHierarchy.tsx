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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { toast } from 'sonner';
import { 
  Building2, 
  ChevronDown, 
  ChevronRight, 
  Users, 
  Target, 
  TrendingUp,
  Settings,
  Plus,
  Edit,
  Trash2,
  Crown,
  Award,
  MapPin,
  Check,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface TeamMember {
  id: string;
  name?: string;
  email: string;
  role?: string;
  is_active?: boolean;
}

interface TeamHierarchy {
  id: string;
  name: string;
  path: string;
  level: number;
  parent_id?: string;
  leader_user_id?: string;
  leader?: {
    name?: string;
    email?: string;
  };
  is_sales_team: boolean;
  is_super_team: boolean;
  is_forecasted_team: boolean;
  team_type: 'sales' | 'operations' | 'management' | 'support' | 'other';
  has_house_account?: boolean;
  member_count: number;
  members?: TeamMember[];
  children?: TeamHierarchy[];
  goals?: {
    target_amount?: number;
    current_amount?: number;
    achievement_percentage?: number;
  };
  performance?: {
    total_revenue?: number;
    avg_margin?: number;
    deals_closed?: number;
  };
}

interface TeamStats {
  totalTeams: number;
  salesTeams: number;
  superTeams: number;
  totalMembers: number;
  deepestLevel: number;
}

export function IntelligentTeamHierarchy() {
  // State
  const [teams, setTeams] = useState<TeamHierarchy[]>([]);
  const [flatTeams, setFlatTeams] = useState<TeamHierarchy[]>([]);
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSalesOnly, setFilterSalesOnly] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  
  // Create team state
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLeader, setNewTeamLeader] = useState<string>('');
  const [newTeamParent, setNewTeamParent] = useState<string>('root');
  const [newTeamType, setNewTeamType] = useState<'sales' | 'operations' | 'management' | 'support' | 'other'>('other');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [newTeamHasHouseAccount, setNewTeamHasHouseAccount] = useState(false);
  const [newTeamIsForecasted, setNewTeamIsForecasted] = useState(true);

  // Edit team state
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamHierarchy | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamLeader, setEditTeamLeader] = useState<string>('');
  const [editTeamParent, setEditTeamParent] = useState<string>('root');
  const [editTeamType, setEditTeamType] = useState<'sales' | 'operations' | 'management' | 'support' | 'other'>('other');
  const [editTeamDescription, setEditTeamDescription] = useState('');
  const [editTeamHasHouseAccount, setEditTeamHasHouseAccount] = useState(false);
  const [editTeamIsForecasted, setEditTeamIsForecasted] = useState(true);

  // Drag and drop state
  const [draggedTeam, setDraggedTeam] = useState<TeamHierarchy | null>(null);
  const [dragOverTeam, setDragOverTeam] = useState<string | null>(null);
  const [isDragAndDropMode, setIsDragAndDropMode] = useState(false);

  // Refs for auto-scroll
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Fetch team hierarchy
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const token = localStorage.getItem('sb-access-token');
        const [teamsRes, usersRes] = await Promise.all([
          fetch('/api/teams-with-members', {
          headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/admin/profiles?limit=1000', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!teamsRes.ok) throw new Error('Failed to fetch teams');

        const data = await teamsRes.json();
        
        console.log('=== Raw API Data Debug ===');
        console.log('Total teams from API:', data.length);
        console.log('Sample team data:', data.slice(0, 3).map((team: any) => ({
          id: team.id,
          name: team.name,
          parent_team_id: team.parent_team_id,
          leader_user_id: team.leader_user_id,
          leader_profiles: team.profiles,
          level: team.level,
          path: team.path
        })));
        
        // Fetch users for team leader selection
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          const userList = (usersData.profiles || []).map((profile: any) => ({
            id: profile.AzureID,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            is_active: profile.accountenabled
          }));
          setUsers(userList);
        }
        
        // Build hierarchical structure from flat list using materialized paths
        const teamMap = new Map<string, TeamHierarchy>();
        const rootTeams: TeamHierarchy[] = [];

        // First pass: create all team objects
        data.forEach((team: any) => {
          // Calculate hierarchy level based on parent chain
          let level = 0;
          let currentParentId = team.parent_team_id;
          while (currentParentId && level < 10) { // Prevent infinite loops
            const parent = data.find((t: any) => t.id === currentParentId);
            if (!parent) break;
            level++;
            currentParentId = parent.parent_team_id;
          }

          // Generate path based on hierarchy
          const path = team.path || `/${team.name}`;

          // Find leader info from users list
          const leader = team.leader_user_id 
            ? users.find(u => u.id === team.leader_user_id)
            : undefined;

          const teamNode: TeamHierarchy = {
            id: team.id,
            name: team.name,
            path: path,
            level: level,
            parent_id: team.parent_team_id,
            leader_user_id: team.leader_user_id,
            leader: leader ? {
              name: leader.name,
              email: leader.email
            } : undefined,
            is_sales_team: team.is_sales_team || false,
            is_super_team: team.is_super_team || false,
            is_forecasted_team: team.is_forecasted_team || true,
            team_type: team.team_type || 'other',
            has_house_account: team.has_house_account || false,
            member_count: team.members?.length || 0,
            members: team.members || [],
            children: [],
            goals: {
              target_amount: team.target_amount,
              current_amount: team.current_amount,
              achievement_percentage: team.achievement_percentage
            },
            performance: {
              total_revenue: team.total_revenue,
              avg_margin: team.avg_margin,
              deals_closed: team.deals_closed
            }
          };
          teamMap.set(team.id, teamNode);
        });

        // Second pass: build parent-child relationships
        teamMap.forEach((team) => {
          if (team.parent_id && teamMap.has(team.parent_id)) {
            const parent = teamMap.get(team.parent_id)!;
            parent.children!.push(team);
          } else {
            rootTeams.push(team);
          }
        });

        // Sort teams by name at each level
        const sortTeams = (teams: TeamHierarchy[]) => {
          teams.sort((a, b) => a.name.localeCompare(b.name));
          teams.forEach(team => {
            if (team.children) sortTeams(team.children);
          });
        };
        sortTeams(rootTeams);

        setTeams(rootTeams);
        setFlatTeams(Array.from(teamMap.values()));
        
        console.log('=== Teams Loaded Successfully ===');
        console.log('Root teams count:', rootTeams.length);
        console.log('Flat teams count:', Array.from(teamMap.values()).length);
        console.log('Root teams:', rootTeams.map(t => ({ id: t.id, name: t.name, children_count: t.children?.length || 0 })));
        console.log('All teams hierarchy:', Array.from(teamMap.values()).map(t => ({ 
          id: t.id, 
          name: t.name, 
          parent_id: t.parent_id,
          children_count: t.children?.length || 0
        })));
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast.error('Failed to load team hierarchy');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  // Cleanup auto-scroll interval on unmount
  useEffect(() => {
    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, []);

  // Keyboard shortcuts for power users
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Toggle drag mode with Ctrl/Cmd + D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        setIsDragAndDropMode(prev => !prev);
        toast.info(isDragAndDropMode ? 'Drag & Drop disabled' : 'Drag & Drop enabled');
      }
      
      // Escape to exit drag mode
      if (e.key === 'Escape' && isDragAndDropMode) {
        setIsDragAndDropMode(false);
        setDraggedTeam(null);
        setDragOverTeam(null);
        toast.info('Drag & Drop disabled');
      }
      
      // Expand all with Ctrl/Cmd + E
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setExpandedTeams(new Set(flatTeams.map(t => t.id)));
        toast.info('All teams expanded');
      }
      
      // Collapse all with Ctrl/Cmd + R
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        setExpandedTeams(new Set());
        toast.info('All teams collapsed');
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isDragAndDropMode, flatTeams]);

  // Calculate stats
  const stats = useMemo((): TeamStats => {
    const salesTeams = flatTeams.filter(t => t.is_sales_team).length;
    const superTeams = flatTeams.filter(t => t.is_super_team).length;
    const totalMembers = flatTeams.reduce((sum, t) => sum + t.member_count, 0);
    const deepestLevel = Math.max(...flatTeams.map(t => t.level), 0);

    return {
      totalTeams: flatTeams.length,
      salesTeams,
      superTeams,
      totalMembers,
      deepestLevel
    };
  }, [flatTeams]);

  // Filter teams
  const filteredTeams = useMemo(() => {
    const filterTeam = (team: TeamHierarchy): TeamHierarchy | null => {
      const matchesSearch = !searchTerm || 
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.path.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = !filterType || filterType === 'all' || team.team_type === filterType;
      const matchesSales = !filterSalesOnly || team.is_sales_team;

      // Filter children recursively
      const filteredChildren = team.children?.map(filterTeam).filter(Boolean) as TeamHierarchy[] || [];
      
      // Include team if it matches filters OR has matching children
      if (matchesSearch && matchesType && matchesSales) {
        return { ...team, children: filteredChildren };
      } else if (filteredChildren.length > 0) {
        return { ...team, children: filteredChildren };
      }
      
      return null;
    };

    return teams.map(filterTeam).filter(Boolean) as TeamHierarchy[];
  }, [teams, searchTerm, filterType, filterSalesOnly]);

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

  const toggleSalesTeam = async (teamId: string, isSalesTeam: boolean) => {
    try {
      const token = localStorage.getItem('sb-access-token');
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ is_sales_team: isSalesTeam }),
      });

      if (!res.ok) throw new Error('Failed to update team');

      // Update local state
      const updateTeam = (teams: TeamHierarchy[]): TeamHierarchy[] => {
        return teams.map(team => {
          if (team.id === teamId) {
            return { ...team, is_sales_team: isSalesTeam };
          }
          if (team.children) {
            return { ...team, children: updateTeam(team.children) };
          }
          return team;
        });
      };

      setTeams(updateTeam);
      setFlatTeams(prev => prev.map(team => 
        team.id === teamId ? { ...team, is_sales_team: isSalesTeam } : team
      ));
      
      toast.success('Team updated successfully');
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Failed to update team');
    }
  };

  const toggleSuperTeam = async (teamId: string, isSuperTeam: boolean) => {
    try {
      const token = localStorage.getItem('sb-access-token');
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ is_super_team: isSuperTeam }),
      });

      if (!res.ok) throw new Error('Failed to update team');

      // Update local state
      const updateTeam = (teams: TeamHierarchy[]): TeamHierarchy[] => {
        return teams.map(team => {
          if (team.id === teamId) {
            return { ...team, is_super_team: isSuperTeam };
          }
          if (team.children) {
            return { ...team, children: updateTeam(team.children) };
          }
          return team;
        });
      };

      setTeams(updateTeam);
      setFlatTeams(prev => prev.map(team => 
        team.id === teamId ? { ...team, is_super_team: isSuperTeam } : team
      ));
      
      toast.success('Team updated successfully');
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Failed to update team');
    }
  };

  // Create new team
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error('Team name is required');
      return;
    }

    const token = localStorage.getItem('sb-access-token');
    try {
      const teamData = {
        name: newTeamName.trim(),
        team_type: newTeamType,
        description: newTeamDescription.trim() || undefined,
        leader_user_id: newTeamLeader || undefined,
        parent_team_id: newTeamParent === 'root' ? undefined : newTeamParent,
        is_sales_team: false,
        is_super_team: false,
        is_forecasted_team: newTeamIsForecasted,
        has_house_account: newTeamHasHouseAccount,
      };

      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(teamData),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create team');
      }
      
      const newTeam = await res.json();
      
      // Add new team to local state
      const newTeamNode: TeamHierarchy = {
        id: newTeam.id,
        name: newTeam.name,
        path: newTeam.path || `/${newTeam.name}`,
        level: newTeam.level || 0,
        parent_id: newTeam.parent_team_id,
        leader_user_id: newTeam.leader_user_id,
        leader: newTeam.profiles ? {
          name: newTeam.profiles.name,
          email: newTeam.profiles.email
        } : undefined,
        is_sales_team: newTeam.is_sales_team || false,
        is_super_team: newTeam.is_super_team || false,
        is_forecasted_team: newTeam.is_forecasted_team || true,
        team_type: newTeam.team_type || 'other',
        has_house_account: newTeam.has_house_account || false,
        member_count: 0,
        members: [],
        children: [],
        goals: {},
        performance: {}
      };

      // Add to appropriate location in hierarchy
      if (newTeam.parent_team_id) {
        // Add as child of parent team
        const updateTeamsWithChild = (teams: TeamHierarchy[]): TeamHierarchy[] => {
          return teams.map(team => {
            if (team.id === newTeam.parent_team_id) {
              return { 
                ...team, 
                children: [...(team.children || []), newTeamNode].sort((a, b) => a.name.localeCompare(b.name))
              };
            }
            if (team.children) {
              return { ...team, children: updateTeamsWithChild(team.children) };
            }
            return team;
          });
        };
        setTeams(updateTeamsWithChild);
      } else {
        // Add as root team
        setTeams(prev => [...prev, newTeamNode].sort((a, b) => a.name.localeCompare(b.name)));
      }

      setFlatTeams(prev => [...prev, newTeamNode]);
      
      // Reset form
      setNewTeamName('');
      setNewTeamLeader('');
      setNewTeamParent('root');
      setNewTeamType('other');
      setNewTeamDescription('');
      setNewTeamHasHouseAccount(false);
      setNewTeamIsForecasted(true);
      setIsCreatingTeam(false);
      
      toast.success('Team created successfully');
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create team');
    }
  };

  // Open edit team dialog
  const handleEditTeam = (team: TeamHierarchy) => {
    setEditingTeam(team);
    setEditTeamName(team.name);
    setEditTeamLeader(team.leader_user_id || '');
    setEditTeamParent(team.parent_id || 'root');
    setEditTeamType(team.team_type);
    setEditTeamDescription('');
    setEditTeamHasHouseAccount(team.has_house_account || false);
    setEditTeamIsForecasted(team.is_forecasted_team || true);
    setIsEditingTeam(true);
  };

  // Save edited team
  const handleSaveEditedTeam = async () => {
    if (!editingTeam || !editTeamName.trim()) {
      toast.error('Team name is required');
      return;
    }

    const token = localStorage.getItem('sb-access-token');
    try {
      const teamData = {
        name: editTeamName.trim(),
        team_type: editTeamType,
        description: editTeamDescription.trim() || undefined,
        leader_user_id: editTeamLeader || undefined,
        parent_team_id: editTeamParent === 'root' ? undefined : editTeamParent,
        has_house_account: editTeamHasHouseAccount,
        is_forecasted_team: editTeamIsForecasted
      };

      const res = await fetch(`/api/teams/${editingTeam.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(teamData),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update team');
      }
      
      // Update local state instead of reloading
      const updatedTeam = await res.json();
      
      // Update flatTeams state
      setFlatTeams(prev => prev.map(team => 
        team.id === editingTeam.id ? { ...team, ...updatedTeam } : team
      ));
      
      // If parent changed, update the hierarchy
      if (editTeamParent !== (editingTeam?.parent_id || 'root')) {
        const newParentId = editTeamParent === 'root' ? undefined : editTeamParent;
        
        // Update teams hierarchy structure
        const moveTeamInHierarchy = (teams: TeamHierarchy[], movedTeam: TeamHierarchy, newParentId?: string): TeamHierarchy[] => {
          // Remove team from current location
          const removeTeam = (teamList: TeamHierarchy[]): TeamHierarchy[] => {
            return teamList
              .filter(team => team.id !== movedTeam.id)
              .map(team => ({
                ...team,
                children: team.children ? removeTeam(team.children) : []
              }));
          };

          const withoutMovedTeam = removeTeam(teams);
          const updatedMovedTeam = { 
            ...movedTeam, 
            parent_id: newParentId,
            name: editTeamName,
            team_type: editTeamType,
            is_forecasted_team: editTeamIsForecasted
          };

          if (newParentId) {
            // Add to new parent
            const addTeamToParent = (teamList: TeamHierarchy[]): TeamHierarchy[] => {
              return teamList.map(team => {
                if (team.id === newParentId) {
                  return {
                    ...team,
                    children: [...(team.children || []), updatedMovedTeam].sort((a, b) => a.name.localeCompare(b.name))
                  };
                }
                return {
                  ...team,
                  children: team.children ? addTeamToParent(team.children) : []
                };
              });
            };
            return addTeamToParent(withoutMovedTeam);
          } else {
            // Add to root level
            return [...withoutMovedTeam, updatedMovedTeam].sort((a, b) => a.name.localeCompare(b.name));
          }
        };

        setTeams(prev => moveTeamInHierarchy(prev, editingTeam, newParentId));
      } else {
        // Just update team properties without moving
        const updateTeamProperties = (teams: TeamHierarchy[]): TeamHierarchy[] => {
          return teams.map(team => {
            if (team.id === editingTeam.id) {
              return { ...team, name: editTeamName, team_type: editTeamType, is_forecasted_team: editTeamIsForecasted };
            }
            return {
              ...team,
              children: team.children ? updateTeamProperties(team.children) : []
            };
          });
        };
        setTeams(updateTeamProperties);
      }
      
      toast.success('Team updated successfully');
      setIsEditingTeam(false);
      setEditingTeam(null);
      
      // Reset edit form
      setEditTeamName('');
      setEditTeamLeader('');
      setEditTeamParent('root');
      setEditTeamType('other');
      setEditTeamDescription('');
      setEditTeamHasHouseAccount(false);
      setEditTeamIsForecasted(true);
      
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update team');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, team: TeamHierarchy) => {
    setDraggedTeam(team);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', team.id);
    
    // Add ghost image styling
    const dragImage = document.createElement('div');
    dragImage.className = 'bg-blue-100 border-2 border-blue-300 rounded-md p-2 text-sm font-medium text-blue-800';
    dragImage.innerHTML = `📁 ${team.name}`;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Clean up after a short delay
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  // Auto-scroll functionality
  const handleAutoScroll = (clientY: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const scrollThreshold = 50; // pixels from edge to trigger scroll
    const scrollSpeed = 10; // pixels per scroll

    // Clear existing scroll interval
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }

    // Check if near top edge
    if (clientY - containerRect.top < scrollThreshold && container.scrollTop > 0) {
      autoScrollIntervalRef.current = setInterval(() => {
        const newScrollTop = Math.max(0, container.scrollTop - scrollSpeed);
        container.scrollTop = newScrollTop;
        if (newScrollTop === 0) {
          clearInterval(autoScrollIntervalRef.current!);
          autoScrollIntervalRef.current = null;
        }
      }, 16); // ~60fps
    }
    // Check if near bottom edge
    else if (containerRect.bottom - clientY < scrollThreshold && 
             container.scrollTop < container.scrollHeight - container.clientHeight) {
      autoScrollIntervalRef.current = setInterval(() => {
        const maxScroll = container.scrollHeight - container.clientHeight;
        const newScrollTop = Math.min(maxScroll, container.scrollTop + scrollSpeed);
        container.scrollTop = newScrollTop;
        if (newScrollTop === maxScroll) {
          clearInterval(autoScrollIntervalRef.current!);
          autoScrollIntervalRef.current = null;
        }
      }, 16); // ~60fps
    }
  };

  const handleDragOver = (e: React.DragEvent, targetTeam: TeamHierarchy) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTeam(targetTeam.id);
    
    // Trigger auto-scroll based on mouse position
    handleAutoScroll(e.clientY);
  };

  const handleDragLeave = () => {
    setDragOverTeam(null);
    // Don't clear auto-scroll here as we might be moving between elements
  };

  const handleDragEnd = () => {
    // Clean up auto-scroll when drag ends
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    setDragOverTeam(null);
  };

  const handleDrop = async (e: React.DragEvent, targetTeam: TeamHierarchy) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling to root container
    setDragOverTeam(null);

    console.log('=== Drop Event Debug ===');
    console.log('Dropped on target team:', targetTeam.name);
    console.log('Dragged team:', draggedTeam?.name);

    if (!draggedTeam || draggedTeam.id === targetTeam.id) {
      console.log('Invalid drop: no dragged team or same team');
      setDraggedTeam(null);
      return;
    }

    // Don't allow dropping a parent onto its own child
    const isChildOfDragged = (team: TeamHierarchy, parentId: string): boolean => {
      if (team.id === parentId) return true;
      return team.children?.some(child => isChildOfDragged(child, parentId)) || false;
    };

    if (isChildOfDragged(draggedTeam, targetTeam.id)) {
      toast.error("Cannot move a team under its own child team");
      setDraggedTeam(null);
      return;
    }

    console.log('Processing drop: moving', draggedTeam.name, 'under', targetTeam.name);

    try {
      const token = localStorage.getItem('sb-access-token');
      const res = await fetch(`/api/teams/${draggedTeam.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          parent_team_id: targetTeam.id 
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to move team');
      }
      
      // Update local state immediately instead of reloading
      const moveTeamInHierarchy = (teams: TeamHierarchy[], movedTeam: TeamHierarchy, newParentId: string): TeamHierarchy[] => {
        // First, remove the team from its current location
        const removeTeam = (teamList: TeamHierarchy[]): TeamHierarchy[] => {
          return teamList
            .filter(team => team.id !== movedTeam.id)
            .map(team => ({
              ...team,
              children: team.children ? removeTeam(team.children) : []
            }));
        };

        // Then add it to the new parent
        const addTeamToParent = (teamList: TeamHierarchy[]): TeamHierarchy[] => {
          return teamList.map(team => {
            if (team.id === newParentId) {
              const updatedMovedTeam = { ...movedTeam, parent_id: newParentId };
              return {
                ...team,
                children: [...(team.children || []), updatedMovedTeam].sort((a, b) => a.name.localeCompare(b.name))
              };
            }
            return {
              ...team,
              children: team.children ? addTeamToParent(team.children) : []
            };
          });
        };

        const withoutMovedTeam = removeTeam(teams);
        return addTeamToParent(withoutMovedTeam);
      };

      // Update teams state
      setTeams(prev => moveTeamInHierarchy(prev, draggedTeam, targetTeam.id));
      
      // Update flatTeams state
      setFlatTeams(prev => prev.map(team => 
        team.id === draggedTeam.id 
          ? { ...team, parent_id: targetTeam.id }
          : team
      ));
      
      // Brief success animation
      const movedElement = document.querySelector(`[data-team-id="${draggedTeam.id}"]`);
      if (movedElement) {
        movedElement.classList.add('animate-pulse');
        setTimeout(() => movedElement.classList.remove('animate-pulse'), 1000);
      }
      
      toast.success(`Moved "${draggedTeam.name}" under "${targetTeam.name}"`);
      
    } catch (error) {
      console.error('Error moving team:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to move team');
    } finally {
      setDraggedTeam(null);
    }
  };

  const handleDropOnRoot = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTeam(null);

    console.log('=== Drop on Root Debug ===');
    console.log('Dropped on root, dragged team:', draggedTeam?.name);

    if (!draggedTeam) {
      console.log('No dragged team for root drop');
      return;
    }

    try {
      const token = localStorage.getItem('sb-access-token');
      const res = await fetch(`/api/teams/${draggedTeam.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          parent_team_id: null 
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to move team');
      }
      
      // Update local state immediately instead of reloading
      const moveTeamToRoot = (teams: TeamHierarchy[], movedTeam: TeamHierarchy): TeamHierarchy[] => {
        // Remove team from current location
        const removeTeam = (teamList: TeamHierarchy[]): TeamHierarchy[] => {
          return teamList
            .filter(team => team.id !== movedTeam.id)
            .map(team => ({
              ...team,
              children: team.children ? removeTeam(team.children) : []
            }));
        };

        const withoutMovedTeam = removeTeam(teams);
        const updatedMovedTeam = { ...movedTeam, parent_id: undefined };
        
        return [...withoutMovedTeam, updatedMovedTeam].sort((a, b) => a.name.localeCompare(b.name));
      };

      // Update teams state
      setTeams(prev => moveTeamToRoot(prev, draggedTeam));
      
      // Update flatTeams state  
      setFlatTeams(prev => prev.map(team => 
        team.id === draggedTeam.id 
          ? { ...team, parent_id: undefined }
          : team
      ));
      
      toast.success(`Moved "${draggedTeam.name}" to root level`);
      
    } catch (error) {
      console.error('Error moving team:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to move team');
    } finally {
      setDraggedTeam(null);
    }
  };

  // Team card component
  const TeamCard = ({ team, depth = 0 }: { team: TeamHierarchy; depth?: number }) => {
    const isExpanded = expandedTeams.has(team.id);
    const hasChildren = team.children && team.children.length > 0;
    const isSelected = selectedTeam === team.id;

    const achievementColor = team.goals?.achievement_percentage 
      ? team.goals.achievement_percentage >= 100 
        ? 'text-green-600' 
        : team.goals.achievement_percentage >= 75 
          ? 'text-yellow-600' 
          : 'text-red-600'
      : 'text-gray-400';

    return (
        <div
          className={cn(
          'border rounded-md transition-all duration-200',
          isSelected && 'ring-2 ring-blue-500',
          dragOverTeam === team.id && 'ring-2 ring-green-400 bg-green-50 shadow-lg transform scale-105',
          draggedTeam?.id === team.id && 'opacity-50 transform scale-95',
          isDragAndDropMode && 'hover:shadow-md cursor-move'
        )}
        data-team-id={team.id}
      >
        <div
          className={cn(
            'p-3 hover:bg-gray-50 transition-colors cursor-pointer group',
            isDragAndDropMode && 'select-none'
          )}
          onClick={() => setSelectedTeam(isSelected ? null : team.id)}
          style={{ marginLeft: depth * 16 }}
          draggable={isDragAndDropMode}
          onDragStart={isDragAndDropMode ? (e) => handleDragStart(e, team) : undefined}
          onDragOver={isDragAndDropMode ? (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDragOver(e, team);
          } : undefined}
          onDragLeave={isDragAndDropMode ? (e) => {
            e.stopPropagation();
            handleDragLeave();
          } : undefined}
          onDragEnd={isDragAndDropMode ? (e) => {
            e.stopPropagation();
            handleDragEnd();
          } : undefined}
          onDrop={isDragAndDropMode ? (e) => {
            console.log('Team card drop event triggered for:', team.name);
            handleDrop(e, team);
          } : undefined}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTeamExpansion(team.id);
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              )}
              
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500 font-mono">L{team.level}</span>
              </div>
              
              <h3 className="font-medium text-sm">{team.name}</h3>
              
              {/* Team Leader Display */}
              {team.leader?.name && (
                <div className="flex items-center gap-1">
                  <Crown className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-600" title={`Leader: ${team.leader.name} (${team.leader.email})`}>
                    {team.leader.name}
                  </span>
                </div>
              )}
              
              <div className="flex gap-1">
                {team.is_super_team && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs px-1 py-0">
                    <Crown className="h-3 w-3 mr-1" />
                    Super
                  </Badge>
                )}
                {team.is_sales_team && (
                  <Badge variant="default" className="bg-green-100 text-green-800 text-xs px-1 py-0">
                    <Award className="h-3 w-3 mr-1" />
                    Sales
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {team.team_type}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{team.member_count}</span>
              </div>
              
              {team.goals?.achievement_percentage !== undefined && (
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  <span className={achievementColor}>
                    {team.goals.achievement_percentage.toFixed(0)}%
                  </span>
                </div>
              )}
              
              {team.performance?.total_revenue && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>${(team.performance.total_revenue / 1000000).toFixed(1)}M</span>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditTeam(team);
                }}
                title="Edit team"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Team path display */}
          <div className="mt-1 text-xs text-gray-400 font-mono truncate">
            {team.path}
          </div>
          
          {/* Quick actions */}
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center space-x-1">
              <Checkbox
                id={`sales-${team.id}`}
                checked={team.is_sales_team}
                onCheckedChange={(checked) => 
                  toggleSalesTeam(team.id, checked as boolean)
                }
                className="h-3 w-3"
              />
              <label htmlFor={`sales-${team.id}`} className="text-xs">
                Sales Team
              </label>
            </div>

            <div className="flex items-center space-x-1">
              <Checkbox
                id={`super-${team.id}`}
                checked={team.is_super_team}
                onCheckedChange={(checked) => 
                  toggleSuperTeam(team.id, checked as boolean)
                }
                className="h-3 w-3"
              />
              <label htmlFor={`super-${team.id}`} className="text-xs">
                Super Team
              </label>
            </div>
          </div>
        </div>
        
        {/* Children teams */}
        {hasChildren && isExpanded && (
          <div className="border-t">
            {team.children!.map(child => (
              <TeamCard key={child.id} team={child} depth={depth + 1} />
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
            <span>Loading team hierarchy...</span>
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
          <div className="flex items-center justify-between">
            <div>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Intelligent Team Hierarchy
          </CardTitle>
          <CardDescription>
            Advanced team management with materialized paths, automatic roll-up, and intelligent organization
          </CardDescription>
            </div>
            <Button onClick={() => setIsCreatingTeam(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Team
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 flex-shrink-0">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-xl font-bold">{stats.totalTeams}</p>
                <p className="text-xs text-gray-600">Total Teams</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xl font-bold">{stats.salesTeams}</p>
                <p className="text-xs text-gray-600">Sales Teams</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-xl font-bold">{stats.superTeams}</p>
                <p className="text-xs text-gray-600">Super Teams</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-indigo-600" />
              <div>
                <p className="text-xl font-bold">{stats.totalMembers}</p>
                <p className="text-xs text-gray-600">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-6 w-6 text-orange-600" />
              <div>
                <p className="text-xl font-bold">{stats.deepestLevel}</p>
                <p className="text-xs text-gray-600">Max Depth</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="flex-shrink-0">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by name or path..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="management">Management</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sales-only"
                checked={filterSalesOnly}
                onCheckedChange={(checked) => setFilterSalesOnly(checked === true)}
              />
              <label htmlFor="sales-only" className="text-sm">
                Sales only
              </label>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setExpandedTeams(new Set(flatTeams.map(t => t.id)))}
                className="h-9"
              >
                Expand All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setExpandedTeams(new Set())}
                className="h-9"
              >
                Collapse All
              </Button>
              <Button 
                variant={isDragAndDropMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsDragAndDropMode(!isDragAndDropMode)}
                className={cn(
                  "h-9 transition-all duration-200",
                  isDragAndDropMode && "bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                )}
                title={isDragAndDropMode ? "Exit Drag & Drop Mode (Esc)" : "Enable Drag & Drop Mode (Ctrl/Cmd + D)"}
              >
                {isDragAndDropMode ? (
                  <>
                    <span className="mr-1">🚀</span>
                    Exit Drag & Drop
                  </>
                ) : (
                  <>
                    <span className="mr-1">🎯</span>
                    Enable Drag & Drop
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Hierarchy */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Team Hierarchy ({filteredTeams.length} teams)</CardTitle>
            {isDragAndDropMode && (
              <Badge variant="secondary" className="text-xs">
                Drag & Drop Mode Active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent 
          ref={scrollContainerRef}
          className={cn(
            "flex-1 overflow-y-auto p-0",
            isDragAndDropMode && "border-2 border-dashed border-gray-300 rounded-lg"
          )}
          onDragOver={isDragAndDropMode ? (e) => {
            e.preventDefault();
            // Only handle if not over a team card
            if (!dragOverTeam) {
              e.dataTransfer.dropEffect = 'move';
              handleAutoScroll(e.clientY);
            }
          } : undefined}
          onDrop={isDragAndDropMode ? (e) => {
            // Only handle root drops if not dropped on a specific team
            if (!dragOverTeam) {
              console.log('Root container drop event triggered');
              handleDropOnRoot(e);
            } else {
              console.log('Ignoring root drop - dropped on team:', dragOverTeam);
            }
          } : undefined}
        >
          {isDragAndDropMode && (
            <div className="p-4 text-center text-sm text-gray-500 border-b bg-gradient-to-r from-blue-50 to-green-50">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="animate-pulse">🎯</div>
                <span className="font-medium text-gray-700">Drag & Drop Mode Active</span>
                <div className="animate-pulse">🎯</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>Drag teams to reorganize</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Drop on teams to make children</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  <span>Drop here for root level</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                💡 Tip: Auto-scroll by dragging near the top or bottom edges
              </div>
            </div>
          )}
          <div className="space-y-1 p-4 pt-0">
            {filteredTeams.map(team => (
              <TeamCard key={team.id} team={team} />
            ))}
            
            {filteredTeams.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No teams found matching the current filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Team Details */}
      {selectedTeam && (
        <Card className="flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Team Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {(() => {
              const team = flatTeams.find(t => t.id === selectedTeam);
              if (!team) return null;
              
              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Team Name</Label>
                      <p className="font-medium text-sm">{team.name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Team Leader</Label>
                      <p className="font-medium text-sm">
                        {team.leader?.name ? (
                          <span title={team.leader.email}>
                            {team.leader.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">No leader assigned</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Team Type</Label>
                      <p className="font-medium text-sm capitalize">{team.team_type}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Hierarchy Path</Label>
                      <p className="font-mono text-xs">{team.path}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Level</Label>
                      <p className="font-medium text-sm">Level {team.level}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Member Count</Label>
                      <p className="font-medium text-sm">{team.member_count} members</p>
                    </div>
                  </div>
                  
                  {team.goals?.target_amount && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">Target Amount</Label>
                        <p className="font-medium text-sm">${team.goals.target_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Current Amount</Label>
                        <p className="font-medium text-sm">${(team.goals.current_amount || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Achievement</Label>
                        <p className="font-medium text-sm">{(team.goals.achievement_percentage || 0).toFixed(1)}%</p>
                      </div>
                    </div>
                  )}
                  
                  {team.members && team.members.length > 0 && (
                    <div>
                      <Label className="text-xs text-gray-500">Team Members ({team.member_count})</Label>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {team.members.slice(0, 8).map((member, index) => (
                          <Badge key={member.id || index} variant="outline" className="text-xs">
                            {member.name || member.email}
                          </Badge>
                        ))}
                        {team.members.length > 8 && (
                          <Badge variant="outline" className="text-xs">
                            +{team.members.length - 8} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Create Team Dialog */}
      <Dialog open={isCreatingTeam} onOpenChange={setIsCreatingTeam}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new team within the hierarchy. You can assign a leader and set the team type.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Enter team name"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Team Type</Label>
              <Select value={newTeamType} onValueChange={(value) => setNewTeamType(value as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select team type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Parent Team (Optional)</Label>
              <Select value={newTeamParent} onValueChange={setNewTeamParent}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select parent team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">No parent (root level)</SelectItem>
                  {flatTeams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.path} - {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Team Leader (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start mt-1">
                    {newTeamLeader 
                      ? users.find(u => u.id === newTeamLeader)?.name || 'Unknown User'
                      : 'Select team leader'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search users..." />
                    <CommandList>
                      <CommandEmpty>No users found.</CommandEmpty>
                      <CommandGroup>
                        {users.map(user => (
                          <CommandItem
                            key={user.id}
                            onSelect={() => setNewTeamLeader(user.id)}
                          >
                            <div className="flex items-center">
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  newTeamLeader === user.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <div>
                                <div className="font-medium">{user.name || user.email}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="team-description">Description (Optional)</Label>
              <Input
                id="team-description"
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                placeholder="Brief description of the team"
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-house-account"
                checked={newTeamHasHouseAccount}
                onCheckedChange={(checked) => setNewTeamHasHouseAccount(checked as boolean)}
              />
              <Label htmlFor="has-house-account" className="text-sm font-medium">
                Team tracks house account
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-forecasted-team"
                checked={newTeamIsForecasted}
                onCheckedChange={(checked) => setNewTeamIsForecasted(checked as boolean)}
              />
              <Label htmlFor="is-forecasted-team" className="text-sm font-medium">
                Team generates forecasts
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreatingTeam(false);
                setNewTeamName('');
                setNewTeamLeader('');
                setNewTeamParent('root');
                setNewTeamType('other');
                setNewTeamDescription('');
                setNewTeamHasHouseAccount(false);
                setNewTeamIsForecasted(true);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTeam} disabled={!newTeamName.trim()}>
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={isEditingTeam} onOpenChange={setIsEditingTeam}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Edit team properties and parent relationships to restructure your hierarchy.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-team-name">Team Name</Label>
              <Input
                id="edit-team-name"
                value={editTeamName}
                onChange={(e) => setEditTeamName(e.target.value)}
                placeholder="Enter team name"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Team Type</Label>
              <Select value={editTeamType} onValueChange={(value) => setEditTeamType(value as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select team type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Parent Team</Label>
              <Select value={editTeamParent} onValueChange={setEditTeamParent}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select parent team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">No parent (root level)</SelectItem>
                  {flatTeams
                    .filter(team => team.id !== editingTeam?.id) // Don't allow team to be parent of itself
                    .map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name} ({team.team_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editingTeam?.parent_id && (
                <p className="text-xs text-gray-500 mt-1">
                  Current parent: {flatTeams.find(t => t.id === editingTeam.parent_id)?.name || 'Unknown'}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Available teams: {flatTeams.filter(team => team.id !== editingTeam?.id).length}
              </p>
            </div>

            <div>
              <Label>Team Leader (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start mt-1">
                    {editTeamLeader 
                      ? users.find(u => u.id === editTeamLeader)?.name || 'Unknown User'
                      : 'Select team leader'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search users..." />
                    <CommandList>
                      <CommandEmpty>No users found.</CommandEmpty>
                      <CommandGroup>
                        {users.map(user => (
                          <CommandItem
                            key={user.id}
                            onSelect={() => setEditTeamLeader(user.id)}
                          >
                            <div className="flex items-center">
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  editTeamLeader === user.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <div>
                                <div className="font-medium">{user.name || user.email}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="edit-team-description">Description (Optional)</Label>
              <Input
                id="edit-team-description"
                value={editTeamDescription}
                onChange={(e) => setEditTeamDescription(e.target.value)}
                placeholder="Brief description of the team"
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-has-house-account"
                checked={editTeamHasHouseAccount}
                onCheckedChange={(checked) => setEditTeamHasHouseAccount(checked as boolean)}
              />
              <Label htmlFor="edit-has-house-account" className="text-sm font-medium">
                Team tracks house account
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-is-forecasted-team"
                checked={editTeamIsForecasted}
                onCheckedChange={(checked) => setEditTeamIsForecasted(checked as boolean)}
              />
              <Label htmlFor="edit-is-forecasted-team" className="text-sm font-medium">
                Team generates forecasts
              </Label>
            </div>

            {/* Warning for hierarchy changes */}
            {editTeamParent !== (editingTeam?.parent_id || 'root') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Hierarchy Change</p>
                    <p className="text-yellow-700">
                      This will move the team and all its children to a new location in the hierarchy.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditingTeam(false);
                setEditingTeam(null);
                setEditTeamName('');
                setEditTeamLeader('');
                setEditTeamParent('root');
                setEditTeamType('other');
                setEditTeamDescription('');
                setEditTeamHasHouseAccount(false);
                setEditTeamIsForecasted(true);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEditedTeam} disabled={!editTeamName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 