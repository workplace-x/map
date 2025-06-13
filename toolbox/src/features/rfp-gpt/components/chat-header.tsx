import React from 'react';
import { Plus, MessageSquare, Settings, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '../stores/chatStore';

export function ChatHeader() {
  const { currentSession, createNewSession } = useChatStore();

  const handleNewChat = () => {
    createNewSession();
  };

  return (
    <header className="border-b bg-white px-4 py-3">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-6 h-6 text-blue-500" />
          <h1 className="text-lg font-semibold text-gray-900">
            {currentSession?.title || 'AI Composer'}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewChat}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </Button>
          
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
} 