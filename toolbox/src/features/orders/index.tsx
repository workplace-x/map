import { useEffect, useState, useMemo } from 'react'
import { ModernPageLayout, ModernCard, ModernStatusBar } from '@/components/layout/modern-page-layout'
import { AgGridReact } from 'ag-grid-react'
import { LicenseManager, ModuleRegistry } from 'ag-grid-enterprise'
import {
  ClientSideRowModelModule,
  ServerSideRowModelModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  SetFilterModule,
  MultiFilterModule,
  RangeSelectionModule,
  RichSelectModule,
  PaginationModule,
  RowSelectionModule,
  TextFilterModule,
  CellStyleModule,
  ValidationModule,
  MenuModule,
  ClipboardModule,
  ExcelExportModule,
  MasterDetailModule,
  RowGroupingModule,
  AggregationModule,
  ColumnMenuModule,
  StatusBarModule,
  SideBarModule,
  TextEditorModule,
  IntegratedChartsModule
} from 'ag-grid-enterprise'
import { AgChartsEnterpriseModule } from 'ag-charts-enterprise'
import 'ag-grid-enterprise'
import 'ag-grid-enterprise/styles/ag-theme-quartz.css'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons'
import { Users, Filter, Download, RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { azureApiClient } from '@/lib/azure-api-client'
import { toast } from 'sonner'

// Set AG Grid Enterprise license key
LicenseManager.setLicenseKey(import.meta.env.VITE_AG_GRID_LICENSE_KEY)

// Register AG Grid modules
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ServerSideRowModelModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  SetFilterModule,
  MultiFilterModule,
  RangeSelectionModule,
  RichSelectModule,
  PaginationModule,
  RowSelectionModule,
  TextFilterModule,
  CellStyleModule,
  ValidationModule,
  MenuModule,
  ClipboardModule,
  ExcelExportModule,
  MasterDetailModule,
  RowGroupingModule,
  AggregationModule,
  ColumnMenuModule,
  StatusBarModule,
  SideBarModule,
  TextEditorModule,
  IntegratedChartsModule.with(AgChartsEnterpriseModule)
])

interface Salesperson {
  salesperson_id: string
  name: string
}

interface Order {
  quote_no: string
  order_title: string
  customer_name: string
  salesperson_name: string
  date_created: string
  total_sell: number
  total_cost: number
  overall_margin_pct: number
  low_margin_line_count: number
  status: string
}

// Custom cell renderer for margin percentage
const marginCellRenderer = (params: any) => {
  const value = Number(params.value);
  const isGood = value >= 20;
  
  return (
    <div className={cn(
      "flex items-center gap-2 font-semibold",
      isGood ? "text-green-600" : "text-red-600"
    )}>
      <span>{isGood ? '✔' : '✖'}</span>
      <span>{value.toFixed(2)}%</span>
    </div>
  );
};

// Custom cell renderer for action links
const actionCellRenderer = (params: any) => (
  <Button
    variant="link"
    size="sm"
    className="h-auto p-0 text-blue-600 hover:text-blue-800"
    onClick={() => window.open(`/margin-analysis?order=${params.value}`, '_blank')}
  >
    View Margin
  </Button>
);

// Format currency
const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return '$0'
  return value.toLocaleString('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

export default function Orders() {
  const { user, loading: userLoading } = useAuth()
  const [rowData, setRowData] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSalespeople, setSelectedSalespeople] = useState<Salesperson[]>([])
  const [salespersonOptions, setSalespersonOptions] = useState<Salesperson[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalValue = rowData.reduce((sum, order) => sum + (order.total_sell || 0), 0)
    const lowMarginOrders = rowData.filter(order => order.overall_margin_pct < 20).length
    const avgMargin = rowData.length > 0 
      ? rowData.reduce((sum, order) => sum + (order.overall_margin_pct || 0), 0) / rowData.length
      : 0

    return {
      totalOrders: rowData.length,
      totalValue,
      lowMarginOrders,
      avgMargin
    }
  }, [rowData])

  // Fetch all ERP salespeople from Supabase
  useEffect(() => {
    const fetchSalespeople = async () => {
      try {
        const { data, error } = await supabase
          .from('ods_hds_salesperson')
          .select('salesperson_id, name')
          .order('name');
        
        if (error) throw error;
        setSalespersonOptions(data || []);
      } catch (err) {
        console.error('Failed to fetch salespeople:', err);
        toast.error('Failed to load salespeople');
      }
    };

    fetchSalespeople();
  }, [])

  // Set default selectedSalespeople to all user's mapped ERP Salespeople
  useEffect(() => {
    const setDefaultSalespeople = async () => {
      if (salespersonOptions.length > 0) {
        try {
          // Get user ID from Supabase session for consistency
          const { data: { session } } = await supabase.auth.getSession();
          const userId = session?.user?.id;
          
          if (!userId) {
            console.warn('No authenticated user found');
            return;
          }
          
          const { data, error } = await supabase
            .from('user_account_mapping')
            .select('erp_salesperson_id')
            .eq('supabase_user_id', userId);
          
          if (error) throw error;
          
          const erpMappings = (data || []).filter(row => row.erp_salesperson_id);
          const defaultSalespeople = salespersonOptions.filter(sp =>
            erpMappings.some(m => m.erp_salesperson_id === sp.salesperson_id)
          );
          setSelectedSalespeople(defaultSalespeople);
        } catch (err) {
          console.error('Failed to load user mappings:', err);
        }
      }
    };

    setDefaultSalespeople();
  }, [salespersonOptions])

  // Fetch orders when salespeople selection changes
  const fetchOrders = async () => {
    if (!selectedSalespeople.length) {
      setRowData([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const ids = selectedSalespeople.map(sp => sp.salesperson_id).join(',');
      
      // Use proper auth headers for API calls
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`/api/orders/active?salesperson_id=${encodeURIComponent(ids)}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      setRowData(data);
      setLastUpdated(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load orders';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedSalespeople])

  // AG Grid column definitions
  const columnDefs = useMemo(() => [
    { 
      headerName: 'Order Title', 
      field: 'order_title' as keyof Order, 
      sortable: true, 
      filter: true, 
      minWidth: 240,
      flex: 2
    },
    { 
      headerName: 'Order #', 
      field: 'quote_no' as keyof Order, 
      sortable: true, 
      filter: true,
      minWidth: 120
    },
    { 
      headerName: 'Customer Name', 
      field: 'customer_name' as keyof Order, 
      sortable: true, 
      filter: true,
      minWidth: 200
    },
    { 
      headerName: 'Salesperson', 
      field: 'salesperson_name' as keyof Order, 
      sortable: true, 
      filter: true,
      minWidth: 150
    },
    { 
      headerName: 'Date Created', 
      field: 'date_created' as keyof Order, 
      sortable: true, 
      filter: true,
      valueFormatter: (params: any) => new Date(params.value).toLocaleDateString(),
      minWidth: 120
    },
    { 
      headerName: 'Total Sell', 
      field: 'total_sell' as keyof Order, 
      sortable: true, 
      filter: true,
      valueFormatter: (params: any) => params.value != null 
        ? `$${Number(params.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : '',
      minWidth: 130,
      type: 'numericColumn'
    },
    {
      headerName: 'Overall Margin > 20%',
      field: 'overall_margin_pct' as keyof Order,
      cellRenderer: marginCellRenderer,
      minWidth: 150,
      sortable: true,
      filter: true,
      type: 'numericColumn'
    },
    { 
      headerName: 'Low Margin Lines', 
      field: 'low_margin_line_count' as keyof Order, 
      sortable: true, 
      filter: true,
      minWidth: 130,
      type: 'numericColumn'
    },
    { 
      headerName: 'Status', 
      field: 'status' as keyof Order, 
      sortable: true, 
      filter: true,
      minWidth: 100
    },
    {
      headerName: 'Actions',
      field: 'quote_no' as keyof Order,
      cellRenderer: actionCellRenderer,
      minWidth: 120,
      sortable: false,
      filter: false,
      pinned: 'right' as const
    },
  ] as any[], []);

  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 100,
    resizable: true,
  }), []);

  // Toggle salesperson selection
  const toggleSalesperson = (salesperson: Salesperson) => {
    setSelectedSalespeople(prev => {
      const isSelected = prev.some(sp => sp.salesperson_id === salesperson.salesperson_id);
      if (isSelected) {
        return prev.filter(sp => sp.salesperson_id !== salesperson.salesperson_id);
      } else {
        return [...prev, salesperson];
      }
    });
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedSalespeople([]);
  };

  if (userLoading) {
    return (
      <ModernPageLayout
        title="Orders"
        description="Loading your orders..."
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading orders...</p>
          </div>
        </div>
      </ModernPageLayout>
    );
  }

  return (
    <ModernPageLayout
      title="Orders"
      description="Browse and analyze your active orders with margin insights"
      showRefresh
      onRefresh={fetchOrders}
      refreshLoading={loading}
      statusInfo={{
        text: error ? "Data Issues" : "System Healthy",
        status: error ? "error" : "healthy"
      }}
      actions={
        <Button variant="outline" size="sm" className="bg-white/60 hover:bg-white border-gray-200 shadow-sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      }
      headerContent={
        <div className="bg-blue-50/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/60">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                <Filter className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Filter by Salesperson</h3>
                <p className="text-sm text-gray-600">Select salespeople to view their orders</p>
              </div>
            </div>

            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isFilterOpen}
                  className="min-w-[200px] justify-between bg-white/80 hover:bg-white border-gray-200"
                >
                  {selectedSalespeople.length === 0
                    ? "Select salespeople..."
                    : `${selectedSalespeople.length} selected`}
                  <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search salespeople..." />
                  <CommandList>
                    <CommandEmpty>No salespeople found.</CommandEmpty>
                    <CommandGroup>
                      {salespersonOptions.map((salesperson) => {
                        const isSelected = selectedSalespeople.some(
                          sp => sp.salesperson_id === salesperson.salesperson_id
                        );
                        return (
                          <CommandItem
                            key={salesperson.salesperson_id}
                            onSelect={() => toggleSalesperson(salesperson)}
                          >
                            <div className="flex items-center space-x-2">
                              <div className={cn(
                                "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible"
                              )}>
                                <CheckIcon className="h-4 w-4" />
                              </div>
                              <span>{salesperson.name}</span>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
                {selectedSalespeople.length > 0 && (
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelections}
                      className="w-full"
                    >
                      Clear All
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Selected salespeople badges */}
          {selectedSalespeople.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedSalespeople.map((salesperson) => (
                <Badge
                  key={salesperson.salesperson_id}
                  variant="secondary"
                  className="cursor-pointer bg-white/80 hover:bg-white border-gray-200"
                  onClick={() => toggleSalesperson(salesperson)}
                >
                  {salesperson.name}
                  <span className="ml-1 text-xs">×</span>
                </Badge>
              ))}
            </div>
          )}
        </div>
      }
    >
      {/* Summary KPI Cards */}
      {rowData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/60 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-white/70 backdrop-blur-sm text-blue-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{summaryStats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200/60 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-white/70 backdrop-blur-sm text-emerald-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Value</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(summaryStats.totalValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200/60 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-white/70 backdrop-blur-sm text-red-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Low Margin Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{summaryStats.lowMarginOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200/60 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-white/70 backdrop-blur-sm text-purple-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Avg Margin</p>
                  <p className="text-3xl font-bold text-gray-900">{summaryStats.avgMargin.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-red-50/50 backdrop-blur-sm rounded-2xl p-6 border border-red-200/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Orders</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modern Data Grid Container */}
      <ModernCard>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Orders List</h3>
            <p className="text-sm text-gray-600">
              {rowData.length > 0 ? `Showing ${rowData.length} orders` : 'No orders found'}
            </p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          )}
        </div>

        <style>{`
          .shadow-quartz {
            box-shadow: 0 2px 16px 0 rgba(44, 62, 80, 0.08), 0 1.5px 4px 0 rgba(44, 62, 80, 0.04);
          }
          .bg-quartz-light {
            background: #f8fafc;
          }
          .ag-theme-quartz .ag-cell, .ag-theme-quartz .ag-header-cell-label {
            font-size: 0.75rem !important;
          }
        `}</style>
        
        <div className='ag-theme-quartz shadow-quartz bg-quartz-light' style={{ width: '100%', borderRadius: '1rem', overflow: 'visible', height: '70vh' }}>
          <AgGridReact
            columnDefs={columnDefs}
            rowData={rowData}
            defaultColDef={defaultColDef}
            animateRows={true}
            pagination={true}
            paginationPageSize={25}
            paginationPageSizeSelector={[15, 25, 50, 100]}
            sideBar={{
              toolPanels: [
                'columns',
                'filters',
              ],
              defaultToolPanel: undefined,
            }}
            loadingOverlayComponentParams={{ loadingMessage: 'Loading orders...' }}
            overlayLoadingTemplate={loading ? '<span class="ag-overlay-loading-center">Loading orders...</span>' : undefined}
            overlayNoRowsTemplate='<span class="ag-overlay-loading-center">No orders found for selected salespeople.</span>'
            suppressRowClickSelection={true}
            rowSelection={'multiple'}
          />
        </div>
      </ModernCard>

      {/* Modern Status Bar */}
      <ModernStatusBar 
        items={[
          { label: "Last Updated", value: lastUpdated.toLocaleTimeString(), status: "active" },
          { label: "Selected Salespeople", value: selectedSalespeople.length.toString() },
          { label: "Total Orders", value: rowData.length.toString() },
          { label: "Data Source", value: "Live API", status: "active" }
        ]}
      />
    </ModernPageLayout>
  )
} 