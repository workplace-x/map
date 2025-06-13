import { PublicClientApplication, Configuration, AccountInfo, AuthenticationResult, SilentRequest, PopupRequest } from '@azure/msal-browser';

// Get the correct redirect URI based on environment
const getRedirectUri = () => {
  if (typeof window === 'undefined') {
    console.log('🔵 SSR context - using default redirect URI: http://localhost:3001/auth/callback');
    return 'http://localhost:3001/auth/callback';
  }
  
  const origin = window.location.origin;
  const redirectUri = `${origin}/auth/callback`;
  
  console.log('🔵 Browser context - window.location.origin:', origin);
  console.log('🔵 Generated redirect URI:', redirectUri);
  
  // Force localhost:3001 if we detect localhost:8080 (nginx proxy issue)
  if (origin.includes('localhost:8080')) {
    const fixedUri = 'http://localhost:3001/auth/callback';
    console.log('🔵 Detected localhost:8080, forcing localhost:3001:', fixedUri);
    return fixedUri;
  }
  
  return redirectUri;
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
    console.log('🟡 azureAdClient.initialize() called');
    console.log('🟡 Already initialized?', this.initialized);
    console.log('🟡 MSAL instance exists?', !!this.msalInstance);
    
    if (this.initialized || !this.msalInstance) {
      console.log('🟡 Skipping initialization - already done or no MSAL instance');
      return;
    }
    
    try {
      console.log('🟡 About to call msalInstance.initialize()...');
      
      // Add timeout to prevent hanging
      const initPromise = this.msalInstance.initialize();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('MSAL initialization timed out after 10 seconds')), 10000);
      });
      
      await Promise.race([initPromise, timeoutPromise]);
      console.log('🟡 MSAL instance initialized successfully');
      
      // Handle redirect response after successful initialization
      console.log('🟡 About to handle redirect response...');
      await this.handleRedirectResponse();
      console.log('🟡 Redirect response handled successfully');
      
      this.initialized = true;
      console.log('🟡 Azure AD MSAL initialization complete with redirect URI:', getRedirectUri());
    } catch (error) {
      console.error('❌ Failed to initialize MSAL:', error);
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      throw error;
    }
  }

  async loginPopup(): Promise<AuthenticationResult> {
    console.log('🔴 azureAdClient.loginPopup() called');
    
    if (!this.msalInstance) {
      console.log('❌ MSAL instance not available');
      throw new Error('MSAL not available (SSR context)');
    }
    
    console.log('🔴 Initializing MSAL...');
    await this.initialize();
    
    const loginRequest: PopupRequest = {
      scopes: ['user.read'], // Only request basic Microsoft Graph access
      prompt: 'select_account'
    };

    console.log('🔴 Login request config:', loginRequest);

    try {
      console.log('🔴 Opening Microsoft login popup...');
      const response = await this.msalInstance.loginPopup(loginRequest);
      
      console.log('🔴 Popup login response received:', {
        accountName: response.account?.name,
        hasAccessToken: !!response.accessToken,
        scopes: response.scopes
      });
      
      console.log('✅ Azure AD login successful:', response.account?.name);
      return response;
    } catch (error) {
      console.error('❌ Azure AD popup login failed:', error);
      console.error('❌ Error type:', error?.constructor?.name);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
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
    console.log('🟠 handleRedirectResponse() called');
    
    if (!this.msalInstance) {
      console.log('🟠 No MSAL instance available for redirect handling');
      return null;
    }
    
    if (!this.initialized) {
      console.log('🟠 MSAL not initialized yet, skipping redirect handling');
      return null;
    }
    
    try {
      console.log('🟠 About to call msalInstance.handleRedirectPromise()...');
      
      // Add timeout to prevent hanging on network issues
      const redirectPromise = this.msalInstance.handleRedirectPromise();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Token exchange timed out after 30 seconds')), 30000);
      });
      
      const response = await Promise.race([redirectPromise, timeoutPromise]);
      console.log('🟠 Redirect promise resolved, response:', !!response);
      
      if (response) {
        console.log('🟠 Redirect response received:', response.account?.name);
        console.log('🟠 Access token present:', !!response.accessToken);
        console.log('🟠 ID token present:', !!response.idToken);
      } else {
        console.log('🟠 No redirect response (normal for non-redirect scenarios)');
      }
      
      return response;
    } catch (error: any) {
      console.error('❌ Error handling redirect response:', error);
      console.error('❌ Redirect error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        errorCode: error?.errorCode,
        errorMessage: error?.errorMessage
      });
      
      // Check for specific network/CORS errors
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('NetworkError') ||
          error.message?.includes('CORS') ||
          error.name === 'NetworkError') {
        console.warn('🟡 Network error detected during token exchange - this might be a CORS or connectivity issue');
        console.warn('🟡 Checking if user is already authenticated...');
        
        // Check if we already have valid accounts despite the network error
        const accounts = this.msalInstance?.getAllAccounts();
        if (accounts && accounts.length > 0) {
          console.log('🟡 Found existing account despite network error:', accounts[0].name);
          // Return a minimal response indicating the user is authenticated
          return {
            account: accounts[0],
            accessToken: '', // We'll get this later via silent token acquisition
            idToken: '',
            fromCache: true,
            scopes: ['user.read'],
            tokenType: 'Bearer',
            expiresOn: null,
            extExpiresOn: null,
            state: '',
            familyId: '',
            cloudGraphHostName: '',
            msGraphHost: '',
            uniqueId: accounts[0].localAccountId,
            tenantId: accounts[0].tenantId || ''
          } as AuthenticationResult;
        }
      }
      
      // For other errors, re-throw
      throw error;
    }
  }
}

// Export singleton instance
export const azureAdAuth = new AzureAdAuthService();
export default azureAdAuth; 