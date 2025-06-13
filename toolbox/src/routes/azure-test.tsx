import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useAzureAuthStore } from '@/stores/azureAuthStore';
import { azureApiClient } from '@/lib/azure-api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/azure-test')({
  component: AzureTestPage,
});

function AzureTestPage() {
  const { user, isAuthenticated, login, logout, loading, error } = useAzureAuthStore();
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const testHealthApi = async () => {
    setApiLoading(true);
    setApiError(null);
    try {
      const response = await azureApiClient.healthCheck();
      setApiResponse(response);
    } catch (error: any) {
      setApiError(error.message);
    } finally {
      setApiLoading(false);
    }
  };

  const testVendorApi = async () => {
    setApiLoading(true);
    setApiError(null);
    try {
      const response = await azureApiClient.getVendorIntelligence();
      setApiResponse(response);
    } catch (error: any) {
      setApiError(error.message);
    } finally {
      setApiLoading(false);
    }
  };

  const testCustomerApi = async () => {
    setApiLoading(true);
    setApiError(null);
    try {
      const response = await azureApiClient.getCustomerIntelligence();
      setApiResponse(response);
    } catch (error: any) {
      setApiError(error.message);
    } finally {
      setApiLoading(false);
    }
  };

  const testForecastingApi = async () => {
    setApiLoading(true);
    setApiError(null);
    try {
      const response = await azureApiClient.getForecastingData();
      setApiResponse(response);
    } catch (error: any) {
      setApiError(error.message);
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">🎯 Azure AD Authentication Test</h1>
        <p className="text-gray-600">
          Test the new Azure Active Directory authentication system for Tangram Interiors
        </p>
      </div>

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle>🔐 Authentication Status</CardTitle>
          <CardDescription>
            Your current Azure AD authentication state
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Loading authentication status...</span>
            </div>
          ) : isAuthenticated && user ? (
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="text-sm text-green-800">
                  <strong>✅ Authenticated as Tangram Employee</strong>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Name:</strong> {user.name}</div>
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Employee:</strong> {user.isEmployee ? '✅ Yes' : '❌ No'}</div>
                <div><strong>Tenant:</strong> {user.tenantId}</div>
              </div>
              <Button onClick={logout} variant="outline">
                🚪 Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="text-sm text-yellow-800">
                  <strong>🔑 Not Authenticated</strong>
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="text-sm text-red-800">
                    <strong>Error:</strong> {error}
                  </div>
                </div>
              )}
              <Button onClick={login} disabled={loading}>
                🔐 Sign In with Microsoft
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Testing */}
      {isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle>📊 API Testing</CardTitle>
            <CardDescription>
              Test Azure Functions endpoints with Azure AD authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                onClick={testHealthApi} 
                disabled={apiLoading}
                variant="outline"
              >
                🩺 Health Check
              </Button>
              <Button 
                onClick={testVendorApi} 
                disabled={apiLoading}
                variant="outline"
              >
                🏪 Vendor Intelligence
              </Button>
              <Button 
                onClick={testCustomerApi} 
                disabled={apiLoading}
                variant="outline"
              >
                👥 Customer Intelligence
              </Button>
              <Button 
                onClick={testForecastingApi} 
                disabled={apiLoading}
                variant="outline"
              >
                📈 Forecasting Data
              </Button>
            </div>

            {apiLoading && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Making API request...</span>
              </div>
            )}

            {apiError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="text-sm text-red-800">
                  <strong>API Error:</strong> {apiError}
                </div>
              </div>
            )}

            {apiResponse && (
              <div className="space-y-2">
                <h4 className="font-medium">✅ API Response:</h4>
                <pre className="bg-gray-50 border rounded-md p-4 text-xs overflow-auto max-h-96">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>ℹ️ System Information</CardTitle>
          <CardDescription>
            Azure AD configuration and system details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div><strong>Tenant:</strong> tangramint.onmicrosoft.com</div>
            <div><strong>App ID:</strong> 72129170-78ba-47b7-8989-fe826a45a7d4</div>
            <div><strong>API URL:</strong> {import.meta.env.VITE_API_URL || 'Development Proxy'}</div>
            <div><strong>Environment:</strong> {import.meta.env.DEV ? 'Development' : 'Production'}</div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-800">
              <strong>💡 Next Steps:</strong> Once testing is complete, this Azure AD system will replace 
              Supabase authentication, providing enterprise security and cost savings for Tangram Interiors.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 