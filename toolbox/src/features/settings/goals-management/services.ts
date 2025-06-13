import {
  MemberTarget,
  TeamTarget,
  MarginThreshold,
  Team,
  CreateMemberTargetRequest,
  UpdateMemberTargetRequest,
  CreateTeamTargetRequest,
  UpdateTeamTargetRequest,
  CreateMarginThresholdRequest,
  UpdateMarginThresholdRequest,
  CreateTeamRequest,
  UpdateTeamRequest,
  SuperTeam
} from './types'

export class GoalsManagementService {
  private static getAuthHeaders() {
    const token = localStorage.getItem('sb-access-token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  // Teams API - NEW SIMPLIFIED APPROACH
  static async fetchTeams(params?: {
    sales_teams_only?: boolean
    super_teams_only?: boolean
    team_type?: string
    include_members?: boolean
    year?: number
  }): Promise<Team[]> {
    const queryParams = new URLSearchParams()
    
    if (params?.sales_teams_only) queryParams.append('sales_teams_only', 'true')
    if (params?.super_teams_only) queryParams.append('super_teams_only', 'true')
    if (params?.team_type) queryParams.append('team_type', params.team_type)
    if (params?.include_members) queryParams.append('include_members', 'true')
    if (params?.year) queryParams.append('year', params.year.toString())

    const response = await fetch(`/api/teams?${queryParams.toString()}`, {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch teams')
    }
    
    return response.json()
  }

  static async fetchSalesOverview(year?: number): Promise<Team[]> {
    const queryParams = year ? `?year=${year}` : ''
    
    const response = await fetch(`/api/teams/sales-overview${queryParams}`, {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch sales overview')
    }
    
    return response.json()
  }

  static async updateTeam(data: UpdateTeamRequest): Promise<Team> {
    const response = await fetch(`/api/teams/${data.id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to update team')
    }
    
    return response.json()
  }

  static async createTeam(data: CreateTeamRequest): Promise<Team> {
    const response = await fetch('/api/teams', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to create team')
    }
    
    return response.json()
  }

  // Member Targets API
  static async fetchMemberTargets(year?: number): Promise<MemberTarget[]> {
    const queryParams = year ? `?year=${year}` : ''
    
    const response = await fetch(`/api/member-targets${queryParams}`, {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch member targets')
    }
    
    return response.json()
  }

  static async createMemberTarget(data: CreateMemberTargetRequest): Promise<MemberTarget> {
    const response = await fetch('/api/member-targets', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to create member target')
    }
    
    return response.json()
  }

  static async updateMemberTarget(data: UpdateMemberTargetRequest): Promise<MemberTarget> {
    const response = await fetch(`/api/member-targets/${data.id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to update member target')
    }
    
    return response.json()
  }

  static async deleteMemberTarget(id: string): Promise<void> {
    const response = await fetch(`/api/member-targets/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete member target')
    }
  }

  // Team Targets API
  static async fetchTeamTargets(year?: number): Promise<TeamTarget[]> {
    const queryParams = year ? `?year=${year}` : ''
    
    const response = await fetch(`/api/team-targets${queryParams}`, {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch team targets')
    }
    
    return response.json()
  }

  static async createTeamTarget(data: CreateTeamTargetRequest): Promise<TeamTarget> {
    const response = await fetch('/api/team-targets', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to create team target')
    }
    
    return response.json()
  }

  static async updateTeamTarget(data: UpdateTeamTargetRequest): Promise<TeamTarget> {
    const response = await fetch(`/api/team-targets/${data.id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to update team target')
    }
    
    return response.json()
  }

  static async deleteTeamTarget(id: string): Promise<void> {
    const response = await fetch(`/api/team-targets/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete team target')
    }
  }

  // Margin Thresholds API
  static async fetchMarginThresholds(): Promise<MarginThreshold[]> {
    const response = await fetch('/api/margin-thresholds', {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch margin thresholds')
    }
    
    return response.json()
  }

  static async createMarginThreshold(data: CreateMarginThresholdRequest): Promise<MarginThreshold> {
    const response = await fetch('/api/margin-thresholds', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to create margin threshold')
    }
    
    return response.json()
  }

  static async updateMarginThreshold(data: UpdateMarginThresholdRequest): Promise<MarginThreshold> {
    const response = await fetch(`/api/margin-thresholds/${data.id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to update margin threshold')
    }
    
    return response.json()
  }

  static async deleteMarginThreshold(id: string): Promise<void> {
    const response = await fetch(`/api/margin-thresholds/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete margin threshold')
    }
  }

  // LEGACY SuperTeam methods (now just use Teams with flags)
  static async fetchSuperTeams(year: number): Promise<SuperTeam[]> {
    // This is now just teams where is_super_team = true
    const teams = await this.fetchTeams({ super_teams_only: true })
    
    // Transform to legacy SuperTeam format if needed
    return teams.map(team => ({
      id: team.id,
      name: team.name,
      team_ids: team.child_teams?.map(ct => ct.id) || [],
      primary_team_id: team.parent_team_id || team.id,
      shared_goal: 0, // This would come from team_targets
      year,
      teams: team.child_teams
    }))
  }

  static async createSuperTeam(data: Omit<SuperTeam, 'id'>): Promise<SuperTeam> {
    // Create a team with is_super_team = true
    const team = await this.createTeam({
      name: data.name,
      is_super_team: true,
      team_type: 'sales'
    })
    
    return {
      id: team.id,
      name: team.name,
      team_ids: [],
      primary_team_id: team.id,
      shared_goal: data.shared_goal,
      year: data.year
    }
  }

  static async updateSuperTeam(data: SuperTeam): Promise<SuperTeam> {
    await this.updateTeam({
      id: data.id,
      name: data.name,
      is_super_team: true
    })
    
    return data
  }

  // Utility methods
  static async fetchTeamsWithMembers(): Promise<any[]> {
    const response = await fetch('/api/teams-with-members', {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch teams with members')
    }
    
    return response.json()
  }

  static async fetchAllUsers(): Promise<any[]> {
    const response = await fetch('/api/admin/profiles?limit=1000', {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }
    
    const data = await response.json()
    return data.profiles || []
  }
} 