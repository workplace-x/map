import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { NotificationCenter } from '@/components/notifications/notification-center'

export const Route = createFileRoute('/_authenticated/notifications')({
  component: NotificationsPage,
})

function NotificationsPage() {
  return (
    <div className='flex min-h-screen flex-col'>
      <Header>
        <div className='flex items-center gap-4'>
          <ProfileDropdown />
          <ThemeSwitch />
        </div>
      </Header>
      
      <Main>
        <NotificationCenter />
      </Main>
    </div>
  )
} 