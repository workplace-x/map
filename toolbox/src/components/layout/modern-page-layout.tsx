import React from 'react'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw } from 'lucide-react'

interface ModernPageLayoutProps {
  children: React.ReactNode
  title: string
  description: string
  actions?: React.ReactNode
  headerContent?: React.ReactNode
  showRefresh?: boolean
  onRefresh?: () => void
  refreshLoading?: boolean
  statusInfo?: {
    text: string
    status: 'healthy' | 'warning' | 'error'
  }
}

export function ModernPageLayout({
  children,
  title,
  description,
  actions,
  headerContent,
  showRefresh = false,
  onRefresh,
  refreshLoading = false,
  statusInfo
}: ModernPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-8">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                {title}
              </h1>
              <p className="text-gray-600 text-lg">{description}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {statusInfo && (
                <Badge 
                  variant="outline" 
                  className={`px-3 py-1 ${
                    statusInfo.status === 'healthy' ? 'bg-green-50 border-green-200 text-green-700' :
                    statusInfo.status === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                    'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    statusInfo.status === 'healthy' ? 'bg-green-500' :
                    statusInfo.status === 'warning' ? 'bg-yellow-500' :
                    'bg-red-500'
                  } ${statusInfo.status === 'healthy' ? 'animate-pulse' : ''}`} />
                  {statusInfo.text}
                </Badge>
              )}
              
              <div className="flex gap-2">
                {showRefresh && onRefresh && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onRefresh}
                    disabled={refreshLoading}
                    className="bg-white/60 hover:bg-white border-gray-200 shadow-sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                )}
                {actions}
                <ThemeSwitch />
                <ProfileDropdown />
              </div>
            </div>
          </div>

          {/* Optional header content */}
          {headerContent}
        </div>

        {/* Page Content */}
        {children}
      </div>
    </div>
  )
}

interface ModernCardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

export function ModernCard({ children, className = '', padding = 'md' }: ModernCardProps) {
  const paddingClass = {
    sm: 'p-4',
    md: 'p-6', 
    lg: 'p-8'
  }[padding]

  return (
    <div className={`bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden ${className}`}>
      <div className={paddingClass}>
        {children}
      </div>
    </div>
  )
}

interface ModernStatusBarProps {
  items: Array<{
    label: string
    value: string
    status?: 'active' | 'inactive' | 'warning'
  }>
}

export function ModernStatusBar({ items }: ModernStatusBarProps) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/40">
      <div className="text-center text-sm text-gray-600 flex items-center justify-center gap-6">
        {items.map((item, index) => (
          <span key={index} className="flex items-center gap-2">
            {item.status && (
              <div className={`w-2 h-2 rounded-full ${
                item.status === 'active' ? 'bg-green-500 animate-pulse' :
                item.status === 'warning' ? 'bg-yellow-500' :
                'bg-gray-400'
              }`} />
            )}
            <span className="font-medium">{item.label}:</span>
            <span>{item.value}</span>
          </span>
        ))}
      </div>
    </div>
  )
} 