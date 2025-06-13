import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { ExecutiveOverview } from '@/components/business-intelligence/executive-overview'

export const Route = createFileRoute('/_authenticated/business-intelligence')({
  component: BusinessIntelligencePage,
})

function BusinessIntelligencePage() {
  return (
    <div className='flex min-h-screen flex-col'>
      <Header>
        <div className='flex items-center gap-4'>
          <ProfileDropdown />
          <ThemeSwitch />
        </div>
      </Header>
      
      <Main>
        <ExecutiveOverview />
      </Main>
    </div>
  )
} 