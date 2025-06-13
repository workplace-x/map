import React, { useEffect, useState, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-enterprise/styles/ag-theme-quartz.css';
import { ModuleRegistry } from 'ag-grid-enterprise';
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
} from 'ag-grid-enterprise';
import { RowStyleModule, TooltipModule } from 'ag-grid-community';
import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
import { ColDef, GridApi } from 'ag-grid-enterprise';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tangram-marketing-functions.azurewebsites.net';

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
  RowStyleModule,
  TooltipModule,
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
]);

interface InvoiceRow {
  invoice_number: string;
  invoice_date: string;
  salesperson: string;
  customer_name: string;
  order_title: string;
  total_sell: number | string;
  total_cost: number | string;
  gp_percent: number | string;
}

export default function InvoicesThisMonthTable() {
  const [rowData, setRowData] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const gridApi = useRef<GridApi | null>(null);

  useEffect(() => {
    async function fetchInvoices() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/invoices-this-month`);
        const json = await res.json();
        setRowData(json.invoices || []);
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
        setRowData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  const columnDefs: ColDef<InvoiceRow>[] = [
    { field: 'invoice_number', headerName: 'INVOICE #', flex: 0.9, minWidth: 90, headerClass: 'ag-header-uppercase ag-header-align-left ag-header-dashboard', cellClass: 'ag-cell-align-left ag-cell-ellipsis ag-cell-dashboard', tooltipField: 'invoice_number',
      cellRenderer: (p: any) => p.value ? (
        <a
          href={`/margin-analysis?invoice=${encodeURIComponent(p.value)}`}
          className="text-blue-600 hover:text-blue-800 font-semibold text-xs"
          style={{ textDecoration: 'none', fontWeight: 600, fontSize: '0.75rem', maxWidth: 120, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title={p.value}
          target="_blank"
          rel="noopener noreferrer"
        >
          {p.value}
        </a>
      ) : '',
    },
    { field: 'invoice_date', headerName: 'INVOICE DATE', flex: 0.8, minWidth: 90, valueFormatter: (p: any) => p.value && new Date(p.value as string).toLocaleDateString(), headerClass: 'ag-header-uppercase ag-header-align-left', cellClass: 'ag-cell-align-left', tooltipField: 'invoice_date' },
    { field: 'salesperson', headerName: 'SALESPERSON', flex: 1, minWidth: 110, headerClass: 'ag-header-uppercase ag-header-align-left', cellClass: 'ag-cell-align-left', tooltipField: 'salesperson' },
    { field: 'customer_name', headerName: 'CUSTOMER NAME', flex: 1.5, minWidth: 140, headerClass: 'ag-header-uppercase ag-header-align-left', cellClass: 'ag-cell-align-left ag-cell-ellipsis', tooltipField: 'customer_name' },
    { field: 'order_title', headerName: 'TITLE', flex: 2, minWidth: 160, headerClass: 'ag-header-uppercase ag-header-align-left', cellClass: 'ag-cell-align-left ag-cell-ellipsis', tooltipField: 'order_title' },
    { field: 'total_sell', headerName: 'SELL', flex: 1, minWidth: 90, headerClass: 'ag-header-uppercase ag-header-align-right', cellClass: 'ag-cell-align-right', valueFormatter: (p: any) => {
      let val = p.value;
      if (typeof val === 'string') val = parseFloat(val);
      return typeof val === 'number' && !isNaN(val)
        ? val.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
        : '';
    }, tooltipValueGetter: (p: any) => {
      let val = p.value;
      if (typeof val === 'string') val = parseFloat(val);
      return typeof val === 'number' && !isNaN(val)
        ? val.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
        : '';
    } },
    { field: 'total_cost', headerName: 'COST', flex: 1, minWidth: 90, headerClass: 'ag-header-uppercase ag-header-align-right', cellClass: 'ag-cell-align-right', valueFormatter: (p: any) => {
      let val = p.value;
      if (typeof val === 'string') val = parseFloat(val);
      return typeof val === 'number' && !isNaN(val)
        ? val.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
        : '';
    }, tooltipValueGetter: (p: any) => {
      let val = p.value;
      if (typeof val === 'string') val = parseFloat(val);
      return typeof val === 'number' && !isNaN(val)
        ? val.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
        : '';
    } },
    { field: 'gp_percent', headerName: 'GP%', flex: 0.7, minWidth: 60, headerClass: 'ag-header-uppercase ag-header-align-right', cellClass: 'ag-cell-align-right', valueFormatter: (p: any) => {
      let val = p.value;
      if (typeof val === 'string') val = parseFloat(val);
      return typeof val === 'number' && !isNaN(val)
        ? (val * 100).toFixed(1) + '%'
        : '';
    }, tooltipValueGetter: (p: any) => {
      let val = p.value;
      if (typeof val === 'string') val = parseFloat(val);
      return typeof val === 'number' && !isNaN(val)
        ? (val * 100).toFixed(1) + '%'
        : '';
    } },
  ];

  const defaultColDef: ColDef = {
    resizable: true,
    sortable: false,
    filter: false,
    flex: 1,
    minWidth: 60,
    tooltipComponentParams: { className: 'ag-tooltip-dashboard' },
  };

  // Export CSV handler
  const handleExport = () => {
    if (gridApi.current) {
      gridApi.current.exportDataAsCsv({
        fileName: 'invoices-this-month.csv',
        columnKeys: columnDefs.map(col => col.field as string),
      });
    }
  };

  // AG Grid event handler to get gridApi
  const onGridReady = (params: any) => {
    gridApi.current = params.api;
  };

  return (
    <>
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
        .ag-paging-page-size {
            display: none !important;
        }
      `}</style>
      <div className='ag-theme-quartz shadow-quartz bg-quartz-light' style={{ width: '100%', borderRadius: '1rem', overflow: 'visible' }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          loadingOverlayComponentParams={{ loadingMessage: 'Loading invoices...' }}
          overlayLoadingTemplate={'<span class="ag-overlay-loading-center">Loading invoices...</span>'}
          animateRows
          pagination={true}
          paginationPageSize={10}
          suppressCellFocus={true}
          suppressRowClickSelection={true}
          suppressMenuHide={true}
          suppressColumnVirtualisation={false}
          suppressMovableColumns={true}
          domLayout="autoHeight"
          tooltipShowDelay={300}
          onGridReady={onGridReady}
          rowSelection="single"
          getRowClass={params => params.node.isSelected() ? 'ag-row-selected-dashboard' : ''}
          headerHeight={36}
          rowHeight={32}
        />
        {loading && <div className="text-center text-gray-400 mt-2">Loading invoices…</div>}
      </div>
    </>
  );
} 