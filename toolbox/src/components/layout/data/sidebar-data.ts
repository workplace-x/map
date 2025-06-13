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
  IconChartBar,
  IconTarget,
  IconBolt,
  IconShield,
  IconHelp,
} from '@tabler/icons-react'
import { 
  AudioWaveform, 
  Command, 
  GalleryVerticalEnd, 
  Bot, 
  TrendingUp,
  FileText,
  Calendar,
  Building2,
  Zap,
  BarChart3,
  Users2,
  Settings2,
  HelpCircle,
  User
} from 'lucide-react'
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
      name: 'Analytics Hub',
      logo: BarChart3,
      plan: 'Business Intelligence',
    },
    {
      name: 'AI Workspace',
      logo: Bot,
      plan: 'AI-Powered',
    },
  ],
  navGroups: [
    {
      title: 'Overview',
      defaultCollapsed: false,
      items: [
        { title: 'Dashboard', url: '/', icon: IconLayoutDashboard },
        { title: 'Daily Wins', url: '/daily-wins', icon: IconChecklist },
        { title: 'Redline Report', url: '/redline-report', icon: IconBarrierBlock },
        { title: 'Analytics', url: '/analytics', icon: TrendingUp },
      ],
    },
    {
      title: 'AI & Automation',
      defaultCollapsed: false,
      items: [
        { title: 'AI Composer', url: '/rfp-gpt', icon: AudioWaveform, badge: 'New' },
        { title: 'RFP Management', url: '/rfp-management', icon: GalleryVerticalEnd },
        { title: 'AI Margin Analysis', url: '/ai-margin-analysis', icon: Bot, badge: 'Beta' },
        { title: 'Invoice Intelligence', url: '/invoices', icon: IconCreditCard, badge: 'AI' },
      ],
    },
    {
      title: 'Sales & Revenue',
      defaultCollapsed: false,
      items: [
        { title: 'Margin Analysis', url: '/margin-analysis', icon: IconChartBar },
        { title: 'Quotes', url: '/quotes', icon: FileText },
        { title: 'Orders', url: '/orders', icon: IconPackages },
        { title: 'Forecast', url: '/forecast', icon: Calendar },
        { title: 'Gap Report', url: '/gap-report', icon: IconBarrierBlock },
      ],
    },
    {
      title: 'Approvals & Tasks',
      defaultCollapsed: false,
      items: [
        { title: 'My Approvals', url: '/my-approvals', icon: IconChecklist, badge: '3' },
        { title: 'Quote Approvals', url: '/approvals', icon: IconTarget },
        { title: 'Tasks', url: '/tasks', icon: IconTool },
      ],
    },
    {
      title: 'Relationships',
      defaultCollapsed: true,
      items: [
        { title: 'Customers', url: '/customers', icon: Building2 },
        { title: 'Vendors', url: '/vendors', icon: IconUserCog },
        { title: 'Team', url: '/users', icon: Users2 },
      ],
    },
    {
      title: 'System & Data',
      defaultCollapsed: true,
      items: [
        { title: 'Azure Status', url: '/azure-status', icon: IconDatabase, badge: 'Live' },
        { title: 'Data Sync', url: '/sync-status', icon: IconBolt },
        { title: 'Monitoring', url: '/monitoring', icon: IconShield },
        { title: 'Chats', url: '/chats', icon: IconMessages },
      ],
    },
    {
      title: 'Configuration',
      defaultCollapsed: true,
      items: [
        { title: 'Profile', url: '/profile', icon: User },
        { title: 'Settings', url: '/settings', icon: Settings2 },
        { title: 'Apps', url: '/apps', icon: IconPackages },
        { title: 'Published Forms', url: '/forms/published', icon: IconBrowserCheck },
        { title: 'Form Builder', url: '/forms/builder', icon: IconTool },
        { title: 'Help Center', url: '/help-center', icon: HelpCircle },
      ],
    },
  ],
}
