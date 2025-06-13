import { PublicClientApplication, Configuration, AccountInfo, AuthenticationResult, SilentRequest, PopupRequest } from '@azure/msal-browser';

// Get the correct redirect URI based on environment
const getRedirectUri = () => {
  if (typeof window === 'undefined') return 'http://localhost:3001/auth/callback';
  return `${window.location.origin}/auth/callback`;
};

// Get post logout redirect URI safely
const getPostLogoutRedirectUri = () => {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  return window.location.origin;
};

// Azure AD Configuration for Tangram Interiors internal users
const msalConfig: Configuration = {
  auth: {
    clientId: '72129170-78ba-47b7-8989-fe826a45a7d4', // Frontend app ID
    authority: 'https://login.microsoftonline.com/ef032c9f-5bea-4839-b1c7-7fc37efef46a', // Tangram tenant
    redirectUri: getRedirectUri(),
    postLogoutRedirectUri: getPostLogoutRedirectUri(),
    navigateToLoginRequestUrl: false // Prevent automatic navigation to login request URL
  },
  cache: {
    cacheLocation: 'localStorage', // Use localStorage instead of sessionStorage for better persistence
    storeAuthStateInCookie: true // Enable cookie storage for IE/Edge compatibility
  },
  system: {
    windowHashTimeout: 60000, // Increase timeout for hash processing
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0
  }
};

class AzureAdAuthService {
  private msalInstance: PublicClientApplication | null = null;
  private initialized = false;

  constructor() {
    // Only initialize if we're in the browser
    if (typeof window !== 'undefined') {
      this.msalInstance = new PublicClientApplication(msalConfig);
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized || !this.msalInstance) return;
    
    try {
      await this.msalInstance.initialize();
      
      // Handle redirect response immediately after initialization
      await this.handleRedirectResponse();
      
      this.initialized = true;
      console.log('🔐 Azure AD MSAL initialized with redirect URI:', getRedirectUri());
    } catch (error) {
      console.error('❌ Failed to initialize MSAL:', error);
      throw error;
    }
  }

  async loginPopup(): Promise<AuthenticationResult> {
    if (!this.msalInstance) {
      throw new Error('MSAL not available (SSR context)');
    }
    
    await this.initialize();
    
    const loginRequest: PopupRequest = {
      scopes: ['user.read'], // Only request basic Microsoft Graph access
      prompt: 'select_account'
    };

    try {
      const response = await this.msalInstance.loginPopup(loginRequest);
      console.log('✅ Azure AD login successful:', response.account?.name);
      return response;
    } catch (error) {
      console.error('❌ Azure AD login failed:', error);
      throw error;
    }
  }

  async loginRedirect(): Promise<void> {
    if (!this.msalInstance) {
      throw new Error('MSAL not available (SSR context)');
    }
    
    await this.initialize();
    
    const loginRequest = {
      scopes: ['user.read'], // Only request basic Microsoft Graph access
      prompt: 'select_account',
      redirectUri: getRedirectUri()
    };

    try {
      await this.msalInstance.loginRedirect(loginRequest);
    } catch (error) {
      console.error('❌ Azure AD redirect login failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    if (!this.msalInstance) {
      throw new Error('MSAL not available (SSR context)');
    }
    
    await this.initialize();
    
    try {
      await this.msalInstance.logoutPopup({
        postLogoutRedirectUri: getPostLogoutRedirectUri()
      });
      console.log('✅ Azure AD logout successful');
    } catch (error) {
      console.error('❌ Azure AD logout failed:', error);
      throw error;
    }
  }

  async getAccessToken(forceRefresh = false): Promise<string | null> {
    if (!this.msalInstance) {
      console.log('MSAL not available (SSR context)');
      return null;
    }
    
    await this.initialize();
    
    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length === 0) {
      console.log('No Azure AD accounts found');
      return null;
    }

    const tokenRequest: SilentRequest = {
      scopes: ['user.read'], // Only request basic Microsoft Graph access
      account: accounts[0],
      forceRefresh
    };

    try {
      const response = await this.msalInstance.acquireTokenSilent(tokenRequest);
      return response.accessToken;
    } catch (error) {
      console.error('❌ Silent token acquisition failed:', error);
      
      // If silent token acquisition fails, try interactive login
      try {
        const response = await this.msalInstance.acquireTokenPopup({
          scopes: ['user.read'], // Only request basic Microsoft Graph access
          account: accounts[0]
        });
        return response.accessToken;
      } catch (interactiveError) {
        console.error('❌ Interactive token acquisition failed:', interactiveError);
        return null;
      }
    }
  }

  getCurrentUser(): AccountInfo | null {
    if (!this.initialized || !this.msalInstance) return null;
    
    const accounts = this.msalInstance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  }

  isLoggedIn(): boolean {
    if (!this.initialized || !this.msalInstance) return false;
    return this.msalInstance.getAllAccounts().length > 0;
  }

  getUserInfo() {
    const account = this.getCurrentUser();
    if (!account) return null;

    return {
      id: account.localAccountId,
      email: account.username,
      name: account.name || account.username,
      tenantId: account.tenantId,
      isEmployee: account.username?.endsWith('@tangramint.onmicrosoft.com') || 
                  account.username?.endsWith('@tangraminteriors.com') || false
    };
  }

  async handleRedirectResponse(): Promise<AuthenticationResult | null> {
    if (!this.msalInstance) {
      return null;
    }
    
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      const response = await this.msalInstance.handleRedirectPromise();
      if (response) {
        console.log('✅ Azure AD redirect response handled:', response.account?.name);
      }
      return response;
    } catch (error) {
      console.error('❌ Error handling redirect response:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const azureAdAuth = new AzureAdAuthService();
export default azureAdAuth; 