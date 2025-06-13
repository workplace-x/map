'use client'

import React, { useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AgGridReact } from 'ag-grid-react'
import ReactECharts from 'echarts-for-react'
import { ColDef } from 'ag-grid-community'
import { LicenseManager } from 'ag-grid-enterprise'
import { ModuleRegistry } from 'ag-grid-community'
import {
  ClientSideRowModelModule,
  ServerSideRowModelModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  PaginationModule,
} from 'ag-grid-enterprise'
import { OrderLine, OrderSummary, VendorComparisonRow } from '../types'
import { 
  calculateVendorMargins, 
  getPieData, 
  getThemeColors, 
  getColor,
  formatCurrency,
  formatPercentage 
} from '../utils'
import { useVendorSummaries } from '../hooks'

// Set AG Grid Enterprise license key
LicenseManager.setLicenseKey(import.meta.env.VITE_AG_GRID_LICENSE_KEY)

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ServerSideRowModelModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  PaginationModule,
])

interface AnalysisTabProps {
  vendorLines: OrderLine[]
  customerLines: OrderLine[]
  orderSummary: OrderSummary
}

export function AnalysisTab({ vendorLines, customerLines }: AnalysisTabProps) {
  const { vendorSummaries } = useVendorSummaries(vendorLines)
  const vendorGridApiRef = useRef<any>(null)

  // Calculate margin data for vendors
  const vendorMarginRows = useMemo(() => calculateVendorMargins(vendorLines), [vendorLines])

  // Pie chart data
  const vendorPieData = useMemo(() => getPieData(
    vendorMarginRows.map(item => ({ name: item.vendor, value: item.margin }))
  ), [vendorMarginRows])

  const vendorVolumePieData = useMemo(() => getPieData(
    vendorMarginRows.map(item => ({ name: item.vendor, value: item.totalSell }))
  ), [vendorMarginRows])

  // Pie chart options
  const pieOption = (data: any[]) => {
    const colors = getThemeColors()
    const labelColor = getColor('--foreground')
    const lineColor = getColor('--border')
  
    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0,0,0,0.6)',
        textStyle: { color: '#fff' },
        borderRadius: 6,
        padding: 10,
        formatter: (params: any) =>
          `<b>${params.name}</b><br/>$${formatCurrency(Number(params.value))} (${params.percent}%)`,
      },
      legend: { show: false },
      series: [
        {
          type: 'pie',
          radius: '70%',
          center: ['50%', '50%'],
          data: data.map((d, i) => {
            const color = colors[i % colors.length]
            return {
              ...d,
              itemStyle: { color },
              emphasis: {
                itemStyle: {
                  color,
                  shadowBlur: 16,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0,0,0,0.12)',
                }
              }
            }
          }),
          label: {
            show: true,
            position: 'outside',
            fontSize: 13,
            fontWeight: '500',
            color: labelColor,
            formatter: (params: any) =>
              `${params.name}\n$${formatCurrency(Number(params.value))} (${params.percent}%)`
          },
          labelLine: {
            show: true,
            length: 22,
            length2: 14,
            lineStyle: { color: lineColor, width: 1.5 },
            smooth: true
          }
        }
      ]
    }
  }

  // Vendor comparison grid columns
  const vendorComparisonColumnDefs: ColDef[] = [
    {
      headerName: 'Vendor',
      field: 'vendor',
      flex: 1,
    },
    {
      headerName: 'Current Margin %',
      field: 'currentMarginPct',
      flex: 1,
      valueFormatter: (params: any) => formatPercentage(params.value),
    },
    {
      headerName: 'All Time Margin %',
      field: 'allTimeMarginPct',
      flex: 1,
      valueFormatter: (params: any) => params.value ? formatPercentage(params.value) : 'N/A',
    },
    {
      headerName: '12 Month Margin %',
      field: 'marginPct12mo',
      flex: 1,
      valueFormatter: (params: any) => params.value ? formatPercentage(params.value) : 'N/A',
    },
    {
      headerName: 'Margin',
      field: 'margin',
      flex: 1,
      valueFormatter: (params: any) => `$${params.value.toFixed(2)}`,
    },
  ]

  // Vendor comparison data
  const vendorComparisonRows: VendorComparisonRow[] = useMemo(() => {
    return vendorMarginRows.map(row => {
      const vnd_no = vendorLines.find(l => (l.vendor_name || l.vnd_no || 'Unknown') === row.vendor)?.vnd_no || ''
      const normVndNo = (vnd_no || '').trim().toUpperCase()
      const summary = vendorSummaries.find(s => s.vendorNo === normVndNo)
      const currentMarginPct = row.totalSell === 0 ? 0 : (row.margin / row.totalSell) * 100
      
      return {
        vendor: row.vendor,
        currentMarginPct,
        allTimeMarginPct: summary?.marginPct ?? null,
        marginPct12mo: summary?.marginPct12mo ?? null,
        margin: row.margin,
      }
    })
  }, [vendorMarginRows, vendorSummaries, vendorLines])

  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 120,
    resizable: true,
  }), [])

  const onVendorGridReady = (params: any) => {
    vendorGridApiRef.current = params.api
  }

  return (
    <>
      <style>{`
        .ag-theme-quartz .ag-cell, .ag-theme-quartz .ag-header-cell-label {
          font-size: 0.75rem !important;
        }
      `}</style>

      <div className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Card>
            <CardHeader>
              <CardTitle>Margin Distribution by Vendor</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: '400px' }}>
                <ReactECharts option={pieOption(vendorPieData)} style={{ height: 400, width: '100%' }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Volume Distribution by Vendor</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: '400px' }}>
                <ReactECharts option={pieOption(vendorVolumePieData)} style={{ height: 400, width: '100%' }} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vendor Margin Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='ag-theme-quartz shadow-quartz bg-quartz-light rounded-xl overflow-hidden' style={{ height: '400px' }}>
              <AgGridReact
                rowData={vendorComparisonRows}
                columnDefs={vendorComparisonColumnDefs}
                defaultColDef={defaultColDef}
                animateRows
                sideBar={{ toolPanels: ['columns', 'filters'] }}
                onGridReady={onVendorGridReady}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}