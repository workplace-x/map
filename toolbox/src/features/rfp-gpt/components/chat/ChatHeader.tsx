import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  PanelRightOpen, 
  PanelRightClose, 
  FileText, 
  Users, 
  MoreVertical,
  Edit3,
  Archive,
  Trash2
} from 'lucide-react'
import { ChatSession } from '../../types/chat'
import { useChatStore } from '../../stores/chatStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { format } from 'date-fns'

interface ChatHeaderProps {
  session: ChatSession
  className?: string
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ session, className }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(session.title)
  const { 
    showDocumentPanel, 
    toggleDocumentPanel,
    updateSessionTitle,
    archiveSession,
    deleteSession
  } = useChatStore()

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== session.title) {
      updateSessionTitle(session.id, editTitle.trim())
    }
    setIsEditingTitle(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      setEditTitle(session.title)
      setIsEditingTitle(false)
    }
  }

  const handleArchive = () => {
    archiveSession(session.id)
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      deleteSession(session.id)
    }
  }

  // Safely access messages with default empty array
  const messages = session.messages || [];
  const messageCount = messages.length
  const lastMessageTime = messages.length > 0 
    ? messages[messages.length - 1].timestamp 
    : session.updatedAt

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900',
        className
      )}
    >
      {/* Left side - Chat Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Document Context Indicator */}
        {session.documentContext && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">{session.documentContext.title}</p>
                  <p className="text-xs text-gray-500">
                    {session.documentContext.totalPages} pages • 
                    {session.documentContext.totalChunks} chunks
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Chat Title and Meta */}
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyDown}
              className="text-lg font-semibold bg-transparent border-b border-blue-500 focus:outline-none text-gray-900 dark:text-white w-full"
              autoFocus
            />
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 
                  className="text-lg font-semibold text-gray-900 dark:text-white truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {session.title}
                </h1>
                
                {/* Session Status Badges */}
                <div className="flex items-center gap-1">
                  {session.isShared && (
                    <Badge variant="secondary" className="text-xs">
                      <Users className="w-3 h-3 mr-1" />
                      Shared
                    </Badge>
                  )}
                  
                  {session.settings.aiPersona !== 'general' && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {session.settings.aiPersona}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span>{messageCount} message{messageCount !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span>Updated {format(lastMessageTime, 'MMM d, h:mm a')}</span>
                {session.collaborators && session.collaborators.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{session.collaborators.length} collaborator{session.collaborators.length !== 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Document Panel Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDocumentPanel}
                className={cn(
                  "transition-colors",
                  showDocumentPanel && "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                )}
              >
                {showDocumentPanel ? (
                  <PanelRightClose className="w-5 h-5" />
                ) : (
                  <PanelRightOpen className="w-5 h-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{showDocumentPanel ? 'Hide' : 'Show'} document panel</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Chat Settings */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  // TODO: Open chat settings modal
                  console.log('Open chat settings')
                }}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Chat settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* More Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
              <Edit3 className="w-4 h-4 mr-2" />
              Rename chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleArchive}>
              <Archive className="w-4 h-4 mr-2" />
              Archive chat
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  )
} 