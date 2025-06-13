'use client'

import React, { useEffect, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import * as echarts from 'echarts'
import ReactECharts from 'echarts-for-react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tangram-marketing-functions.azurewebsites.net';

export function Overview() {
  const [yearData, setYearData] = useState<number[]>([])
  const [invoiceYearData, setInvoiceYearData] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingInvoices, setLoadingInvoices] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE_URL}/api/bookings-by-month-this-year`)
        const json = await res.json()
        const data: number[] = MONTHS.map((_, i) => {
          const found = json.bookings.find((b: any) => Number(b.month) === i + 1)
          return found ? Number(found.total_booked) : 0
        })
        setYearData(data)
      } catch (error) {
        console.error('Failed to fetch bookings data:', error)
        setYearData([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    async function fetchInvoices() {
      setLoadingInvoices(true)
      try {
        const res = await fetch(`${API_BASE_URL}/api/invoices-by-month-this-year`)
        const json = await res.json()
        const data: number[] = MONTHS.map((_, i) => {
          const found = json.invoices.find((b: any) => Number(b.month) === i + 1)
          return found ? Number(found.total_invoiced) : 0
        })
        setInvoiceYearData(data)
      } catch (error) {
        console.error('Failed to fetch invoices data:', error)
        setInvoiceYearData([])
      } finally {
        setLoadingInvoices(false)
      }
    }
    fetchInvoices()
  }, [])

  function getThemeColors(): string[] {
    const root = getComputedStyle(document.documentElement)
    return [
      root.getPropertyValue('--chart-1'),
      root.getPropertyValue('--chart-2'),
      root.getPropertyValue('--chart-3'),
      root.getPropertyValue('--chart-4'),
      root.getPropertyValue('--chart-5'),
    ].map(c => c.trim())
  }

  function getColor(varName: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  }

  function abbreviateNumber(value: number) {
    if (value >= 1e9) return (value / 1e9).toFixed(1).replace(/\.0$/, '') + 'B'
    if (value >= 1e6) return (value / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
    if (value >= 1e3) return (value / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
    return '$' + value
  }

  function getChartOption(title: string, data: number[]) {
    const colors = getThemeColors()
    const textColor = getColor('--foreground')
    const gridColor = getColor('--border')

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(0,0,0,0.6)',
        textStyle: { color: '#fff' },
        borderRadius: 6,
        padding: 12,
        formatter: (params: any) => {
          const p = params[0]
          return `${p.axisValue}<br/><b>${p.value.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
          })}</b>`
        },
      },
      grid: {
        left: 40,
        right: 20,
        top: 30,
        bottom: 40,
        containLabel: true,
        borderColor: 'transparent',
      },
      xAxis: {
        type: 'category',
        data: MONTHS,
        axisTick: { alignWithLabel: true },
        axisLabel: { fontSize: 12, color: textColor },
        axisLine: { lineStyle: { color: textColor, width: 1 } },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (v: number) => abbreviateNumber(v),
          fontSize: 12,
          color: textColor,
        },
        axisLine: { lineStyle: { color: textColor, width: 1 } },
        splitLine: { show: true, lineStyle: { color: gridColor } },
      },
      series: [
        {
          name: title,
          type: 'bar',
          barMaxWidth: 48,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
          },
          data: data.map((val, i) => {
            const color = colors[i % colors.length]
            return {
              value: val,
              itemStyle: {
                color,
              },
              emphasis: {
                itemStyle: {
                  color,
                  opacity: 1,
                  shadowColor: 'rgba(0,0,0,0.15)',
                  shadowBlur: 12,
                  borderRadius: [6, 6, 0, 0],
                },
              },
            }
          }),
        },
      ],
    }
  }

  const bookingsOption = getChartOption('Total Booked', yearData)
  const invoicesOption = getChartOption('Total Invoiced', invoiceYearData)

  return (
    <Tabs defaultValue="year" className="w-full">
      <TabsList className="mb-2">
        <TabsTrigger value="year">This Year's Bookings</TabsTrigger>
        <TabsTrigger value="invoices">This Year's Invoices</TabsTrigger>
      </TabsList>

      <TabsContent value="year">
        <div className="w-full h-full">
          <ReactECharts
            echarts={echarts}
            option={bookingsOption}
            style={{ width: '100%', height: 350 }}
            showLoading={loading}
            notMerge
            opts={{ renderer: 'svg' }}
          />
        </div>
      </TabsContent>

      <TabsContent value="invoices">
        <div className="w-full h-full">
          <ReactECharts
            echarts={echarts}
            option={invoicesOption}
            style={{ width: '100%', height: 350 }}
            showLoading={loadingInvoices}
            notMerge
            opts={{ renderer: 'svg' }}
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}