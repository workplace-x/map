import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Users, 
  Shield, 
  Link2, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  UserCheck,
  Building,
  ChevronDown,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Database,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

// CSS overrides for dialog width
const dialogStyles = `
  .identity-mapping-dialog [data-radix-dialog-content] {
    width: 95vw !important;
    max-width: none !important;
    height: 90vh !important;
    max-height: none !important;
  }
  
  .identity-mapping-dialog .dialog-content-override {
    width: 95vw !important;
    max-width: none !important;
    height: 90vh !important;
    max-height: none !important;
  }

  @media (max-width: 640px) {
    .identity-mapping-dialog [data-radix-dialog-content],
    .identity-mapping-dialog .dialog-content-override {
      width: 98vw !important;
      height: 95vh !important;
    }
  }
`;

// Types
interface User {
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
  lastLoginAt?: string;
  identityStatus: 'complete' | 'partial' | 'incomplete';
}

interface Team {
  id: string;
  name: string;
  path?: string;
  level?: number;
  is_sales_team?: boolean;
  is_super_team?: boolean;
  team_type?: string;
  member_count?: number;
}

interface IdentityMapping {
  azure_id: string;
  supabase_user_id?: string;
  erp_salesperson_id?: string;
  salesforce_user_id?: string;
  house_account_erp_id?: string;
  house_account_salesforce_id?: string;
  status: 'active' | 'inactive' | 'mapped_to_house';
}

interface ErpSalesperson {
  id: string;
  name: string;
  code: string;
  territory?: string;
  active: boolean;
}

interface SalesforceUser {
  id: string;
  name: string;
  email: string;
  title?: string;
  active: boolean;
}

interface HouseAccount {
  id: string;
  name: string;
  type: 'erp' | 'salesforce';
}

export function IdentityAccessHub() {
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [identityMappings, setIdentityMappings] = useState<IdentityMapping[]>([]);
  const [erpSalespeople, setErpSalespeople] = useState<ErpSalesperson[]>([]);
  const [salesforceUsers, setSalesforceUsers] = useState<SalesforceUser[]>([]);
  const [houseAccounts, setHouseAccounts] = useState<HouseAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUserForMapping, setSelectedUserForMapping] = useState<User | null>(null);
  const [showMappingDialog, setShowMappingDialog] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('sb-access-token');
        console.log('[IdentityAccessHub] Token:', token ? 'Present' : 'Missing');
        
        const [usersRes, teamsRes] = await Promise.all([
          fetch('/api/admin/profiles?limit=1000', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/teams?include_members=true', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        console.log('[IdentityAccessHub] API responses:', {
          users: usersRes.status,
          teams: teamsRes.status
        });

        if (!usersRes.ok || !teamsRes.ok) {
          throw new Error(`API calls failed: Users ${usersRes.status}, Teams ${teamsRes.status}`);
        }

        const usersData = await usersRes.json();
        const teamsData = await teamsRes.json();

        // Transform user data with identity status
        const transformedUsers = (usersData.profiles || []).map((profile: any) => {
          const userTeams = (usersData.teamMembers || [])
            .filter((tm: any) => tm.azure_id === profile.AzureID)
            .map((tm: any) => tm.team_id);
          
          // Get actual mapping counts from the database
          const userMappings = (usersData.mappings || []).filter((m: any) => m.azure_id === profile.AzureID);
          const erpMappings = userMappings.filter((m: any) => m.erp_salesperson_id);
          const sfMappings = userMappings.filter((m: any) => m.salesforce_user_id);
          
          const hasErp = erpMappings.length > 0;
          const hasSf = sfMappings.length > 0;
          const hasTeams = userTeams.length > 0;
          const hasSupabase = !!profile.user_id;
          
          // Updated identity status logic: Complete = Supabase + ERP + SF + Teams
          let identityStatus: 'complete' | 'partial' | 'incomplete' = 'incomplete';
          if (hasSupabase && hasErp && hasSf && hasTeams) identityStatus = 'complete';
          else if (hasSupabase || hasErp || hasSf || hasTeams) identityStatus = 'partial';

          return {
            id: profile.AzureID,
            email: profile.email,
            name: profile.name,
            jobtitle: profile.jobtitle,
            department: profile.department,
            teams: userTeams,
            erpSalespeople: erpMappings.map((m: any) => m.erp_salesperson_id),
            sfUsers: sfMappings.map((m: any) => m.salesforce_user_id),
            role: (usersData.userRoles || []).find((r: any) => r.supabase_user_id === profile.AzureID)?.role,
            signedIn: hasSupabase,
            accountenabled: profile.accountenabled,
            lastLoginAt: profile.last_sign_in_at,
            identityStatus
          };
        });

        setUsers(transformedUsers);
        setTeams(teamsData);
        setIdentityMappings([]); // Empty for now since endpoint doesn't exist
        
        // Fetch real ERP salespeople and Salesforce users
        try {
          console.log('[IdentityAccessHub] Fetching ERP and SF data...');
          const [erpRes, sfRes, houseRes] = await Promise.all([
            fetch('/api/admin/erp-salespeople', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/admin/salesforce-users', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/admin/house-accounts', { headers: { 'Authorization': `Bearer ${token}` } })
          ]);

          console.log('[IdentityAccessHub] ERP/SF API responses:', {
            erp: erpRes.status,
            sf: sfRes.status,
            house: houseRes.status
          });

          if (erpRes.ok) {
            const erpData = await erpRes.json();
            console.log('[IdentityAccessHub] ERP data received:', erpData.salespeople?.length || 0, 'salespeople');
            setErpSalespeople(erpData.salespeople || []);
          } else {
            try {
              const erpError = await erpRes.text();
              console.error('[IdentityAccessHub] ERP API error:', erpRes.status, erpError || 'No error message');
            } catch {
              console.error('[IdentityAccessHub] ERP API error:', erpRes.status, 'Could not read error');
            }
            toast.error(`ERP API failed (${erpRes.status}): Authentication issue`);
            setErpSalespeople([
              { id: 'erp1', name: 'John Smith (Sample)', code: 'JS001', territory: 'West Coast', active: true },
              { id: 'erp2', name: 'Jane Doe (Sample)', code: 'JD002', territory: 'East Coast', active: true },
            ]);
          }

          if (sfRes.ok) {
            const sfData = await sfRes.json();
            console.log('[IdentityAccessHub] SF data received:', sfData.users?.length || 0, 'users');
            setSalesforceUsers(sfData.users || []);
          } else {
            try {
              const sfError = await sfRes.text();
              console.error('[IdentityAccessHub] SF API error:', sfRes.status, sfError || 'No error message');
            } catch {
              console.error('[IdentityAccessHub] SF API error:', sfRes.status, 'Could not read error');
            }
            toast.error(`Salesforce API failed (${sfRes.status}): Authentication issue`);
            setSalesforceUsers([
              { id: 'sf1', name: 'Alice Johnson (Sample)', email: 'alice@company.com', title: 'Sales Rep', active: true },
              { id: 'sf2', name: 'Mike Brown (Sample)', email: 'mike@company.com', title: 'Account Manager', active: true },
            ]);
          }

          if (houseRes.ok) {
            const houseData = await houseRes.json();
            console.log('[IdentityAccessHub] House data received:', houseData.accounts?.length || 0, 'accounts');
            setHouseAccounts(houseData.accounts || []);
          } else {
            try {
              const houseError = await houseRes.text();
              console.error('[IdentityAccessHub] House API error:', houseRes.status, houseError || 'No error message');
            } catch {
              console.error('[IdentityAccessHub] House API error:', houseRes.status, 'Could not read error');
            }
            toast.error(`House accounts API failed (${houseRes.status}): Authentication issue`);
            setHouseAccounts([
              { id: 'house1', name: 'House Account - General (Sample)', type: 'erp' },
              { id: 'house2', name: 'House Account - Corporate (Sample)', type: 'salesforce' },
            ]);
          }
        } catch (error) {
          console.error('[IdentityAccessHub] Error fetching ERP/SF data:', error);
          toast.error('Failed to load identity mapping data. Check authentication.');
          // Fallback to sample data
          setErpSalespeople([
            { id: 'erp1', name: 'John Smith (Sample)', code: 'JS001', territory: 'West Coast', active: true },
            { id: 'erp2', name: 'Jane Doe (Sample)', code: 'JD002', territory: 'East Coast', active: true },
          ]);
          
          setSalesforceUsers([
            { id: 'sf1', name: 'Alice Johnson (Sample)', email: 'alice@company.com', title: 'Sales Rep', active: true },
            { id: 'sf2', name: 'Mike Brown (Sample)', email: 'mike@company.com', title: 'Account Manager', active: true },
          ]);

          setHouseAccounts([
            { id: 'house1', name: 'House Account - General (Sample)', type: 'erp' },
            { id: 'house2', name: 'House Account - Corporate (Sample)', type: 'salesforce' },
          ]);
        }
      } catch (error) {
        console.error('[IdentityAccessHub] Error fetching data:', error);
        toast.error('Failed to load data. Check your authentication and try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesRole = !filterRole || filterRole === 'all' || user.role === filterRole;
      const matchesDepartment = !filterDepartment || filterDepartment === 'all' || user.department === filterDepartment;
      const matchesStatus = !filterStatus || filterStatus === 'all' || user.identityStatus === filterStatus;
      
      return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
    });
  }, [users, searchTerm, filterRole, filterDepartment, filterStatus]);

  // Get unique departments and roles
  const departments = useMemo(() => 
    [...new Set(users.map(u => u.department).filter((dept): dept is string => typeof dept === 'string'))].sort(),
    [users]
  );
  
  const roles = useMemo(() => 
    [...new Set(users.map(u => u.role).filter((role): role is string => typeof role === 'string'))].sort(),
    [users]
  );

  // Team assignment handler
  const handleTeamAssignment = async (userId: string, teamIds: string[]) => {
    try {
      const token = localStorage.getItem('sb-access-token');
      const res = await fetch('/api/admin/update-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ azureId: userId, teamIds }),
      });

      if (!res.ok) throw new Error('Failed to update teams');

      setUsers(prev => 
        prev.map(user => user.id === userId ? { ...user, teams: teamIds } : user)
      );
      
      toast.success('Teams updated successfully');
    } catch (error) {
      console.error('Error updating teams:', error);
      toast.error('Failed to update teams');
    }
  };

  // Bulk operations
  const handleBulkTeamAssignment = async (teamIds: string[]) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users first');
      return;
    }

    try {
      const token = localStorage.getItem('sb-access-token');
      await Promise.all(selectedUsers.map(userId =>
        fetch('/api/admin/update-mapping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ azureId: userId, teamIds }),
        })
      ));

      setUsers(prev => 
        prev.map(user => 
          selectedUsers.includes(user.id) ? { ...user, teams: teamIds } : user
        )
      );
      
      setSelectedUsers([]);
      toast.success(`Updated teams for ${selectedUsers.length} users`);
    } catch (error) {
      console.error('Error in bulk update:', error);
      toast.error('Failed to update teams');
    }
  };

  // Identity status badge
  const IdentityStatusBadge = ({ status }: { status: string }) => {
    const config = {
      complete: { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle2, 
        label: 'Complete',
        tooltip: 'Supabase + ERP + Salesforce + Team assignments'
      },
      partial: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: AlertCircle, 
        label: 'Partial',
        tooltip: 'Missing one or more: Supabase, ERP, Salesforce, or Team assignments'
      },
      incomplete: { 
        color: 'bg-red-100 text-red-800', 
        icon: AlertCircle, 
        label: 'Incomplete',
        tooltip: 'No identity mappings or team assignments'
      }
    }[status] || { 
      color: 'bg-gray-100 text-gray-800', 
      icon: AlertCircle, 
      label: 'Unknown',
      tooltip: 'Unknown status'
    };

    const Icon = config.icon;

    return (
      <Badge className={cn('text-xs', config.color)} title={config.tooltip}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Team selector component
  const TeamSelector = ({ userId, currentTeams }: { userId: string; currentTeams: string[] }) => {
    const selectedTeams = teams.filter(t => currentTeams.includes(t.id));
    const summary = selectedTeams.length === 0 
      ? 'No teams' 
      : selectedTeams.length === 1
        ? selectedTeams[0].name
        : `${selectedTeams.length} teams`;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-7 px-2 text-xs justify-between font-normal">
            <span className="truncate max-w-[140px]">{summary}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search teams..." className="h-9" />
            <CommandList>
              <CommandEmpty>No teams found.</CommandEmpty>
              <CommandGroup>
                {teams.map(team => {
                  const isSelected = currentTeams.includes(team.id);
                  return (
                    <CommandItem
                      key={team.id}
                      onSelect={() => {
                        const newTeams = isSelected
                          ? currentTeams.filter(id => id !== team.id)
                          : [...currentTeams, team.id];
                        handleTeamAssignment(userId, newTeams);
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        className="mr-2"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{team.name}</div>
                        <div className="text-xs text-gray-500">
                          {team.team_type} • {team.member_count || 0} members
                        </div>
                      </div>
                      {team.is_sales_team && (
                        <Badge variant="secondary" className="ml-2 text-xs">Sales</Badge>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  // Identity mapping handler
  const handleIdentityMapping = async (mapping: Partial<IdentityMapping>) => {
    try {
      const token = localStorage.getItem('sb-access-token');
      const res = await fetch('/api/admin/identity-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(mapping),
      });

      if (!res.ok) throw new Error('Failed to update identity mapping');

      // Update user's identity status
      setUsers(prev => prev.map(user => {
        if (user.id === mapping.azure_id) {
          const hasErp = !!mapping.erp_salesperson_id || !!mapping.house_account_erp_id;
          const hasSf = !!mapping.salesforce_user_id || !!mapping.house_account_salesforce_id;
          const hasTeams = user.teams.length > 0;
          const hasSupabase = user.signedIn;
          
          let identityStatus: 'complete' | 'partial' | 'incomplete' = 'incomplete';
          if (hasSupabase && hasErp && hasSf && hasTeams) identityStatus = 'complete';
          else if (hasSupabase || hasErp || hasSf || hasTeams) identityStatus = 'partial';

          return { ...user, identityStatus };
        }
        return user;
      }));
      
      toast.success('Identity mapping updated successfully');
      setShowMappingDialog(false);
      setSelectedUserForMapping(null);
    } catch (error) {
      console.error('Error updating identity mapping:', error);
      toast.error('Failed to update identity mapping');
    }
  };

  // Identity Mapping Dialog Component
  const IdentityMappingDialog = ({
    user,
    open,
    onOpenChange,
    erpSalespeople,
    salesforceUsers,
    houseAccounts,
    onSave
  }: IdentityMappingDialogProps) => {
    const [selectedErpIds, setSelectedErpIds] = useState<string[]>([]);
    const [selectedSfIds, setSelectedSfIds] = useState<string[]>([]);
    const [selectedHouseAccountErp, setSelectedHouseAccountErp] = useState<string>('');
    const [selectedHouseAccountSf, setSelectedHouseAccountSf] = useState<string>('');
    const [mappingType, setMappingType] = useState<'individual' | 'house'>('individual');
    const [erpSearchTerm, setErpSearchTerm] = useState('');
    const [sfSearchTerm, setSfSearchTerm] = useState('');

    // Reset form when user changes
    useEffect(() => {
      if (user) {
        setSelectedErpIds(user.erpSalespeople || []);
        setSelectedSfIds(user.sfUsers || []);
        setSelectedHouseAccountErp('');
        setSelectedHouseAccountSf('');
        setMappingType('individual');
        setErpSearchTerm('');
        setSfSearchTerm('');
      }
    }, [user]);

    // Filtered lists with smart sorting: selected first, then alphabetical
    const filteredErpSalespeople = useMemo(() => {
      let filtered = erpSalespeople;
      
      // Apply search filter if search term exists
      if (erpSearchTerm) {
      const term = erpSearchTerm.toLowerCase();
        filtered = erpSalespeople.filter((erp: ErpSalesperson) => 
        erp.name.toLowerCase().includes(term) ||
        erp.code.toLowerCase().includes(term) ||
        (erp.territory && erp.territory.toLowerCase().includes(term))
      );
      }
      
      // Sort: selected items first, then alphabetically by name
      return filtered.sort((a: ErpSalesperson, b: ErpSalesperson) => {
        const aSelected = selectedErpIds.includes(a.id);
        const bSelected = selectedErpIds.includes(b.id);
        
        // If one is selected and other isn't, selected comes first
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        
        // If both have same selection status, sort alphabetically
        return a.name.localeCompare(b.name);
      });
    }, [erpSalespeople, erpSearchTerm, selectedErpIds]);

    const filteredSalesforceUsers = useMemo(() => {
      let filtered = salesforceUsers;
      
      // Apply search filter if search term exists
      if (sfSearchTerm) {
      const term = sfSearchTerm.toLowerCase();
        filtered = salesforceUsers.filter((sf: SalesforceUser) => 
        sf.name.toLowerCase().includes(term) ||
        sf.email.toLowerCase().includes(term) ||
        (sf.title && sf.title.toLowerCase().includes(term))
      );
      }
      
      // Sort: selected items first, then alphabetically by name
      return filtered.sort((a: SalesforceUser, b: SalesforceUser) => {
        const aSelected = selectedSfIds.includes(a.id);
        const bSelected = selectedSfIds.includes(b.id);
        
        // If one is selected and other isn't, selected comes first
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        
        // If both have same selection status, sort alphabetically
        return a.name.localeCompare(b.name);
      });
    }, [salesforceUsers, sfSearchTerm, selectedSfIds]);

    if (!user) return null;

    const handleSave = () => {
      onSave({
        erpSalespersonIds: mappingType === 'individual' ? selectedErpIds : [],
        salesforceUserIds: mappingType === 'individual' ? selectedSfIds : [],
        houseAccountErpId: mappingType === 'house' ? selectedHouseAccountErp : undefined,
        houseAccountSalesforceId: mappingType === 'house' ? selectedHouseAccountSf : undefined,
      });
    };

    return (
      <div className="identity-mapping-dialog">
      <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent 
            className="w-[95vw] h-[90vh] max-w-none max-h-none overflow-hidden flex flex-col dialog-content-override"
            style={{ 
              width: '95vw', 
              maxWidth: 'none',
              height: '90vh',
              maxHeight: 'none'
            }}
          >
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Map Identity: {user.name || user.email}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* User Info */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Azure AD User</Label>
                    <p className="font-medium text-sm">{user.name || user.email}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Department</Label>
                    <p className="font-medium text-sm">{user.department || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Current Status</Label>
                    <div className="mt-1">
                      <IdentityStatusBadge status={user.identityStatus} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mapping Type Selection */}
            <div>
              <Label className="text-sm font-medium">Mapping Type</Label>
              <Tabs value={mappingType} onValueChange={(value) => setMappingType(value as 'individual' | 'house')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="individual">Individual Mapping</TabsTrigger>
                  <TabsTrigger value="house">House Account Mapping</TabsTrigger>
                </TabsList>

                <TabsContent value="individual" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* ERP Salespeople Selection */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          ERP Salespeople ({selectedErpIds.length} selected)
                        </CardTitle>
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search ERP salespeople..."
                            value={erpSearchTerm}
                            onChange={(e) => setErpSearchTerm(e.target.value)}
                            className="pl-10 h-9"
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1 max-h-64 overflow-y-auto">
                          {filteredErpSalespeople.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No ERP salespeople found</p>
                            </div>
                          ) : (
                              filteredErpSalespeople.map((erp: ErpSalesperson) => (
                              <div key={erp.id} className="flex items-center space-x-3 p-2 border rounded hover:bg-gray-50">
                                <Checkbox
                                  checked={selectedErpIds.includes(erp.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedErpIds(prev => [...prev, erp.id]);
                                    } else {
                                      setSelectedErpIds(prev => prev.filter(id => id !== erp.id));
                                    }
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{erp.name}</div>
                                  <div className="text-xs text-gray-500 truncate">
                                    Code: {erp.code} • Territory: {erp.territory}
                                  </div>
                                </div>
                                <div className="flex-shrink-0">
                                  {erp.active && (
                                    <Badge variant="secondary" className="text-xs">Active</Badge>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        {erpSearchTerm && (
                          <div className="mt-2 text-xs text-gray-500">
                            Showing {filteredErpSalespeople.length} of {erpSalespeople.length} salespeople
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Salesforce Users Selection */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Salesforce Users ({selectedSfIds.length} selected)
                        </CardTitle>
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search Salesforce users..."
                            value={sfSearchTerm}
                            onChange={(e) => setSfSearchTerm(e.target.value)}
                            className="pl-10 h-9"
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1 max-h-64 overflow-y-auto">
                          {filteredSalesforceUsers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <ExternalLink className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No Salesforce users found</p>
                            </div>
                          ) : (
                              filteredSalesforceUsers.map((sf: SalesforceUser) => (
                              <div key={sf.id} className="flex items-center space-x-3 p-2 border rounded hover:bg-gray-50">
                                <Checkbox
                                  checked={selectedSfIds.includes(sf.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedSfIds(prev => [...prev, sf.id]);
                                    } else {
                                      setSelectedSfIds(prev => prev.filter(id => id !== sf.id));
                                    }
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{sf.name}</div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {sf.email} • {sf.title}
                                  </div>
                                </div>
                                <div className="flex-shrink-0">
                                  {sf.active && (
                                    <Badge variant="secondary" className="text-xs">Active</Badge>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        {sfSearchTerm && (
                          <div className="mt-2 text-xs text-gray-500">
                            Showing {filteredSalesforceUsers.length} of {salesforceUsers.length} users
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Selection Summary */}
                  {(selectedErpIds.length > 0 || selectedSfIds.length > 0) && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{selectedErpIds.length} ERP</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ExternalLink className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{selectedSfIds.length} Salesforce</span>
                          </div>
                          <div className="text-blue-600">
                            Total mappings: {selectedErpIds.length + selectedSfIds.length}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="house" className="space-y-4">
                  {/* House Account Selection */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        House Account Mapping
                      </CardTitle>
                      <CardDescription>
                        Map this user to house accounts for ERP and Salesforce systems
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">ERP House Account</Label>
                          <Select value={selectedHouseAccountErp} onValueChange={setSelectedHouseAccountErp}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ERP house account" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No house account</SelectItem>
                                {houseAccounts.filter((h: HouseAccount) => h.type === 'erp').map((house: HouseAccount) => (
                                <SelectItem key={house.id} value={house.id}>{house.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm">Salesforce House Account</Label>
                          <Select value={selectedHouseAccountSf} onValueChange={setSelectedHouseAccountSf}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Salesforce house account" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No house account</SelectItem>
                                {houseAccounts.filter((h: HouseAccount) => h.type === 'salesforce').map((house: HouseAccount) => (
                                <SelectItem key={house.id} value={house.id}>{house.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Actions - Fixed at bottom */}
          <div className="flex-shrink-0 pt-4 border-t">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {mappingType === 'individual' 
                  ? `${selectedErpIds.length + selectedSfIds.length} mappings selected`
                  : `${[selectedHouseAccountErp, selectedHouseAccountSf].filter(Boolean).length} house accounts selected`
                }
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Save Mappings
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span>Loading identity data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Inject custom CSS for dialog width */}
      <style dangerouslySetInnerHTML={{ __html: dialogStyles }} />
      
      {/* Header */}
      <Card className="flex-shrink-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Identity & Access Hub
          </CardTitle>
          <CardDescription>
            Unified user management with multi-system identity mapping and intelligent team assignment
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Identity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-shrink-0">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-xl font-bold">{users.length}</p>
                <p className="text-xs text-gray-600">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xl font-bold">
                  {users.filter(u => u.identityStatus === 'complete').length}
                </p>
                <p className="text-xs text-gray-600">Complete Identities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="text-xl font-bold">
                  {users.filter(u => u.identityStatus === 'partial').length}
                </p>
                <p className="text-xs text-gray-600">Partial Identities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-xl font-bold">
                  {users.filter(u => u.signedIn).length}
                </p>
                <p className="text-xs text-gray-600">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="flex-shrink-0">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            </div>
            
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="All depts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card className="flex-shrink-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedUsers.length} user(s) selected
              </span>
              <div className="flex gap-2">
                <TeamSelector 
                  userId="bulk" 
                  currentTeams={[]} 
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUsers([])}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List - Compact Table-like Cards */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="text-lg">Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          <div className="space-y-1 p-4 pt-0">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                className="border rounded-md p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers(prev => [...prev, user.id]);
                        } else {
                          setSelectedUsers(prev => prev.filter(id => id !== user.id));
                        }
                      }}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm truncate">{user.name || user.email}</h3>
                        <IdentityStatusBadge status={user.identityStatus} />
                        {user.signedIn && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">Active</Badge>
                        )}
                        {user.role && (
                          <Badge variant="outline" className="text-xs px-1 py-0">{user.role}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="truncate">{user.email}</span>
                        {user.department && (
                          <span className="truncate">{user.department}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          {user.erpSalespeople?.length || 0} ERP • {user.sfUsers?.length || 0} SF
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Building className="h-3 w-3 text-gray-400" />
                    <div className="min-w-[180px]">
                      <TeamSelector userId={user.id} currentTeams={user.teams} />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => {
                        setSelectedUserForMapping(user);
                        setShowMappingDialog(true);
                      }}
                    >
                      <Database className="h-3 w-3 mr-1" />
                      Map
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No users found matching the current filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Identity Mapping Dialog */}
      <IdentityMappingDialog 
        user={selectedUserForMapping}
        open={showMappingDialog}
        onOpenChange={setShowMappingDialog}
        erpSalespeople={erpSalespeople}
        salesforceUsers={salesforceUsers}
        houseAccounts={houseAccounts}
        onSave={async (mappings) => {
          try {
            console.log('=== Identity Mapping Save Debug ===');
            console.log('Selected user for mapping:', selectedUserForMapping);
            console.log('Mappings to save:', mappings);
            
            if (!selectedUserForMapping?.id) {
              throw new Error('No user selected for mapping');
            }
            
            const requestBody = {
              azureId: selectedUserForMapping.id,
              erpSalespersonIds: mappings.erpSalespersonIds || [],
              salesforceUserIds: mappings.salesforceUserIds || [],
              houseAccountErpId: mappings.houseAccountErpId || null,
              houseAccountSalesforceId: mappings.houseAccountSalesforceId || null,
            };
            
            console.log('Request body being sent:', requestBody);
            
            const token = localStorage.getItem('sb-access-token');
            console.log('Auth token present:', !!token);
            
            const res = await fetch('/api/admin/identity-mappings', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify(requestBody),
            });

            console.log('API response status:', res.status);
            console.log('API response ok:', res.ok);

            if (!res.ok) {
              let errorMessage = 'Failed to save mappings';
              let errorData = null;
              
              const contentType = res.headers.get('content-type');
              
              try {
                if (contentType && contentType.includes('application/json')) {
                  errorData = await res.json();
                  console.log('Error response data:', errorData);
                  errorMessage = errorData.error || errorData.details || errorData.message || `API Error: ${res.status}`;
                } else {
                  const errorText = await res.text();
                  console.log('Raw error response:', errorText);
                  errorMessage = `HTTP ${res.status}: ${errorText || res.statusText}`;
                }
              } catch (parseError) {
                console.log('Could not parse error response:', parseError);
                errorMessage = `HTTP ${res.status}: ${res.statusText}`;
              }
              
              throw new Error(errorMessage);
            }

            const responseData = await res.json();
            console.log('Success response:', responseData);

            // Update user's identity status locally
            if (selectedUserForMapping) {
              setUsers(prev => prev.map((user: User) => {
                if (user.id === selectedUserForMapping.id) {
                  const hasErp = mappings.erpSalespersonIds.length > 0 || !!mappings.houseAccountErpId;
                  const hasSf = mappings.salesforceUserIds.length > 0 || !!mappings.houseAccountSalesforceId;
                  const hasTeams = user.teams.length > 0;
                  const hasSupabase = user.signedIn;
                  
                  let identityStatus: 'complete' | 'partial' | 'incomplete' = 'incomplete';
                  if (hasSupabase && hasErp && hasSf && hasTeams) identityStatus = 'complete';
                  else if (hasSupabase || hasErp || hasSf || hasTeams) identityStatus = 'partial';

                  return { 
                    ...user, 
                    identityStatus,
                    erpSalespeople: mappings.erpSalespersonIds,
                    sfUsers: mappings.salesforceUserIds
                  };
                }
                return user;
              }));
            }
            
            toast.success('Identity mappings updated successfully');
            setShowMappingDialog(false);
            setSelectedUserForMapping(null);
          } catch (error: any) {
            console.error('=== Identity Mapping Save Error ===');
            console.error('Error details:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to save identity mappings';
            console.error('Final error message:', errorMessage);
            toast.error(errorMessage);
          }
        }}
      />
    </div>
  );
}

// Identity Mapping Dialog Props Interface
interface IdentityMappingDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  erpSalespeople: ErpSalesperson[];
  salesforceUsers: SalesforceUser[];
  houseAccounts: HouseAccount[];
  onSave: (mappings: {
    erpSalespersonIds: string[];
    salesforceUserIds: string[];
    houseAccountErpId?: string;
    houseAccountSalesforceId?: string;
  }) => void;
} 