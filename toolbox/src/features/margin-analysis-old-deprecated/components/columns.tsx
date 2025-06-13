import { Badge } from '@/components/ui/badge'
import { ColDef } from 'ag-grid-community'

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
  [key: string]: any
}

interface MarginRow {
  vendor?: string
  customer?: string
  currentMarginPct: number
  margin: number
  [key: string]: any
}

function formatCurrency(value: number | undefined) {
  if (value == null || isNaN(value)) return ''
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatNumber(value: number | undefined) {
  if (value == null || isNaN(value)) return ''
  return value.toString()
}

function formatPercent(value: number | undefined) {
  if (value == null || isNaN(value)) return ''
  return `${value.toFixed(2)}%`
}

// Columns for vendor/tangram lines tables
export const orderLineColumnDefs: ColDef<OrderLine>[] = [
  {
    headerName: 'Vendor #',
    field: 'vnd_no',
    cellRenderer: (params: any) => {
      const div = document.createElement('div');
      div.className = 'font-medium';
      div.textContent = params.value;
      return div;
    },
    sortable: true,
    filter: true,
  },
  {
    headerName: 'Vendor Name',
    field: 'vendor_name',
    sortable: true,
    filter: true,
  },
  {
    headerName: 'Catalog #',
    field: 'cat_no',
    sortable: true,
    filter: true,
  },
  {
    headerName: 'Quantity',
    field: 'qty_ordered',
    sortable: true,
    filter: true,
    valueFormatter: (params: any) => formatNumber(params.value),
  },
  {
    headerName: 'List Price',
    field: 'unit_list',
    sortable: true,
    filter: true,
    valueFormatter: (params: any) => formatCurrency(params.value),
    hide: true,
  },
  {
    headerName: 'Unit Sell',
    field: 'unit_sell',
    sortable: true,
    filter: true,
    valueFormatter: (params: any) => formatCurrency(params.value),
  },
  {
    headerName: 'Unit Cost',
    field: 'unit_cost',
    sortable: true,
    filter: true,
    valueFormatter: (params: any) => formatCurrency(params.value),
    hide: true,
  },
  {
    headerName: 'Margin',
    field: 'margin',
    sortable: true,
    filter: true,
    valueFormatter: (params: any) => formatCurrency(params.value),
  },
  {
    headerName: 'Margin %',
    field: 'margin_pct',
    sortable: true,
    filter: true,
    cellRenderer: (params: any) => {
      const value = params.value
      const formattedValue = formatPercent(value)
      let className = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium '
      
      if (value < 20) {
        className += 'bg-red-100 text-red-800'
      } else if (value >= 25) {
        className += 'bg-green-100 text-green-800'
      } else {
        className += 'bg-yellow-100 text-yellow-800'
      }
      
      const span = document.createElement('span');
      span.className = className;
      span.textContent = formattedValue;
      return span;
    },
  },
  {
    headerName: 'Processing Code',
    field: 'processing_code',
    sortable: true,
    filter: true,
    hide: true,
  },
  {
    headerName: 'Special Order',
    field: 'spec_l_order_indictr',
    sortable: true,
    filter: true,
    hide: true,
  },
  {
    headerName: 'Freight',
    field: 'freight_indicator',
    sortable: true,
    filter: true,
    hide: true,
  },
]

// Columns for analysis tables
export const analysisColumnDefs: ColDef<MarginRow>[] = [
  {
    headerName: 'Vendor',
    field: 'vendor',
    sortable: true,
    filter: true,
    valueFormatter: (params: any) => params.value || '-',
  },
  {
    headerName: 'Customer',
    field: 'customer',
    sortable: true,
    filter: true,
    valueFormatter: (params: any) => params.value || '-',
  },
  {
    headerName: 'Margin %',
    field: 'currentMarginPct',
    sortable: true,
    filter: true,
    valueFormatter: (params: any) => formatPercent(params.value),
  },
  {
    headerName: 'Margin',
    field: 'margin',
    sortable: true,
    filter: true,
    valueFormatter: (params: any) => formatCurrency(params.value),
  },
] 