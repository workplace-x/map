import { useEffect, useRef, useState, useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card } from '@/components/ui/card'
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
// @ts-ignore
import myTheme from '/src/AGGridTheme.js'
import { RowStyleModule, TooltipModule } from 'ag-grid-community'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { useCustomers, useCustomersBulkList } from '@/hooks/api-hooks'
import type { CustomerSummary, CustomerListParams } from '@/types'
import { RefreshCw, Search } from 'lucide-react'

// Set AG Grid Enterprise license key
LicenseManager.setLicenseKey(import.meta.env.VITE_AG_GRID_LICENSE_KEY)

// Register all needed AG Grid Enterprise modules (if not already registered)
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
  IntegratedChartsModule.with(AgChartsEnterpriseModule),
  RowStyleModule,
  TooltipModule
])

const PAGE_SIZE = 1000

// Add a mapping for human-friendly column headers
const headerMap: Record<string, string> = {
  hds_customer_id: 'Customer ID',
  organization_id: 'Organization',
  company_code: 'Company Code',
  customer_no: 'Customer No',
  customerNo: 'Customer No',
  customer_sort_key: 'Sort Key',
  name: 'Name',
  customerName: 'Customer Name',
  address_id: 'Address ID',
  contact_attention: 'Contact Attention',
  phone_country_code: 'Phone Country',
  phone_no: 'Phone No',
  formatted_phone_no: 'Formatted Phone',
  phone_extension: 'Phone Ext',
  fax_country_code: 'Fax Country',
  fax_no: 'Fax No',
  formatted_fax_no: 'Formatted Fax',
  fax_extension: 'Fax Ext',
  salesperson_id: 'Salesperson ID',
  collector_agent_code: 'Collector Agent',
  tax_authority_code: 'Tax Authority',
  customer_terms_code: 'Terms Code',
  statement_indicator: 'Statement?',
  dunning_messages: 'Dunning Messages?',
  finance_indicator: 'Finance?',
  sic_code: 'SIC Code',
  duns_number: 'DUNS Number',
  date_added: 'Date Added',
  credit_limit: 'Credit Limit',
  date_last_payment: 'Last Payment',
  date_last_purchase: 'Last Purchase',
  largest_bal_date: 'Largest Bal Date',
  largest_bal_amount: 'Largest Bal Amount',
  a_r_open_total: 'A/R Open Total',
  prior_year_sales: 'Prior Year Sales',
  d__b_rating: 'D&B Rating',
  delivery_indicator: 'Delivery?',
  bill_complete_ind: 'Bill Complete?',
  cus_po_required: 'PO Required?',
  disguise_indicator: 'Disguise?',
  cust_ack_indicator: 'Cust Ack?',
  cus_ack_type: 'Ack Type',
  osr_type: 'OSR Type',
  email_invoices: 'Email Invoices?',
  sap_id_id: 'SAP ID',
  legal_name: 'Legal Name',
  objectkey: 'Object Key',
  created_on: 'Created On',
  updated_on: 'Updated On',
  process_id: 'Process ID',
  contact_email: 'Contact Email',
  totalSell: 'Total Sales',
  totalMargin: 'Total Margin',
  sell12mo: '12mo Sales',
  margin12mo: '12mo Margin',
  marginPct: 'Margin %',
  marginPct12mo: '12mo Margin %',
  lastUpdated: 'Last Updated',
};

function toStartCase(str: string) {
  return str.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

// Define standard columns to show by default
const standardColumns = [
  'customerName',
  'customerNo',
  'totalSell',
  'totalMargin',
  'marginPct',
  'sell12mo',
  'margin12mo',
  'marginPct12mo',
  'salesperson_virtual',
];

// Money formatter for currency columns
const currencyFormatter = (params: any) => {
  if (typeof params.value === 'number') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(params.value);
  }
  return params.value;
};

// Percentage formatter
const percentageFormatter = (params: any) => {
  if (typeof params.value === 'number') {
    return `${params.value.toFixed(1)}%`;
  }
  return params.value;
};

// Add a custom cell renderer for the salesperson column
const salespersonCellRenderer = (params: any) => {
  const isHouse = params.data?.is_house_account;
  const name = params.data?.salesperson_name || params.data?.house_team_name || '';
  const avatarUrl = params.data?.salesperson_avatar_url || '';
  
  if (isHouse) {
    // Show house icon and team name
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.2em', lineHeight: 1 }}>🏠</span>
        <span>{name}</span>
      </span>
    );
  }
  
  // Default: show user avatar and name
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Avatar className='h-6 w-6'>
        <AvatarImage src={avatarUrl} alt={name} />
        <AvatarFallback>{name ? name[0] : '?'}</AvatarFallback>
      </Avatar>
      <span>{name}</span>
    </span>
  );
};

// Navigate to customer analysis
const customerActionRenderer = (params: any) => {
  const customerNo = params.data?.customerNo || params.data?.customer_no;
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        // Navigate to customer analysis page
        window.open(`/customers/${customerNo}/analysis`, '_blank');
      }}
    >
      Analyze
    </Button>
  );
};

export default function Customers() {
  const [search, setSearch] = useState('')
  const [searchParams, setSearchParams] = useState<CustomerListParams>({ limit: PAGE_SIZE, offset: 0 })
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const gridApiRef = useRef<any>(null)
  const gridColumnApiRef = useRef<any>(null)
  const [columnDefs, setColumnDefs] = useState<any[]>([])

  // Use the new bulk list API for better performance
  const {
    data: response,
    isLoading,
    error,
    refetch
  } = useCustomersBulkList(searchParams);

  // Extract customers data and pagination info from the response
  const customers = response?.data || [];
  const pagination = (response as any)?.pagination; // Cast to any to handle type mismatch

  // Load All Customers function
  const loadAllCustomers = () => {
    setSearchParams({
      ...searchParams,
      limit: 20000, // Set a very high limit to get all customers
      offset: 0
    });
  };

  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 120,
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  // Initialize column definitions
  useEffect(() => {
    if (customers.length > 0 && columnDefs.length === 0) {
      // Build columns based on the data structure
      const sampleCustomer = customers[0];
      const baseCols = Object.keys(sampleCustomer)
        .filter(key => !['salesperson_name', 'salesperson_avatar_url', 'is_house_account', 'house_team_name'].includes(key))
        .map(key => {
          const colDef: any = {
                headerName: headerMap[key] || toStartCase(key),
                field: key,
                hide: !standardColumns.includes(key),
          };

          // Add formatters for currency and percentage columns
          if (['totalSell', 'totalMargin', 'sell12mo', 'margin12mo'].includes(key)) {
            colDef.cellRenderer = currencyFormatter;
            colDef.type = 'numericColumn';
          } else if (['marginPct', 'marginPct12mo'].includes(key)) {
            colDef.cellRenderer = percentageFormatter;
            colDef.type = 'numericColumn';
          }

          return colDef;
        });

            // Insert Salesperson column after Customer No
      const customerNoIdx = baseCols.findIndex(col => col.field === 'customerNo');
            const salespersonCol = {
              headerName: 'Salesperson',
        field: 'salesperson_virtual',
              cellRenderer: salespersonCellRenderer,
              hide: false,
        sortable: false,
        filter: false,
      };

      // Add Actions column
      const actionsCol = {
        headerName: 'Actions',
        field: 'actions',
        cellRenderer: customerActionRenderer,
        hide: false,
        sortable: false,
        filter: false,
        pinned: 'right',
        width: 100,
            };

            const colsWithSalesperson = [
              ...baseCols.slice(0, customerNoIdx + 1),
              salespersonCol,
        ...baseCols.slice(customerNoIdx + 1),
        actionsCol,
            ];

            setColumnDefs(colsWithSalesperson);
          }
  }, [customers, columnDefs.length]);

  // Handle grid ready
  const onGridReady = (params: any) => {
    gridApiRef.current = params.api;
    gridColumnApiRef.current = params.columnApi;
  }

  // Handle search submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    
    const newParams: CustomerListParams = {
      ...searchParams,
      q: search.trim() || undefined,
      offset: 0, // Reset to first page
    };
    
    setSearchParams(newParams);
    setSearching(false);
  };

  // Handle pagination
  const loadNextPage = () => {
    if (pagination?.hasMore) {
      setSearchParams({
        ...searchParams,
        offset: pagination.offset + pagination.limit
      });
    }
  };

  const loadPreviousPage = () => {
    if (pagination && pagination.offset > 0) {
      setSearchParams({
        ...searchParams,
        offset: Math.max(0, pagination.offset - pagination.limit)
      });
    }
  };

  const goToPage = (page: number) => {
    const newOffset = page * PAGE_SIZE;
    setSearchParams({
      ...searchParams,
      offset: newOffset
    });
  };

  // Handle error display
  useEffect(() => {
    if (error) {
      toast.error(`Failed to load customers: ${error.message}`);
    }
  }, [error]);

  // Clear search
  const clearSearch = () => {
    setSearch('');
    setSearchParams({ limit: PAGE_SIZE, offset: 0 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-8">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                Customers
              </h1>
              <p className="text-gray-600 text-lg">Browse and search your customer list with sales analytics</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <ThemeSwitch />
                <ProfileDropdown />
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="bg-blue-50/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/60">
            <form onSubmit={handleSubmit} className="flex gap-3 items-center">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-12 px-6 text-base rounded-2xl border border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/90 backdrop-blur-sm placeholder-gray-400 shadow-sm"
                  placeholder="Search customer name or number..."
                  autoComplete="off"
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !search.trim()}
                className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-2xl"
              >
                {isLoading && searching ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search
              </Button>
              {search && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearSearch}
                  className="h-12 px-4 rounded-2xl bg-white/80 hover:bg-white border-gray-200"
                >
                  Clear
                </Button>
              )}
              <Button
                onClick={() => refetch()}
                variant="outline"
                disabled={isLoading}
                className="h-12 px-4 rounded-2xl bg-white/80 hover:bg-white border-gray-200"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={loadAllCustomers}
                variant="outline"
                disabled={isLoading}
                className="h-12 px-6 rounded-2xl bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800"
              >
                Load All ({pagination?.total || '16,518'})
              </Button>
            </form>
          </div>
        </div>

        {/* Results Info */}
        {(isLoading || customers.length > 0) && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/40">
            <div className="flex items-center justify-between text-sm text-gray-600">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Loading customers...
                </span>
              ) : (
                <span>
                  Showing {customers.length} customer{customers.length !== 1 ? 's' : ''}
                  {search && ` for "${search}"`}
                </span>
              )}
              <span className="text-xs text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}

        {/* Modern Data Grid Container */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className="p-6">
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
                rowData={customers}
                defaultColDef={defaultColDef}
                animateRows={true}
                rowModelType='clientSide'
                pagination={true}
                paginationPageSize={PAGE_SIZE}
                sideBar={{
                  toolPanels: [
                    'columns',
                    'filters',
                  ],
                  defaultToolPanel: undefined,
                }}
                loadingOverlayComponentParams={{ loadingMessage: 'Loading customers...' }}
                overlayLoadingTemplate={isLoading ? '<span class="ag-overlay-loading-center">Loading customers...</span>' : undefined}
                overlayNoRowsTemplate='<span class="ag-overlay-loading-center">No customers found. Try adjusting your search.</span>'
                onGridReady={onGridReady}
                suppressRowClickSelection={true}
                rowSelection={'multiple'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 