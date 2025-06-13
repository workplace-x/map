// API endpoint to fetch user avatar from Azure database
export interface UserProfile {
  AzureID: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  jobtitle?: string;
  department?: string;
  accountenabled?: boolean;
}

// Use relative URLs in development to leverage Vite proxy, absolute URLs in production
const getApiUrl = (endpoint: string) => {
  if (import.meta.env.DEV) {
    return `/api${endpoint}`;
  } else {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tangram-marketing-functions.azurewebsites.net/api';
    return `${API_BASE_URL}${endpoint}`;
  }
};

export const fetchUserProfile = async (azureId: string, accessToken: string): Promise<UserProfile | null> => {
  try {
    const response = await fetch(getApiUrl(`/user/profile/${azureId}`), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const profile = await response.json();
      return profile;
    } else if (response.status === 404) {
      console.log(`No profile found for Azure ID: ${azureId}`);
      return null;
    } else {
      console.error('Failed to fetch user profile:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const updateUserAvatar = async (azureId: string, avatarUrl: string, accessToken: string): Promise<boolean> => {
  try {
    const response = await fetch(getApiUrl(`/user/profile/${azureId}/avatar`), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ avatar_url: avatarUrl })
    });

    return response.ok;
  } catch (error) {
    console.error('Error updating user avatar:', error);
    return false;
  }
}; 