export interface TeamForecast {
  id: string;
  team_id: string;
  year: number;
  month: number;
  forecast_type: 'manual' | 'predictive' | 'adjusted';
  
  // Forecast values
  forecasted_revenue?: number | null;
  forecasted_bookings?: number | null;
  forecasted_gp_dollars?: number | null;
  forecasted_gp_percentage?: number | null;
  
  // Confidence and notes
  confidence_level?: number | null; // 1-5 scale
  notes?: string | null;
  
  // Locking mechanism
  is_locked: boolean;
  locked_at?: string | null;
  locked_by?: string | null;
  
  // Audit fields
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  
  // Team information (from joins)
  team_name?: string;
  team_is_sales?: boolean;
  team_is_super?: boolean;
}

export interface ForecastLockSettings {
  id: string;
  year: number;
  month: number;
  
  // Lock settings
  auto_lock_enabled: boolean;
  auto_lock_day: number; // Day of the month to auto-lock
  manual_lock_enabled: boolean;
  
  // Override settings
  force_locked: boolean;
  force_unlocked: boolean;
  
  // Admin settings
  admin_override_enabled: boolean;
  
  // Audit fields
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface ForecastMonthData {
  forecasted_revenue?: number | null;
  forecasted_bookings?: number | null;
  forecasted_gp_dollars?: number | null;
  forecasted_gp_percentage?: number | null;
  confidence_level?: number | null;
  notes?: string;
  is_locked: boolean;
  locked_at?: string | null;
  can_edit: boolean;
  auto_lock_day: number;
  force_locked: boolean;
}

export interface TeamForecastRow {
  team_id: string;
  team_name: string;
  is_super_team: boolean;
  is_forecasted_team: boolean;
  parent_team_id?: string | null;
  months: {
    [month: number]: ForecastMonthData;
  };
}

export interface ForecastMatrixData {
  year: number;
  forecast_type: string;
  teams: TeamForecastRow[];
  monthly_totals: {
    [month: number]: {
      total_revenue: number;
      total_bookings: number;
      total_gp_dollars: number;
    };
  };
  lock_settings: ForecastLockSettings[];
}

export interface CreateForecastRequest {
  team_id: string;
  year: number;
  month: number;
  forecast_type?: 'manual' | 'predictive' | 'adjusted';
  forecasted_revenue?: number | null;
  forecasted_bookings?: number | null;
  forecasted_gp_dollars?: number | null;
  forecasted_gp_percentage?: number | null;
  confidence_level?: number | null;
  notes?: string | null;
}

export interface BulkForecastRequest {
  forecasts: CreateForecastRequest[];
}

export interface LockForecastRequest {
  year: number;
  month: number;
  is_locked: boolean;
  team_ids?: string[];
}

export interface ForecastFilters {
  year?: number;
  month?: number;
  team_id?: string;
  forecast_type?: string;
}

// Confidence level constants
export const CONFIDENCE_LEVELS = {
  1: 'Very Low',
  2: 'Low', 
  3: 'Medium',
  4: 'High',
  5: 'Very High'
} as const;

export type ConfidenceLevel = keyof typeof CONFIDENCE_LEVELS;

// Month constants
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

export const MONTH_ABBR = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
] as const;

// Forecast type constants
export const FORECAST_TYPES = {
  manual: 'Manual',
  predictive: 'Predictive',
  adjusted: 'Adjusted'
} as const; 