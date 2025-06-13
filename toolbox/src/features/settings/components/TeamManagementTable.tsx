import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
// Removed: import 'ag-grid-enterprise/styles/ag-grid.css';
import 'ag-grid-enterprise/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import { Button } from '@/components/ui/button';
import { PlusCircledIcon, Cross2Icon, TrashIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ModuleRegistry } from 'ag-grid-enterprise';
import {
  ClientSideRowModelModule,
  ServerSideRowModelModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  SetFilterModule,
  MultiFilterModule,
  RangeSelectionModule,
  RichSelectModule,
  PaginationModule,
  RowSelectionModule,
  TextFilterModule,
  CellStyleModule,
  ValidationModule,
  MenuModule,
  ClipboardModule,
  ExcelExportModule,
  MasterDetailModule,
  RowGroupingModule,
  AggregationModule,
  ColumnMenuModule,
  StatusBarModule,
  SideBarModule,
  TextEditorModule,
  IntegratedChartsModule,
  TreeDataModule
} from 'ag-grid-enterprise';
import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
// @ts-ignore
import myTheme from '../../../AGGridTheme';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { CheckIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { LicenseManager } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ServerSideRowModelModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  SetFilterModule,
  MultiFilterModule,
  RangeSelectionModule,
  RichSelectModule,
  PaginationModule,
  RowSelectionModule,
  TextFilterModule,
  CellStyleModule,
  ValidationModule,
  MenuModule,
  ClipboardModule,
  ExcelExportModule,
  MasterDetailModule,
  RowGroupingModule,
  AggregationModule,
  ColumnMenuModule,
  StatusBarModule,
  SideBarModule,
  TextEditorModule,
  IntegratedChartsModule.with(AgChartsEnterpriseModule),
  TreeDataModule
]);

if (import.meta.env.VITE_AG_GRID_LICENSE_KEY) {
  LicenseManager.setLicenseKey(import.meta.env.VITE_AG_GRID_LICENSE_KEY);
}

interface TeamRow {
  id: string;
  name: string;
  leader_user_id?: string;
  parent_team_id?: string;
  house_account_erp_id?: string;
  house_account_salesforce_id?: string;
  is_forecasted_team?: boolean;
  members: MemberRow[];
}
interface MemberRow {
  id: string;
  name?: string;
  email?: string;
  jobtitle?: string;
  department?: string;
}

const TeamManagementTable: React.FC = () => {
  const [rowData, setRowData] = useState<TeamRow[]>([]);
  const [allUsers, setAllUsers] = useState<MemberRow[]>([]);
  const [allTeams, setAllTeams] = useState<TeamRow[]>([]);
  const [allErpAccounts, setAllErpAccounts] = useState<any[]>([]);
  const [allSfAccounts, setAllSfAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addMemberTeamId, setAddMemberTeamId] = useState<string | null>(null);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLeader, setNewTeamLeader] = useState<string | null>(null);
  const [erpMappings, setErpMappings] = useState<Record<string, any[]>>({});
  const [sfMappings, setSfMappings] = useState<Record<string, any[]>>({});
  const gridRef = useRef<AgGridReact>(null);
  const [editTeam, setEditTeam] = useState<TeamRow | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedErpIds, setSelectedErpIds] = useState<string[]>([]);
  const [selectedSfIds, setSelectedSfIds] = useState<string[]>([]);
  const [editTab, setEditTab] = useState<'members' | 'erp' | 'sf'>('members');
  const [allUserMappings, setAllUserMappings] = useState<any[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Enhanced fetch function with minimal retries for speed
  const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 1): Promise<any> => {
    const token = localStorage.getItem('sb-access-token');
    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          // Shorter delay for speed
          const delay = 500; // Fixed 500ms delay
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const response = await fetch(url, defaultOptions);
        
        if (response.status === 429) {
          if (attempt < retries) {
            console.warn(`⚠️ Rate limited (429) on ${url}. Quick retry...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second only
            continue;
          } else {
            throw new Error(`Rate limit exceeded for ${url}`);
          }
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
      }
    }
    
    throw new Error(`All retry attempts failed for ${url}`);
  };

  // Fetch teams, users, ERP, and SF accounts with enhanced error handling
  useEffect(() => {
    let isMounted = true;
    
    const fetchInitialData = async () => {
      if (!isInitialLoad) return;
      
    setLoading(true);
      setError(null);
      
      try {
        console.log('🚀 Starting fast data fetch...');
        
        // Load core data with controlled concurrency (3 requests at once)
        const corePromises = [
          fetchWithRetry('/api/teams-with-members'),
          fetchWithRetry('/api/admin/profiles?limit=1000'),
          fetchWithRetry('/api/erp-salespeople')
        ];
        
        const [teamsRes, usersRes, erpRes] = await Promise.all(corePromises);
        
        // Start remaining requests while processing data
        const remainingPromises = [
          fetchWithRetry('/api/sf-users'),
          fetchWithRetry('/api/admin/profiles?limit=1')
        ];
        
        if (!isMounted) return;
        
        console.log('📋 Processing core data...');
        setRowData(teamsRes || []);
        setAllTeams(teamsRes || []);
        setAllUsers((usersRes?.profiles || []).map((u: any) => ({
        id: u.AzureID,
        name: u.name,
        email: u.email,
        jobtitle: u.jobtitle,
        department: u.department,
      })));
      setAllErpAccounts(erpRes || []);
        
        // Finish remaining requests
        const [sfRes, mappingRes] = await Promise.all(remainingPromises);
        
      setAllSfAccounts(sfRes || []);
        setAllUserMappings((usersRes?.mappings || mappingRes?.mappings || []));
        
        setLoading(false); // Show the grid immediately
        console.log('✅ Core data loaded! Loading mappings in background...');
        
        // Load team mappings in background with smart batching
        if (teamsRes && teamsRes.length > 0) {
          loadMappingsInBackground(teamsRes);
        } else {
          setIsInitialLoad(false);
        }
        
      } catch (err) {
        console.error('💥 Failed to load initial data:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load team management data');
          setLoading(false);
        }
      }
    };
    
    // Background mapping loader with smart batching
    const loadMappingsInBackground = async (teams: any[]) => {
      try {
        console.log('🔗 Loading team mappings with smart batching...');
        
        // Batch teams into groups of 3 for concurrent processing
        const batchSize = 3;
      const erpMap: Record<string, any[]> = {};
      const sfMap: Record<string, any[]> = {};
        
        for (let i = 0; i < teams.length; i += batchSize) {
          const batch = teams.slice(i, i + batchSize);
          console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(teams.length / batchSize)}`);
          
          // Process batch concurrently
          const batchPromises = batch.flatMap(team => [
            fetchWithRetry(`/api/api-team-erp-mapping?teamId=${team.id}`, {}, 1) // Only 1 retry for speed
              .then(erp => ({ teamId: team.id, type: 'erp', data: Array.isArray(erp) ? erp : [] }))
              .catch(() => ({ teamId: team.id, type: 'erp', data: [] })),
            fetchWithRetry(`/api/api-team-sf-mapping?teamId=${team.id}`, {}, 1)
              .then(sf => ({ teamId: team.id, type: 'sf', data: Array.isArray(sf) ? sf : [] }))
              .catch(() => ({ teamId: team.id, type: 'sf', data: [] }))
          ]);
          
          const batchResults = await Promise.all(batchPromises);
          
          // Process batch results
          batchResults.forEach(result => {
            if (result.type === 'erp') {
              erpMap[result.teamId] = result.data;
            } else {
              sfMap[result.teamId] = result.data;
            }
          });
          
          // Update UI with current progress
          if (isMounted) {
            setErpMappings(prev => ({ ...prev, ...erpMap }));
            setSfMappings(prev => ({ ...prev, ...sfMap }));
          }
          
          // Small delay between batches (much shorter than before)
          if (i + batchSize < teams.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        setIsInitialLoad(false);
        console.log('✅ All mappings loaded!');
        
      } catch (error) {
        console.error('❌ Background mapping load failed:', error);
        setIsInitialLoad(false);
      }
    };
    
    fetchInitialData();
    
    return () => {
      isMounted = false;
    };
  }, []); // Remove isInitialLoad dependency to prevent loops

  // Add debug logging for tree paths
  useEffect(() => {
    if (rowData.length > 0) {
      console.log('Team hierarchy paths:', rowData.map(team => ({
        name: team.name,
        parent_team_id: team.parent_team_id,
        path: getDataPath(team)
      })));
    }
  }, [rowData]);

  // Move getDataPath to a separate function for reuse
  const getDataPath = (data: TeamRow) => {
    const path: string[] = [];
    let current = data;
    console.log('Building path for team:', current.name, 'with parent:', current.parent_team_id);
    while (current) {
      path.unshift(current.name);
      if (!current.parent_team_id) break;
      const parent = rowData.find(t => t.id === current.parent_team_id);
      if (!parent) break;
      current = parent;
    }
    console.log('Generated path:', path);
    return path;
  };

  // Update functions
  const updateTeamField = async (teamId: string, field: string, value: string | null) => {
    const token = localStorage.getItem('sb-access-token');
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error('Failed to update team');
      setRowData(prev => prev.map(t => t.id === teamId ? { ...t, [field]: value } : t));
      toast.success('Team updated');
    } catch (err) {
      toast.error('Failed to update team');
    }
  };

  const updateTeamBoolField = async (teamId: string, field: string, value: boolean) => {
    const token = localStorage.getItem('sb-access-token');
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error('Failed to update team');
      setRowData(prev => prev.map(t => t.id === teamId ? { ...t, [field]: value } : t));
      toast.success('Team updated');
    } catch (err) {
      toast.error('Failed to update team');
    }
  };

  // Cell renderers for mapping columns
  const LeaderCellRenderer = (params: any) => {
    const { value, data } = params;
    const selectedUser = allUsers.find(u => u.id === value);
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="w-full h-full text-left truncate px-2 py-1.5" tabIndex={0} aria-label="Edit leader">
            <span className="truncate" title={selectedUser?.name || 'None'}>{selectedUser?.name || '—'}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search users..." />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                {allUsers.map(user => (
                  <CommandItem
                    key={user.id}
                    onSelect={() => updateTeamField(data.id, 'leader_user_id', user.id)}
                  >
                    <span className="flex items-center">
                      <span className={cn('mr-2 flex h-4 w-4 items-center justify-center rounded-sm border', value === user.id ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible')}>
                        <CheckIcon className="h-4 w-4" />
                      </span>
                      {user.name || user.email}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  const ParentTeamCellRenderer = (params: any) => {
    const { value, data } = params;
    const selectedTeam = allTeams.find(t => t.id === value);
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="w-full h-full text-left truncate px-2 py-1.5" tabIndex={0} aria-label="Edit parent team">
            <span className="truncate" title={selectedTeam?.name || 'None'}>{selectedTeam?.name || '—'}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search teams..." />
            <CommandList>
              <CommandEmpty>No teams found.</CommandEmpty>
              <CommandGroup>
                {allTeams.filter(t => t.id !== data.id).map(team => (
                  <CommandItem
                    key={team.id}
                    onSelect={() => updateTeamField(data.id, 'parent_team_id', team.id)}
                  >
                    <span className="flex items-center">
                      <span className={cn('mr-2 flex h-4 w-4 items-center justify-center rounded-sm border', value === team.id ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible')}>
                        <CheckIcon className="h-4 w-4" />
                      </span>
                      {team.name}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  const ForecastedTeamCellRenderer = (params: any) => {
    const { value, data } = params;
    const isForecasted = value === true;
    
    return (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={isForecasted}
          onCheckedChange={(checked) => updateTeamBoolField(data.id, 'is_forecasted_team', !!checked)}
          aria-label={`${isForecasted ? 'Disable' : 'Enable'} forecasting for ${data.name}`}
        />
        <span className="ml-2 text-xs text-muted-foreground">
          {isForecasted ? 'Generates forecasts' : 'Roll-up only'}
        </span>
      </div>
    );
  };

  const ErpCellRenderer = (params: any) => {
    const { data } = params;
    const teamId = data.id;
    const mappedErps = erpMappings[teamId] || [];
    console.log('[ERP CellRenderer]', { teamId, mappedErps });
    if (!Array.isArray(mappedErps)) {
      console.warn('[ERP CellRenderer] mappedErps is not an array:', mappedErps);
      return null;
    }
    if (mappedErps.length === 0) {
      console.info('[ERP CellRenderer] No mappings for team', teamId);
    }
    const MAX_VISIBLE = 3;
    const visible = mappedErps.slice(0, MAX_VISIBLE);
    const hidden = mappedErps.slice(MAX_VISIBLE);
    // Only show unmapped ERP accounts in the add dropdown
    const mappedIds = mappedErps.map((e: any) => e.erp_account_id);
    const available = allErpAccounts.filter((e: any) => !mappedIds.includes(e.salesperson_id));
    return (
      <div className="flex flex-wrap gap-2 items-center">
        {visible.map((erp: any) => (
          <span key={erp.erp_account_id || erp.salesperson_id || JSON.stringify(erp)} className="inline-flex items-center bg-muted rounded px-2 py-1 text-xs">
            {erp.erp_account?.name || erp.erp_account_id || erp.salesperson_id || JSON.stringify(erp)}
            <Button size="icon" variant="ghost" className="ml-1" onClick={() => handleRemoveErpMapping(teamId, erp.erp_account_id || erp.salesperson_id)}><Cross2Icon className="w-3 h-3" /></Button>
          </span>
        ))}
        {hidden.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" className="px-2">+{hidden.length} more</Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 max-h-64 overflow-auto">
              <div className="flex flex-col gap-2">
                {hidden.map((erp: any) => (
                  <span key={erp.erp_account_id || erp.salesperson_id || JSON.stringify(erp)} className="inline-flex items-center bg-muted rounded px-2 py-1 text-xs">
                    {erp.erp_account?.name || erp.erp_account_id || erp.salesperson_id || JSON.stringify(erp)}
                    <Button size="icon" variant="ghost" className="ml-1" onClick={() => handleRemoveErpMapping(teamId, erp.erp_account_id || erp.salesperson_id)}><Cross2Icon className="w-3 h-3" /></Button>
                  </span>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost"><PlusCircledIcon /></Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <Command>
              <CommandInput placeholder="Search ERP accounts..." />
              <CommandList>
                <CommandEmpty>No ERP accounts found.</CommandEmpty>
                <CommandGroup>
                  {available.map((erp: any) => (
                    <CommandItem key={erp.salesperson_id} onSelect={() => handleAddErpMapping(teamId, erp.salesperson_id)}>
                      {erp.name}
                      <PlusCircledIcon className="ml-auto h-4 w-4" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  const SfCellRenderer = (params: any) => {
    const { data } = params;
    const teamId = data.id;
    const mappedSfs = sfMappings[teamId] || [];
    const MAX_VISIBLE = 3;
    const visible = mappedSfs.slice(0, MAX_VISIBLE);
    const hidden = mappedSfs.slice(MAX_VISIBLE);
    // Only show unmapped SF accounts in the add dropdown
    const mappedIds = mappedSfs.map((s: any) => s.salesforce_account_id);
    const available = allSfAccounts.filter((s: any) => !mappedIds.includes(s.salesforce_user_id));
    return (
      <div className="flex flex-wrap gap-2 items-center">
        {visible.map((sf: any) => (
          <span key={sf.salesforce_account_id} className="inline-flex items-center bg-muted rounded px-2 py-1 text-xs">
            {sf.salesforce_account?.name || sf.salesforce_account_id}
            <Button size="icon" variant="ghost" className="ml-1" onClick={() => handleRemoveSfMapping(teamId, sf.salesforce_account_id)}><Cross2Icon className="w-3 h-3" /></Button>
          </span>
        ))}
        {hidden.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" className="px-2">+{hidden.length} more</Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 max-h-64 overflow-auto">
              <div className="flex flex-col gap-2">
                {hidden.map((sf: any) => (
                  <span key={sf.salesforce_account_id} className="inline-flex items-center bg-muted rounded px-2 py-1 text-xs">
                    {sf.salesforce_account?.name || sf.salesforce_account_id}
                    <Button size="icon" variant="ghost" className="ml-1" onClick={() => handleRemoveSfMapping(teamId, sf.salesforce_account_id)}><Cross2Icon className="w-3 h-3" /></Button>
                  </span>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost"><PlusCircledIcon /></Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <Command>
              <CommandInput placeholder="Search SF accounts..." />
              <CommandList>
                <CommandEmpty>No SF accounts found.</CommandEmpty>
                <CommandGroup>
                  {available.map((sf: any) => (
                    <CommandItem key={sf.salesforce_user_id} onSelect={() => handleAddSfMapping(teamId, sf.salesforce_user_id)}>
                      {sf.name}
                      <PlusCircledIcon className="ml-auto h-4 w-4" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  // Add member to team
  const handleAddMember = async (teamId: string, userId: string) => {
    const token = localStorage.getItem('sb-access-token');
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ user_ids: [userId] }),
      });
      if (!res.ok) throw new Error('Failed to add member');
      // Optimistically update UI
      const user = allUsers.find(u => u.id === userId);
      setRowData(prev => prev.map(t => t.id === teamId ? { ...t, members: [...t.members, { id: userId, name: user?.name, email: user?.email }] } : t));
      toast.success('Member added');
      setAddMemberTeamId(null);
    } catch (err) {
      toast.error('Failed to add member');
    }
  };

  // Remove member from team
  const handleRemoveMember = async (teamId: string, userId: string) => {
    const token = localStorage.getItem('sb-access-token');
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to remove member');
      setRowData(prev => prev.map(t => t.id === teamId ? { ...t, members: t.members.filter(m => m.id !== userId) } : t));
      toast.success('Member removed');
    } catch (err) {
      toast.error('Failed to remove member');
    }
  };

  // Create new team
  const handleCreateTeam = async () => {
    if (!newTeamName || !newTeamLeader) {
      toast.error('Team name and leader are required');
      return;
    }

    const token = localStorage.getItem('sb-access-token');
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          name: newTeamName,
          leader_user_id: newTeamLeader
        }),
      });
      
      if (!res.ok) throw new Error('Failed to create team');
      
      const newTeam = await res.json();
      setRowData(prev => [...prev, { ...newTeam, members: [] }]);
      setNewTeamName('');
      setNewTeamLeader(null);
      setIsCreatingTeam(false);
      toast.success('Team created successfully');
    } catch (err) {
      toast.error('Failed to create team');
    }
  };

  // Delete team
  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team? This will remove all team memberships.')) {
      return;
    }

    const token = localStorage.getItem('sb-access-token');
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error('Failed to delete team');
      
      setRowData(prev => prev.filter(t => t.id !== teamId));
      toast.success('Team deleted successfully');
    } catch (err) {
      toast.error('Failed to delete team');
    }
  };

  // Add/Remove ERP mapping
  const handleAddErpMapping = async (teamId: string, erpAccountId: string) => {
    try {
      console.log(`➕ Adding ERP mapping for team ${teamId}...`);
      
      const postResponse = await fetchWithRetry(`/api/api-team-erp-mapping?teamId=${teamId}`, {
      method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ erpAccountIds: [erpAccountId] })
    });
      const postData = await postResponse.json().catch(() => ({}));
      console.log('[ERP] POST response:', postResponse.status, postData);
      
      // Add delay before refreshing
      await new Promise(res => setTimeout(res, 500));
      
    // Refresh mappings
      const refreshResponse = await fetchWithRetry(`/api/api-team-erp-mapping?teamId=${teamId}`);
      const erp = await refreshResponse.json().catch(() => []);
    console.log('[ERP] Refetched mappings:', erp);
      
    setErpMappings(prev => {
        const updated = { ...prev, [teamId]: Array.isArray(erp) ? erp : [] };
      console.log('[ERP] Updated erpMappings state:', updated);
      return updated;
    });
      
      toast.success('ERP mapping added successfully');
    } catch (error) {
      console.error('Failed to add ERP mapping:', error);
      toast.error(`Failed to add ERP mapping: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const handleRemoveErpMapping = async (teamId: string, erpAccountId: string) => {
    try {
      console.log(`➖ Removing ERP mapping for team ${teamId}...`);
      
      const deleteResponse = await fetchWithRetry(`/api/api-team-erp-mapping?teamId=${teamId}`, {
      method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ erpAccountId })
    });
      const delData = await deleteResponse.json().catch(() => ({}));
      console.log('[ERP] DELETE response:', deleteResponse.status, delData);
      
      // Add delay before refreshing
      await new Promise(res => setTimeout(res, 500));
      
    // Refresh mappings
      const refreshResponse = await fetchWithRetry(`/api/api-team-erp-mapping?teamId=${teamId}`);
      const erp = await refreshResponse.json().catch(() => []);
    console.log('[ERP] Refetched mappings:', erp);
      
    setErpMappings(prev => {
        const updated = { ...prev, [teamId]: Array.isArray(erp) ? erp : [] };
      console.log('[ERP] Updated erpMappings state:', updated);
      return updated;
    });
      
      toast.success('ERP mapping removed successfully');
    } catch (error) {
      console.error('Failed to remove ERP mapping:', error);
      toast.error(`Failed to remove ERP mapping: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Add/Remove SF mapping
  const handleAddSfMapping = async (teamId: string, sfAccountId: string) => {
    try {
      console.log(`➕ Adding SF mapping for team ${teamId}...`);
      
      const postResponse = await fetchWithRetry(`/api/api-team-sf-mapping?teamId=${teamId}`, {
      method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salesforceAccountIds: [sfAccountId] })
    });
      const postData = await postResponse.json().catch(() => ({}));
      console.log('[SF] POST response:', postResponse.status, postData);
      
      // Add delay before refreshing
      await new Promise(res => setTimeout(res, 500));
      
    // Refresh mappings
      const refreshResponse = await fetchWithRetry(`/api/api-team-sf-mapping?teamId=${teamId}`);
      const sf = await refreshResponse.json().catch(() => []);
    console.log('[SF] Refetched mappings:', sf);
      
    setSfMappings(prev => {
        const updated = { ...prev, [teamId]: Array.isArray(sf) ? sf : [] };
      console.log('[SF] Updated sfMappings state:', updated);
      return updated;
    });
      
      toast.success('SF mapping added successfully');
    } catch (error) {
      console.error('Failed to add SF mapping:', error);
      toast.error(`Failed to add SF mapping: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const handleRemoveSfMapping = async (teamId: string, sfAccountId: string) => {
    try {
      console.log(`➖ Removing SF mapping for team ${teamId}...`);
      
      const deleteResponse = await fetchWithRetry(`/api/api-team-sf-mapping?teamId=${teamId}`, {
      method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salesforceAccountId: sfAccountId })
    });
      const delData = await deleteResponse.json().catch(() => ({}));
      console.log('[SF] DELETE response:', deleteResponse.status, delData);
      
      // Add delay before refreshing
      await new Promise(res => setTimeout(res, 500));
      
    // Refresh mappings
      const refreshResponse = await fetchWithRetry(`/api/api-team-sf-mapping?teamId=${teamId}`);
      const sf = await refreshResponse.json().catch(() => []);
    console.log('[SF] Refetched mappings:', sf);
      
    setSfMappings(prev => {
        const updated = { ...prev, [teamId]: Array.isArray(sf) ? sf : [] };
      console.log('[SF] Updated sfMappings state:', updated);
      return updated;
    });
      
      toast.success('SF mapping removed successfully');
    } catch (error) {
      console.error('Failed to remove SF mapping:', error);
      toast.error(`Failed to remove SF mapping: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  function openEditModal(team: any) {
    setEditTeam(team);
    setSelectedUserIds((team.members || []).map((m: any) => m.id));
    setSelectedErpIds((erpMappings[team.id] || []).map((e: any) => e.erp_account_id));
    setSelectedSfIds((sfMappings[team.id] || []).map((s: any) => s.salesforce_account_id));
  }

  async function handleSave() {
    if (!editTeam) return;
    const token = localStorage.getItem('sb-access-token');
    await fetch(`/api/teams/${editTeam.id}/members`, {
      method: 'PUT',
      body: JSON.stringify({ userIds: selectedUserIds }),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    });
    await fetch(`/api/api-team-erp-mapping?teamId=${editTeam.id}`, {
      method: 'PUT',
      body: JSON.stringify({ erpAccountIds: selectedErpIds }),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    });
    await fetch(`/api/api-team-sf-mapping?teamId=${editTeam.id}`, {
      method: 'PUT',
      body: JSON.stringify({ salesforceAccountIds: selectedSfIds }),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    });
    setEditTeam(null);
    window.location.reload(); // Or refetchTeams() if you have a fetch function
  }

  function SearchableList({ items, selectedIds, onChange, labelKey }: { items: any[]; selectedIds: string[]; onChange: (ids: string[]) => void; labelKey: string }) {
    const [search, setSearch] = useState('');
    // Remove already selected items from the unselected list
    const selectedItems = items.filter((item: any) => {
      const id = item.id || item.salesperson_id || item.salesforce_user_id;
      return selectedIds.includes(id);
    });
    const unselectedItems = items.filter((item: any) => {
      const id = item.id || item.salesperson_id || item.salesforce_user_id;
      return !selectedIds.includes(id);
    });
    // Filter by search
    const filteredSelected = selectedItems.filter((item: any) => (item[labelKey] || '').toLowerCase().includes(search.toLowerCase()));
    const filteredUnselected = unselectedItems.filter((item: any) => (item[labelKey] || '').toLowerCase().includes(search.toLowerCase()));
    // Show selected first, then unselected
    const sorted = [...filteredSelected, ...filteredUnselected];
    return (
      <div>
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." />
        <div className="max-h-64 overflow-auto">
          {sorted.map((item: any) => {
            const id = item.id || item.salesperson_id || item.salesforce_user_id;
            return (
              <div key={id} className="flex items-center gap-2 py-1">
                <Checkbox
                  checked={selectedIds.includes(id)}
                  onCheckedChange={checked => {
                    if (checked) onChange([...selectedIds, id]);
                    else onChange(selectedIds.filter((i: any) => i !== id));
                  }}
                />
                {item[labelKey]}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // AG Grid columns
  const columnDefs = useMemo<ColDef<TeamRow>[]>(() => [
    { headerName: 'Team Name', field: 'name', editable: true, flex: 1, hide: true },
    { headerName: 'Leader', field: 'leader_user_id', editable: false, flex: 1, cellRenderer: LeaderCellRenderer },
    { headerName: 'Parent Team', field: 'parent_team_id', editable: false, flex: 1, cellRenderer: ParentTeamCellRenderer },
    {
      headerName: 'Forecasted',
      field: 'is_forecasted_team',
      editable: false,
      flex: 1,
      cellRenderer: ForecastedTeamCellRenderer
    },
    {
      headerName: 'Members',
      field: 'members',
      flex: 2,
      cellRenderer: (params: any) => (
        <Button variant="ghost" onClick={() => openEditModal(params.data)}>
          {(params.value?.length ?? 0)} members
        </Button>
      ),
      hide: false
    },
    {
      headerName: 'ERP Mappings',
      flex: 1,
      cellRenderer: (params: any) => (
        <Button variant="ghost" onClick={() => openEditModal(params.data)}>
          {(erpMappings[params.data.id] || []).length} mapped
        </Button>
      ),
      hide: false
    },
    {
      headerName: 'SF Mappings',
      flex: 1,
      cellRenderer: (params: any) => (
        <Button variant="ghost" onClick={() => openEditModal(params.data)}>
          {(sfMappings[params.data.id] || []).length} mapped
        </Button>
      ),
      hide: false
    },
    {
      headerName: 'Actions',
      field: 'id',
      width: 100,
      cellRenderer: (params: ICellRendererParams<TeamRow>) => (
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleDeleteTeam(params.data!.id)}
            className="text-destructive hover:text-destructive"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
      hide: true
    }
  ], [allUsers, allTeams, addMemberTeamId, erpMappings, sfMappings, allUserMappings]);

  // Helper to get mapping for a user
  function getUserMapping(userId: string) {
    if (!allUserMappings) return undefined;
    return allUserMappings.find((m: any) => m.supabase_user_id === userId);
  }
  const memberErpIds = editTeam && editTeam.members
    ? editTeam.members
        .map((m: any) => {
          const mapping = getUserMapping(m.id);
          return mapping?.erp_salesperson_id;
        })
        .filter(Boolean)
    : [];
  const memberSfIds = editTeam && editTeam.members
    ? editTeam.members
        .map((m: any) => {
          const mapping = getUserMapping(m.id);
          return mapping?.salesforce_user_id;
        })
        .filter(Boolean)
    : [];

  // Compute all mapped ERP and SF account IDs (except for current team)
  const allMappedErp = Object.entries(erpMappings)
    .flatMap(([teamId, mappings]) => {
      if (teamId === (editTeam?.id || '') || !Array.isArray(mappings)) {
        return [];
      }
      return mappings.map(m => m?.erp_account_id).filter(Boolean);
    });
  const allMappedSf = Object.entries(sfMappings)
    .flatMap(([teamId, mappings]) => {
      if (teamId === (editTeam?.id || '') || !Array.isArray(mappings)) {
        return [];
      }
      return mappings.map(m => m?.salesforce_account_id).filter(Boolean);
    });

  return (
    <>
      <style>{`
        .shadow-quartz {
          box-shadow: 0 2px 16px 0 rgba(44, 62, 80, 0.08), 0 1.5px 4px 0 rgba(44, 62, 80, 0.04);
        }
        .bg-quartz-light {
          background: #f8fafc;
        }
        .ag-theme-quartz .ag-cell, .ag-theme-quartz .ag-header-cell-label {
          font-size: 0.75rem !important;
        }
        .ag-theme-quartz .ag-group-child-count {
          display: none !important;
        }
        .ag-theme-quartz .ag-group-expanded,
        .ag-theme-quartz .ag-group-contracted {
          margin-right: 6px !important;
        }
        .ag-theme-quartz .ag-group-value {
          padding-left: 4px !important;
        }
      `}</style>

      {/* Create Team Button and Dialog */}
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setIsCreatingTeam(true)}>
          <PlusCircledIcon className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </div>

      <Dialog open={isCreatingTeam} onOpenChange={setIsCreatingTeam}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new team and assign a leader.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Enter team name"
              />
            </div>
            <div className="grid gap-2">
              <Label>Team Leader</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    {newTeamLeader ? allUsers.find(u => u.id === newTeamLeader)?.name || 'Unknown' : 'Select leader'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0">
                  <Command>
                    <CommandInput placeholder="Search users..." />
                    <CommandList>
                      <CommandEmpty>No users found.</CommandEmpty>
                      <CommandGroup>
                        {allUsers.map(user => (
                          <CommandItem
                            key={user.id}
                            onSelect={() => setNewTeamLeader(user.id)}
                          >
                            <span className="flex items-center">
                              <span className={cn('mr-2 flex h-4 w-4 items-center justify-center rounded-sm border', newTeamLeader === user.id ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible')}>
                                <CheckIcon className="h-4 w-4" />
                              </span>
                              {user.name || user.email}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingTeam(false)}>Cancel</Button>
            <Button onClick={handleCreateTeam}>Create Team</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTeam} onOpenChange={() => setEditTeam(null)}>
        <DialogContent>
          <div className="flex gap-2 mb-4">
            <Button variant={editTab === 'members' ? 'default' : 'outline'} onClick={() => setEditTab('members')}>Members</Button>
            <Button variant={editTab === 'erp' ? 'default' : 'outline'} onClick={() => setEditTab('erp')}>ERP Mappings</Button>
            <Button variant={editTab === 'sf' ? 'default' : 'outline'} onClick={() => setEditTab('sf')}>SF Mappings</Button>
          </div>
          {editTab === 'members' && (
            <SearchableList
              items={allUsers}
              selectedIds={selectedUserIds}
              onChange={setSelectedUserIds}
              labelKey="name"
            />
          )}
          {editTab === 'erp' && (
            <SearchableList
              items={allErpAccounts.filter(
                (erp: any) =>
                  !allMappedErp.includes(erp.salesperson_id) &&
                  !memberErpIds.includes(erp.salesperson_id)
              )}
              selectedIds={selectedErpIds}
              onChange={setSelectedErpIds}
              labelKey="name"
            />
          )}
          {editTab === 'sf' && (
            <SearchableList
              items={allSfAccounts.filter(
                (sf: any) =>
                  !allMappedSf.includes(sf.salesforce_user_id) &&
                  !memberSfIds.includes(sf.salesforce_user_id)
              )}
              selectedIds={selectedSfIds}
              onChange={setSelectedSfIds}
              labelKey="name"
            />
          )}
          <DialogFooter>
            <Button onClick={handleSave}>Save</Button>
            <Button variant="outline" onClick={() => setEditTeam(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className='ag-theme-quartz shadow-quartz bg-quartz-light' style={{ width: '100%', borderRadius: '1rem', overflow: 'hidden', minHeight: 400, height: '75vh', marginTop: 32 }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="animate-spin inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
            <span className="ml-3 text-base text-gray-400">Loading teams…</span>
          </div>
        ) : error ? (
          <div className="p-4 text-red-500">{error}</div>
        ) : (
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            domLayout="normal"
            defaultColDef={{
              resizable: true,
              sortable: true,
              filter: true,
              minWidth: 60,
              flex: 1,
            }}
            treeData={true}
            getDataPath={getDataPath}
            groupDefaultExpanded={-1}
            autoGroupColumnDef={{
              headerName: 'Team',
              minWidth: 250,
              field: 'name',
              cellRendererParams: {
                suppressCount: true,
                innerRenderer: (params: { value: string }) => params.value
              }
            }}
            suppressAggFuncInHeader={true}
            suppressGroupRowsSticky={false}
            animateRows={true}
            pagination={true}
            paginationPageSize={25}
            paginationPageSizeSelector={[25, 50, 100, 200]}
            enableCellTextSelection={true}
            sideBar={{
              toolPanels: [
                { id: 'columns', labelDefault: 'Columns', labelKey: 'columns', iconKey: 'columns', toolPanel: 'agColumnsToolPanel' },
                { id: 'filters', labelDefault: 'Filters', labelKey: 'filters', iconKey: 'filter', toolPanel: 'agFiltersToolPanel' }
              ],
              defaultToolPanel: undefined
            }}
            suppressColumnVirtualisation={true}
            suppressRowVirtualisation={true}
          />
        )}
      </div>
    </>
  );
};

export default TeamManagementTable; 