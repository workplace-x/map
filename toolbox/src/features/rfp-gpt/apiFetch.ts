import { useAuthStore } from '@/stores/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tangram-marketing-functions.azurewebsites.net'

const fetchFromAPI = async (endpoint: string, options: RequestInit = {}, accessToken?: string) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  // Remove leading slash from endpoint if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  const response = await fetch(`${API_BASE_URL}/${cleanEndpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token is invalid or expired, trigger a refresh
    const { refreshSession } = useAuthStore.getState();
    await refreshSession();
    
    // Get the new token after refresh
    const newToken = useAuthStore.getState().accessToken;
    
    // Only retry if we got a new token
    if (newToken && newToken !== accessToken) {
      return fetchFromAPI(endpoint, options, newToken);
    } else {
      // If no new token was obtained, throw an error to stop the retry loop
      throw new Error('Authentication failed: Unable to refresh session');
    }
  }

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
};

export const apiFetch = async <T>(url: string, options: RequestInit = {}, accessToken?: string): Promise<T> => {
  return fetchFromAPI(url, options, accessToken);
};

export const uploadFileWithProgress = (
  endpoint: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Failed to parse response'));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    // Remove leading slash from endpoint if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    xhr.open('POST', `${API_BASE_URL}${cleanEndpoint}`);
    xhr.send(formData);
  });
}; 