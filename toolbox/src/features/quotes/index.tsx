import { useEffect, useState, useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
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
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons'
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

interface Quote {
  quote_no: string
  order_title: string
  customer_name: string
  salesperson_name: string
  date_created: string
  total_sell: number
  total_cost: number
  overall_margin_pct: number
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
    className="h-auto p-0 text-primary"
    onClick={() => window.open(`/margin-analysis?order=${params.value}`, '_blank')}
  >
    View Margin
  </Button>
);

export default function Quotes() {
  const { user, loading: userLoading } = useAuth()
  const [rowData, setRowData] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSalespeople, setSelectedSalespeople] = useState<Salesperson[]>([])
  const [salespersonOptions, setSalespersonOptions] = useState<Salesperson[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)

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

  // Fetch quotes when salespeople selection changes
  useEffect(() => {
    const fetchQuotes = async () => {
      if (!selectedSalespeople.length) {
        setRowData([]);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const ids = selectedSalespeople.map(sp => sp.salesperson_id).join(',');
        
        // Use API client instead of direct fetch for proper auth handling
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('Not authenticated');
        }
        
        const response = await fetch(`/api/quotes/active?salesperson_id=${encodeURIComponent(ids)}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch quotes');
        }
        
        const data = await response.json();
        setRowData(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load quotes';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, [selectedSalespeople])

  // AG Grid column definitions
  const columnDefs = useMemo(() => [
    { 
      headerName: 'Order Title', 
      field: 'order_title' as keyof Quote, 
      sortable: true, 
      filter: true, 
      minWidth: 240,
      flex: 2
    },
    { 
      headerName: 'Order #', 
      field: 'quote_no' as keyof Quote, 
      sortable: true, 
      filter: true,
      minWidth: 120
    },
    { 
      headerName: 'Customer Name', 
      field: 'customer_name' as keyof Quote, 
      sortable: true, 
      filter: true,
      minWidth: 200
    },
    { 
      headerName: 'Salesperson', 
      field: 'salesperson_name' as keyof Quote, 
      sortable: true, 
      filter: true,
      minWidth: 150
    },
    { 
      headerName: 'Date Created', 
      field: 'date_created' as keyof Quote, 
      sortable: true, 
      filter: true,
      valueFormatter: (params: any) => new Date(params.value).toLocaleDateString(),
      minWidth: 120
    },
    { 
      headerName: 'Total Sell', 
      field: 'total_sell' as keyof Quote, 
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
      field: 'overall_margin_pct' as keyof Quote,
      cellRenderer: marginCellRenderer,
      minWidth: 150,
      sortable: true,
      filter: true,
      type: 'numericColumn'
    },
    {
      headerName: 'Actions',
      field: 'quote_no' as keyof Quote,
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
      <>
        <Header fixed>
          <div className='ml-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading...</p>
            </div>
          </div>
        </Main>
      </>
    );
  }

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Active Quotes</h2>
            <p className='text-muted-foreground'>Browse and search your quotes list.</p>
          </div>
          
          {/* Salesperson Filter */}
          <div className='flex gap-2 items-center'>
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isFilterOpen}
                  className="min-w-[200px] justify-between"
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
        </div>

        {/* Selected salespeople badges */}
        {selectedSalespeople.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedSalespeople.map((salesperson) => (
              <Badge
                key={salesperson.salesperson_id}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => toggleSalesperson(salesperson)}
              >
                {salesperson.name}
                <span className="ml-1 text-xs">×</span>
              </Badge>
            ))}
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mb-4 p-4 border border-destructive rounded-lg bg-destructive/10">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Results count */}
        {rowData.length > 0 && (
          <div className='mb-4 text-sm text-muted-foreground'>
            Showing {rowData.length} quote{rowData.length !== 1 ? 's' : ''}
          </div>
        )}

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
        
        <div className='ag-theme-quartz shadow-quartz bg-quartz-light' style={{ width: '100%', borderRadius: '1rem', overflow: 'visible', height: '80vh' }}>
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
            loadingOverlayComponentParams={{ loadingMessage: 'Loading quotes...' }}
            overlayLoadingTemplate={loading ? '<span class="ag-overlay-loading-center">Loading quotes...</span>' : undefined}
            overlayNoRowsTemplate='<span class="ag-overlay-loading-center">No quotes found. Select salespeople to view their quotes.</span>'
            suppressRowClickSelection={true}
            rowSelection={'multiple'}
          />
        </div>
      </Main>
    </>
  )
} 