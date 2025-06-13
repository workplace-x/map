import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { LicenseManager } from 'ag-grid-enterprise';
import 'ag-grid-enterprise';
import 'ag-grid-enterprise/styles/ag-theme-quartz.css';
import { ModuleRegistry } from 'ag-grid-enterprise';
import {
  ClientSideRowModelModule,
  MenuModule,
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
  ColDef,
  RowStyleModule,
  TooltipModule,
  ValidationModule
} from 'ag-grid-enterprise';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { CheckIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Check } from 'lucide-react';

// Set AG Grid license key
LicenseManager.setLicenseKey(import.meta.env.VITE_AG_GRID_LICENSE_KEY || '');

// Register AG Grid modules
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  MenuModule,
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
  RowStyleModule,
  TooltipModule,
  ValidationModule
]);

// User row interface
interface UserRow {
  id: string;
  email: string;
  name?: string;
  jobtitle?: string;
  department?: string;
  teams: string[];
  erpSalespeople?: string[];
  sfUsers?: string[];
  role?: string;
  signedIn?: boolean;
  accountenabled?: boolean;
}

// Constants
const LIMIT = 100; // Increased from 50 to 100 for better performance

const UserManagementTable: React.FC = () => {
  // Refs
  const gridRef = useRef<any>(null);
  
  // State
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [allErpSalespeople, setAllErpSalespeople] = useState<any[]>([]);
  const [allSfUsers, setAllSfUsers] = useState<any[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterEnabled, setFilterEnabled] = useState('');
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [refsReady, setRefsReady] = useState(false);
  const [rowData, setRowData] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch reference data first
  useEffect(() => {
    setLoadingRefs(true);
    const token = localStorage.getItem('sb-access-token');
    console.log('[UserManagementTable] Starting to fetch reference data with token:', token ? 'present' : 'missing');
    const fetchOptions = async () => {
      try {
        console.log('[UserManagementTable] Making API requests for reference data');
        const [teamsRes, erpRes, sfRes] = await Promise.all([
          fetch('/api/teams', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/erp-salespeople', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/sf-users', { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);
        
        console.log('[UserManagementTable] API responses:', {
          teams: teamsRes.status,
          erp: erpRes.status,
          sf: sfRes.status
        });
        
        if (!teamsRes.ok || !erpRes.ok || !sfRes.ok) {
          throw new Error('Failed to fetch reference data');
        }
        
        const teamsData = await teamsRes.json();
        const erpData = await erpRes.json();
        const sfData = await sfRes.json();
        
        console.log('[UserManagementTable] Parsed reference data:', {
          teams: teamsData.length,
          erp: erpData.length,
          sf: sfData.length
        });
        
        setAllTeams(teamsData);
        setAllErpSalespeople(erpData);
        setAllSfUsers(sfData);
        setLoadingRefs(false);
        setRefsReady(true);
        
        console.log('[UserManagementTable] State updated with reference data');
      } catch (error) {
        console.error('[UserManagementTable] Error fetching reference data:', error);
        toast.error('Failed to load reference data');
        setLoadingRefs(false);
      }
    };
    
    fetchOptions();
  }, []);

  // Fetch user data when reference data is ready or filters change
  useEffect(() => {
    if (!refsReady) return;
    
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('sb-access-token');
        const params = new URLSearchParams({
          offset: '0'
        });
        params.append('limit', '1000');
        if (search) params.append('search', search);
        if (filterRole) params.append('role', filterRole);
        if (filterDepartment) params.append('department', filterDepartment);
        if (filterEnabled) params.append('enabled', filterEnabled);
        
        console.log('[UserTableAG][SHADCN] Fetching data with params:', params.toString());
        
        const res = await fetch(`/api/admin/profiles?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch profiles');
        }
        
        const json = await res.json();
        console.log('[UserTableAG] API response:', json);
        
        // Process the data
        const profiles = json.profiles || [];
        const teamMembers = json.teamMembers || [];
        const mappings = json.mappings || [];
        const userRoles = json.userRoles || [];
        
        console.log('[UserTableAG] Raw data:', {
          profiles: profiles.length,
          teamMembers: teamMembers.length,
          mappings: mappings.length,
          userRoles: userRoles.length,
          sampleMapping: mappings[0],
          sampleProfile: profiles[0]
        });
        
        // Transform data
        const users = profiles.map((profile: any) => {
          const userTeams = teamMembers
            .filter((tm: any) => tm.azure_id === profile.AzureID)
            .map((tm: any) => tm.team_id);
            
          const erpSalespeople = mappings
            .filter((m: any) => {
              console.log('[UserTableAG] Checking mapping:', {
                mapping: m,
                profileId: profile.AzureID,
                matches: m.supabase_user_id === profile.AzureID || m.azure_id === profile.AzureID
              });
              return (m.supabase_user_id === profile.AzureID || m.azure_id === profile.AzureID) && m.erp_salesperson_id;
            })
            .map((m: any) => m.erp_salesperson_id);
            
          const sfUsers = mappings
            .filter((m: any) => {
              console.log('[UserTableAG] Checking SF mapping:', {
                mapping: m,
                profileId: profile.AzureID,
                matches: m.supabase_user_id === profile.AzureID || m.azure_id === profile.AzureID
              });
              return (m.supabase_user_id === profile.AzureID || m.azure_id === profile.AzureID) && m.salesforce_user_id;
            })
            .map((m: any) => m.salesforce_user_id);
            
          const role = userRoles.find((r: any) => r.supabase_user_id === profile.AzureID)?.role;
          
          return {
            id: profile.AzureID,
            email: profile.email,
            name: profile.name,
            jobtitle: profile.jobtitle,
            department: profile.department,
            teams: userTeams,
            erpSalespeople,
            sfUsers,
            role,
            signedIn: !!profile.user_id,
            accountenabled: profile.accountenabled
          };
        });
        
        setRowData(users);
        setTotalCount(json.totalCount || users.length);
      } catch (error) {
        console.error('[UserTableAG] Error fetching user data:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [refsReady, search, filterRole, filterDepartment, filterEnabled]);

  // API handlers
  const deleteUser = async (profileId: string) => {
    try {
      const token = localStorage.getItem('sb-access-token');
      const res = await fetch(`/api/admin/profiles/${profileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete profile');
      }
      
      toast.success('Profile deleted successfully');
      
      // Remove from local data
      setRowData(prev => prev.filter(row => row.id !== profileId));
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error('Failed to delete profile');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('sb-access-token');
      const res = await fetch('/api/admin/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId, newRole }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update role');
      }
      
      toast.success('Role updated successfully');
      
      // Update local data
      setRowData(prev => 
        prev.map(row => row.id === userId ? { ...row, role: newRole } : row)
      );
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
      
      // Refresh grid to revert changes
      if (gridRef.current && gridRef.current.api) {
        gridRef.current.api.refreshCells({ force: true });
      }
    }
  };

  // Update teams for a user
  const updateTeams = async (userId: string, teamIds: string[]) => {
    try {
      const token = localStorage.getItem('sb-access-token');
      const res = await fetch('/api/admin/update-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ azureId: userId, teamIds }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update teams');
      }
      
      toast.success('Teams updated successfully');
      
      // Update local data
      setRowData(prev => 
        prev.map(row => row.id === userId ? { ...row, teams: teamIds } : row)
      );
    } catch (error) {
      console.error('Error updating teams:', error);
      toast.error('Failed to update teams');
    }
  };

  // Update ERP/SF mappings
  const updateMapping = async (userId: string, erpIds?: string[], sfIds?: string[]) => {
    try {
      // First get current data
      const currentRow = rowData.find(row => row.id === userId);
      if (!currentRow) return;
      
      // Prepare optimistic update
      const updatedData = { ...currentRow };
      if (erpIds !== undefined) updatedData.erpSalespeople = erpIds;
      if (sfIds !== undefined) updatedData.sfUsers = sfIds;
      
      // Update local data optimistically
      setRowData(prev => 
        prev.map(row => row.id === userId ? updatedData : row)
      );
      
      // Send to server
      const token = localStorage.getItem('sb-access-token');
      
      // Use a single API call for both ERP and SF mappings
      const res = await fetch('/api/admin/update-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          azureId: userId, 
          erpSalespersonIds: erpIds,
          salesforceUserIds: sfIds 
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update mappings');
      }
      
      toast.success('Mappings updated successfully');
    } catch (error) {
      console.error('Error updating mappings:', error);
      toast.error('Failed to update mappings');
      
      // Refresh data to revert changes
      const fetchUsers = async () => {
        // Refetch data to ensure consistency
        const token = localStorage.getItem('sb-access-token');
        const res = await fetch(`/api/admin/profiles?limit=${LIMIT}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          // Process and update data
          // (simplified - in a real app, you'd process the data as before)
          setRowData(json.profiles || []);
        }
      };
      
      fetchUsers();
    }
  };

  // Custom cell renderers for mapping columns
  const TeamsCellRenderer = useCallback((params: any) => {
    const { data, value } = params;
    if (!data) return null;
    
    const selectedIds = value || [];
    const selectedTeams = allTeams.filter(t => selectedIds.includes(t.id));
    
    // Create summary text
    const summary = selectedTeams.length === 0
      ? 'None'
      : selectedTeams.length <= 2
        ? selectedTeams.map(t => t.name).join(', ')
        : `${selectedTeams[0].name}, +${selectedTeams.length - 1} more`;
    
    return (
      <div className="flex items-center h-full">
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-full h-full text-left truncate px-2 py-1.5" tabIndex={0} aria-label="Edit teams">
              <span className="truncate" title={selectedTeams.map(t => t.name).join(', ') || 'None'}>{summary}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search teams..." />
              <CommandList>
                <CommandEmpty>No teams found.</CommandEmpty>
                <CommandGroup>
                  {allTeams.map(team => {
                    const isSelected = selectedIds.includes(team.id);
                    return (
                      <CommandItem
                        key={team.id}
                        onSelect={() => {
                          let newTeams;
                          if (isSelected) {
                            newTeams = selectedIds.filter((id: string) => id !== team.id);
                          } else {
                            newTeams = [...selectedIds, team.id];
                          }
                          updateTeams(params.data.id, newTeams);
                        }}
                      >
                        <span className="flex items-center">
                          <span className={cn('mr-2 flex h-4 w-4 items-center justify-center rounded-sm border', isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible')}>
                            <CheckIcon className="h-4 w-4" />
                          </span>
                          {team.name}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  }, [allTeams, updateTeams]);

  // ERP cell renderer
  const ErpCellRenderer = useCallback((params: any) => {
    const { data, value } = params;
    if (!data) return null;
    
    console.log('[ERP Cell] Rendering cell for:', {
      user: data.email,
      value,
      allErpSalespeople: allErpSalespeople.length
    });
    
    const selectedIds = value || [];
    const selectedErp = allErpSalespeople.filter(e => selectedIds.includes(e.salesperson_id));
    
    console.log('[ERP Cell] Selected ERP salespeople:', {
      selectedIds,
      matchedSalespeople: selectedErp.length
    });
    
    // Create summary text with fallback to raw IDs
    let summary;
    if (selectedErp.length === 0) {
      summary = selectedIds.length > 0 ? selectedIds.join(', ') : 'None';
    } else if (selectedErp.length <= 2) {
      summary = selectedErp.map(e => e.name).join(', ');
    } else {
      summary = `${selectedErp[0].name}, +${selectedErp.length - 1} more`;
    }
    
    return (
      <div className="flex items-center gap-2">
        <span>{summary}</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search ERP salespeople..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {allErpSalespeople.map((erp) => (
                      <CommandItem
                        key={erp.salesperson_id}
                        onSelect={() => {
                        const newIds = selectedIds.includes(erp.salesperson_id)
                          ? selectedIds.filter((id: string) => id !== erp.salesperson_id)
                          : [...selectedIds, erp.salesperson_id];
                        updateMapping(data.id, newIds, undefined);
                        }}
                      >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedIds.includes(erp.salesperson_id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                          {erp.name}
                      </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  }, [allErpSalespeople, updateMapping]);

  // SF cell renderer
  const SfCellRenderer = useCallback((params: any) => {
    const { data, value } = params;
    if (!data) return null;
    
    console.log('[SF Cell] Rendering cell for:', {
      user: data.email,
      value,
      allSfUsers: allSfUsers.length
    });
    
    const selectedIds = value || [];
    const selectedSf = allSfUsers.filter(s => selectedIds.includes(s.salesforce_user_id));
    
    console.log('[SF Cell] Selected SF users:', {
      selectedIds,
      matchedUsers: selectedSf.length
    });
    
    // Create summary text with fallback to raw IDs
    let summary;
    if (selectedSf.length === 0) {
      summary = selectedIds.length > 0 ? selectedIds.join(', ') : 'None';
    } else if (selectedSf.length <= 2) {
      summary = selectedSf.map(s => s.name).join(', ');
    } else {
      summary = `${selectedSf[0].name}, +${selectedSf.length - 1} more`;
    }
    
    return (
      <div className="flex items-center gap-2">
        <span>{summary}</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search Salesforce users..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {allSfUsers.map((sf) => (
                      <CommandItem
                        key={sf.salesforce_user_id}
                        onSelect={() => {
                        const newIds = selectedIds.includes(sf.salesforce_user_id)
                          ? selectedIds.filter((id: string) => id !== sf.salesforce_user_id)
                          : [...selectedIds, sf.salesforce_user_id];
                        updateMapping(data.id, undefined, newIds);
                        }}
                      >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedIds.includes(sf.salesforce_user_id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                          {sf.name}
                      </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  }, [allSfUsers, updateMapping]);

  const RoleCellRenderer = useCallback((params: any) => {
    const { data, value } = params;
    if (!data) return null;
    
    return (
      <div className="flex items-center h-full">
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-full h-full text-left truncate px-2 py-1.5" tabIndex={0} aria-label="Edit role">
              <span className="truncate" title={value || 'None'}>{value || 'None'}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search roles..." />
              <CommandList>
                <CommandEmpty>No roles found.</CommandEmpty>
                <CommandGroup>
                  {['admin', 'user', 'manager', ''].map(role => {
                    const isSelected = value === role;
                    return (
                      <CommandItem
                        key={role}
                        onSelect={() => {
                          handleRoleChange(params.data.id, role);
                        }}
                      >
                        <span className="flex items-center">
                          <span className={cn('mr-2 flex h-4 w-4 items-center justify-center rounded-sm border', isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible')}>
                            <CheckIcon className="h-4 w-4" />
                          </span>
                          {role || 'None'}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  }, [handleRoleChange]);

  const ActionsCellRenderer = useCallback((params: any) => {
    const handleDelete = () => {
      if (window.confirm('Are you sure you want to delete this profile?')) {
        deleteUser(params.data.id);
      }
    };
    
    return (
      <div className="flex items-center justify-center h-full">
        <Button size="icon" variant="ghost" aria-label="Delete User" onClick={handleDelete}>
          <Cross2Icon />
        </Button>
      </div>
    );
  }, []);

  // Column definitions
  const columnDefs = useMemo<ColDef[]>(() => [
    // Name column (pinned left)
    {
      field: 'name',
      headerName: 'NAME',
      pinned: 'left',
      lockPinned: true,
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 160,
      cellClass: 'ag-cell-name',
      headerClass: 'ag-header-uppercase'
    },
    // Email column (pinned left)
    {
      field: 'email',
      headerName: 'EMAIL',
      pinned: 'left',
      lockPinned: true,
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 180,
      cellClass: 'ag-cell-email',
      headerClass: 'ag-header-uppercase'
    },
    // Job Title column
    {
      field: 'jobtitle',
      headerName: 'JOB TITLE',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 140,
      headerClass: 'ag-header-uppercase'
    },
    // Department column
    {
      field: 'department',
      headerName: 'DEPARTMENT',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 120,
      headerClass: 'ag-header-uppercase'
    },
    // Teams column with custom cell renderer and valueFormatter fallback
    {
      field: 'teams',
      headerName: 'TEAMS',
      width: 160,
      cellRenderer: TeamsCellRenderer,
      headerClass: 'ag-header-uppercase',
      filter: 'agTextColumnFilter',
      editable: false,
      valueFormatter: params => Array.isArray(params.value) ? params.value.join(', ') : ''
    },
    // ERP Salespeople column with custom cell renderer and valueFormatter fallback
    {
      field: 'erpSalespeople',
      headerName: 'ERP SALESPEOPLE',
      width: 180,
      cellRenderer: ErpCellRenderer,
      headerClass: 'ag-header-uppercase',
      filter: 'agTextColumnFilter',
      editable: false,
      valueFormatter: params => Array.isArray(params.value) ? params.value.join(', ') : ''
    },
    // Salesforce Users column with custom cell renderer and valueFormatter fallback
    {
      field: 'sfUsers',
      headerName: 'SALESFORCE USERS',
      width: 180,
      cellRenderer: SfCellRenderer,
      headerClass: 'ag-header-uppercase',
      filter: 'agTextColumnFilter',
      editable: false,
      valueFormatter: params => Array.isArray(params.value) ? params.value.join(', ') : ''
    },
    // Role column with custom cell renderer
    {
      field: 'role',
      headerName: 'ROLE',
      width: 120,
      cellRenderer: RoleCellRenderer,
      headerClass: 'ag-header-uppercase',
      filter: 'agTextColumnFilter',
      editable: false
    },
    // Signed In column
    {
      field: 'signedIn',
      headerName: 'SIGNED IN',
      width: 70,
      cellRenderer: (params: any) => params.value ? '✅' : '—',
      headerClass: 'ag-header-uppercase'
    },
    // Enabled column
    {
      field: 'accountenabled',
      headerName: 'ENABLED',
      width: 80,
      cellRenderer: (params: any) => params.value ? 'Enabled' : 'Disabled',
      headerClass: 'ag-header-uppercase'
    },
    // Actions column
    {
      headerName: 'ACTIONS',
      width: 60,
      cellRenderer: ActionsCellRenderer,
      sortable: false,
      filter: false,
      headerClass: 'ag-header-uppercase'
    }
  ], [allTeams, allErpSalespeople, allSfUsers, TeamsCellRenderer, ErpCellRenderer, SfCellRenderer, ActionsCellRenderer, RoleCellRenderer]);

  // Grid ready handler
  const onGridReady = useCallback((params: any) => {
    console.log('[UserTableAG] Grid ready');
    gridRef.current = params;
  }, []);

  // Default column definition
  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    minWidth: 60,
    flex: 1
  }), []);

  // Components
  const components = useMemo(() => ({
    teamsCellRenderer: TeamsCellRenderer,
    erpCellRenderer: ErpCellRenderer,
    sfCellRenderer: SfCellRenderer,
    actionsCellRenderer: ActionsCellRenderer,
    roleCellRenderer: RoleCellRenderer
  }), [TeamsCellRenderer, ErpCellRenderer, SfCellRenderer, ActionsCellRenderer, RoleCellRenderer]);

  // Only render grid after reference data is loaded
  if (loadingRefs || !refsReady) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <span className="animate-spin inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
        <span className="ml-3 text-base text-gray-400">Loading reference data…</span>
      </div>
    );
  }

  // Debug logging
  console.log('rowData', rowData);
  console.log('columnDefs', columnDefs);

  return (
    <>
      <style>{`
        .shadow-quartz {
          box-shadow: 0 2px 16px 0 rgba(44, 62, 80, 0.08), 0 1.5px 4px 0 rgba(44, 62, 80, 0.04);
        }
        .bg-quartz-light {
          background: #f8fafc;
        }
      `}</style>
      <style>{`
        .ag-theme-quartz .ag-cell, .ag-theme-quartz .ag-header-cell-label {
          font-size: 0.75rem !important;
        }
      `}</style>
      <div className='ag-theme-quartz shadow-quartz bg-quartz-light' style={{ width: '100%', borderRadius: '1rem', overflow: 'hidden', minHeight: 400, height: '75vh', marginTop: 32 }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="animate-spin inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
            <span className="ml-3 text-base text-gray-400">Loading users…</span>
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
            suppressRowClickSelection={true}
            animateRows={true}
            pagination={true}
            paginationPageSize={25}
            paginationPageSizeSelector={[25, 50, 100, 200]}
            rowSelection="multiple"
            rowMultiSelectWithClick={true}
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

export default UserManagementTable; 