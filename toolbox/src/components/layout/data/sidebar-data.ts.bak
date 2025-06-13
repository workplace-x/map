import {
  IconBarrierBlock,
  IconBrowserCheck,
  IconChecklist,
  IconError404,
  IconLayoutDashboard,
  IconLock,
  IconMessages,
  IconPackages,
  IconPalette,
  IconServerOff,
  IconSettings,
  IconTool,
  IconUserCog,
  IconUserOff,
  IconUsers,
  IconDatabase,
  IconCreditCard,
} from '@tabler/icons-react'
import { AudioWaveform, Command, GalleryVerticalEnd, Bot } from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Toolbox',
      logo: Command,
      plan: 'Tangram Interiors',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'General',
      items: [
        { title: 'Home Dashboard', url: '/', icon: IconLayoutDashboard },
        { title: 'Daily Wins', url: '/daily-wins', icon: IconChecklist },
        { title: 'Redline Report', url: '/redline-report', icon: IconBarrierBlock },
      ],
    },
    {
      title: 'AI Tools',
      items: [
        { title: 'AI Composer', url: '/rfp-gpt', icon: AudioWaveform },
        { title: 'RFP Management', url: '/rfp-management', icon: GalleryVerticalEnd },
        { title: 'AI Dashboard', url: '/monitoring', icon: IconLayoutDashboard },
      ],
    },
    {
      title: 'Sales',
      items: [
        { title: 'Margin Analysis', url: '/margin-analysis', icon: IconChecklist },
        { title: '🤖 AI Margin Analysis', url: '/ai-margin-analysis', icon: Bot },
        { title: 'Quotes', url: '/quotes', icon: IconPackages },
        { title: 'Orders', url: '/orders', icon: IconTool },
        { title: '🤖 Invoice Intelligence', url: '/invoices', icon: IconCreditCard },
        { title: 'My Quote Approvals', url: '/my-approvals', icon: IconChecklist },
      ],
    },
    {
      title: 'Sales Management',
      items: [
        { title: 'Forecast', url: '/forecast', icon: IconPalette },
        { title: 'Gap Report', url: '/gap-report', icon: IconBarrierBlock },
        { title: 'Quote Approvals', url: '/approvals', icon: IconChecklist },
      ],
    },
    {
      title: 'Customers + Vendors',
      items: [
        { title: 'Customers', url: '/customers', icon: IconUsers },
        { title: 'Vendors', url: '/vendors', icon: IconUserCog },
      ],
    },
    {
      title: 'Application Data',
      items: [
        { title: '🚀 Azure Status', url: '/azure-status', icon: IconDatabase },
        { title: 'Data Sync Status', url: '/sync-status', icon: IconDatabase },
        { title: 'Settings', url: '/settings', icon: IconSettings },
        { title: 'Tasks', url: '/tasks', icon: IconChecklist },
        { title: 'Apps', url: '/apps', icon: IconPackages },
        { title: 'Chats', url: '/chats', icon: IconMessages },
        { title: 'Users', url: '/users', icon: IconUsers },
      ],
    },
    {
      title: 'Authentication',
      items: [
        { title: 'Sign In', url: '/sign-in', icon: IconLock },
        { title: 'Sign In (2 Col)', url: '/sign-in-2', icon: IconLock },
        { title: 'Sign Up', url: '/sign-up', icon: IconLock },
        { title: 'Forgot Password', url: '/forgot-password', icon: IconLock },
        { title: 'OTP', url: '/otp', icon: IconLock },
      ],
    },
    {
      title: 'Error Pages',
      items: [
        { title: 'Unauthorized', url: '/401', icon: IconError404 },
        { title: 'Forbidden', url: '/403', icon: IconUserOff },
        { title: 'Not Found', url: '/404', icon: IconError404 },
        { title: 'Internal Server Error', url: '/500', icon: IconServerOff },
        { title: 'Maintenance Error', url: '/503', icon: IconBarrierBlock },
      ],
    },
    {
      title: 'Forms',
      items: [
        { title: 'Published Forms', url: '/forms/published', icon: IconBrowserCheck },
        { title: 'Form Builder', url: '/forms/builder', icon: IconTool },
      ],
    },
  ],
}
