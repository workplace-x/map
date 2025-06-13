import { useRef, useState, useMemo, useEffect } from 'react'
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
import { Button } from '@/components/ui/button'
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

interface Vendor {
  vendorNo: string
  vendorName: string
  totalSell: number
  totalMargin: number
  sell12mo: number
  margin12mo: number
  marginPct: number
  marginPct12mo: number
  lastUpdated?: string
}

const PAGE_SIZE = 50

// Currency formatter
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

export default function Vendors() {
  const [search, setSearch] = useState('')
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const gridApiRef = useRef<any>(null)
  const gridColumnApiRef = useRef<any>(null)

  // AG Grid column definitions
  const columnDefs = useMemo(() => [
    { 
      headerName: 'Vendor Name', 
      field: 'vendorName' as keyof Vendor, 
      sortable: true, 
      filter: true,
      minWidth: 200,
      flex: 2
    },
    { 
      headerName: 'Vendor #', 
      field: 'vendorNo' as keyof Vendor, 
      sortable: true, 
      filter: true,
      minWidth: 120
    },
    { 
      headerName: 'Total Sell', 
      field: 'totalSell' as keyof Vendor, 
      sortable: true, 
      filter: true,
      cellRenderer: currencyFormatter,
      type: 'numericColumn',
      minWidth: 130
    },
    { 
      headerName: 'Total Margin', 
      field: 'totalMargin' as keyof Vendor, 
      sortable: true, 
      filter: true,
      cellRenderer: currencyFormatter,
      type: 'numericColumn',
      minWidth: 130
    },
    { 
      headerName: '12mo Sell', 
      field: 'sell12mo' as keyof Vendor, 
      sortable: true, 
      filter: true,
      cellRenderer: currencyFormatter,
      type: 'numericColumn',
      minWidth: 130
    },
    { 
      headerName: '12mo Margin', 
      field: 'margin12mo' as keyof Vendor, 
      sortable: true, 
      filter: true,
      cellRenderer: currencyFormatter,
      type: 'numericColumn',
      minWidth: 130
    },
    { 
      headerName: '12mo Margin %', 
      field: 'marginPct12mo' as keyof Vendor, 
      sortable: true, 
      filter: true,
      cellRenderer: percentageFormatter,
      type: 'numericColumn',
      minWidth: 120
    },
    { 
      headerName: 'Margin %', 
      field: 'marginPct' as keyof Vendor, 
      sortable: true, 
      filter: true,
      cellRenderer: percentageFormatter,
      type: 'numericColumn',
      minWidth: 120
    },
  ] as any[], [])

  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  // Fetch vendors with search
  const fetchVendors = async (searchQuery: string = '') => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `/api/vendors/bulk-list?limit=${PAGE_SIZE}&offset=0`;
      if (searchQuery.trim()) {
        url += `&q=${encodeURIComponent(searchQuery.trim())}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }
      
      const data = await response.json();
      setVendors(data || []);
        } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load vendors';
      setError(message);
      toast.error(message);
      setVendors([]);
        } finally {
          setLoading(false);
        }
  };

  // Initial load
  useEffect(() => {
    fetchVendors();
  }, []);

  // Handle search submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    fetchVendors(search).finally(() => setSearching(false));
  };

  // Clear search
  const clearSearch = () => {
    setSearch('');
    fetchVendors('');
  };

  // Handle grid ready
  const onGridReady = (params: any) => {
    gridApiRef.current = params.api;
    gridColumnApiRef.current = params.columnApi;
  }

  // Refresh data
  const handleRefresh = () => {
    fetchVendors(search);
  };

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
            <h2 className='text-2xl font-bold tracking-tight'>Vendors</h2>
            <p className='text-muted-foreground'>
              Browse and search your vendor list with sales analytics.
            </p>
          </div>
          <div className='flex gap-2 items-center'>
          <form
            onSubmit={handleSubmit}
              className='flex gap-2 items-center max-w-xl relative'
            autoComplete='off'
          >
            <input
              type='text'
              value={search}
              onChange={e => setSearch(e.target.value)}
              className='w-full pl-4 pr-4 py-2 rounded-full border border-gray-200 shadow focus:ring-ring focus:border-ring transition-all duration-200 text-base bg-white placeholder-gray-400'
              placeholder='Search vendor name or number...'
              autoComplete='off'
              disabled={loading}
            />
              <Button
              type='submit'
                disabled={loading || (!search.trim() && !searching)}
                className='px-5 py-2 rounded-full'
            >
              {loading && searching ? 'Loading...' : 'Search'}
              </Button>
              {search && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={clearSearch}
                  className='px-3 py-2 rounded-full'
                >
                  Clear
                </Button>
              )}
          </form>
            <Button
              onClick={handleRefresh}
              variant='outline'
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className='mb-4 text-center text-muted-foreground'>
            Loading vendors...
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mb-4 p-4 border border-destructive rounded-lg bg-destructive/10">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Results count */}
        {vendors.length > 0 && (
          <div className='mb-4 text-sm text-muted-foreground'>
            Showing {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
            {search && ` for "${search}"`}
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
            rowData={vendors}
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
            loadingOverlayComponentParams={{ loadingMessage: 'Loading vendors...' }}
            overlayLoadingTemplate={loading ? '<span class="ag-overlay-loading-center">Loading vendors...</span>' : undefined}
            overlayNoRowsTemplate='<span class="ag-overlay-loading-center">No vendors found. Try adjusting your search.</span>'
            onGridReady={onGridReady}
            suppressRowClickSelection={true}
            rowSelection={'multiple'}
          />
        </div>
      </Main>
    </>
  )
} 