import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, Filter, Download, Eye, EyeOff,
  ChevronDown, ChevronUp, Search, RefreshCw, BarChart3,
  PieChart, LineChart, AlertTriangle, CheckCircle,
  Settings, Users, DollarSign, Calendar, Clock
} from 'lucide-react'

// Sophisticated KPI Component with Trend Analysis
interface SmartKPIProps {
  title: string
  value: number | string
  subtitle?: string
  trend?: {
    direction: 'up' | 'down' | 'stable'
    percentage: number
    period: string
  }
  target?: number
  format?: 'currency' | 'percentage' | 'number'
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onClick?: () => void
  loading?: boolean
}

const colorVariants = {
  blue: {
    background: 'from-blue-50 to-indigo-50',
    border: 'border-blue-200/60',
    icon: 'bg-blue-100 text-blue-600',
    trend: 'text-blue-600'
  },
  green: {
    background: 'from-emerald-50 to-green-50',
    border: 'border-emerald-200/60',
    icon: 'bg-emerald-100 text-emerald-600',
    trend: 'text-emerald-600'
  },
  red: {
    background: 'from-red-50 to-orange-50',
    border: 'border-red-200/60',
    icon: 'bg-red-100 text-red-600',
    trend: 'text-red-600'
  },
  yellow: {
    background: 'from-yellow-50 to-amber-50',
    border: 'border-yellow-200/60',
    icon: 'bg-yellow-100 text-yellow-600',
    trend: 'text-yellow-600'
  },
  purple: {
    background: 'from-purple-50 to-violet-50',
    border: 'border-purple-200/60',
    icon: 'bg-purple-100 text-purple-600',
    trend: 'text-purple-600'
  }
}

export function SmartKPI({
  title,
  value,
  subtitle,
  trend,
  target,
  format = 'number',
  icon,
  color = 'blue',
  size = 'md',
  interactive = false,
  onClick,
  loading = false
}: SmartKPIProps) {
  const colorConfig = colorVariants[color]
  
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val)
      case 'percentage':
        return `${val.toFixed(1)}%`
      case 'number':
      default:
        return val.toLocaleString()
    }
  }

  const sizeClasses = {
    sm: { card: 'p-4', icon: 'p-2 rounded-xl', iconSize: 'h-4 w-4', title: 'text-lg', value: 'text-2xl' },
    md: { card: 'p-6', icon: 'p-3 rounded-2xl', iconSize: 'h-6 w-6', title: 'text-xl', value: 'text-3xl' },
    lg: { card: 'p-8', icon: 'p-4 rounded-3xl', iconSize: 'h-8 w-8', title: 'text-2xl', value: 'text-4xl' }
  }[size]

  const progress = target ? Math.min((Number(value) / target) * 100, 100) : undefined

  return (
    <motion.div
      whileHover={interactive ? { scale: 1.02, y: -2 } : {}}
      whileTap={interactive ? { scale: 0.98 } : {}}
      onClick={onClick}
    >
      <Card className={cn(
        `bg-gradient-to-br ${colorConfig.background} backdrop-blur-sm ${colorConfig.border} transition-all duration-300 hover:shadow-lg rounded-2xl`,
        interactive && 'cursor-pointer hover:shadow-xl'
      )}>
        <CardContent className={sizeClasses.card}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(`${sizeClasses.icon} bg-white/70 backdrop-blur-sm ${colorConfig.icon} flex items-center justify-center`)}>
                <div className={sizeClasses.iconSize}>
                  {icon}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                {loading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                ) : (
                  <>
                    <p className={cn('font-bold text-gray-900 mb-1', sizeClasses.value)}>
                      {formatValue(value)}
                    </p>
                    {trend && (
                      <div className="flex items-center gap-1 text-sm">
                        {trend.direction === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                        {trend.direction === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
                        <span className={cn(
                          'font-medium',
                          trend.direction === 'up' ? 'text-green-600' : 
                          trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                        )}>
                          {trend.percentage > 0 ? '+' : ''}{trend.percentage.toFixed(1)}% {trend.period}
                        </span>
                      </div>
                    )}
                    {subtitle && (
                      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {/* Progress indicator for targets */}
            {progress !== undefined && (
              <div className="w-16 h-16 relative">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${progress}, 100`}
                    className={colorConfig.trend}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-600">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Advanced Data Table with Intelligent Features
interface SmartTableColumn<T> {
  key: keyof T
  title: string
  sortable?: boolean
  filterable?: boolean
  formatter?: (value: any, row: T) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
  sticky?: boolean
}

interface SmartTableProps<T> {
  data: T[]
  columns: SmartTableColumn<T>[]
  loading?: boolean
  searchable?: boolean
  exportable?: boolean
  selectable?: boolean
  pagination?: boolean
  pageSize?: number
  realTime?: boolean
  onRefresh?: () => void
  onRowClick?: (row: T) => void
  onExport?: () => void
  className?: string
}

export function SmartTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchable = true,
  exportable = true,
  selectable = false,
  pagination = true,
  pageSize = 25,
  realTime = false,
  onRefresh,
  onRowClick,
  onExport,
  className
}: SmartTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [hiddenColumns, setHiddenColumns] = useState<Set<keyof T>>(new Set())

  // Smart filtering and sorting
  const processedData = useMemo(() => {
    let filtered = data

    // Search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = data.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(query)
        )
      )
    }

    // Sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [data, searchQuery, sortConfig])

  // Pagination
  const paginatedData = useMemo(() => {
    if (!pagination) return processedData
    
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return processedData.slice(start, end)
  }, [processedData, currentPage, pageSize, pagination])

  const totalPages = Math.ceil(processedData.length / pageSize)

  const handleSort = (key: keyof T) => {
    const column = columns.find(col => col.key === key)
    if (!column?.sortable) return

    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const toggleColumnVisibility = (key: keyof T) => {
    setHiddenColumns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const visibleColumns = columns.filter(col => !hiddenColumns.has(col.key))

  return (
    <div className={cn('space-y-4', className)}>
      {/* Table Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {processedData.length} {processedData.length === 1 ? 'result' : 'results'}
            </span>
            
            {selectedRows.size > 0 && (
              <Badge variant="secondary">
                {selectedRows.size} selected
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Column Visibility */}
          <Button variant="outline" size="sm">
            <EyeOff className="h-4 w-4 mr-2" />
            Columns ({visibleColumns.length}/{columns.length})
          </Button>

          {realTime && onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
          )}

          {exportable && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Smart Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 backdrop-blur-sm">
              <tr>
                {selectable && (
                  <th className="w-12 p-4">
                    <input type="checkbox" className="rounded" />
                  </th>
                )}
                {visibleColumns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={cn(
                      'p-4 text-left font-semibold text-gray-700 border-b border-gray-200',
                      column.sortable && 'cursor-pointer hover:bg-gray-100/50 transition-colors',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.sticky && 'sticky left-0 bg-gray-50 z-10'
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.title}</span>
                      {column.sortable && (
                        <div className="flex flex-col">
                          <ChevronUp className={cn(
                            'h-3 w-3',
                            sortConfig?.key === column.key && sortConfig.direction === 'asc'
                              ? 'text-blue-600' : 'text-gray-400'
                          )} />
                          <ChevronDown className={cn(
                            'h-3 w-3 -mt-1',
                            sortConfig?.key === column.key && sortConfig.direction === 'desc'
                              ? 'text-blue-600' : 'text-gray-400'
                          )} />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <motion.tr
                      key={`loading-${index}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-gray-100"
                    >
                      {selectable && <td className="p-4"><div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div></td>}
                      {visibleColumns.map((column) => (
                        <td key={String(column.key)} className="p-4">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                      ))}
                    </motion.tr>
                  ))
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumns.length + (selectable ? 1 : 0)} className="p-8 text-center text-gray-500">
                      No data found
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={cn(
                        'border-b border-gray-100 hover:bg-gray-50/50 transition-colors',
                        onRowClick && 'cursor-pointer'
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {selectable && (
                        <td className="p-4">
                          <input type="checkbox" className="rounded" />
                        </td>
                      )}
                      {visibleColumns.map((column) => (
                        <td
                          key={String(column.key)}
                          className={cn(
                            'p-4',
                            column.align === 'center' && 'text-center',
                            column.align === 'right' && 'text-right',
                            column.sticky && 'sticky left-0 bg-white'
                          )}
                        >
                          {column.formatter 
                            ? column.formatter(row[column.key], row)
                            : String(row[column.key] || '')
                          }
                        </td>
                      ))}
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Real-time Data Feed Component
interface DataFeedProps {
  title: string
  items: Array<{
    id: string
    type: 'success' | 'warning' | 'error' | 'info'
    message: string
    timestamp: Date
    details?: string
  }>
  maxItems?: number
  realTime?: boolean
}

export function RealTimeDataFeed({ title, items, maxItems = 50, realTime = true }: DataFeedProps) {
  const [visibleItems, setVisibleItems] = useState(items.slice(0, maxItems))

  useEffect(() => {
    setVisibleItems(items.slice(0, maxItems))
  }, [items, maxItems])

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-blue-600" />
    }
  }

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          {title}
          {realTime && (
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {visibleItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
              >
                {getIcon(item.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.message}</p>
                  {item.details && (
                    <p className="text-xs text-gray-600 mt-1">{item.details}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {item.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
} 