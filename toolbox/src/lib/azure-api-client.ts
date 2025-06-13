import { azureAdAuth } from './azureAdClient';

// Use relative URLs in development to leverage Vite proxy, absolute URLs in production
const getApiUrl = (endpoint: string) => {
  if (import.meta.env.DEV) {
    // In development, use /api prefix to go through Vite proxy to localhost:3000
    return `/api${endpoint}`;
  } else {
    // In production, use the Azure Functions URL
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tangram-marketing-functions.azurewebsites.net/api';
    return `${API_BASE_URL}${endpoint}`;
  }
};

class AzureApiClient {
  private async getAuthToken(): Promise<string | null> {
    try {
      const token = await azureAdAuth.getAccessToken();
      return token;
    } catch (error) {
      console.error('Error getting Azure AD auth token:', error);
      return null;
    }
  }

  async request(config: {
    url: string;
    method?: string;
    data?: any;
    headers?: Record<string, string>;
  }) {
    const token = await this.getAuthToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = getApiUrl(config.url);
    const method = config.method || 'GET';

    const options: RequestInit = {
      method,
      headers,
    };

    if (config.data && method !== 'GET') {
      options.body = JSON.stringify(config.data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Azure AD token expired or invalid, attempting refresh...');
          
          // Try to refresh token and retry
          const newToken = await azureAdAuth.getAccessToken(true);
          if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
            const retryResponse = await fetch(url, { ...options, headers });
            if (retryResponse.ok) {
              return retryResponse.json();
            }
          }
          
          // If refresh fails, user needs to log in again
          throw new Error('Authentication required. Please sign in again.');
        }
        
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Convenience methods
  async get(url: string, headers?: Record<string, string>) {
    return this.request({ url, method: 'GET', headers });
  }

  async post(url: string, data?: any, headers?: Record<string, string>) {
    return this.request({ url, method: 'POST', data, headers });
  }

  async put(url: string, data?: any, headers?: Record<string, string>) {
    return this.request({ url, method: 'PUT', data, headers });
  }

  async delete(url: string, headers?: Record<string, string>) {
    return this.request({ url, method: 'DELETE', headers });
  }

  // Health check method
  async healthCheck() {
    try {
      const response = await this.get('/health');
      console.log('🩺 API Health Check:', response);
      return response;
    } catch (error) {
      console.error('❌ API Health Check failed:', error);
      throw error;
    }
  }

  // Vendor Intelligence
  async getVendorIntelligence() {
    try {
      const response = await this.get('/vendor-intelligence');
      console.log('🏪 Vendor Intelligence:', response.data?.length, 'vendors');
      return response;
    } catch (error) {
      console.error('❌ Vendor Intelligence failed:', error);
      throw error;
    }
  }

  // Customer Intelligence
  async getCustomerIntelligence() {
    try {
      const response = await this.get('/customer-intelligence');
      console.log('👥 Customer Intelligence:', response.data?.length, 'customers');
      return response;
    } catch (error) {
      console.error('❌ Customer Intelligence failed:', error);
      throw error;
    }
  }

  // Forecasting Data
  async getForecastingData() {
    try {
      const response = await this.get('/forecasting-data');
      console.log('📈 Forecasting Data:', response.forecasting_data?.length, 'records');
      return response;
    } catch (error) {
      console.error('❌ Forecasting Data failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const azureApiClient = new AzureApiClient();
export default azureApiClient; 