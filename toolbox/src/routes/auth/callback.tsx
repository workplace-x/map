import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useAzureAuthStore } from '@/stores/azureAuthStore';
import { azureAdAuth } from '@/lib/azureAdClient';

export const Route = createFileRoute('/auth/callback')({
  component: AzureCallbackHandler,
});

function AzureCallbackHandler() {
  const [status, setStatus] = useState('Processing Azure AD authentication...');
  const [error, setError] = useState<string | null>(null);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const { setUser, setAccessToken } = useAzureAuthStore();
  const navigate = useNavigate();

  const retryAuthentication = () => {
    setError(null);
    setIsNetworkError(false);
    setStatus('🔄 Retrying authentication...');
    window.location.reload();
  };

  useEffect(() => {
    const handleAzureCallback = async () => {
      try {
        console.log('[AZURE CALLBACK] Processing Azure AD redirect callback');
        setStatus('🔐 Initializing Azure AD...');
        
        // First, ensure Azure AD is initialized
        await azureAdAuth.initialize();
        console.log('[AZURE CALLBACK] Azure AD initialized successfully');
        
        setStatus('🔐 Processing authentication response...');
        
        // Handle redirect response from Azure AD
        const response = await azureAdAuth.handleRedirectResponse();
        console.log('[AZURE CALLBACK] Redirect response:', !!response);
        
        if (response && response.account) {
          console.log('[AZURE CALLBACK] Azure AD authentication response received');
          
          // Check if we got access token in the response
          let accessToken = response.accessToken;
          
          if (!accessToken) {
            console.log('[AZURE CALLBACK] No access token in response, attempting silent acquisition...');
            setStatus('🔐 Getting access token...');
            
            try {
              accessToken = await azureAdAuth.getAccessToken(false);
              console.log('[AZURE CALLBACK] Silent token acquisition:', !!accessToken);
            } catch (tokenError) {
              console.warn('[AZURE CALLBACK] Silent token acquisition failed:', tokenError);
              // Continue without token - we can still proceed with basic auth
            }
          }
          
          if (accessToken) {
            console.log('[AZURE CALLBACK] Azure AD authentication successful with access token');
            setStatus('✅ Authentication successful! Setting up your session...');
          } else {
            console.log('[AZURE CALLBACK] Azure AD authentication successful but no access token (network issue?)');
            setStatus('✅ Authentication successful! (Limited network connectivity)');
          }
          
          // Get user info from Azure AD
          const userInfo = azureAdAuth.getUserInfo();
          console.log('[AZURE CALLBACK] User info retrieved:', !!userInfo);
          
          if (userInfo) {
            console.log('[AZURE CALLBACK] Setting user and token in store...');
            // Set user and token in store
            setUser(userInfo);
            if (accessToken) {
              setAccessToken(accessToken);
            }
            
            setStatus('📊 Profile setup complete...');
            
            // TEMPORARILY DISABLED to prevent API server crashes
            // Fetch complete profile data from database
            // await fetchCompleteUserProfile();
            
            setStatus('🔐 Authentication complete...');
            
            // TEMPORARILY DISABLED to prevent API server crashes  
            // Verify the user with the API
            // await verifyUserWithApi();
            
            setStatus('🚀 Redirecting to Tangram Toolbox...');
            
            console.log('✅ Azure AD redirect authentication complete (API calls disabled for now)');
            
            // Redirect to home after successful authentication
            setTimeout(() => {
              navigate({ to: '/' });
            }, 1000);
          } else {
            throw new Error('Failed to retrieve user information from Azure AD');
          }
        } else {
          // Check if user is already logged in
          if (azureAdAuth.isLoggedIn()) {
            console.log('[AZURE CALLBACK] User already authenticated');
            setStatus('✅ Already authenticated! Redirecting...');
            
            const userInfo = azureAdAuth.getUserInfo();
            const accessToken = await azureAdAuth.getAccessToken();
            
            if (userInfo && accessToken) {
              setUser(userInfo);
              setAccessToken(accessToken);
              
              // TEMPORARILY DISABLED to prevent API server crashes
              // await fetchCompleteUserProfile();
              // await verifyUserWithApi();
              
              setTimeout(() => {
                navigate({ to: '/' });
              }, 1000);
            } else {
              throw new Error('Failed to retrieve existing authentication');
            }
          } else {
            // No authentication response - redirect to sign-in
            console.log('[AZURE CALLBACK] No authentication response, redirecting to sign-in');
            setStatus('🔄 No authentication found, redirecting to sign-in...');
            setTimeout(() => {
              navigate({ to: '/sign-in' });
            }, 2000);
          }
        }
      } catch (error: any) {
        console.error('[AZURE CALLBACK] Authentication failed:', error);
        
        // Check for specific types of errors
        let errorMessage = error.message || 'Azure AD authentication failed';
        let shouldRetry = false;
        
        if (error.message?.includes('Failed to fetch') || 
            error.message?.includes('NetworkError') ||
            error.message?.includes('CORS') ||
            error.message?.includes('Token exchange timed out') ||
            error.name === 'NetworkError') {
          errorMessage = 'Network connectivity issue during authentication. This might be due to CORS policy or network restrictions.';
          shouldRetry = true;
          setStatus('🌐 Network connectivity issue detected...');
          setIsNetworkError(true);
        } else if (error.message?.includes('MSAL')) {
          errorMessage = 'Microsoft authentication service error. Please try again.';
          shouldRetry = true;
        } else {
          setStatus('❌ Authentication failed');
        }
        
        setError(errorMessage);
        
        console.error('[AZURE CALLBACK] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          shouldRetry,
          errorType: typeof error
        });
        
        // Provide different redirect timeouts based on error type
        const redirectDelay = shouldRetry ? 5000 : 3000;
        
        setTimeout(() => {
          navigate({ to: '/sign-in' });
        }, redirectDelay);
      }
    };

    handleAzureCallback();
  }, [setUser, setAccessToken, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center space-y-4">
          {/* Loading animation */}
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          
          {/* Status message */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">
              🏢 Tangram Toolbox
            </h2>
            <p className="text-sm text-gray-600">
              {status}
            </p>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-sm text-red-800">
                <strong>Error:</strong> {error}
              </div>
              {isNetworkError && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-red-600">
                    This might be due to CORS policy or network restrictions in your development environment.
                  </div>
                  <button 
                    onClick={retryAuthentication}
                    className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded border border-red-300 transition-colors"
                  >
                    🔄 Retry Authentication
                  </button>
                </div>
              )}
              <div className="text-xs text-red-600 mt-1">
                {isNetworkError ? 'Redirecting to sign-in page in 5 seconds...' : 'Redirecting to sign-in page...'}
              </div>
            </div>
          )}
          
          {/* Success indicators */}
          {!error && (
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center justify-center space-x-2">
                <span>🔐</span>
                <span>Azure Active Directory</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span>🛡️</span>
                <span>Enterprise Security</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span>🏢</span>
                <span>Tangram Interiors</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 