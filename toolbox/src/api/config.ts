// Use relative URLs in development to leverage Vite proxy, absolute URLs in production
export const getApiUrl = (endpoint: string) => {
  if (import.meta.env.DEV) {
    return `/api${endpoint}`;
  } else {
    // In production, use the Azure Functions URL
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tangram-marketing-functions.azurewebsites.net/api';
    return `${API_BASE_URL}${endpoint}`;
  }
}; 