import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { azureAdAuth } from './azureAdClient';
import {
  ApiResponse,
  PaginatedResponse,
  CustomerSummary,
  CustomerAnalysis,
  CustomerListParams,
  VendorSummary,
  VendorAnalysis,
  VendorListParams,
  Order,
  Quote,
  OrderMargin,
  Salesperson,
  Profile,
  ProfileListParams,
  UserRole,
  Team,
  Approval,
  ApprovalRequest,
  ApprovalDecision,
  ApprovalFilter,
  LeaderboardEntry,
  UpdateRoleRequest,
  UpdateMappingRequest,
  AddMappingRequest,
  RemoveMappingRequest,
  CreateTeamRequest,
  UpdateTeamRequest,
  AddTeamMembersRequest,
  User,
  Chat,
  ChatMessage,
  Document,
  Form,
  FormSubmission,
  HealthStatus
} from '../types';

// API Configuration
const getBaseUrl = () => {
  if (import.meta.env.DEV) {
    // In development, use empty string to make all URLs relative (goes through Vite proxy)
    return '';
  } else {
    // In production, use the full API URL
    return import.meta.env.VITE_API_URL || '';
  }
};

const API_BASE_URL = getBaseUrl();

class MapApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth and request IDs
    this.client.interceptors.request.use(
      async (config) => {
        // Add auth token if available
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data,
          requestId: error.config?.headers['X-Request-ID']
        });
        return Promise.reject(error);
      }
    );
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      // Use Azure AD authentication instead of Supabase
      const token = await azureAdAuth.getAccessToken();
      return token;
    } catch (error) {
      console.error('Error getting Azure AD auth token:', error);
      return null;
    }
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.request(config);
    return response.data;
  }

  // Health and System endpoints
  health = {
    check: () => this.request<HealthStatus>({ method: 'GET', url: '/health' }),
    ready: () => this.request<HealthStatus>({ method: 'GET', url: '/ready' }),
    metrics: () => this.request<string>({ method: 'GET', url: '/metrics' }),
  };

  // User and Authentication
  auth = {
    me: () => this.request<User>({ method: 'GET', url: '/api/me' }),
  };

  // Customer Management
  customers = {
    list: (params?: CustomerListParams) => 
      this.request<PaginatedResponse<CustomerSummary[]>>({
        method: 'GET',
        url: '/api/customers',
        params
      }),
    
    // Lightweight customer index for caching (all customers, minimal data)
    index: () =>
      this.request<{
        data: Array<{
          customer_no: string;
          name: string;
          last_transaction_date: string;
          lifecycle_stage: string;
          customer_tier: string;
          salesperson_id?: string;
        }>;
        metadata: {
          total_count: number;
          generated_at: string;
          cache_ttl: number;
          fields: string[];
        };
      }>({
        method: 'GET',
        url: '/api/customers/index'
      }),
    
    getAnalysis: (customerNo: string) =>
      this.request<CustomerAnalysis>({
        method: 'GET',
        url: `/api/customers/${customerNo}/analysis`
      }),
    
    bulkList: (params?: { q?: string; limit?: number; offset?: number }) =>
      this.request<PaginatedResponse<CustomerSummary[]>>({
        method: 'GET',
        url: '/api/customers/bulk-list',
        params
      }),
    
    bulkLookup: (customerNos: string[]) =>
      this.request<CustomerSummary[]>({
        method: 'POST',
        url: '/api/customers/bulk-list-by-ids',
        data: { customerNos }
      }),
    
    get: (id: string) =>
      this.request<CustomerSummary>({
        method: 'GET', 
        url: `/api/customers/${id}`
      }),
    
    create: (data: Partial<CustomerSummary>) =>
      this.request<CustomerSummary>({
        method: 'POST',
        url: '/api/customers',
        data
      }),
    
    update: (id: string, data: Partial<CustomerSummary>) =>
      this.request<CustomerSummary>({
        method: 'PUT',
        url: `/api/customers/${id}`,
        data
      }),
    
    delete: (id: string) =>
      this.request<void>({
        method: 'DELETE',
        url: `/api/customers/${id}`
      })
  };

  // Vendor Management
  vendors = {
    index: () =>
      this.request<{
        data: Array<{
          vendor_no: string;
          name: string;
          last_transaction_date: string;
          lifecycle_stage: string;
          vendor_tier: string;
          lifetime_spend: number;
        }>;
        metadata: {
          total_count: number;
          generated_at: string;
          cache_duration: number;
        };
      }>({
        method: 'GET',
        url: '/api/vendors/index'
      }),
    
    bulkList: (params?: { q?: string; limit?: number; offset?: number }) =>
      this.request<PaginatedResponse<VendorSummary[]>>({
        method: 'GET',
        url: '/api/vendors/bulk-list',
        params
      }),
    
    bulkListByIds: (vendorNos: string[]) =>
      this.request<VendorSummary[]>({
        method: 'POST',
        url: '/api/vendors/bulk-list-by-ids',
        data: { vendorNos }
      }),
    
    get: (id: string) =>
      this.request<VendorSummary>({
        method: 'GET',
        url: `/api/vendors/${id}`
      }),
    
    create: (data: Partial<VendorSummary>) =>
      this.request<VendorSummary>({
        method: 'POST',
        url: '/api/vendors',
        data
      }),
    
    update: (id: string, data: Partial<VendorSummary>) =>
      this.request<VendorSummary>({
        method: 'PUT',
        url: `/api/vendors/${id}`,
        data
      }),
    
    delete: (id: string) =>
      this.request<void>({
        method: 'DELETE',
        url: `/api/vendors/${id}`
      })
  };

  // Orders and Quotes
  orders = {
    getMargin: (orderNo: number) =>
      this.request<OrderMargin>({
        method: 'GET',
        url: `/api/orders/${orderNo}/margin`
      }),
    
    getActive: (salesperson_id: string) =>
      this.request<Order[]>({
        method: 'GET',
        url: '/api/orders/active',
        params: { salesperson_id }
      })
  };

  quotes = {
    getActive: (salesperson_id: string) =>
      this.request<Quote[]>({
        method: 'GET',
        url: '/api/quotes/active',
        params: { salesperson_id }
      })
  };

  // Salespeople
  salespeople = {
    list: () => this.request<Salesperson[]>({ method: 'GET', url: '/api/salespeople' })
  };

  // Leaderboards and Analytics
  leaderboards = {
    bookingsSales: () => 
      this.request<LeaderboardEntry[]>({
        method: 'GET',
        url: '/api/bookings-leaderboard-sales-this-month'
      }),
    
    bookingsGP: () =>
      this.request<LeaderboardEntry[]>({
        method: 'GET',
        url: '/api/bookings-leaderboard-gp-this-month'
      }),
    
    invoicesSales: () =>
      this.request<LeaderboardEntry[]>({
        method: 'GET',
        url: '/api/invoices-leaderboard-sales-this-month'
      }),
    
    invoicesGP: () =>
      this.request<LeaderboardEntry[]>({
        method: 'GET',
        url: '/api/invoices-leaderboard-gp-this-month'
      })
  };

  // Totals
  totals = {
    invoicedThisMonth: () =>
      this.request<{ total: number; comparison_total?: number; percentage_change?: number }>({
        method: 'GET',
        url: '/api/total-invoiced-this-month'
      }),
    
    invoicedThisYear: () =>
      this.request<{ total: number; comparison_total?: number; percentage_change?: number }>({
        method: 'GET',
        url: '/api/total-invoiced-this-year'
      })
  };

  // Dashboard Analytics
  dashboard = {
    monthlyTrends: () =>
      this.request<Array<{ month: string; sales: number; margin: number; bookings: number }>>({
        method: 'GET',
        url: '/api/monthly-trends'
      }),
    
    activityFeed: () =>
      this.request<Array<{
        id: string;
        type: 'success' | 'info' | 'warning';
        message: string;
        timestamp: Date;
        details: string;
      }>>({
        method: 'GET',
        url: '/api/activity-feed'
      })
  };

  // Margin Analysis
  marginAnalysis = {
    getAnalysis: (params?: {
      period?: string;
      low_margin_only?: boolean;
      high_risk_only?: boolean;
      sales_team_only?: boolean;
      salesperson_id?: string;
      customer_no?: string;
      vendor_no?: string;
      real_time?: boolean;
      include_predictions?: boolean;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.period) queryParams.append('period', params.period);
      if (params?.low_margin_only) queryParams.append('low_margin_only', 'true');
      if (params?.high_risk_only) queryParams.append('high_risk_only', 'true');
      if (params?.sales_team_only) queryParams.append('sales_team_only', 'true');
      if (params?.salesperson_id) queryParams.append('salesperson_id', params.salesperson_id);
      if (params?.customer_no) queryParams.append('customer_no', params.customer_no);
      if (params?.vendor_no) queryParams.append('vendor_no', params.vendor_no);
      if (params?.real_time) queryParams.append('real_time', 'true');
      if (params?.include_predictions) queryParams.append('include_predictions', 'true');
      
      return this.request<any>({
        method: 'GET',
        url: `/api/margin-analysis?${queryParams.toString()}`
      });
    },

    getMarginTrends: (params?: {
      period?: string;
      granularity?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.period) queryParams.append('period', params.period);
      if (params?.granularity) queryParams.append('granularity', params.granularity);
      
      return this.request<{
        trends: Array<{
          month: string;
          period: string;
          total_sell: number;
          total_cost: number;
          margin_value: number;
          margin_pct: number;
          order_count: number;
        }>;
        period: string;
        granularity: string;
      }>({
        method: 'GET',
        url: `/api/margin-analysis/margin-trends?${queryParams.toString()}`
      });
    },

    getTopPerformers: (params?: {
      period?: string;
      metric?: string;
      limit?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.period) queryParams.append('period', params.period);
      if (params?.metric) queryParams.append('metric', params.metric);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      
      return this.request<{
        performers: Array<{
          salesperson_id: string;
          salesperson_name: string;
          total_sell: number;
          total_cost: number;
          margin_value: number;
          margin_pct: number;
          order_count: number;
        }>;
        period: string;
        metric: string;
        total_performers: number;
      }>({
        method: 'GET',
        url: `/api/margin-analysis/top-performers?${queryParams.toString()}`
      });
    },

    getMarginBreakdown: (params?: {
      period?: string;
      breakdown_by?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.period) queryParams.append('period', params.period);
      if (params?.breakdown_by) queryParams.append('breakdown_by', params.breakdown_by);
      
      return this.request<any>({
        method: 'GET',
        url: `/api/margin-analysis/margin-breakdown?${queryParams.toString()}`
      });
    },

    getAlerts: (params?: {
      active_only?: boolean;
      severity?: string;
      team_id?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.active_only) queryParams.append('active_only', 'true');
      if (params?.severity) queryParams.append('severity', params.severity);
      if (params?.team_id) queryParams.append('team_id', params.team_id);
      
      return this.request<Array<any>>({
        method: 'GET',
        url: `/api/margin-analysis/alerts?${queryParams.toString()}`
      });
    }
  };

  // Admin - User Management
  admin = {
    listProfiles: (params?: ProfileListParams) =>
      this.request<{
        profiles: Profile[];
        userRoles: UserRole[];
        teamMembers: any[];
        mappings: any[];
        totalCount: number;
      }>({
        method: 'GET',
        url: '/api/admin/profiles',
        params
      }),
    
    updateRole: (request: UpdateRoleRequest) =>
      this.request<{ success: boolean }>({
        method: 'POST',
        url: '/api/admin/update-role',
        data: request
      }),
    
    updateMapping: (request: UpdateMappingRequest) =>
      this.request<{ success: boolean }>({
        method: 'POST',
        url: '/api/admin/update-mapping',
        data: request
      }),
    
    addMapping: (request: AddMappingRequest) =>
      this.request<{ success: boolean }>({
        method: 'POST',
        url: '/api/admin/add-mapping',
        data: request
      }),
    
    removeMapping: (request: RemoveMappingRequest) =>
      this.request<{ success: boolean }>({
        method: 'DELETE',
        url: '/api/admin/remove-mapping',
        data: request
      }),
    
    deleteProfile: (profileId: string) =>
      this.request<{ success: boolean }>({
        method: 'DELETE',
        url: `/api/admin/profiles/${profileId}`
      })
  };

  // Team Management
  teams = {
    list: () => this.request<Team[]>({ method: 'GET', url: '/api/teams' }),
    
    create: (request: CreateTeamRequest) =>
      this.request<{ team: Team }>({
        method: 'POST',
        url: '/api/teams',
        data: request
      }),
    
    update: (id: string, request: UpdateTeamRequest) =>
      this.request<{ team: Team }>({
        method: 'PATCH',
        url: `/api/teams/${id}`,
        data: request
      }),
    
    delete: (id: string) =>
      this.request<{ success: boolean }>({
        method: 'DELETE',
        url: `/api/teams/${id}`
      }),
    
    addMembers: (id: string, request: AddTeamMembersRequest) =>
      this.request<{ success: boolean }>({
        method: 'POST',
        url: `/api/teams/${id}/members`,
        data: request
      }),
    
    removeMember: (teamId: string, userId: string) =>
      this.request<{ success: boolean }>({
        method: 'DELETE',
        url: `/api/teams/${teamId}/members/${userId}`
      }),
    
    getMyTeam: () =>
      this.request<{ team: Team | null; members: any[] }>({
        method: 'GET',
        url: '/api/my-team'
      }),
    
    getWithMembers: () =>
      this.request<Team[]>({
        method: 'GET',
        url: '/api/teams-with-members'
      })
  };

  // Approval Workflows
  approvals = {
    submit: (request: ApprovalRequest) =>
      this.request<Approval>({
        method: 'POST',
        url: '/api/approvals',
        data: request
      }),
    
    list: (filter?: ApprovalFilter) =>
      this.request<Approval[]>({
        method: 'GET',
        url: '/api/approvals',
        params: filter
      }),
    
    decide: (id: string, decision: ApprovalDecision) =>
      this.request<Approval>({
        method: 'POST',
        url: `/api/approvals/${id}/decision`,
        data: decision
      })
  };

  // RFP-GPT and Chat Features
  rfpGpt = {
    ask: (data: { question: string; context?: string }) =>
      this.request<{ answer: string; citations: any[] }>({
        method: 'POST',
        url: '/api/rfp-gpt/ask',
        data
      }),
    
    upload: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return this.request<{ message: string; chunks: number; document: any }>({
        method: 'POST',
        url: '/api/rfp-gpt/upload',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    
    getUploadStatus: (id: string) =>
      this.request<{ status: string; chunks?: number; error_message?: string }>({
        method: 'GET',
        url: `/api/rfp-gpt/upload/status/${id}`
      })
  };

  // Chat Management
  chats = {
    list: () => this.request<Chat[]>({ method: 'GET', url: '/api/chats' }),
    
    create: (data: { message?: string; is_rfp_specific?: boolean; title?: string }) =>
      this.request<Chat>({
        method: 'POST',
        url: '/api/chats',
        data
      }),
    
    getMessages: (chatId: string) =>
      this.request<ChatMessage[]>({
        method: 'GET',
        url: `/api/chats/${chatId}/messages`
      }),
    
    addMessage: (chatId: string, message: Partial<ChatMessage>) =>
      this.request<{ user: ChatMessage; assistant: ChatMessage }>({
        method: 'POST',
        url: `/api/chats/${chatId}/messages`,
        data: message
      }),
    
    updateMessage: (chatId: string, messageId: string, content: string) =>
      this.request<{ message: string; updated: ChatMessage }>({
        method: 'PATCH',
        url: `/api/chats/${chatId}/messages/${messageId}`,
        data: { content }
      }),
    
    deleteMessage: (chatId: string, messageId: string) =>
      this.request<{ message: string }>({
        method: 'DELETE',
        url: `/api/chats/${chatId}/messages/${messageId}`
      })
  };

  // Documents
  documents = {
    list: () => this.request<Document[]>({ method: 'GET', url: '/api/documents' }),
    
    get: (id: string) =>
      this.request<Document>({
        method: 'GET',
        url: `/api/documents/${id}`
      }),
    
    delete: (id: string) =>
      this.request<{ message: string }>({
        method: 'DELETE',
        url: `/api/documents/${id}`
      })
  };

  // Forms
  forms = {
    list: () => this.request<Form[]>({ method: 'GET', url: '/api/forms' }),
    
    get: (id: string) =>
      this.request<Form>({
        method: 'GET',
        url: `/api/forms/${id}`
      }),
    
    create: (data: Partial<Form>) =>
      this.request<Form>({
        method: 'POST',
        url: '/api/forms',
        data
      }),
    
    update: (id: string, data: Partial<Form>) =>
      this.request<Form>({
        method: 'PUT',
        url: `/api/forms/${id}`,
        data
      }),
    
    delete: (id: string) =>
      this.request<{ message: string }>({
        method: 'DELETE',
        url: `/api/forms/${id}`
      }),
    
    submit: (id: string, data: any) =>
      this.request<FormSubmission>({
        method: 'POST',
        url: `/api/forms/${id}/submit`,
        data
      })
  };

  // Ingestion Metrics
  ingestionMetrics = {
    list: () =>
      this.request<{ logs: any[] }>({
        method: 'GET',
        url: '/api/ingestion-metrics'
      })
  };

  // Customer drill-down methods
  async getCustomerOverview(customerNo: string) {
    return this.request({
      method: 'GET',
      url: `/customers/${customerNo}/overview`
    });
  }

  async getCustomerQuotes(customerNo: string, params?: { limit?: number; offset?: number }) {
    return this.request({
      method: 'GET',
      url: `/customers/${customerNo}/quotes`,
      params
    });
  }

  async getCustomerOrders(customerNo: string, params?: { limit?: number; offset?: number }) {
    return this.request({
      method: 'GET',
      url: `/customers/${customerNo}/orders`,
      params
    });
  }

  async getCustomerInvoices(customerNo: string, params?: { limit?: number; offset?: number }) {
    return this.request({
      method: 'GET',
      url: `/customers/${customerNo}/invoices`,
      params
    });
  }

  async getQuoteLines(quoteNo: string) {
    return this.request({
      method: 'GET',
      url: `/quotes/${quoteNo}/lines`
    });
  }

  async getOrderLines(orderNo: string) {
    return this.request({
      method: 'GET',
      url: `/orders/${orderNo}/lines`
    });
  }

  async getInvoiceLines(invoiceNo: string) {
    return this.request({
      method: 'GET',
      url: `/invoices/${invoiceNo}/lines`
    });
  }
}

// Create and export singleton instance
export const apiClient = new MapApiClient();
export default apiClient;

type BasicApiResponse<T> = {
  data?: T
  error?: string
  message?: string
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T = any>(
  url: string,
  options: RequestOptions = {},
  accessToken?: string
): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_URL || 'https://tangram-marketing-functions.azurewebsites.net'
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`

  const headers: Record<string, string> = {
    ...options.headers
  }

  // Only set Content-Type to application/json if body is not FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const config: RequestInit = {
    method: options.method || 'GET',
    headers,
    credentials: 'include'
  }

  if (options.body && options.method !== 'GET') {
    if (options.body instanceof FormData) {
      // For FormData, pass it directly and let the browser set Content-Type
      config.body = options.body
    } else {
      // For other types, stringify to JSON
      config.body = typeof options.body === 'string' 
        ? options.body 
        : JSON.stringify(options.body)
    }
  }

  try {
    const response = await fetch(fullUrl, config)
    
    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `API call failed: ${response.statusText}`
      
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.message || errorJson.error || errorMessage
      } catch {
        // Use the response status text if JSON parsing fails
      }
      
      throw new ApiError(errorMessage, response.status, response)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }
    
    return await response.text() as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function uploadFileWithProgress(
  url: string,
  file: File,
  onProgress?: (progress: number) => void,
  accessToken?: string
): Promise<any> {
  const baseUrl = import.meta.env.VITE_API_URL || 'https://tangram-marketing-functions.azurewebsites.net'
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('file', file)

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = (e.loaded / e.total) * 100
        onProgress(progress)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response)
        } catch {
          resolve(xhr.responseText)
        }
      } else {
        reject(new ApiError(`Upload failed: ${xhr.statusText}`, xhr.status))
      }
    })

    xhr.addEventListener('error', () => {
      reject(new ApiError('Upload failed: Network error'))
    })

    xhr.open('POST', fullUrl)
    
    if (accessToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
    }
    
    xhr.send(formData)
  })
} 