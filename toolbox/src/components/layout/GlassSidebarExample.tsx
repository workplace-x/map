import React, { useState } from 'react'
import { 
  Home, 
  BarChart3, 
  Users, 
  Settings, 
  FileText, 
  MessageSquare,
  Zap,
  Database,
  Shield,
  HelpCircle,
  LogOut,
  User
} from 'lucide-react'
import { 
  GlassSidebar, 
  GlassSidebarHeader, 
  GlassSidebarNav, 
  GlassSidebarNavItem, 
  GlassSidebarSection, 
  GlassSidebarFooter 
} from './glass-layout'

const GlassSidebarExample = () => {
  const [activeItem, setActiveItem] = useState('dashboard')

  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
  ]

  const toolsItems = [
    { id: 'ai-tools', label: 'AI Tools', icon: Zap },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  const supportItems = [
    { id: 'help', label: 'Help Center', icon: HelpCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <GlassSidebar>
      {/* Header */}
      <GlassSidebarHeader 
        title="Toolbox" 
        subtitle="Business Intelligence Platform"
      />

      {/* Navigation */}
      <GlassSidebarNav>
        {/* Main Navigation */}
        <GlassSidebarSection title="Main">
          {mainNavItems.map((item) => (
            <GlassSidebarNavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeItem === item.id}
              onClick={() => setActiveItem(item.id)}
            />
          ))}
        </GlassSidebarSection>

        {/* Tools Section */}
        <GlassSidebarSection title="Tools">
          {toolsItems.map((item) => (
            <GlassSidebarNavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeItem === item.id}
              onClick={() => setActiveItem(item.id)}
            />
          ))}
        </GlassSidebarSection>

        {/* Support Section */}
        <GlassSidebarSection title="Support">
          {supportItems.map((item) => (
            <GlassSidebarNavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeItem === item.id}
              onClick={() => setActiveItem(item.id)}
            />
          ))}
        </GlassSidebarSection>
      </GlassSidebarNav>

      {/* Footer */}
      <GlassSidebarFooter>
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/50">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
            <p className="text-xs text-gray-500 truncate">john@company.com</p>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </GlassSidebarFooter>
    </GlassSidebar>
  )
}

export default GlassSidebarExample 