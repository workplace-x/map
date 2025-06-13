import { getApiUrl } from './config'

export interface CompleteUserProfile {
  // Azure AD basics
  azureId: string
  email: string
  name: string
  tenantId: string
  isEmployee: boolean
  
  // Database profile (profiles table)
  profile: {
    user_id: string
    AzureID: string
    name: string
    email: string
    jobtitle?: string
    department?: string
    avatar_url?: string
    accountenabled: boolean
    created_at: string
    updated_at: string
  }
  
  // Role information (user_roles table)
  role: {
    id: string
    supabase_user_id: string
    role: 'superadmin' | 'admin' | 'executive' | 'manager' | 'user' | 'dashboard_user'
    created_at: string
    updated_at: string
  }
  
  // Team memberships (teams table)
  teams: Array<{
    id: string
    name: string
    description?: string
    color?: string
    logo_url?: string
    created_at: string
    is_leader?: boolean
  }>
  
  // Goals/targets (team_forecasts table)
  targets: Array<{
    id: string
    team_id: string
    year: number
    month: number
    target_amount: number
    actual_amount?: number
    created_at: string
    updated_at: string
  }>
  
  // Account mappings (account_mapping table)
  accountMapping: {
    id: string
    user_id: string
    salesforce_id?: string
    azure_id: string
    email: string
    name: string
    created_at: string
    updated_at: string
  }
  
  // Computed properties
  primaryTeam?: string
  isTeamLeader: boolean
  currentMonthTarget?: number
  targetProgress?: number
  permissions: string[]
}

export const fetchCompleteUserProfile = async (azureId: string, accessToken: string): Promise<CompleteUserProfile | null> => {
  try {
    console.log('🔍 Fetching complete user profile for Azure ID:', azureId)
    
    const response = await fetch(getApiUrl(`/user/complete-profile/${azureId}`), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const profileData = await response.json()
      console.log('✅ Complete profile data received:', profileData)
      return profileData
    } else if (response.status === 404) {
      console.log(`No complete profile found for Azure ID: ${azureId}`)
      return null
    } else {
      console.error('Failed to fetch complete user profile:', response.status, await response.text())
      return null
    }
  } catch (error) {
    console.error('Error fetching complete user profile:', error)
    return null
  }
}

export const refreshUserProfile = async (azureId: string, accessToken: string): Promise<boolean> => {
  try {
    console.log('🔄 Refreshing user profile for Azure ID:', azureId)
    
    const response = await fetch(getApiUrl(`/user/complete-profile/${azureId}/refresh`), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      console.log('✅ User profile refreshed successfully')
      return true
    } else {
      console.error('Failed to refresh user profile:', response.status, await response.text())
      return false
    }
  } catch (error) {
    console.error('Error refreshing user profile:', error)
    return false
  }
} 