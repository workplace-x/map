import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useAzureAuthStore } from '@/stores/azureAuthStore';
import { azureAdAuth } from '@/lib/azureAdClient';

export const Route = createFileRoute('/auth/azure-callback')({
  component: AzureCallbackHandler,
});

function AzureCallbackHandler() {
  const [status, setStatus] = useState('Processing Azure AD authentication...');
  const [error, setError] = useState<string | null>(null);
  const { setUser, setAccessToken } = useAzureAuthStore();

  useEffect(() => {
    const handleAzureCallback = async () => {
      try {
        console.log('[AZURE CALLBACK] Processing Azure AD callback');
        setStatus('🔐 Verifying Azure AD authentication...');
        
        // Handle redirect response from Azure AD
        const response = await azureAdAuth.handleRedirectResponse();
        
        if (response && response.account && response.accessToken) {
          console.log('[AZURE CALLBACK] Azure AD authentication successful');
          setStatus('✅ Authentication successful! Setting up your session...');
          
          // Get user info from Azure AD
          const userInfo = azureAdAuth.getUserInfo();
          
          if (userInfo) {
            // Set user and token in store
            setUser(userInfo);
            setAccessToken(response.accessToken);
            
            setStatus('🚀 Redirecting to Tangram Toolbox...');
            
            // Small delay to show success message
            setTimeout(() => {
              window.location.href = '/';
            }, 1500);
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
              
              setTimeout(() => {
                window.location.href = '/';
              }, 1000);
            } else {
              throw new Error('Failed to retrieve existing authentication');
            }
          } else {
            throw new Error('No authentication response received from Azure AD');
          }
        }
      } catch (error: any) {
        console.error('[AZURE CALLBACK] Authentication failed:', error);
        setError(error.message || 'Azure AD authentication failed');
        setStatus('❌ Authentication failed');
        
        // Redirect to sign-in after a delay
        setTimeout(() => {
          window.location.href = '/sign-in';
        }, 3000);
      }
    };

    handleAzureCallback();
  }, [setUser, setAccessToken]);

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
              <div className="text-xs text-red-600 mt-1">
                Redirecting to sign-in page...
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