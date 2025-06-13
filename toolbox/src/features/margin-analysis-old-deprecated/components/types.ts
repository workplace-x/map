export interface OrderLine {
  vnd_no: string
  vendor_name?: string
  customer_no?: string
  customer_name?: string
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

export interface OrderSummary {
  order_no: string
  customer_no: string
  customer_name: string
  order_title: string
  date_created: string
  total_sell: number
  total_cost: number
  overall_margin: number
  overall_margin_pct: number
  vendor_lines: OrderLine[]
  tangram_lines: OrderLine[]
  salesperson_name?: string
}

export interface VendorSummary {
  vendorNo: string
  vendorName: string
  marginPct: number | null
  marginPct12mo: number | null
}

export interface CustomerSummary {
  customerNo: string
  customerName: string
  marginPct: number
  marginPct12mo: number
}

export interface VendorComparisonRow {
  vendor: string
  currentMarginPct: number
  allTimeMarginPct: number | null
  marginPct12mo: number | null
  margin: number
}

export interface CustomerComparisonRow {
  customer: string
  currentMarginPct: number
  allTimeMarginPct: number | null
  marginPct12mo: number | null
  margin: number
} 