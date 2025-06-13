import { useRef, useState, useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AgGridReact } from 'ag-grid-react'
import { LicenseManager } from 'ag-grid-enterprise'
import 'ag-grid-enterprise'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import { ModuleRegistry } from 'ag-grid-community'
import { ClientSideRowModelModule } from 'ag-grid-community'
import { ServerSideRowModelModule, ColumnsToolPanelModule, FiltersToolPanelModule } from 'ag-grid-enterprise'
import { useAuth } from '@/stores/authStore'

// Set AG Grid Enterprise license key
LicenseManager.setLicenseKey(import.meta.env.VITE_AG_GRID_LICENSE_KEY)

// Register AG Grid modules
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ServerSideRowModelModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
])

// Inject custom CSS for smaller AG Grid text
const agGridCustomStyles = `
  .ag-theme-quartz .ag-cell, .ag-theme-quartz .ag-header-cell-label {
    font-size: 0.75rem !important;
}
`

export default function ApprovalsDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [decision, setDecision] = useState<{ [id: string]: { comment: string; submitting: boolean } }>({})
  const gridApiRef = useRef<any>(null)
  const gridColumnApiRef = useRef<any>(null)

  const handleDecision = async (id: string, status: 'approved' | 'rejected') => {
    if (!user || !user.id) return
    setDecision(prev => ({ ...prev, [id]: { ...prev[id], submitting: true } }))
    try {
      const comment = decision[id]?.comment || ''
      const res = await fetch(`/api/approvals/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewed_by: user.id, manager_comment: comment })
      })
      if (!res.ok) throw new Error('Failed to update approval')
      if (gridApiRef.current) {
        gridApiRef.current.refreshServerSide({ purge: true })
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setDecision(prev => ({ ...prev, [id]: { ...prev[id], submitting: false } }))
    }
  }

  // AG Grid column definitions
  const columnDefs = useMemo(() => [
    { headerName: 'Order #', field: 'order_no', sortable: true, filter: true },
    { headerName: 'Requested By', field: 'requested_by', sortable: true, filter: true },
    {
      headerName: 'Requested At', 
      field: 'requested_at', 
      sortable: true, 
      filter: true,
      valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleString() : ''
    },
    {
      headerName: 'Status', 
      field: 'status', 
      sortable: true, 
      filter: true,
      cellRenderer: (params: any) => (
        <span className='capitalize'>{params.value}</span>
      )
    },
    {
      headerName: 'Manager Comment', 
      field: 'manager_comment', 
      sortable: true, 
      filter: true,
      valueFormatter: (params: any) => params.value || '-'
    },
    {
      headerName: 'Actions',
      field: 'id',
      cellRenderer: (params: any) => {
        const a = params.data
        return (
          <div className='flex flex-col gap-2 min-w-[180px]'>
            <a
              href={`/margin-analysis?order=${a.order_no}`}
              className='text-primary underline hover:text-primary/80 mb-1'
              target='_blank'
              rel='noopener noreferrer'
            >
              View Margin Analysis
            </a>
            <Input
              placeholder='Manager comment (optional)'
              value={decision[a.id]?.comment || ''}
              onChange={e => setDecision(prev => ({ ...prev, [a.id]: { ...prev[a.id], comment: e.target.value } }))}
              className='my-1'
            />
            <div className='flex gap-2'>
              <Button
                variant='default'
                size='sm'
                disabled={decision[a.id]?.submitting}
                onClick={() => handleDecision(a.id, 'approved')}
              >
                {decision[a.id]?.submitting ? 'Approving...' : 'Approve'}
              </Button>
              <Button
                variant='destructive'
                size='sm'
                disabled={decision[a.id]?.submitting}
                onClick={() => handleDecision(a.id, 'rejected')}
              >
                {decision[a.id]?.submitting ? 'Rejecting...' : 'Reject'}
              </Button>
            </div>
          </div>
        )
      },
      minWidth: 200,
      sortable: false,
      filter: false,
    },
  ], [decision])

  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 120,
    resizable: true,
  }), [])

  // AG Grid Server-Side Row Model datasource
  const getDatasource = () => {
    return {
      getRows: async (params: any) => {
        if (!user || !user.id) {
          params.success({ rowData: [], rowCount: 0 })
          return
        }
        setLoading(true)
        try {
          const { request } = params
          const startRow = request.startRow
          const endRow = request.endRow
          const limit = endRow - startRow
          const offset = startRow
          const url = `/api/approvals?role=manager&user_id=${user.id}&limit=${limit}&offset=${offset}`
          const res = await fetch(url)
          const data = await res.json()
          const lastRow = data.length < limit ? startRow + data.length : undefined
          params.success({ rowData: data, rowCount: lastRow })
        } catch (err) {
          setError('Failed to fetch approvals')
          params.fail()
        } finally {
          setLoading(false)
        }
      }
    }
  }

  // Handle grid ready
  const onGridReady = (params: any) => {
    gridApiRef.current = params.api
    gridColumnApiRef.current = params.columnApi
    params.api.setGridOption('serverSideDatasource', getDatasource())
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
            <h2 className='text-2xl font-bold tracking-tight'>Quote Approvals</h2>
            <p className='text-muted-foreground'>Review and manage quote approval requests.</p>
          </div>
        </div>
        {error && <div className='text-red-500 mb-4'>{error}</div>}
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
      </Main>
    </>
  )
} 