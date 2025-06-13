import * as React from 'react'
import { ChevronsUpDown, Plus, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string
    logo: React.ElementType
    plan: string
  }[]
}) {
  const { isMobile } = useSidebar()
  const [activeTeam, setActiveTeam] = React.useState(teams[0])

  const getTeamColor = (teamName: string) => {
    switch (teamName.toLowerCase()) {
      case 'toolbox':
        return 'bg-blue-600 text-white'
      case 'analytics hub':
        return 'bg-green-600 text-white'
      case 'ai workspace':
        return 'bg-purple-600 text-white'
      default:
        return 'bg-gray-600 text-white'
    }
  }

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
              <div className={cn(
                'flex aspect-square size-8 items-center justify-center rounded-lg shadow-sm',
                getTeamColor(activeTeam.name)
              )}>
                <activeTeam.logo className='size-4' />
              </div>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-semibold'>
                  {activeTeam.name}
                </span>
                <span className='truncate text-xs text-muted-foreground'>
                  {activeTeam.plan}
                </span>
              </div>
              <ChevronsUpDown className='ml-auto size-4 text-muted-foreground' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg shadow-lg border'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-muted-foreground text-xs font-semibold uppercase tracking-wider px-3 py-2'>
              Workspaces
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className={cn(
                  'gap-3 p-3 cursor-pointer transition-colors duration-200',
                  'hover:bg-accent/50 focus:bg-accent/50',
                  activeTeam.name === team.name && 'bg-accent/30'
                )}
              >
                <div className={cn(
                  'flex size-6 items-center justify-center rounded-md shadow-sm',
                  getTeamColor(team.name)
                )}>
                  <team.logo className='size-4 shrink-0' />
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='font-medium truncate'>{team.name}</div>
                  <div className='text-xs text-muted-foreground truncate'>{team.plan}</div>
                </div>
                {activeTeam.name === team.name && (
                  <Check className='size-4 text-primary' />
                )}
                <DropdownMenuShortcut className='text-xs'>
                  ⌘{index + 1}
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className='my-1' />
            <DropdownMenuItem className={cn(
              'gap-3 p-3 cursor-pointer transition-colors duration-200',
              'hover:bg-accent/50 focus:bg-accent/50'
            )}>
              <div className='bg-muted flex size-6 items-center justify-center rounded-md border border-dashed border-muted-foreground/30'>
                <Plus className='size-4 text-muted-foreground' />
              </div>
              <div className='flex-1'>
                <div className='font-medium text-muted-foreground'>Add workspace</div>
                <div className='text-xs text-muted-foreground/70'>Create a new workspace</div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
