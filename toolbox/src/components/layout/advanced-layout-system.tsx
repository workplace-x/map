import React, { createContext, useContext, useState, useEffect } from 'react'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Download, Settings, Bell, Search, Filter } from 'lucide-react'

// Advanced Layout Context for sophisticated state management
interface LayoutContextType {
  theme: 'default' | 'warm' | 'cool' | 'minimal'
  density: 'compact' | 'comfortable' | 'spacious'
  animations: boolean
  realTime: boolean
  setTheme: (theme: string) => void
  setDensity: (density: string) => void
  toggleAnimations: () => void
  toggleRealTime: () => void
}

const LayoutContext = createContext<LayoutContextType | null>(null)

export const useLayoutContext = () => {
  const context = useContext(LayoutContext)
  if (!context) throw new Error('useLayoutContext must be used within LayoutProvider')
  return context
}

// Advanced Theme System
const themeVariants = {
  default: {
    background: 'from-gray-50 to-white',
    card: 'bg-white/80 backdrop-blur-xl border-white/20',
    accent: 'blue',
    textGradient: 'from-gray-900 to-gray-600'
  },
  warm: {
    background: 'from-orange-50 to-red-50',
    card: 'bg-white/85 backdrop-blur-xl border-orange-100/40',
    accent: 'orange',
    textGradient: 'from-orange-900 to-red-700'
  },
  cool: {
    background: 'from-blue-50 to-cyan-50',
    card: 'bg-white/85 backdrop-blur-xl border-blue-100/40',
    accent: 'cyan',
    textGradient: 'from-blue-900 to-cyan-700'
  },
  minimal: {
    background: 'from-white to-gray-50',
    card: 'bg-white border-gray-200',
    accent: 'gray',
    textGradient: 'from-gray-800 to-gray-600'
  }
}

const densityVariants = {
  compact: { spacing: 'space-y-4', padding: 'p-4', headerPadding: 'p-6' },
  comfortable: { spacing: 'space-y-6', padding: 'p-6', headerPadding: 'p-8' },
  spacious: { spacing: 'space-y-8', padding: 'p-8', headerPadding: 'p-10' }
}

// Layout Provider Component
export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<string>('default')
  const [density, setDensity] = useState<string>('comfortable')
  const [animations, setAnimations] = useState(true)
  const [realTime, setRealTime] = useState(true)

  const value = {
    theme: theme as any,
    density: density as any,
    animations,
    realTime,
    setTheme,
    setDensity,
    toggleAnimations: () => setAnimations(!animations),
    toggleRealTime: () => setRealTime(!realTime)
  }

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  )
}

// Sophisticated Animation Variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { 
      duration: 0.3,
      ease: 'easeOut',
      staggerChildren: 0.1
    }
  }
}

// Advanced Layout Components with Compound Pattern
interface AdvancedLayoutProps {
  children: React.ReactNode
  className?: string
}

export function AdvancedLayout({ children, className }: AdvancedLayoutProps) {
  const { theme, density, animations } = useLayoutContext()
  const themeConfig = themeVariants[theme]
  const densityConfig = densityVariants[density]

  const content = animations ? (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        'min-h-screen bg-gradient-to-br',
        themeConfig.background,
        className
      )}
    >
      <div className={cn('w-full px-4 md:px-6 lg:px-8 py-6', densityConfig.spacing)}>
        {children}
      </div>
    </motion.div>
  ) : (
    <div className={cn('min-h-screen bg-gradient-to-br', themeConfig.background, className)}>
      <div className={cn('w-full px-4 md:px-6 lg:px-8 py-6', densityConfig.spacing)}>
        {children}
      </div>
    </div>
  )

  return content
}

// Sophisticated Header Component
interface HeaderProps {
  title: string
  description: string
  actions?: React.ReactNode
  statusInfo?: {
    text: string
    status: 'healthy' | 'warning' | 'error'
    details?: string
  }
  metrics?: Array<{
    label: string
    value: string | number
    trend?: 'up' | 'down' | 'stable'
    change?: string
  }>
  onRefresh?: () => void
  refreshLoading?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
}

export function AdvancedHeader({
  title,
  description,
  actions,
  statusInfo,
  metrics,
  onRefresh,
  refreshLoading,
  searchPlaceholder,
  onSearch
}: HeaderProps) {
  const { theme, density, animations, realTime, toggleRealTime } = useLayoutContext()
  const themeConfig = themeVariants[theme]
  const densityConfig = densityVariants[density]
  const [searchQuery, setSearchQuery] = useState('')

  const headerContent = (
    <Card className={cn(
      themeConfig.card,
      'shadow-xl border rounded-3xl overflow-hidden'
    )}>
      <div className={densityConfig.headerPadding}>
        {/* Main Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className={cn(
              'text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent mb-2',
              themeConfig.textGradient
            )}>
              {title}
            </h1>
            <p className="text-gray-600 text-lg mb-4">{description}</p>
            
            {/* Metrics Row */}
            {metrics && metrics.length > 0 && (
              <div className="flex items-center gap-6 text-sm">
                {metrics.map((metric, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-gray-500">{metric.label}:</span>
                    <span className="font-semibold text-gray-900">{metric.value}</span>
                    {metric.trend && (
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        metric.trend === 'up' ? 'bg-green-100 text-green-700' :
                        metric.trend === 'down' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      )}>
                        {metric.change}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Status Badge */}
            {statusInfo && (
              <Badge 
                variant="outline" 
                className={cn(
                  'px-3 py-1 cursor-pointer transition-all duration-200 hover:scale-105',
                  statusInfo.status === 'healthy' ? 'bg-green-50 border-green-200 text-green-700' :
                  statusInfo.status === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                  'bg-red-50 border-red-200 text-red-700'
                )}
                title={statusInfo.details}
              >
                <div className={cn(
                  'w-2 h-2 rounded-full mr-2',
                  statusInfo.status === 'healthy' ? 'bg-green-500 animate-pulse' :
                  statusInfo.status === 'warning' ? 'bg-yellow-500' :
                  'bg-red-500'
                )} />
                {statusInfo.text}
              </Badge>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={toggleRealTime}
                className={cn(
                  'transition-all duration-200',
                  realTime ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white/60 hover:bg-white border-gray-200'
                )}
              >
                <div className={cn(
                  'w-2 h-2 rounded-full mr-2',
                  realTime ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                )} />
                {realTime ? 'Live' : 'Manual'}
              </Button>
              
              {onRefresh && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onRefresh}
                  disabled={refreshLoading}
                  className="bg-white/60 hover:bg-white border-gray-200 shadow-sm"
                >
                  <RefreshCw className={cn('h-4 w-4 mr-2', refreshLoading ? 'animate-spin' : '')} />
                  Refresh
                </Button>
              )}
              
              {actions}
              
              <Button variant="outline" size="sm" className="bg-white/60 hover:bg-white border-gray-200">
                <Settings className="h-4 w-4" />
              </Button>
              
              <ThemeSwitch />
              <ProfileDropdown />
            </div>
          </div>
        </div>
        
        {/* Search and Filters Row */}
        {(onSearch || searchPlaceholder) && (
          <div className="flex items-center gap-4 p-4 bg-gray-50/50 backdrop-blur-sm rounded-2xl border border-gray-200/60">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  onSearch?.(e.target.value)
                }}
                className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/90 backdrop-blur-sm placeholder-gray-400 shadow-sm"
                placeholder={searchPlaceholder || "Search..."}
              />
            </div>
            <Button variant="outline" size="sm" className="bg-white/80 hover:bg-white border-gray-200">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        )}
      </div>
    </Card>
  )

  return animations ? (
    <motion.div variants={cardVariants} initial="hidden" animate="visible">
      {headerContent}
    </motion.div>
  ) : headerContent
}

// Advanced Card Component
interface AdvancedCardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'elevated' | 'outlined' | 'glass'
  interactive?: boolean
}

export function AdvancedCard({ 
  children, 
  className = '', 
  padding = 'md',
  variant = 'default',
  interactive = false
}: AdvancedCardProps) {
  const { theme, density, animations } = useLayoutContext()
  const themeConfig = themeVariants[theme]
  const densityConfig = densityVariants[density]
  
  const paddingClass = {
    sm: 'p-4',
    md: densityConfig.padding,
    lg: 'p-8'
  }[padding]

  const variantClasses = {
    default: themeConfig.card,
    elevated: `${themeConfig.card} shadow-2xl`,
    outlined: 'bg-white border-2 border-gray-200',
    glass: 'bg-white/60 backdrop-blur-lg border border-white/40'
  }

  const cardContent = (
    <div className={cn(
      variantClasses[variant],
      'rounded-3xl overflow-hidden transition-all duration-300',
      interactive && 'hover:shadow-xl hover:scale-[1.01] cursor-pointer',
      className
    )}>
      <div className={paddingClass}>
        {children}
      </div>
    </div>
  )

  return animations ? (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={interactive ? { scale: 1.01 } : {}}
      whileTap={interactive ? { scale: 0.99 } : {}}
    >
      {cardContent}
    </motion.div>
  ) : cardContent
}

// Advanced Status Bar
interface StatusItem {
  label: string
  value: string | number
  status?: 'active' | 'inactive' | 'warning' | 'error'
  details?: string
}

export function AdvancedStatusBar({ items }: { items: StatusItem[] }) {
  const { theme, animations } = useLayoutContext()
  const themeConfig = themeVariants[theme]

  const statusContent = (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/40">
      <div className="flex items-center justify-center gap-8 text-sm text-gray-600 flex-wrap">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2" title={item.details}>
            {item.status && (
              <div className={cn(
                'w-2 h-2 rounded-full',
                item.status === 'active' ? 'bg-green-500 animate-pulse' :
                item.status === 'warning' ? 'bg-yellow-500' :
                item.status === 'error' ? 'bg-red-500' :
                'bg-gray-400'
              )} />
            )}
            <span className="font-medium">{item.label}:</span>
            <span className="text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )

  return animations ? (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {statusContent}
    </motion.div>
  ) : statusContent
}

// Compound Layout System
AdvancedLayout.Header = AdvancedHeader
AdvancedLayout.Card = AdvancedCard
AdvancedLayout.StatusBar = AdvancedStatusBar
AdvancedLayout.Provider = LayoutProvider 