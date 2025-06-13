export interface MemberTarget {
  id: string
  member_id: string
  team_id?: string
  year: number
  sales_target: number | null
  gross_profit_percentage: number | null
  gross_profit_dollars: number | null // Calculated field
  design_allocation: number | null
  pm_allocation: number | null
  presidents_circle_target: number | null
  created_at?: string
  updated_at?: string
  member_name?: string
  member_email?: string
  team_name?: string
  erp_salesperson_id?: string
  erp_salesperson_name?: string
}

export interface Team {
  id: string
  name: string
  leader_user_id?: string
  parent_team_id?: string
  house_account_erp_id?: string
  house_account_salesforce_id?: string
  is_sales_team: boolean
  is_super_team: boolean
  team_type?: 'sales' | 'operations' | 'management' | 'support' | 'other'
  description?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
  members?: TeamMember[]
  member_count?: number
  parent_team?: Team
  child_teams?: Team[]
  // Hierarchy support
  team_path?: string
  team_level?: number
}

export interface TeamTarget {
  id: string
  team_id: string
  year: number
  sales_target: number | null
  gross_profit_percentage: number | null
  gross_profit_dollars: number | null // Calculated field
  design_allocation: number | null
  pm_allocation: number | null
  presidents_circle_target: number | null
  created_at?: string
  updated_at?: string
  team_name?: string
  member_count?: number
  members?: TeamMember[]
  team?: Team
  // Hierarchy roll-up fields
  child_teams_sales_total?: number
  child_teams_gp_dollars_total?: number
  is_rollup_calculated?: boolean
}

export interface TeamMember {
  id: string
  name: string
  email: string
  jobtitle?: string
  department?: string
  erp_salesperson_id?: string
  erp_salesperson_name?: string
  is_active?: boolean
}

export interface MarginThreshold {
  id: string
  margin_type: 'vendor' | 'customer' | 'service' | 'overall' | 'order_minimum'
  threshold_percentage: number | null
  threshold_amount: number | null
  requires_approval: boolean
  approval_level?: 'manager' | 'director' | 'vp'
  active: boolean
  created_at?: string
  updated_at?: string
}

export interface SuperTeam {
  id: string
  name: string
  team_ids: string[]
  primary_team_id: string
  shared_goal: number
  year: number
  teams?: Team[]
}

export interface GoalsManagementState {
  memberTargets: MemberTarget[]
  teamTargets: TeamTarget[]
  marginThresholds: MarginThreshold[]
  teams: Team[]
  loading: boolean
  error: string | null
  selectedYear: number
}

export interface CreateMemberTargetRequest {
  member_id: string
  team_id: string
  year: number
  sales_target?: number
  gross_profit_percentage?: number
  design_allocation?: number
  pm_allocation?: number
  presidents_circle_target?: number
}

export interface UpdateMemberTargetRequest {
  id: string
  sales_target?: number
  gross_profit_percentage?: number
  design_allocation?: number
  pm_allocation?: number
  presidents_circle_target?: number
}

export interface CreateTeamTargetRequest {
  team_id: string
  year: number
  sales_target?: number
  gross_profit_percentage?: number
  design_allocation?: number
  pm_allocation?: number
  presidents_circle_target?: number
}

export interface UpdateTeamTargetRequest {
  id: string
  sales_target?: number
  gross_profit_percentage?: number
  design_allocation?: number
  pm_allocation?: number
  presidents_circle_target?: number
}

export interface CreateMarginThresholdRequest {
  name: string
  type: 'vendor' | 'customer' | 'service' | 'overall' | 'order_minimum'
  threshold_percentage: number
  threshold_amount?: number
  requires_approval: boolean
  approval_level: 'manager' | 'director' | 'vp'
}

export interface UpdateMarginThresholdRequest {
  id: string
  name?: string
  threshold_percentage?: number
  threshold_amount?: number
  requires_approval?: boolean
  approval_level?: 'manager' | 'director' | 'vp'
  active?: boolean
}

export interface CreateTeamRequest {
  name: string
  leader_user_id?: string
  parent_team_id?: string
  house_account_erp_id?: string
  house_account_salesforce_id?: string
  is_sales_team?: boolean
  is_super_team?: boolean
  team_type?: 'sales' | 'operations' | 'management' | 'support' | 'other'
  description?: string
}

export interface UpdateTeamRequest {
  id: string
  name?: string
  leader_user_id?: string
  parent_team_id?: string
  house_account_erp_id?: string
  house_account_salesforce_id?: string
  is_sales_team?: boolean
  is_super_team?: boolean
  team_type?: 'sales' | 'operations' | 'management' | 'support' | 'other'
  description?: string
  is_active?: boolean
}

// New interfaces for hierarchy-aware goals
export interface TeamHierarchyGoals {
  team: Team
  direct_targets: TeamTarget | null
  member_targets: MemberTarget[]
  child_teams: TeamHierarchyGoals[]
  rollup_totals: {
    sales_target_total: number
    gross_profit_dollars_total: number
    design_allocation_total: number
    pm_allocation_total: number
    presidents_circle_total: number
    member_count_total: number
  }
  is_super_team_individual: boolean // Flag for super teams treated as individuals
} 