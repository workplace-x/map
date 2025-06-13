import { useAzureAuthStore } from '@/stores/azureAuthStore';

export function useAuth() {
  const { 
    user, 
    loading, 
    error, 
    isAuthenticated,
    login: azureLogin,
    logout: azureLogout 
  } = useAzureAuthStore();

  const login = async (email?: string, password?: string) => {
    // Azure AD doesn't use email/password - use popup login
    try {
      return await azureLogin();
    } catch (error) {
      console.error('Azure AD login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await azureLogout();
    } catch (error) {
      console.error('Azure AD logout error:', error);
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
  };
} 