import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore, useActiveChatSession, useChatUIState } from '../../stores/chatStore'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { ChatHeader } from './ChatHeader'
import { DocumentPanel } from '../documents/DocumentPanel'
import { AnalysisPanel } from '../analysis/AnalysisPanel'
import { cn } from '@/lib/utils'

interface ChatInterfaceProps {
  className?: string
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ className }) => {
  const {
    isLoading,
    isStreamingMessage,
    sendMessage,
    clearError
  } = useChatStore()

  const activeSession = useActiveChatSession()
  const { 
    sidebarCollapsed, 
    showDocumentPanel, 
    error 
  } = useChatUIState()

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messages.length, isStreamingMessage])

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    try {
      await sendMessage(content, attachments)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  if (!activeSession) {
    return (
      <div className={cn(
        'flex-1 flex items-center justify-center',
        'bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-gray-900 dark:to-gray-800',
        className
      )}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-md px-6"
        >
          <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome to RFP Intelligence
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
              Start a new conversation to analyze documents, answer questions, and generate insights powered by AI.
            </p>
          </div>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105">
              Upload Document
            </button>
            <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 font-medium">
              Browse Templates
            </button>
          </motion.div>

          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
            <p className="font-medium">Quick shortcuts:</p>
            <div className="flex flex-wrap gap-2 justify-center text-xs">
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">⌘+N New chat</span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">⌘+K Focus input</span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">⌘+Enter Send</span>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={cn('flex-1 flex flex-col h-full bg-white dark:bg-gray-900', className)}>
      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={clearError}
                  className="text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Header */}
      <ChatHeader session={activeSession} />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <MessageList 
            messages={activeSession.messages}
            isStreaming={isStreamingMessage}
            className="flex-1 overflow-hidden"
          />
          
          <div ref={messagesEndRef} />
          
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={isLoading || isStreamingMessage}
            placeholder="Ask about your documents..."
            className="border-t bg-white dark:bg-gray-900"
          />
        </div>

        {/* Right Panel - Document/Analysis */}
        <AnimatePresence>
          {showDocumentPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 384, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Context</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {activeSession.documentContext ? (
                  <DocumentPanel context={activeSession.documentContext} />
                ) : (
                  <AnalysisPanel session={activeSession} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 