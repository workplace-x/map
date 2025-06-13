// Import shared types from the backend
export type {
  User,
  Chat,
  ChatMessage,
  Document,
  Form,
  FormSubmission,
  ApiResponse,
  PaginatedResponse,
  HealthStatus,
  Chunk,
  IntentType,
  ProposalSection
} from '@map-dev/utils';

// Base pagination params type
export interface PaginationParams {
  limit?: number;
  offset?: number;
  q?: string;
}

// Frontend-specific types
export interface CustomerSummary {
  customerNo: string;
  customerName: string;
  totalSell: number;
  totalMargin: number;
  marginPct: number;
  sell12mo?: number;
  margin12mo?: number;
  marginPct12mo?: number;
  lowMarginLineCount?: number;
  overall_margin_pct?: number;
  lifetime_revenue?: number;
  lifetime_margin?: number;
  lifetime_margin_pct?: number;
  revenue_12mo?: number;
  margin_12mo_pct?: number;
  lifecycle_stage?: string;
  customer_tier?: string;
  churn_risk?: string;
  salesperson_name?: string;
  salesperson_avatar_url?: string;
  is_house_account?: boolean;
  house_team_name?: string;
  lastUpdated?: string;
  quote_no?: string | number;
  order_title?: string;
  date_created?: string;
  status?: string;
  customer_name?: string;
  low_margin_line_count?: number;
}

export interface CustomerAnalysis {
  customerNo: string;
  customerName: string;
  totalSell: number;
  totalMargin: number;
  totalCost: number;
  avgMargin: number;
  sell12mo: number;
  margin12mo: number;
  cost12mo: number;
  avgMargin12mo: number;
  yearly: YearlyData[];
  monthly: MonthlyData[];
  invoiceLines: InvoiceLine[];
}

export interface VendorSummary {
  vendorNo: string;
  vendorName: string;
  vendorType?: string;
  vendorStatus?: string;
  // Financial analytics
  lifetime_spend: number;
  spend_12mo: number;
  avg_order_value: number;
  // Performance analytics
  total_orders: number;
  orders_12mo: number;
  order_frequency: number;
  // Risk analytics
  item_diversity: number;
  customer_diversity: number;
  spend_volatility: number;
  // Classifications
  vendor_tier: string;
  performance_level: string;
  dependency_risk: string;
  lifecycle_stage: string;
  // Dates
  last_transaction_date?: string;
  last_order_date?: string;
  // Legacy compatibility
  totalSell: number;
  totalMargin: number;
}

export interface VendorAnalysis {
  vendorNo: string;
  vendorName: string;
  totalSell: number;
  totalMargin: number;
  totalCost: number;
  avgMargin: number;
  sell12mo: number;
  margin12mo: number;
  cost12mo: number;
  avgMargin12mo: number;
  yearly: YearlyData[];
  monthly: MonthlyData[];
  orderLines: OrderLine[];
}

export interface YearlyData {
  year: string;
  sell: number;
  margin: number;
  cost: number;
}

export interface MonthlyData {
  month: string;
  sell: number;
  margin: number;
  cost: number;
}

export interface InvoiceLine {
  id: string;
  customer_no: string;
  unit_sell: number;
  unit_cost: number;
  quantity_invoiced: number;
  invoice_date: string;
  customer_name?: string;
}

export interface OrderLine {
  id: string;
  vendor_no: string;
  unit_sell: number;
  unit_cost: number;
  qty_ordered: number;
  order_date: string;
  vendor_name?: string;
}

export interface Order {
  order_no: number;
  quote_no: number;
  order_title: string;
  customer_name: string;
  salesperson_name: string;
  date_created: string;
  status: string;
  total_sell: number;
  total_cost: number;
  overall_margin_pct: number;
  low_margin_line_count: number;
}

export interface Quote extends Order {
  // Quotes have the same structure as orders
}

export interface OrderMargin {
  order_no: number;
  customer_name: string;
  customer_no: string;
  salesperson_name: string;
  order_title: string;
  totalCost: number;
  totalSell: number;
  orderMargin: number;
  orderMarginPct: number;
  lines: OrderLineWithMargin[];
}

export interface OrderLineWithMargin {
  id: string;
  unit_sell: number;
  unit_cost: number;
  qty_ordered: number;
  margin_pct: number;
  vendor_name?: string;
}

export interface Salesperson {
  id: string;
  name: string;
}

export interface Profile {
  AzureID: string;
  email: string;
  name: string;
  user_id: string;
  jobtitle?: string;
  department?: string;
  accountenabled: boolean;
}

export interface UserRole {
  supabase_user_id: string;
  role: 'admin' | 'executive' | 'manager' | 'user';
}

export interface TeamMember {
  team_id: string;
  azure_id: string;
}

export interface UserMapping {
  azure_id: string;
  erp_salesperson_id?: string;
  salesforce_user_id?: string;
}

export interface Team {
  id: string;
  name: string;
  leader_user_id?: string;
  parent_team_id?: string;
  house_account_erp_id?: string;
  house_account_salesforce_id?: string;
  members?: TeamMemberProfile[];
}

export interface TeamMemberProfile {
  id: string;
  name: string;
  email: string;
  jobtitle?: string;
  department?: string;
}

export interface Approval {
  id: string;
  order_no: string;
  requested_by: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  manager_comment?: string;
  created_at: string;
}

export interface ApprovalRequest {
  order_no: string;
  requested_by: string;
}

export interface ApprovalDecision {
  status: 'approved' | 'rejected';
  reviewed_by: string;
  manager_comment?: string;
}

export interface LeaderboardEntry {
  salesperson_id: string;
  salesperson_name: string;
  value: number;
}

// API-specific types
export interface CustomerListParams {
  q?: string;
  limit?: number;
  offset?: number;
  lifecycle_stage?: string;
  customer_tier?: string;
}

export interface VendorListParams {
  q?: string;
  limit?: number;
  offset?: number;
  lifecycle_stage?: string;
  vendor_tier?: string;
}

export interface ProfileListParams extends PaginationParams {
  role?: string;
  department?: string;
  enabled?: 'enabled' | 'disabled';
  search?: string;
}

export interface ApprovalFilter {
  user_id?: string;
  role?: 'sales' | 'manager' | 'admin';
  status?: 'pending' | 'approved' | 'rejected';
}

// Form types for API calls
export interface UpdateRoleRequest {
  userId: string;
  newRole: 'admin' | 'executive' | 'manager' | 'user';
}

export interface UpdateMappingRequest {
  azureId: string;
  teamIds?: string[];
  erpSalespersonIds?: string[];
  salesforceUserIds?: string[];
}

export interface AddMappingRequest {
  azureId: string;
  erpSalespersonId?: string;
  salesforceUserId?: string;
}

export interface RemoveMappingRequest {
  azureId: string;
  erpSalespersonId?: string;
  salesforceUserId?: string;
}

export interface CreateTeamRequest {
  name: string;
  leader_user_id: string;
}

export interface UpdateTeamRequest {
  name?: string;
  leader_user_id?: string;
  parent_team_id?: string;
  house_account_erp_id?: string;
  house_account_salesforce_id?: string;
}

export interface AddTeamMembersRequest {
  user_ids: string[];
} 