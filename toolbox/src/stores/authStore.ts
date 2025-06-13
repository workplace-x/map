import { create } from 'zustand'
import { azureAdAuth } from '../lib/azureAdClient'

// Use relative URLs in development to leverage Vite proxy, absolute URLs in production
const getApiUrl = (endpoint: string) => {
  if (import.meta.env.DEV) {
    // In development, use relative URLs to go through Vite proxy
    return endpoint
  } else {
    // In production, use the full API URL
    const API_BASE_URL = import.meta.env.VITE_API_URL || ''
    return `${API_BASE_URL}${endpoint}`
  }
}

export interface AuthUser {
  id: string
  email: string
  name?: string
  avatar_url?: string
  role?: string | null
  team?: { id: string; name: string } | null
  isLeader?: boolean
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  loading: boolean
  retryCount: number
  setUser: (user: AuthUser | null) => void
  setAccessToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
  refreshUser: () => Promise<void>
  refreshSession: () => Promise<boolean>
  clearStaleAuth: () => void
}

const MAX_RETRY_COUNT = 3
const RETRY_DELAY = 1000 // 1 second

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('azure-access-token'),
  loading: true,
  retryCount: 0,
  setUser: (user) => set({ user }),
  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem('azure-access-token', token)
    } else {
      localStorage.removeItem('azure-access-token')
    }
    set({ accessToken: token })
  },
  setLoading: (loading) => set({ loading }),
  reset: () => {
    localStorage.removeItem('azure-access-token')
    set({ user: null, accessToken: null, loading: false, retryCount: 0 })
  },
  refreshUser: async () => {
    const token = get().accessToken
    const retryCount = get().retryCount
    
    if (!token) {
      set({ user: null, loading: false, retryCount: 0 })
      return
    }
    
    // Prevent infinite retry loop
    if (retryCount >= MAX_RETRY_COUNT) {
      console.warn('Max retry count reached, resetting auth state')
      get().reset()
      return
    }
    
    set({ loading: true })
    try {
      console.log('[AUTH] Making request to /api/me with Azure AD token:', token?.substring(0, 20) + '...')
      const res = await fetch(getApiUrl('/api/me'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      console.log('[AUTH] /api/me response status:', res.status)
      
      if (res.ok) {
        const data = await res.json()
        console.log('[AUTH] Successfully refreshed user data:', data)
        
        // Extract user data from API response structure
        const userData = data.user || data;
        
        set({ 
          user: { ...userData, name: userData.name || userData.email }, 
          loading: false, 
          retryCount: 0 
        })
      } else if (res.status === 429) {
        // Rate limited - wait and retry with backoff
        console.warn('Rate limited, waiting before retry...')
        set({ retryCount: retryCount + 1 })
        setTimeout(() => {
          get().refreshUser()
        }, RETRY_DELAY * Math.pow(2, retryCount))
      } else if (res.status === 401) {
        // Unauthorized - immediately clear stale auth state
        console.log('401 Unauthorized - clearing stale auth state')
        get().reset()
      } else {
        // Other errors
        console.error('Error fetching user:', res.status, res.statusText)
        const errorText = await res.text()
        console.error('Error response body:', errorText)
        set({ user: null, loading: false })
      }
    } catch (error) {
      console.error('Network error fetching user:', error)
      set({ user: null, loading: false })
    }
  },
  refreshSession: async () => {
    try {
      // Try to get a fresh Azure AD token
      const token = await azureAdAuth.getAccessToken(true) // Force refresh
      
      if (token) {
        // If we have an Azure AD token, use it
        get().setAccessToken(token)
        set({ retryCount: 0 }) // Reset retry count on new token
        
        // Fetch user data with new token (but don't trigger refresh cycle)
        try {
          const res = await fetch(getApiUrl('/api/me'), {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            const data = await res.json()
            
            // Extract user data from API response structure
            const userData = data.user || data;
            
            set({ user: { ...userData, name: userData.name || userData.email }, loading: false })
            return true
          }
        } catch (error) {
          console.error('Error fetching user with new Azure AD token:', error)
        }
      }

      // If no Azure AD token or the new token doesn't work, reset
      get().reset()
      return false
    } catch (error) {
      console.error('Error refreshing Azure AD session:', error)
      get().reset()
      return false
    }
  },
  clearStaleAuth: () => {
    console.log('[AUTH] Clearing stale Azure AD authentication state')
    localStorage.removeItem('azure-access-token')
    localStorage.removeItem('azure-refresh-token')
    set({ user: null, accessToken: null, loading: false, retryCount: 0 })
  }
}))

export const useAuth = () => useAuthStore()
