import { Link, useNavigate } from '@tanstack/react-router'
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  Settings,
  User,
  Shield,
  HelpCircle,
  Target,
  Users,
  Crown,
  Star,
  Zap,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAzureAuthStore, usePermissions } from '@/stores/azureAuthStore'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export function NavUser() {
  const { user, logout } = useAzureAuthStore();
  const { hasPermission, isAdmin, isExecutive, isManager, role } = usePermissions();
  const { isMobile } = useSidebar()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout();
  }

  // Generate initials from Azure AD user name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserRole = () => {
    if (user?.isTeamLeader) return 'Team Leader'
    if (user?.jobtitle) return user.jobtitle
    if (user?.role) {
      // Format role for display
      return user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
    if (user?.isEmployee) return 'Employee'
    return 'User'
  }

  const getDepartment = () => {
    return user?.department || 'Tangram Interiors'
  }

  const getPrimaryTeam = () => {
    return user?.primaryTeam?.name || user?.teams?.[0]?.name
  }

  const getStatusColor = () => {
    return 'bg-green-500' // Online status
  }

  // Get role badge styling
  const getRoleBadgeStyle = () => {
    if (isAdmin) return 'bg-red-100 text-red-800 border-red-200'
    if (isExecutive) return 'bg-purple-100 text-purple-800 border-purple-200'
    if (isManager) return 'bg-blue-100 text-blue-800 border-blue-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  // Get role icon
  const getRoleIcon = () => {
    if (isAdmin) return Shield
    if (isExecutive) return Star
    if (isManager) return Users
    return User
  }

  // Get avatar URL with fallback
  const getAvatarUrl = () => {
    if (user?.avatar_url) {
      // Handle Azure Blob Storage URLs
      if (user.avatar_url.includes('blob.core.windows.net')) {
        return user.avatar_url;
      }
      // Handle relative URLs
      if (user.avatar_url.startsWith('/')) {
        return user.avatar_url;
      }
      // Handle full URLs
      if (user.avatar_url.startsWith('http')) {
        return user.avatar_url;
      }
    }
    return undefined; // Will use fallback
  }

  // Format current month target
  const getCurrentMonthTarget = () => {
    if (user?.currentMonthTarget) {
      const target = user.currentMonthTarget;
      const progress = target.actual_amount ? (target.actual_amount / target.target_amount) * 100 : 0;
      return {
        target: target.target_amount,
        actual: target.actual_amount || 0,
        progress: Math.round(progress)
      };
    }
    return null;
  }

  const monthlyTarget = getCurrentMonthTarget();
  const RoleIcon = getRoleIcon();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className={cn(
                'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
                'hover:bg-sidebar-accent/50 transition-all duration-200',
                'border border-transparent hover:border-sidebar-border'
              )}
            >
              <div className="relative">
                <Avatar className='h-8 w-8 rounded-lg'>
                  <AvatarImage 
                    src={getAvatarUrl()} 
                    alt={user?.name || 'User'} 
                    className="object-cover"
                  />
                  <AvatarFallback className='rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold'>
                    {user?.name ? getInitials(user.name) : 'TI'}
                  </AvatarFallback>
                </Avatar>
                {/* Online status indicator */}
                <div className={cn(
                  'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background',
                  getStatusColor()
                )} />
                {/* Admin/Leader indicators */}
                {(user?.isTeamLeader || isAdmin) && (
                  <div className={cn(
                    "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center",
                    isAdmin ? "bg-red-500" : "bg-yellow-500"
                  )}>
                    {isAdmin ? (
                      <Shield className="w-2.5 h-2.5 text-white" />
                    ) : (
                      <Crown className="w-2.5 h-2.5 text-white" />
                    )}
                  </div>
                )}
              </div>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-semibold'>{user?.name || 'Tangram Employee'}</span>
                <div className="flex items-center gap-2">
                  <span className='truncate text-xs text-muted-foreground'>{getUserRole()}</span>
                  {isAdmin && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-red-100 text-red-800">
                      Admin
                    </Badge>
                  )}
                  {user?.isTeamLeader && !isAdmin && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-yellow-100 text-yellow-800">
                      Leader
                    </Badge>
                  )}
                  {user?.teams && user.teams.length > 0 && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      {user.teams.length} team{user.teams.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
              <ChevronsUpDown className='ml-auto size-4 text-muted-foreground' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-72 rounded-lg shadow-lg border'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-3 px-3 py-3 text-left text-sm'>
                <div className="relative">
                  <Avatar className='h-12 w-12 rounded-lg'>
                    <AvatarImage 
                      src={getAvatarUrl()} 
                      alt={user?.name || 'User'} 
                      className="object-cover"
                    />
                    <AvatarFallback className='rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold text-lg'>
                      {user?.name ? getInitials(user.name) : 'TI'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background',
                    getStatusColor()
                  )} />
                  {(user?.isTeamLeader || isAdmin) && (
                    <div className={cn(
                      "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center",
                      isAdmin ? "bg-red-500" : "bg-yellow-500"
                    )}>
                      {isAdmin ? (
                        <Shield className="w-3 h-3 text-white" />
                      ) : (
                        <Crown className="w-3 h-3 text-white" />
                      )}
                    </div>
                  )}
                </div>
                <div className='grid flex-1 text-left leading-tight'>
                  <span className='truncate font-semibold text-base'>{user?.name || 'Tangram Employee'}</span>
                  <span className='truncate text-sm text-muted-foreground'>{user?.email || ''}</span>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <div className="flex items-center gap-1">
                      <RoleIcon className="w-3 h-3 text-muted-foreground" />
                      <span className='text-xs text-muted-foreground'>{getUserRole()}</span>
                    </div>
                    {user?.role && (
                      <Badge variant="outline" className={cn("text-xs px-1.5 py-0", getRoleBadgeStyle())}>
                        {user.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      {getDepartment()}
                    </Badge>
                  </div>
                  {getPrimaryTeam() && (
                    <div className="flex items-center gap-1 mt-1">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{getPrimaryTeam()}</span>
                    </div>
                  )}
                  {user?.permissions && user.permissions.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Zap className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {user.permissions.includes('*') ? 'All permissions' : `${user.permissions.length} permissions`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Monthly Target Progress */}
              {monthlyTarget && (
                <div className="px-3 pb-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-blue-600" />
                        <span className="text-xs font-medium text-gray-700">Monthly Target</span>
                      </div>
                      <span className="text-xs text-gray-600">{monthlyTarget.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          monthlyTarget.progress >= 100 ? "bg-green-500" :
                          monthlyTarget.progress >= 75 ? "bg-blue-500" :
                          monthlyTarget.progress >= 50 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${Math.min(monthlyTarget.progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>${(monthlyTarget.actual / 1000).toFixed(0)}K</span>
                      <span>${(monthlyTarget.target / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                </div>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to='/settings/profile' className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to='/settings' className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to='/settings/notifications' className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <span>Notifications</span>
                  <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0">
                    3
                  </Badge>
                </Link>
              </DropdownMenuItem>
              {user?.isTeamLeader && (
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to='/settings' className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Team Management</span>
                    <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0">
                      Leader
                    </Badge>
                  </Link>
                </DropdownMenuItem>
              )}
              {hasPermission('users.read') && (
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to='/users' className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>User Management</span>
                    {isAdmin && (
                      <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0 bg-red-100 text-red-800">
                        Admin
                      </Badge>
                    )}
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer">
                <Shield className="w-4 h-4" />
                <span>Privacy & Security</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <HelpCircle className="w-4 h-4" />
                <span>Help & Support</span>
              </DropdownMenuItem>
              {!isAdmin && (
                <DropdownMenuItem className="cursor-pointer">
                  <Sparkles className="w-4 h-4" />
                  <span>Upgrade to Pro</span>
                  <Badge className="ml-auto text-xs px-1.5 py-0 bg-gradient-to-r from-purple-500 to-pink-500">
                    New
                  </Badge>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={handleLogout}
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
