import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  MessageSquare, 
  Search, 
  Trash2, 
  MoreHorizontal,
  Settings,
  Archive,
  Download,
  Share
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChatStore } from '../stores/chatStore';
import { formatDistanceToNow } from 'date-fns';
import type { ChatSession } from '../types/chat';

interface ChatSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function ChatSidebar({ isCollapsed = false, onToggle }: ChatSidebarProps) {
  const {
    sessions,
    currentSession,
    createNewSession,
    deleteSession,
    setCurrentSession,
    isLoading
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewChat = async () => {
    try {
      await createNewSession();
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this chat?')) {
      try {
        await deleteSession(sessionId);
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-16 border-r bg-gray-50 flex flex-col items-center py-4 space-y-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handleNewChat}
          disabled={isLoading}
          className="w-10 h-10"
        >
          <Plus className="w-4 h-4" />
        </Button>
        
        <div className="flex flex-col space-y-2">
          {filteredSessions.slice(0, 5).map((session) => (
            <Button
              key={session.id}
              variant={currentSession?.id === session.id ? "default" : "ghost"}
              size="icon"
              onClick={() => setCurrentSession(session)}
              className="w-10 h-10"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          ))}
        </div>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(!showSettings)}
          className="w-10 h-10"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 border-r bg-gray-50 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">AI Composer</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="h-8 w-8"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        <Button
          onClick={handleNewChat}
          disabled={isLoading}
          className="w-full mb-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredSessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No chats found</p>
            {searchQuery && (
              <p className="text-xs text-gray-400 mt-1">
                Try a different search term
              </p>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredSessions.map((session) => (
              <ChatSessionItem
                key={session.id}
                session={session}
                isActive={currentSession?.id === session.id}
                onClick={() => setCurrentSession(session)}
                onDelete={(e) => handleDeleteSession(session.id, e)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t bg-white p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Settings</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(false)}
            >
              ×
            </Button>
          </div>
          
          <div className="space-y-2">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Archive className="w-4 h-4 mr-2" />
              Archived Chats
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Share className="w-4 h-4 mr-2" />
              Share Settings
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

interface ChatSessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

function ChatSessionItem({ session, isActive, onClick, onDelete }: ChatSessionItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Safely access messages with default empty array
  const messages = session.messages || [];
  
  // Safe date conversion function - handles both Date objects and ISO strings
  const ensureDate = (dateValue: any): Date => {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };
  
  const lastMessageTime = messages.length > 0 
    ? ensureDate(messages[messages.length - 1].timestamp)
    : ensureDate(session.updatedAt);

  const previewText = messages.length > 0
    ? messages[messages.length - 1].content.slice(0, 60) + '...'
    : 'No messages yet';

  // Safe date formatting with error handling
  const formatTimeAgo = (date: Date): string => {
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.warn('Date formatting error:', error, 'Date value:', date);
      return 'Recently';
    }
  };

  return (
    <div
      className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
        isActive 
          ? 'bg-blue-100 border border-blue-200' 
          : 'hover:bg-gray-100'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium truncate ${
            isActive ? 'text-blue-900' : 'text-gray-900'
          }`}>
            {session.title}
          </h3>
          <p className={`text-xs mt-1 line-clamp-2 ${
            isActive ? 'text-blue-700' : 'text-gray-600'
          }`}>
            {previewText}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className={`text-xs ${
              isActive ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {formatTimeAgo(lastMessageTime)}
            </span>
            {messages.length > 0 && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                isActive 
                  ? 'bg-blue-200 text-blue-800' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {messages.length} msg{messages.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className={`opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 ${
              showMenu ? 'opacity-100' : ''
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <MoreHorizontal className="w-3 h-3" />
          </Button>

          {showMenu && (
            <div className="absolute right-0 top-6 bg-white border rounded-md shadow-lg z-10 py-1 min-w-[120px]">
              <button
                className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100 flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  // Add archive functionality
                }}
              >
                <Archive className="w-3 h-3 mr-2" />
                Archive
              </button>
              <button
                className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100 flex items-center text-red-600"
                onClick={(e) => {
                  setShowMenu(false);
                  onDelete(e);
                }}
              >
                <Trash2 className="w-3 h-3 mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 