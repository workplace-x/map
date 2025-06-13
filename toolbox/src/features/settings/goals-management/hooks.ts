import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  MemberTarget,
  TeamTarget,
  MarginThreshold,
  Team,
  SuperTeam,
  CreateMemberTargetRequest,
  UpdateMemberTargetRequest,
  CreateTeamTargetRequest,
  UpdateTeamTargetRequest,
  CreateMarginThresholdRequest,
  UpdateMarginThresholdRequest,
  CreateTeamRequest,
  UpdateTeamRequest
} from './types'
import { GoalsManagementService } from './services'

// NEW SIMPLIFIED TEAMS HOOK - FIXED INFINITE LOOP ISSUE
export function useTeams(params?: {
  sales_teams_only?: boolean
  super_teams_only?: boolean
  team_type?: string
  include_members?: boolean
  year?: number
}) {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Stabilize params to prevent infinite loops
  const stableParams = useMemo(() => params, [
    params?.sales_teams_only,
    params?.super_teams_only,
    params?.team_type,
    params?.include_members,
    params?.year
  ])

  const fetchTeams = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await GoalsManagementService.fetchTeams(stableParams)
      setTeams(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch teams'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [stableParams])

  const updateTeam = useCallback(async (data: UpdateTeamRequest) => {
    try {
      const updatedTeam = await GoalsManagementService.updateTeam(data)
      setTeams(prev => 
        prev.map(team => team.id === data.id ? updatedTeam : team)
      )
      toast.success('Team updated successfully')
      return updatedTeam
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update team'
      toast.error(message)
      throw err
    }
  }, [])

  const createTeam = useCallback(async (data: CreateTeamRequest) => {
    try {
      const newTeam = await GoalsManagementService.createTeam(data)
      setTeams(prev => [...prev, newTeam])
      toast.success('Team created successfully')
      return newTeam
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create team'
      toast.error(message)
      throw err
    }
  }, [])

  // Convenience methods for common operations
  const toggleSalesTeam = useCallback(async (teamId: string, isSalesTeam: boolean) => {
    return updateTeam({ 
      id: teamId, 
      is_sales_team: isSalesTeam,
      team_type: isSalesTeam ? 'sales' : undefined
    })
  }, [updateTeam])

  const toggleSuperTeam = useCallback(async (teamId: string, isSuperTeam: boolean) => {
    return updateTeam({ 
      id: teamId, 
      is_super_team: isSuperTeam 
    })
  }, [updateTeam])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  return {
    teams,
    loading,
    error,
    refetch: fetchTeams,
    updateTeam,
    createTeam,
    toggleSalesTeam,
    toggleSuperTeam
  }
}

// SALES OVERVIEW HOOK
export function useSalesOverview(year?: number) {
  const [salesTeams, setSalesTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSalesOverview = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await GoalsManagementService.fetchSalesOverview(year)
      setSalesTeams(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sales overview'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    fetchSalesOverview()
  }, [fetchSalesOverview])

  return {
    salesTeams,
    loading,
    error,
    refetch: fetchSalesOverview
  }
}

// Hook for managing member targets
export function useMemberTargets(selectedYear: number) {
  const [memberTargets, setMemberTargets] = useState<MemberTarget[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMemberTargets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await GoalsManagementService.fetchMemberTargets(selectedYear)
      setMemberTargets(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch member targets'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [selectedYear])

  const createMemberTarget = useCallback(async (data: CreateMemberTargetRequest) => {
    try {
      const newTarget = await GoalsManagementService.createMemberTarget(data)
      setMemberTargets(prev => [...prev, newTarget])
      toast.success('Member target created successfully')
      return newTarget
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create member target'
      toast.error(message)
      throw err
    }
  }, [])

  const updateMemberTarget = useCallback(async (data: UpdateMemberTargetRequest) => {
    try {
      const updatedTarget = await GoalsManagementService.updateMemberTarget(data)
      setMemberTargets(prev => 
        prev.map(target => target.id === data.id ? updatedTarget : target)
      )
      toast.success('Member target updated successfully')
      return updatedTarget
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update member target'
      toast.error(message)
      throw err
    }
  }, [])

  const deleteMemberTarget = useCallback(async (id: string) => {
    try {
      await GoalsManagementService.deleteMemberTarget(id)
      setMemberTargets(prev => prev.filter(target => target.id !== id))
      toast.success('Member target deleted successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete member target'
      toast.error(message)
      throw err
    }
  }, [])

  useEffect(() => {
    fetchMemberTargets()
  }, [fetchMemberTargets])

  return {
    memberTargets,
    loading,
    error,
    refetch: fetchMemberTargets,
    createMemberTarget,
    updateMemberTarget,
    deleteMemberTarget
  }
}

// Hook for managing team targets
export function useTeamTargets(selectedYear: number) {
  const [teamTargets, setTeamTargets] = useState<TeamTarget[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTeamTargets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await GoalsManagementService.fetchTeamTargets(selectedYear)
      setTeamTargets(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch team targets'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [selectedYear])

  const createTeamTarget = useCallback(async (data: CreateTeamTargetRequest) => {
    try {
      const newTarget = await GoalsManagementService.createTeamTarget(data)
      setTeamTargets(prev => [...prev, newTarget])
      toast.success('Team target created successfully')
      return newTarget
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create team target'
      toast.error(message)
      throw err
    }
  }, [])

  const updateTeamTarget = useCallback(async (data: UpdateTeamTargetRequest) => {
    try {
      const updatedTarget = await GoalsManagementService.updateTeamTarget(data)
      setTeamTargets(prev => 
        prev.map(target => target.id === data.id ? updatedTarget : target)
      )
      toast.success('Team target updated successfully')
      return updatedTarget
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update team target'
      toast.error(message)
      throw err
    }
  }, [])

  const deleteTeamTarget = useCallback(async (id: string) => {
    try {
      await GoalsManagementService.deleteTeamTarget(id)
      setTeamTargets(prev => prev.filter(target => target.id !== id))
      toast.success('Team target deleted successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete team target'
      toast.error(message)
      throw err
    }
  }, [])

  useEffect(() => {
    fetchTeamTargets()
  }, [fetchTeamTargets])

  return {
    teamTargets,
    loading,
    error,
    refetch: fetchTeamTargets,
    createTeamTarget,
    updateTeamTarget,
    deleteTeamTarget
  }
}

// Hook for managing margin thresholds
export function useMarginThresholds() {
  const [marginThresholds, setMarginThresholds] = useState<MarginThreshold[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMarginThresholds = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await GoalsManagementService.fetchMarginThresholds()
      setMarginThresholds(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch margin thresholds'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createMarginThreshold = useCallback(async (data: CreateMarginThresholdRequest) => {
    try {
      const newThreshold = await GoalsManagementService.createMarginThreshold(data)
      setMarginThresholds(prev => [...prev, newThreshold])
      toast.success('Margin threshold created successfully')
      return newThreshold
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create margin threshold'
      toast.error(message)
      throw err
    }
  }, [])

  const updateMarginThreshold = useCallback(async (data: UpdateMarginThresholdRequest) => {
    try {
      const updatedThreshold = await GoalsManagementService.updateMarginThreshold(data)
      setMarginThresholds(prev => 
        prev.map(threshold => threshold.id === data.id ? updatedThreshold : threshold)
      )
      toast.success('Margin threshold updated successfully')
      return updatedThreshold
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update margin threshold'
      toast.error(message)
      throw err
    }
  }, [])

  const deleteMarginThreshold = useCallback(async (id: string) => {
    try {
      await GoalsManagementService.deleteMarginThreshold(id)
      setMarginThresholds(prev => prev.filter(threshold => threshold.id !== id))
      toast.success('Margin threshold deleted successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete margin threshold'
      toast.error(message)
      throw err
    }
  }, [])

  useEffect(() => {
    fetchMarginThresholds()
  }, [fetchMarginThresholds])

  return {
    marginThresholds,
    loading,
    error,
    refetch: fetchMarginThresholds,
    createMarginThreshold,
    updateMarginThreshold,
    deleteMarginThreshold
  }
}

// LEGACY: Hook for managing super teams (now uses simplified teams)
export function useSuperTeams(selectedYear: number) {
  const [superTeams, setSuperTeams] = useState<SuperTeam[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSuperTeams = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await GoalsManagementService.fetchSuperTeams(selectedYear)
      setSuperTeams(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch super teams'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [selectedYear])

  const createSuperTeam = useCallback(async (data: Omit<SuperTeam, 'id'>) => {
    try {
      const newSuperTeam = await GoalsManagementService.createSuperTeam(data)
      setSuperTeams(prev => [...prev, newSuperTeam])
      toast.success('Super team created successfully')
      return newSuperTeam
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create super team'
      toast.error(message)
      throw err
    }
  }, [])

  const updateSuperTeam = useCallback(async (data: SuperTeam) => {
    try {
      const updatedSuperTeam = await GoalsManagementService.updateSuperTeam(data)
      setSuperTeams(prev => 
        prev.map(team => team.id === data.id ? updatedSuperTeam : team)
      )
      toast.success('Super team updated successfully')
      return updatedSuperTeam
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update super team'
      toast.error(message)
      throw err
    }
  }, [])

  useEffect(() => {
    fetchSuperTeams()
  }, [fetchSuperTeams])

  return {
    superTeams,
    loading,
    error,
    refetch: fetchSuperTeams,
    createSuperTeam,
    updateSuperTeam
  }
}

// Hook for reference data (teams and users)
export function useReferenceData() {
  const [teams, setTeams] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReferenceData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [teamsData, usersData] = await Promise.all([
        GoalsManagementService.fetchTeamsWithMembers(),
        GoalsManagementService.fetchAllUsers()
      ])
      setTeams(teamsData)
      setUsers(usersData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch reference data'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReferenceData()
  }, [fetchReferenceData])

  return {
    teams,
    users,
    loading,
    error,
    refetch: fetchReferenceData
  }
} 