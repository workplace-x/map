import { useRef, useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { orderLineColumnDefs } from './columns'
import { ModuleRegistry } from 'ag-grid-community'
import { ClientSideRowModelModule } from 'ag-grid-community'
import { ServerSideRowModelModule, ColumnsToolPanelModule, FiltersToolPanelModule, PaginationModule } from 'ag-grid-enterprise'
import { LicenseManager } from 'ag-grid-enterprise'

LicenseManager.setLicenseKey(import.meta.env.VITE_AG_GRID_LICENSE_KEY)

interface OrderLine {
  vnd_no: string
  vendor_name?: string
  qty_ordered: number
  cat_no: string
  unit_list: number
  unit_sell: number
  unit_cost: number
  processing_code: string
  spec_l_order_indictr: string
  freight_indicator: string
  margin: number
  margin_pct?: number
}

interface TangramLinesTableProps {
  data: OrderLine[]
  loading?: boolean
}

export function TangramLinesTable({ data, loading }: TangramLinesTableProps) {
  const gridApiRef = useRef<any>(null)
  const gridColumnApiRef = useRef<any>(null)

  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 120,
    resizable: true,
  }), [])

  const getTableHeight = (rowCount: number, minHeight = 300, maxHeight = 600) => {
    const headerHeight = 32;
    const paginationHeight = 40;
    const rowHeight = 30;
    const calculatedHeight = headerHeight + paginationHeight + (rowCount * rowHeight);
    return Math.max(minHeight, Math.min(maxHeight, calculatedHeight));
  };

  const onGridReady = (params: any) => {
    gridApiRef.current = params.api
    gridColumnApiRef.current = params.columnApi
  }

  ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    ServerSideRowModelModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    PaginationModule,
  ]);

  return (
    <>
      <style>{`
        .ag-theme-quartz .ag-cell, .ag-theme-quartz .ag-header-cell-label {
          font-size: 0.75rem !important;
        }
      `}</style>
      <div className='ag-theme-quartz shadow-quartz bg-quartz-light rounded-xl overflow-hidden' style={{ width: '100%', borderRadius: '1rem', overflow: 'visible', height: `${getTableHeight(data.length)}px` }}>
        <AgGridReact
          rowData={data}
          columnDefs={orderLineColumnDefs}
          defaultColDef={defaultColDef}
          animateRows={true}
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
    </>
  )
} 