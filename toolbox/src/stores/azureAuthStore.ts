import { create } from 'zustand';
import { azureAdAuth } from '@/lib/azureAdClient';

export interface UserTeam {
  id: string;
  name: string;
  description?: string;
  is_sales_team?: boolean;
  leader_user_id?: string;
}

export interface UserTarget {
  id: string;
  year: number;
  month: number;
  target_amount: number;
  actual_amount?: number;
}

export interface UserAccountMapping {
  erp_salesperson_id?: string;
  salesforce_user_id?: string;
  team_id?: string;
}

export interface UserRole {
  role: string;
  permissions?: string[];
}

export interface CompleteUserProfile {
  // Azure AD basic info
  id: string;
  email: string;
  name: string;
  tenantId: string;
  isEmployee: boolean;
  
  // Database profile info
  avatar_url?: string;
  jobtitle?: string;
  department?: string;
  accountenabled?: boolean;
  
  // Role and permissions
  role?: string;
  permissions?: string[];
  
  // Team memberships
  teams?: UserTeam[];
  
  // Goals and targets
  targets?: UserTarget[];
  
  // Account mappings
  accountMapping?: UserAccountMapping;
  
  // Computed properties
  primaryTeam?: UserTeam;
  isTeamLeader?: boolean;
  currentMonthTarget?: UserTarget;
  isAdmin?: boolean;
  isExecutive?: boolean;
  isManager?: boolean;
}

interface AzureAuthState {
  user: CompleteUserProfile | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: CompleteUserProfile | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  initialize: () => Promise<void>;
  reset: () => void;
  fetchCompleteUserProfile: () => Promise<void>;
  verifyUserWithApi: () => Promise<void>;
}

// Use relative URLs in development to leverage Vite proxy, absolute URLs in production
const getApiUrl = (endpoint: string) => {
  if (import.meta.env.DEV) {
    // In development, always prepend /api for Vite proxy
    return `/api${endpoint}`;
  } else {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tangram-marketing-functions.azurewebsites.net/api';
    return `${API_BASE_URL}${endpoint}`;
  }
};

// Role-based permission mapping
const getRolePermissions = (role: string): string[] => {
  const rolePermissions: Record<string, string[]> = {
    'superadmin': ['*'], // All permissions
    'admin': [
      'users.read', 'users.write', 'users.delete',
      'teams.read', 'teams.write', 'teams.delete',
      'reports.read', 'reports.write',
      'settings.read', 'settings.write',
      'analytics.read'
    ],
    'executive': [
      'users.read', 'teams.read', 'reports.read', 
      'analytics.read', 'forecasts.read', 'targets.read'
    ],
    'manager': [
      'users.read', 'teams.read', 'reports.read',
      'targets.read', 'targets.write'
    ],
    'user': [
      'dashboard.read', 'profile.read', 'profile.write'
    ],
    'dashboard_user': [
      'dashboard.read', 'profile.read', 'profile.write'
    ]
  };
  
  return rolePermissions[role] || rolePermissions['user'];
};

// Check if user has specific permission
const hasPermission = (userPermissions: string[], permission: string): boolean => {
  if (userPermissions.includes('*')) return true;
  return userPermissions.includes(permission);
};

export const useAzureAuthStore = create<AzureAuthState>((set, get) => ({
  user: null,
  accessToken: null,
  loading: false,
  error: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAccessToken: (token) => set({ accessToken: token }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  login: async () => {
    console.log('🟢 azureAuthStore.login() called');
    set({ loading: true, error: null });
    
    try {
      console.log('🟢 Environment check - PROD:', import.meta.env.PROD);
      
      // Use redirect login for both development and production for simplicity
      console.log('🟢 Using redirect login for better reliability');
      
      try {
        await azureAdAuth.loginRedirect();
        console.log('🟢 Redirect login initiated successfully');
        // The redirect will handle the rest, user will be redirected to callback page
        return true;
      } catch (error) {
        console.error('❌ Redirect login failed:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('❌ Azure AD login failed in store:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      set({
        error: error.message || 'Login failed',
        loading: false,
        isAuthenticated: false
      });
      return false;
    }
  },

  logout: async () => {
    set({ loading: true });
    
    try {
      await azureAdAuth.logout();
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        loading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Azure AD logout failed:', error);
      set({ error: error.message || 'Logout failed', loading: false });
    }
  },

  refreshToken: async () => {
    try {
      const token = await azureAdAuth.getAccessToken(true);
      set({ accessToken: token });
      return token;
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      set({ error: error.message || 'Token refresh failed' });
      return null;
    }
  },

  fetchCompleteUserProfile: async () => {
    const { user, accessToken } = get();
    
    if (!user || !accessToken) {
      return;
    }

    try {
      console.log('🔍 Fetching complete user profile for Azure ID:', user.id);
      
      // Fetch complete profile data from your Azure PostgreSQL database
      const response = await fetch(getApiUrl(`/user/complete-profile/${user.id}`), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const profileData = await response.json();
        console.log('✅ Complete profile data received:', profileData);
        
        // Get role permissions
        const userRole = profileData.role?.role || 'user';
        const permissions = getRolePermissions(userRole);
        
        // Merge Azure AD user info with complete database profile
        const completeProfile: CompleteUserProfile = {
          // Keep Azure AD basics
          ...user,
          
          // Add database profile info
          avatar_url: profileData.profile?.avatar_url,
          jobtitle: profileData.profile?.jobtitle,
          department: profileData.profile?.department,
          accountenabled: profileData.profile?.accountenabled,
          
          // Add role and permissions
          role: userRole,
          permissions: permissions,
          
          // Add team memberships
          teams: profileData.teams || [],
          
          // Add targets/goals
          targets: profileData.targets || [],
          
          // Add account mappings
          accountMapping: profileData.accountMapping,
          
          // Computed properties
          primaryTeam: profileData.teams?.[0], // First team as primary
          isTeamLeader: profileData.teams?.some((team: UserTeam) => team.leader_user_id === user.id),
          currentMonthTarget: profileData.targets?.find((target: UserTarget) => {
            const now = new Date();
            return target.year === now.getFullYear() && target.month === now.getMonth() + 1;
          }),
          
          // Role-based flags
          isAdmin: ['admin', 'superadmin'].includes(userRole),
          isExecutive: ['executive', 'admin', 'superadmin'].includes(userRole),
          isManager: ['manager', 'executive', 'admin', 'superadmin'].includes(userRole),
          
          // Use database name/email if available, otherwise keep Azure AD
          name: profileData.profile?.name || user.name,
          email: profileData.profile?.email || user.email
        };
        
        set({ user: completeProfile });
        
        console.log('✅ Complete user profile updated:', {
          avatar: completeProfile.avatar_url,
          role: completeProfile.role,
          permissions: completeProfile.permissions?.length,
          teams: completeProfile.teams?.length,
          targets: completeProfile.targets?.length,
          isLeader: completeProfile.isTeamLeader,
          isAdmin: completeProfile.isAdmin
        });
        
      } else if (response.status === 404) {
        console.log('⚠️ User profile not found in database, using Azure AD data only');
        // User exists in Azure AD but not in database - this is okay for new users
        // Set default role for new users
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              role: 'user',
              permissions: getRolePermissions('user'),
              isAdmin: false,
              isExecutive: false,
              isManager: false
            }
          });
        }
      } else {
        console.error('❌ Failed to fetch complete profile:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching complete user profile:', error);
      // Don't fail the auth process if profile fetch fails
    }
  },

  initialize: async () => {
    set({ loading: true });
    
    try {
      await azureAdAuth.initialize();
      
      // Check if user is already logged in
      if (azureAdAuth.isLoggedIn()) {
        const userInfo = azureAdAuth.getUserInfo();
        const accessToken = await azureAdAuth.getAccessToken();
        
        if (userInfo && accessToken) {
          set({
            user: userInfo as CompleteUserProfile,
            accessToken: accessToken,
            isAuthenticated: true,
            loading: false
          });
          
          // TEMPORARILY DISABLED to prevent API server crashes
          // Fetch complete profile data from database
          // await get().fetchCompleteUserProfile();
          
          // Verify the user with the API
          // await get().verifyUserWithApi();
          
          console.log('✅ Azure AD initialization successful (API calls disabled for now)');
        } else {
          set({ loading: false });
        }
      } else {
        set({ loading: false });
      }
    } catch (error: any) {
      console.error('Azure AD initialization failed:', error);
      set({
        error: error.message || 'Initialization failed',
        loading: false
      });
    }
  },

  // Verify user with API (similar to refreshUser in original authStore)
  verifyUserWithApi: async () => {
    const { accessToken } = get();
    
    try {
      const response = await fetch(getApiUrl('/health'), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API verification successful:', data);
        
        // If API returns updated user info, use it
        if (data.authentication?.user) {
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: {
                ...currentUser,
                name: data.authentication.user,
                email: data.authentication.email || currentUser.email
              }
            });
          }
        }
      } else if (response.status === 401) {
        console.log('🔄 Token expired, attempting refresh...');
        const newToken = await get().refreshToken();
        
        if (!newToken) {
          console.log('❌ Token refresh failed, logging out');
          await get().logout();
        }
      } else {
        console.warn('API verification failed:', response.status);
      }
    } catch (error) {
      console.error('API verification error:', error);
      // Don't fail the whole auth process if API verification fails
    }
  },

  reset: () => {
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      loading: false,
      error: null
    });
  }
}));

// Export utility functions for permission checking
export const usePermissions = () => {
  const user = useAzureAuthStore(state => state.user);
  
  return {
    hasPermission: (permission: string) => {
      if (!user?.permissions) return false;
      return hasPermission(user.permissions, permission);
    },
    isAdmin: user?.isAdmin || false,
    isExecutive: user?.isExecutive || false,
    isManager: user?.isManager || false,
    role: user?.role || 'user'
  };
};

// Note: Initialization is now handled in main.tsx to not block app startup 