import React, { useState } from 'react'
import { ChatInterface } from './components/chat-interface'
import { ChatSidebar } from './components/chat-sidebar'
import { SystemStatus } from './components/system-status'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquare, Activity, Settings } from 'lucide-react'

export default function RfpGpt() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className="h-screen flex bg-white">
      <ChatSidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={handleToggleSidebar} 
      />
      
      <div className="flex-1 flex flex-col">
        {/* Tab Navigation */}
        <div className="border-b bg-gray-50 px-4 py-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-fit grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Chat</span>
              </TabsTrigger>
              <TabsTrigger value="status" className="flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>System Status</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} className="h-full">
            <TabsContent value="chat" className="h-full m-0">
              <ChatInterface />
            </TabsContent>
            
            <TabsContent value="status" className="h-full m-0 p-6 overflow-y-auto">
              <SystemStatus />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// Also export as named export for flexibility
export { RfpGpt } 