import { ReactNode, useState, useEffect } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { ChevronRight, ChevronDown, Clock, Star } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { NavCollapsible, NavItem, NavLink, type NavGroup } from './types'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

// Recent items storage
const RECENT_ITEMS_KEY = 'sidebar-recent-items'
const MAX_RECENT_ITEMS = 5

const getRecentItems = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_ITEMS_KEY) || '[]')
  } catch {
    return []
  }
}

const addRecentItem = (url: string, title: string) => {
  const recent = getRecentItems()
  const item = `${url}|${title}`
  const filtered = recent.filter(r => !r.startsWith(url))
  const updated = [item, ...filtered].slice(0, MAX_RECENT_ITEMS)
  localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated))
  
  // Dispatch custom event to update recent items in real-time
  window.dispatchEvent(new CustomEvent('recent-items-updated'))
}

export function NavGroup({ title, items, defaultCollapsed = false }: NavGroup) {
  const { state } = useSidebar()
  const href = useLocation({ select: (location) => location.href })
  
  // Check if any item in this group is active
  const hasActiveItem = items.some(item => 
    checkIsActive(href, item) || 
    (item.items && item.items.some(subItem => checkIsActive(href, subItem)))
  )

  // Simple collapsed state - start expanded if there's an active item, otherwise use defaultCollapsed
  const [isCollapsed, setIsCollapsed] = useState(hasActiveItem ? false : defaultCollapsed)

  // Count items with badges for visual emphasis
  const badgeCount = items.reduce((count, item) => {
    if (item.badge) count++
    if (item.items) {
      count += item.items.filter(subItem => subItem.badge).length
    }
    return count
  }, 0)

  return (
    <SidebarGroup>
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className={cn(
            "text-xs font-semibold text-muted-foreground uppercase tracking-wider",
            "hover:text-foreground transition-all duration-300 cursor-pointer",
            "flex items-center justify-between group py-2 px-2 rounded-md hover:bg-accent/30",
            "select-none relative overflow-hidden",
            hasActiveItem && "text-foreground"
          )}>
            {/* Subtle glow effect for active sections */}
            {hasActiveItem && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
            )}
            
            <div className="flex items-center gap-2 relative z-10">
              <span>{title}</span>
              <AnimatePresence>
                {isCollapsed && (
                  <motion.div 
                    className="flex items-center gap-1"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 min-w-4 flex items-center justify-center">
                      {items.length}
                    </Badge>
                    {badgeCount > 0 && (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0 h-4 min-w-4 flex items-center justify-center animate-pulse">
                        {badgeCount}
                      </Badge>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 90 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative z-10"
            >
              <ChevronRight className={cn(
                "w-3 h-3 transition-all duration-300",
                "opacity-60 group-hover:opacity-100",
                hasActiveItem && "opacity-100"
              )} />
            </motion.div>
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="transition-all duration-300 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <SidebarMenu className="space-y-1">
              {items.map((item, index) => {
                const key = `${item.title}-${item.url}`

                if (!item.items)
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <SidebarMenuLink item={item} href={href} />
                    </motion.div>
                  )

                if (state === 'collapsed')
                  return (
                    <SidebarMenuCollapsedDropdown key={key} item={item} href={href} />
                  )

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <SidebarMenuCollapsible item={item} href={href} />
                  </motion.div>
                )
              })}
            </SidebarMenu>
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  )
}

const NavBadge = ({ children }: { children: ReactNode }) => {
  const badgeText = String(children).toLowerCase()
  
  // Determine badge style based on content
  const getBadgeStyle = () => {
    if (badgeText === 'new') {
      return 'bg-green-100 text-green-700 border-green-200 shadow-sm shadow-green-500/20'
    }
    if (badgeText === 'beta') {
      return 'bg-orange-100 text-orange-700 border-orange-200 shadow-sm shadow-orange-500/20'
    }
    if (badgeText === 'ai') {
      return 'bg-purple-100 text-purple-700 border-purple-200 shadow-sm shadow-purple-500/20'
    }
    if (badgeText === 'live') {
      return 'bg-red-100 text-red-700 border-red-200 animate-pulse shadow-sm shadow-red-500/20'
    }
    if (!isNaN(Number(badgeText))) {
      return 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm shadow-blue-500/20'
    }
    return 'bg-gray-100 text-gray-700 border-gray-200 shadow-sm'
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Badge 
        className={cn(
          'rounded-full px-2 py-0.5 text-xs font-medium border',
          getBadgeStyle()
        )}
      >
        {children}
      </Badge>
    </motion.div>
  )
}

const SidebarMenuLink = ({ item, href }: { item: NavLink; href: string }) => {
  const { setOpenMobile } = useSidebar()
  const isActive = checkIsActive(href, item)
  
  const handleClick = () => {
    setOpenMobile(false)
  }
  
  return (
    <SidebarMenuItem>
      <motion.div
        whileHover={{ x: 2 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={item.title}
          className={cn(
            "transition-all duration-300 hover:bg-accent/50 group",
            "relative overflow-hidden",
            isActive && "bg-accent text-accent-foreground font-medium shadow-sm"
          )}
        >
          <Link to={item.url} onClick={handleClick}>
            {/* Subtle glow for active items */}
            {isActive && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
            
            <div className="flex items-center gap-2 flex-1 min-w-0 relative z-10">
              {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
              <span className="truncate flex-1">{item.title}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                {item.badge && <NavBadge>{item.badge}</NavBadge>}
              </div>
            </div>
            
            {/* Active indicator */}
            {isActive && (
              <motion.div 
                className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </Link>
        </SidebarMenuButton>
      </motion.div>
    </SidebarMenuItem>
  )
}

const SidebarMenuCollapsible = ({
  item,
  href,
}: {
  item: NavCollapsible
  href: string
}) => {
  const { setOpenMobile } = useSidebar()
  return (
    <Collapsible
      asChild
      defaultOpen={checkIsActive(href, item, true)}
      className='group/collapsible'
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <motion.div
            whileHover={{ x: 2 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <SidebarMenuButton tooltip={item.title} className="group">
              {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
              <span className="truncate flex-1">{item.title}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                {item.badge && <NavBadge>{item.badge}</NavBadge>}
                <motion.div
                  animate={{ rotate: 0 }}
                  className="group-data-[state=open]/collapsible:rotate-90 transition-transform duration-200"
                >
                  <ChevronRight className='w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity' />
                </motion.div>
              </div>
            </SidebarMenuButton>
          </motion.div>
        </CollapsibleTrigger>
        <CollapsibleContent className='CollapsibleContent'>
          <SidebarMenuSub className="ml-4 border-l border-border/40 relative">
            {/* Subtle gradient line */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-border/20 via-border/60 to-border/20" />
            
            {item.items.map((subItem, index) => (
              <motion.div
                key={subItem.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    asChild
                    isActive={checkIsActive(href, subItem)}
                    className="transition-all duration-200 hover:bg-accent/30"
                  >
                    <Link 
                      to={subItem.url} 
                      onClick={() => setOpenMobile(false)}
                    >
                      {subItem.icon && <subItem.icon className="w-4 h-4 flex-shrink-0" />}
                      <span className="truncate flex-1">{subItem.title}</span>
                      {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </motion.div>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

const SidebarMenuCollapsedDropdown = ({
  item,
  href,
}: {
  item: NavCollapsible
  href: string
}) => {
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={checkIsActive(href, item)}
            className="group"
          >
            {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
            <span className="truncate flex-1">{item.title}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {item.badge && <NavBadge>{item.badge}</NavBadge>}
              <ChevronRight className='w-4 h-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 opacity-60 group-hover:opacity-100' />
            </div>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start' sideOffset={4} className="shadow-lg backdrop-blur-sm">
          <DropdownMenuLabel className="font-semibold">
            {item.title} {item.badge ? `(${item.badge})` : ''}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map((sub) => (
            <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
              <Link
                to={sub.url}
                className={cn(
                  "transition-colors duration-200 cursor-pointer",
                  checkIsActive(href, sub) ? 'bg-secondary' : ''
                )}
              >
                {sub.icon && <sub.icon className="w-4 h-4 flex-shrink-0" />}
                <span className='max-w-52 text-wrap truncate flex-1'>{sub.title}</span>
                {sub.badge && (
                  <span className='ml-auto text-xs'>{sub.badge}</span>
                )}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function checkIsActive(href: string, item: NavItem, mainNav = false) {
  return (
    href === item.url || // /endpint?search=param
    href.split('?')[0] === item.url || // endpoint
    !!item?.items?.filter((i) => i.url === href).length || // if child nav is active
    (mainNav &&
      href.split('/')[1] !== '' &&
      href.split('/')[1] === item?.url?.split('/')[1])
  )
}
