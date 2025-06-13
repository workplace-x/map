import { OrderLine, ChartDataPoint, VendorMarginRow } from './types'

// Helper to robustly parse numbers (matches original tool)
export function extractNumeric(field: any): number {
  if (typeof field === 'object' && field !== null && Array.isArray(field.d)) {
    return field.d[0];
  }
  return typeof field === 'number' ? field : Number(field) || 0;
}

// Transform API line data to OrderLine interface
export function transformOrderLine(line: any): OrderLine {
  return {
    vnd_no: line.vnd_no ?? '',
    vendor_name: line.vendor_name ?? '',
    qty_ordered: extractNumeric(line.qty_ordered ?? line.quantity),
    cat_no: line.cat_no ?? line.product ?? '',
    unit_list: extractNumeric(line.unit_list),
    unit_sell: extractNumeric(line.unit_sell ?? line.unitSell),
    unit_cost: extractNumeric(line.unit_cost ?? line.unitCost),
    processing_code: line.processing_code ?? line.processingCode ?? '',
    spec_l_order_indictr: line.spec_l_order_indictr ?? '',
    freight_indicator: line.freight_indicator ?? '',
    margin: extractNumeric(line.margin),
    margin_pct: extractNumeric(line.margin_pct),
  }
}

// Filter vendor lines (excludes Tangram internal vendors)
export function filterVendorLines(lines: any[]): OrderLine[] {
  return lines
    .filter((line: any) => {
      const vnd = (line.vnd_no ?? '').trim().toUpperCase()
      return vnd !== '1' && vnd !== 'INT99'
    })
    .map(transformOrderLine)
}

// Filter Tangram lines (includes only internal vendors)
export function filterTangramLines(lines: any[]): OrderLine[] {
  return lines
    .filter((line: any) => {
      const vnd = (line.vnd_no ?? '').trim().toUpperCase()
      return vnd === '1' || vnd === 'INT99'
    })
    .map(transformOrderLine)
}

// Calculate margin data for vendors
export function calculateVendorMargins(vendorLines: OrderLine[]): VendorMarginRow[] {
  return vendorLines.reduce((acc: VendorMarginRow[], line) => {
    const vendorKey = line.vendor_name || line.vnd_no || 'Unknown'
    const lineSell = Number(line.unit_sell) * Number(line.qty_ordered)
    const lineCost = Number(line.unit_cost) * Number(line.qty_ordered)
    const lineMargin = lineSell - lineCost
    
    const existing = acc.find(item => item.vendor === vendorKey)
    if (existing) {
      existing.margin += lineMargin
      existing.totalSell += lineSell
    } else {
      acc.push({ vendor: vendorKey, margin: lineMargin, totalSell: lineSell })
    }
    return acc
  }, [])
}

// Format number as currency
export function formatCurrency(value: number): string {
  return value.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })
}

// Format percentage
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

// Calculate margin percentage
export function calculateMarginPercentage(sell: number, cost: number): number {
  return sell !== 0 ? ((sell - cost) / sell) * 100 : 0
}

// Chart utilities
export function getThemeColors(): string[] {
  const root = getComputedStyle(document.documentElement)
  return [
    root.getPropertyValue('--chart-1'),
    root.getPropertyValue('--chart-2'),
    root.getPropertyValue('--chart-3'),
    root.getPropertyValue('--chart-4'),
    root.getPropertyValue('--chart-5'),
  ].map(c => c.trim())
}

export function getColor(varName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
}

export function getPieData(data: { name: string; value: number }[]): ChartDataPoint[] {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  return data.map(d => ({
    ...d,
    percent: total ? ((d.value / total) * 100).toFixed(1) : '0',
  }))
} 