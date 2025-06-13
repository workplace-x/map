import React, { memo } from 'react'
import { motion } from 'framer-motion'
import { EnhancedMessage } from '../../types/chat'
import { MessageBubble } from './MessageBubble'
import { cn } from '@/lib/utils'

interface MessageListProps {
  messages: EnhancedMessage[]
  isStreaming: boolean
  className?: string
}

export const MessageList = memo<MessageListProps>(({ 
  messages, 
  isStreaming, 
  className 
}) => {
  if (messages.length === 0) {
    return (
      <div className={cn('flex-1 flex items-center justify-center p-8', className)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 max-w-md"
        >
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Start the conversation
            </h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Ask a question or upload a document to begin analyzing with AI.
            </p>
          </div>

          <div className="flex flex-col gap-2 text-xs text-gray-500 dark:text-gray-400">
            <p>Try asking:</p>
            <div className="space-y-1">
              <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                "Summarize the key requirements"
              </div>
              <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                "What are the compliance requirements?"
              </div>
              <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                "Generate a response template"
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={cn('flex-1 overflow-y-auto', className)}>
      <div className="space-y-1 p-4">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isLast={index === messages.length - 1}
          />
        ))}
        
        {/* Streaming indicator */}
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-2"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <span>AI is thinking</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0ms]" />
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:150ms]" />
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
})

MessageList.displayName = 'MessageList' 