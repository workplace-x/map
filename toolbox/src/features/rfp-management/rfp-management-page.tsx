import { useRef, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Download, Trash2 } from 'lucide-react'
import { RFPUploadDialog } from './components/rfp-upload-dialog'
import { AgGridReact } from 'ag-grid-react'
import { LicenseManager } from 'ag-grid-enterprise'
import 'ag-grid-enterprise'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import { ModuleRegistry } from 'ag-grid-community'
import { ClientSideRowModelModule } from 'ag-grid-community'
import { ServerSideRowModelModule, ColumnsToolPanelModule, FiltersToolPanelModule } from 'ag-grid-enterprise'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { apiFetch } from '@/lib/api-client'
import { formatBytes, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

// Set AG Grid Enterprise license key
LicenseManager.setLicenseKey(import.meta.env.VITE_AG_GRID_LICENSE_KEY)
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ServerSideRowModelModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
])

const agGridCustomStyles = `
  .ag-theme-quartz .ag-cell, .ag-theme-quartz .ag-header-cell-label {
    font-size: 0.75rem !important;
  }
`

interface Document {
  id: string;
  filename: string;
  size_bytes: number;
  status: string;
  uploaded_at: string;
  uploaded_by: string;
  chunks?: number;
  error_message?: string;
}

export function RFPManagementPage() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const gridApiRef = useRef<any>(null)
  const gridColumnApiRef = useRef<any>(null)
  const accessToken = useAuthStore(state => state.accessToken)

  // AG Grid column definitions
  const columnDefs = useMemo(() => [
    { headerName: 'Title', field: 'title', sortable: true, filter: true },
    { headerName: 'Uploaded Date', field: 'uploadedAt', sortable: true, filter: true, valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '' },
    { headerName: 'Uploaded By', field: 'uploadedBy', sortable: true, filter: true },
    { headerName: 'Status', field: 'status', sortable: true, filter: true },
    { headerName: 'Chunk Count', field: 'chunks', sortable: true, filter: true },
    { headerName: 'Error', field: 'error', sortable: false, filter: false, cellRenderer: (params: any) => params.value ? <span className="text-red-600">{params.value}</span> : '' },
    { headerName: 'File Size', field: 'fileSize', sortable: true, filter: true },
    { headerName: 'File Type', field: 'fileType', sortable: true, filter: true },
    {
      headerName: 'Actions',
      field: 'id',
      cellRenderer: (params: any) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleDownload(params.value)}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(params.value)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      minWidth: 120,
      sortable: false,
      filter: false,
    },
  ], [])

  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 120,
    resizable: true,
  }), [])

  // Download and delete handlers
  const handleDownload = (id: string) => {
    window.open(`/api/rfp-gpt/documents/${id}/download`, '_blank')
  }
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this RFP document?')) return
    try {
      setLoading(true)
      await apiFetch(`/api/rfp-gpt/documents/${id}`, { method: 'DELETE' }, accessToken || undefined)
      if (gridApiRef.current) gridApiRef.current.refreshServerSide({ purge: true })
    } catch (err) {
      alert('Error deleting document')
    } finally {
      setLoading(false)
    }
  }

  // AG Grid Server-Side Row Model datasource
  const getDatasource = (searchValue: string) => {
    return {
      getRows: async (params: any) => {
        setLoading(true)
        try {
          const { request } = params;
          const startRow = request.startRow;
          const endRow = request.endRow;
          const limit = endRow - startRow;
          const offset = startRow;
          let url = `/api/rfp-gpt/documents?limit=${limit}&offset=${offset}`;
          if (searchValue) url += `&q=${encodeURIComponent(searchValue)}`;
          const res = await apiFetch<Document[]>(url, {}, accessToken || undefined);
          // Map/format data as needed
          const formattedData = res.map(doc => ({
            id: doc.id,
            title: doc.filename,
            uploadedAt: doc.uploaded_at,
            uploadedBy: doc.uploaded_by,
            status: doc.status,
            chunks: doc.chunks,
            error: doc.error_message,
            fileSize: formatBytes(doc.size_bytes),
            fileType: doc.filename.split('.').pop() || '',
          }));
          const lastRow = formattedData.length < limit ? startRow + formattedData.length : undefined;
          params.success({ rowData: formattedData, rowCount: lastRow });
        } catch (err) {
          params.fail();
        } finally {
          setLoading(false);
        }
      }
    }
  }

  // Handle grid ready
  const onGridReady = (params: any) => {
    gridApiRef.current = params.api;
    gridColumnApiRef.current = params.columnApi;
    params.api.setGridOption('serverSideDatasource', getDatasource(search));
  }

  // Handle search submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gridApiRef.current) {
      gridApiRef.current.setGridOption('serverSideDatasource', getDatasource(search));
    }
  }

  // Handle upload success
  const handleUploadSuccess = () => {
    // Refresh the AG Grid table after successful upload
    if (gridApiRef.current) {
      gridApiRef.current.refreshServerSide({ purge: true });
    }
    setIsUploadDialogOpen(false);
  }

  return (
    <>
      <style>{agGridCustomStyles}</style>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>RFP Management</h2>
            <p className='text-muted-foreground'>Upload and manage your RFP documents here.</p>
          </div>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
          Upload RFP
        </Button>
      </div>
        <div className='ag-theme-quartz shadow-quartz bg-quartz-light rounded-xl overflow-hidden' style={{ width: '100%', borderRadius: '1rem', overflow: 'visible', height: '80vh' }}>
          <AgGridReact
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            animateRows={true}
            rowModelType='serverSide'
            cacheBlockSize={100}
            maxBlocksInCache={2}
            sideBar={{
              toolPanels: [
                'columns',
                'filters',
              ],
              defaultToolPanel: undefined,
            }}
            loadingOverlayComponentParams={{ loadingMessage: 'Loading...' }}
            overlayLoadingTemplate={loading ? '<span class="ag-overlay-loading-center">Loading...</span>' : undefined}
            onGridReady={onGridReady}
          />
        </div>
      <RFPUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onUploadSuccess={handleUploadSuccess}
      />
      </Main>
    </>
  )
} 