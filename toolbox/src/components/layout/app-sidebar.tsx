import { useState, useEffect } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { TeamSwitcher } from '@/components/layout/team-switcher'
import { sidebarData } from './data/sidebar-data'
import { useAuthStore } from '@/stores/authStore'
import { Zap, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { motion } from 'framer-motion'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastSync, setLastSync] = useState<Date>(new Date())

  // Online status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Simulate sync updates
    const syncInterval = setInterval(() => {
      if (isOnline) {
        setLastSync(new Date())
      }
    }, 30000) // Update every 30 seconds
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(syncInterval)
    }
  }, [isOnline])

  const formatLastSync = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return 'Yesterday'
  }

  return (
    <TooltipProvider>
      <Sidebar collapsible='icon' variant='floating' {...props}>
        <SidebarHeader className="border-b border-sidebar-border/50 bg-gradient-to-b from-background/80 to-background">
          <TeamSwitcher teams={sidebarData.teams} />
          
          {/* Status Bar */}
          <div className="px-3 pb-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: isOnline ? 1 : 0.8 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {isOnline ? (
                    <Wifi className="w-3 h-3 text-green-500" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-red-500" />
                  )}
                </motion.div>
                <span className={cn(
                  "font-medium transition-colors",
                  isOnline ? "text-green-600" : "text-red-600"
                )}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-muted-foreground/70">
                    <Zap className="w-3 h-3" />
                    <span>{formatLastSync(lastSync)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Last data sync
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </SidebarHeader>
        
        <SidebarContent className="px-2 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur-sm">
          {/* Navigation Groups */}
          {sidebarData.navGroups.map((group, index) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NavGroup {...group} />
            </motion.div>
          ))}
        </SidebarContent>
        
        <SidebarFooter className="border-t border-sidebar-border/50 bg-gradient-to-t from-background/80 to-background/50">
          <NavUser />
        </SidebarFooter>
        
        <SidebarRail />
      </Sidebar>
    </TooltipProvider>
  )
}
