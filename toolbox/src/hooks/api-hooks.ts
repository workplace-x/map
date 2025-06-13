import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { 
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

// Query Keys
export const queryKeys = {
  health: ['health'] as const,
  user: ['user'] as const,
  customers: {
    all: ['customers'] as const,
    list: (params?: CustomerListParams) => ['customers', 'list', params] as const,
    bulkList: (params?: any) => ['customers', 'bulk-list', params] as const,
    analysis: (customerNo: string) => ['customers', 'analysis', customerNo] as const,
  },
  vendors: {
    all: ['vendors'] as const,
    list: (params?: VendorListParams) => ['vendors', 'list', params] as const,
    analysis: (vendorNo: string) => ['vendors', 'analysis', vendorNo] as const,
  },
  orders: {
    all: ['orders'] as const,
    margin: (orderNo: number) => ['orders', 'margin', orderNo] as const,
    active: (salespersonId: string) => ['orders', 'active', salespersonId] as const,
  },
  quotes: {
    all: ['quotes'] as const,
    active: (salespersonId: string) => ['quotes', 'active', salespersonId] as const,
  },
  salespeople: ['salespeople'] as const,
  leaderboards: {
    all: ['leaderboards'] as const,
    bookingsSales: ['leaderboards', 'bookings-sales'] as const,
    bookingsGP: ['leaderboards', 'bookings-gp'] as const,
    invoicesSales: ['leaderboards', 'invoices-sales'] as const,
    invoicesGP: ['leaderboards', 'invoices-gp'] as const,
  },
  totals: {
    all: ['totals'] as const,
    invoicedThisMonth: ['totals', 'invoiced-this-month'] as const,
    invoicedThisYear: ['totals', 'invoiced-this-year'] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    monthlyTrends: ['dashboard', 'monthly-trends'] as const,
    activityFeed: ['dashboard', 'activity-feed'] as const,
  },
  marginAnalysis: {
    all: ['margin-analysis'] as const,
    analysis: (params?: any) => ['margin-analysis', 'analysis', params] as const,
    trends: (params?: any) => ['margin-analysis', 'trends', params] as const,
    performers: (params?: any) => ['margin-analysis', 'performers', params] as const,
    breakdown: (params?: any) => ['margin-analysis', 'breakdown', params] as const,
    alerts: (params?: any) => ['margin-analysis', 'alerts', params] as const,
  },
  admin: {
    all: ['admin'] as const,
    profiles: (params?: ProfileListParams) => ['admin', 'profiles', params] as const,
  },
  teams: {
    all: ['teams'] as const,
    list: ['teams', 'list'] as const,
    withMembers: ['teams', 'with-members'] as const,
    myTeam: ['teams', 'my-team'] as const,
  },
  approvals: {
    all: ['approvals'] as const,
    list: (filter?: ApprovalFilter) => ['approvals', 'list', filter] as const,
  },
  chats: {
    all: ['chats'] as const,
    list: ['chats', 'list'] as const,
    messages: (chatId: string) => ['chats', 'messages', chatId] as const,
  },
  documents: {
    all: ['documents'] as const,
    list: ['documents', 'list'] as const,
    detail: (id: string) => ['documents', 'detail', id] as const,
  },
  forms: {
    all: ['forms'] as const,
    list: ['forms', 'list'] as const,
    detail: (id: string) => ['forms', 'detail', id] as const,
  },
  ingestionMetrics: ['ingestion-metrics'] as const,
} as const;

// Health and System Hooks
export const useHealth = () => {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: apiClient.health.check,
    refetchInterval: 30000, // Check every 30 seconds
  });
};

// User Hooks
export const useUser = () => {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: apiClient.auth.me,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Customer Hooks
export const useCustomers = (params?: CustomerListParams) => {
  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: () => apiClient.customers.list(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCustomersBulkList = (params?: { q?: string; limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: queryKeys.customers.bulkList(params),
    queryFn: async () => {
      const response = await apiClient.customers.bulkList(params);
      return response; // Return the full paginated response
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useCustomerAnalysis = (customerNo: string) => {
  return useQuery({
    queryKey: queryKeys.customers.analysis(customerNo),
    queryFn: () => apiClient.customers.getAnalysis(customerNo),
    enabled: !!customerNo,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCustomersBulkLookup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.customers.bulkLookup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
};

export const useCustomerIndex = () => {
  return useQuery({
    queryKey: ['customer-index'],
    queryFn: () => apiClient.customers.index(),
    staleTime: 1000 * 60 * 60, // 1 hour cache as per API
    gcTime: 1000 * 60 * 60, // 1 hour garbage collection
    refetchOnWindowFocus: false, // Don't refetch on window focus since data is cached
  });
};

// Vendor Hooks
export const useVendors = (params?: VendorListParams) => {
  return useQuery({
    queryKey: queryKeys.vendors.list(params),
    queryFn: () => apiClient.vendors.bulkList(params),
    staleTime: 2 * 60 * 1000,
  });
};

export const useVendorAnalysis = (vendorNo: string) => {
  return useQuery({
    queryKey: queryKeys.vendors.analysis(vendorNo),
    queryFn: () => apiClient.vendors.get(vendorNo),
    enabled: !!vendorNo,
    staleTime: 5 * 60 * 1000,
  });
};

export const useVendorsBulkLookup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.vendors.bulkListByIds,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
    },
  });
};

export const useVendorIndex = () => {
  return useQuery({
    queryKey: ['vendor-index'],
    queryFn: () => apiClient.vendors.index(),
    staleTime: 1000 * 60 * 60, // 1 hour cache as per API
    gcTime: 1000 * 60 * 60, // 1 hour garbage collection
    refetchOnWindowFocus: false, // Don't refetch on window focus since data is cached
  });
};

export const useVendorsBulkList = (params?: { limit?: number; offset?: number; q?: string }) => {
  return useQuery({
    queryKey: ['vendors-bulk-list', params],
    queryFn: () => apiClient.vendors.bulkList(params),
    enabled: true, // Always enabled since we want to fetch visible vendors
  });
};

// Order and Quote Hooks
export const useOrderMargin = (orderNo: number) => {
  return useQuery({
    queryKey: queryKeys.orders.margin(orderNo),
    queryFn: () => apiClient.orders.getMargin(orderNo),
    enabled: !!orderNo,
    staleTime: 5 * 60 * 1000,
  });
};

export const useActiveOrders = (salespersonId: string) => {
  return useQuery({
    queryKey: queryKeys.orders.active(salespersonId),
    queryFn: () => apiClient.orders.getActive(salespersonId),
    enabled: !!salespersonId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useActiveQuotes = (salespersonId: string) => {
  return useQuery({
    queryKey: queryKeys.quotes.active(salespersonId),
    queryFn: () => apiClient.quotes.getActive(salespersonId),
    enabled: !!salespersonId,
    staleTime: 2 * 60 * 1000,
  });
};

// Salespeople Hooks
export const useSalespeople = () => {
  return useQuery({
    queryKey: queryKeys.salespeople,
    queryFn: apiClient.salespeople.list,
    staleTime: 10 * 60 * 1000, // 10 minutes - rarely changes
  });
};

// Leaderboard Hooks
export const useLeaderboardBookingsSales = () => {
  return useQuery({
    queryKey: queryKeys.leaderboards.bookingsSales,
    queryFn: apiClient.leaderboards.bookingsSales,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};

export const useLeaderboardBookingsGP = () => {
  return useQuery({
    queryKey: queryKeys.leaderboards.bookingsGP,
    queryFn: apiClient.leaderboards.bookingsGP,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
};

export const useLeaderboardInvoicesSales = () => {
  return useQuery({
    queryKey: queryKeys.leaderboards.invoicesSales,
    queryFn: apiClient.leaderboards.invoicesSales,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
};

export const useLeaderboardInvoicesGP = () => {
  return useQuery({
    queryKey: queryKeys.leaderboards.invoicesGP,
    queryFn: apiClient.leaderboards.invoicesGP,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
};

// Totals Hooks
export const useTotalInvoicedThisMonth = () => {
  return useQuery({
    queryKey: queryKeys.totals.invoicedThisMonth,
    queryFn: apiClient.totals.invoicedThisMonth,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });
};

export const useTotalInvoicedThisYear = () => {
  return useQuery({
    queryKey: queryKeys.totals.invoicedThisYear,
    queryFn: apiClient.totals.invoicedThisYear,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};

// Add new hook for yearly bookings that uses the working endpoint
export const useTotalBookedThisYear = () => {
  return useQuery({
    queryKey: ['totals', 'bookedThisYear'],
    queryFn: async () => {
      const response = await fetch('/api/total-booked-this-year');
      if (!response.ok) {
        throw new Error('Failed to fetch yearly bookings');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};

// Add new hook for yesterday's bookings
export const useTotalBookedYesterday = () => {
  return useQuery({
    queryKey: ['totals', 'bookedYesterday'],
    queryFn: async () => {
      const response = await fetch('/api/total-booked-yesterday');
      if (!response.ok) {
        throw new Error('Failed to fetch yesterday bookings');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};

// Add new hook for this week's bookings
export const useTotalBookedThisWeek = () => {
  return useQuery({
    queryKey: ['totals', 'bookedThisWeek'],
    queryFn: async () => {
      const response = await fetch('/api/total-booked-this-week');
      if (!response.ok) {
        throw new Error('Failed to fetch this week bookings');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};

// Add new hook for monthly bookings
export const useTotalBookedThisMonth = () => {
  return useQuery({
    queryKey: ['totals', 'bookedThisMonth'],
    queryFn: async () => {
      const response = await fetch('/api/total-booked-this-month');
      if (!response.ok) {
        throw new Error('Failed to fetch monthly bookings');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};

// Add new hook for yesterday's invoices
export const useTotalInvoicedYesterday = () => {
  return useQuery({
    queryKey: ['totals', 'invoicedYesterday'],
    queryFn: async () => {
      const response = await fetch('/api/total-invoiced-yesterday');
      if (!response.ok) {
        throw new Error('Failed to fetch yesterday invoices');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};

// Add new hook for weekly invoicing
export const useTotalInvoicedThisWeek = () => {
  return useQuery({
    queryKey: ['totals', 'invoicedThisWeek'],
    queryFn: async () => {
      const response = await fetch('/api/total-invoiced-this-week');
      if (!response.ok) {
        throw new Error('Failed to fetch weekly invoices');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};

// Dashboard Analytics Hooks
export const useMonthlyTrends = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.monthlyTrends,
    queryFn: apiClient.dashboard.monthlyTrends,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000, // Refresh every 15 minutes
  });
};

export const useActivityFeed = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.activityFeed,
    queryFn: apiClient.dashboard.activityFeed,
    staleTime: 1 * 60 * 1000, // 1 minute - activity feed should be fresh
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });
};

// Admin Hooks
export const useAdminProfiles = (params?: ProfileListParams) => {
  return useQuery({
    queryKey: queryKeys.admin.profiles(params),
    queryFn: () => apiClient.admin.listProfiles(params),
    staleTime: 2 * 60 * 1000,
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.admin.updateRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      toast.success('User role updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update user role: ${error.response?.data?.error || error.message}`);
    },
  });
};

export const useUpdateUserMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.admin.updateMapping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      toast.success('User mapping updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update user mapping: ${error.response?.data?.error || error.message}`);
    },
  });
};

export const useAddUserMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.admin.addMapping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      toast.success('User mapping added successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to add user mapping: ${error.response?.data?.error || error.message}`);
    },
  });
};

export const useRemoveUserMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.admin.removeMapping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      toast.success('User mapping removed successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to remove user mapping: ${error.response?.data?.error || error.message}`);
    },
  });
};

export const useDeleteProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.admin.deleteProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      toast.success('Profile deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete profile: ${error.response?.data?.error || error.message}`);
    },
  });
};

// Team Hooks
export const useTeams = () => {
  return useQuery({
    queryKey: queryKeys.teams.list,
    queryFn: apiClient.teams.list,
    staleTime: 5 * 60 * 1000,
  });
};

export const useTeamsWithMembers = () => {
  return useQuery({
    queryKey: queryKeys.teams.withMembers,
    queryFn: apiClient.teams.getWithMembers,
    staleTime: 2 * 60 * 1000,
  });
};

export const useMyTeam = () => {
  return useQuery({
    queryKey: queryKeys.teams.myTeam,
    queryFn: apiClient.teams.getMyTeam,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.teams.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
      toast.success('Team created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create team: ${error.response?.data?.error || error.message}`);
    },
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateTeamRequest) =>
      apiClient.teams.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
      toast.success('Team updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update team: ${error.response?.data?.error || error.message}`);
    },
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.teams.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
      toast.success('Team deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete team: ${error.response?.data?.error || error.message}`);
    },
  });
};

export const useAddTeamMembers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & AddTeamMembersRequest) =>
      apiClient.teams.addMembers(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
      toast.success('Team members added successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to add team members: ${error.response?.data?.error || error.message}`);
    },
  });
};

export const useRemoveTeamMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      apiClient.teams.removeMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
      toast.success('Team member removed successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to remove team member: ${error.response?.data?.error || error.message}`);
    },
  });
};

// Approval Hooks
export const useApprovals = (filter?: ApprovalFilter) => {
  return useQuery({
    queryKey: queryKeys.approvals.list(filter),
    queryFn: () => apiClient.approvals.list(filter),
    staleTime: 1 * 60 * 1000, // 1 minute - approvals change frequently
  });
};

export const useSubmitApproval = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.approvals.submit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
      toast.success('Approval request submitted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to submit approval: ${error.response?.data?.error || error.message}`);
    },
  });
};

export const useDecideApproval = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...decision }: { id: string } & ApprovalDecision) =>
      apiClient.approvals.decide(id, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
      toast.success('Approval decision recorded successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to record approval decision: ${error.response?.data?.error || error.message}`);
    },
  });
};

// Chat Hooks
export const useChats = () => {
  return useQuery({
    queryKey: queryKeys.chats.list,
    queryFn: apiClient.chats.list,
    staleTime: 2 * 60 * 1000,
  });
};

export const useChatMessages = (chatId: string) => {
  return useQuery({
    queryKey: queryKeys.chats.messages(chatId),
    queryFn: () => apiClient.chats.getMessages(chatId),
    enabled: !!chatId,
    staleTime: 30 * 1000, // 30 seconds - chat messages update frequently
  });
};

export const useCreateChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.chats.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
    },
    onError: (error: any) => {
      toast.error(`Failed to create chat: ${error.response?.data?.error || error.message}`);
    },
  });
};

export const useAddChatMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, ...message }: { chatId: string } & Partial<ChatMessage>) =>
      apiClient.chats.addMessage(chatId, message),
    onSuccess: (data, { chatId }) => {
      // Optimistically update the messages list
      queryClient.setQueryData(queryKeys.chats.messages(chatId), (old: ChatMessage[] = []) => [
        ...old,
        data.user,
        data.assistant,
      ]);
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
    },
    onError: (error: any) => {
      toast.error(`Failed to send message: ${error.response?.data?.error || error.message}`);
    },
  });
};

export const useUpdateChatMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, messageId, content }: { chatId: string; messageId: string; content: string }) =>
      apiClient.chats.updateMessage(chatId, messageId, content),
    onSuccess: (data, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.messages(chatId) });
      toast.success('Message updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update message: ${error.response?.data?.error || error.message}`);
    },
  });
};

export const useDeleteChatMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, messageId }: { chatId: string; messageId: string }) =>
      apiClient.chats.deleteMessage(chatId, messageId),
    onSuccess: (data, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.messages(chatId) });
      toast.success('Message deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete message: ${error.response?.data?.error || error.message}`);
    },
  });
};

// RFP-GPT Hooks
export const useRfpGptAsk = () => {
  return useMutation({
    mutationFn: apiClient.rfpGpt.ask,
    onError: (error: any) => {
      toast.error(`Failed to get answer: ${error.response?.data?.error || error.message}`);
    },
  });
};

export const useRfpGptUpload = () => {
  return useMutation({
    mutationFn: apiClient.rfpGpt.upload,
    onSuccess: () => {
      toast.success('Document uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to upload document: ${error.response?.data?.error || error.message}`);
    },
  });
};

export const useRfpGptUploadStatus = (id: string) => {
  return useQuery({
    queryKey: ['rfp-gpt', 'upload-status', id],
    queryFn: () => apiClient.rfpGpt.getUploadStatus(id),
    enabled: !!id,
    refetchInterval: 5000, // Poll every 5 seconds
  });
};

// Documents Hooks
export const useDocuments = () => {
  return useQuery({
    queryKey: queryKeys.documents.list,
    queryFn: apiClient.documents.list,
    staleTime: 2 * 60 * 1000,
  });
};

export const useDocument = (id: string) => {
  return useQuery({
    queryKey: queryKeys.documents.detail(id),
    queryFn: () => apiClient.documents.get(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.documents.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      toast.success('Document deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete document: ${error.response?.data?.error || error.message}`);
    },
  });
};

// Forms Hooks
export const useForms = () => {
  return useQuery({
    queryKey: queryKeys.forms.list,
    queryFn: apiClient.forms.list,
    staleTime: 5 * 60 * 1000,
  });
};

export const useForm = (id: string) => {
  return useQuery({
    queryKey: queryKeys.forms.detail(id),
    queryFn: () => apiClient.forms.get(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateForm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.forms.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.all });
      toast.success('Form created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create form: ${error.response?.data?.error || error.message}`);
    },
  });
};

export const useUpdateForm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Form>) =>
      apiClient.forms.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.all });
      toast.success('Form updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update form: ${error.response?.data?.error || error.message}`);
    },
  });
};

export const useDeleteForm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.forms.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.all });
      toast.success('Form deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete form: ${error.response?.data?.error || error.message}`);
    },
  });
};

export const useSubmitForm = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.forms.submit(id, data),
    onSuccess: () => {
      toast.success('Form submitted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to submit form: ${error.response?.data?.error || error.message}`);
    },
  });
};

// Ingestion Metrics Hooks
export const useIngestionMetrics = () => {
  return useQuery({
    queryKey: queryKeys.ingestionMetrics,
    queryFn: apiClient.ingestionMetrics.list,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 10 * 1000, // Refresh every 10 seconds for real-time monitoring
  });
};

// Margin Analysis Hooks
export const useMarginAnalysis = (params?: {
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
  return useQuery({
    queryKey: queryKeys.marginAnalysis.analysis(params),
    queryFn: () => apiClient.marginAnalysis.getAnalysis(params),
    staleTime: params?.real_time ? 30 * 1000 : 5 * 60 * 1000, // 30 seconds for real-time, 5 minutes otherwise
    refetchInterval: params?.real_time ? 60 * 1000 : 10 * 60 * 1000, // 1 minute for real-time, 10 minutes otherwise
  });
};

export const useMarginTrends = (params?: {
  period?: string;
  granularity?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.marginAnalysis.trends(params),
    queryFn: () => apiClient.marginAnalysis.getMarginTrends(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 15 * 60 * 1000, // Refresh every 15 minutes
  });
};

export const useMarginTopPerformers = (params?: {
  period?: string;
  metric?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: queryKeys.marginAnalysis.performers(params),
    queryFn: () => apiClient.marginAnalysis.getTopPerformers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });
};

export const useMarginBreakdown = (params?: {
  period?: string;
  breakdown_by?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.marginAnalysis.breakdown(params),
    queryFn: () => apiClient.marginAnalysis.getMarginBreakdown(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });
};

export const useMarginAlerts = (params?: {
  active_only?: boolean;
  severity?: string;
  team_id?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.marginAnalysis.alerts(params),
    queryFn: () => apiClient.marginAnalysis.getAlerts(params),
    staleTime: 1 * 60 * 1000, // 1 minute - alerts should be fresh
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });
}; 