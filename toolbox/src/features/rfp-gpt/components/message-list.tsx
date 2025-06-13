import React, { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { StreamingMessage, TypingIndicator } from './streaming-message';
import { useChatStore } from '../stores/chatStore';
import { formatDistanceToNow } from 'date-fns';
import type { EnhancedMessage } from '../types/chat';

export function MessageList() {
  const { messages, isLoading } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(messages.length);

  // Optimized scroll function with debouncing
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && scrollAreaRef.current) {
      // Only scroll if we're near the bottom or if a new message was added
      const scrollArea = scrollAreaRef.current;
      const isNearBottom = scrollArea.scrollTop + scrollArea.clientHeight >= scrollArea.scrollHeight - 100;
      const newMessageAdded = messages.length > lastMessageCountRef.current;
      
      if (isNearBottom || newMessageAdded) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }
      
      lastMessageCountRef.current = messages.length;
    }
  }, [messages.length]);

  // Only scroll when new messages are added, not during streaming updates
  useEffect(() => {
    if (messages.length !== lastMessageCountRef.current) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  return (
    <div 
      ref={scrollAreaRef}
      className="flex-1 overflow-y-auto px-4 py-6"
      style={{ scrollBehavior: 'smooth' }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              isLatest={index === messages.length - 1}
            />
          ))}
        </AnimatePresence>

        {/* Loading indicator with stable height */}
        {isLoading && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start space-x-3"
            style={{ minHeight: '80px' }} // Fixed height to prevent layout shifts
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div 
              className="flex-1 bg-gray-50 rounded-lg p-4"
              style={{ minHeight: '60px' }} // Fixed height for loading container
            >
              <TypingIndicator />
            </div>
          </motion.div>
        )}

        {/* Stable scroll anchor */}
        <div 
          ref={messagesEndRef} 
          style={{ height: '1px', marginTop: '16px' }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: EnhancedMessage;
  isLatest: boolean;
}

function MessageBubble({ message, isLatest }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // Safe date conversion function - handles both Date objects and ISO strings
  const ensureDate = (dateValue: any): Date => {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // Safe date formatting with error handling
  const formatTimeAgo = (date: any): string => {
    try {
      const safeDate = ensureDate(date);
      return formatDistanceToNow(safeDate, { addSuffix: true });
    } catch (error) {
      console.warn('Date formatting error:', error, 'Date value:', date);
      return 'Recently';
    }
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400 animate-spin" />;
      case 'delivered':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  const Avatar = ({ isUser }: { isUser: boolean }) => (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
      isUser 
        ? 'bg-gray-200 text-gray-700' 
        : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
    }`}>
      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
    >
      <Avatar isUser={isUser} />
      
      <div className={`flex-1 max-w-3xl ${isUser ? 'flex flex-col items-end' : ''}`}>
        {/* Message Content */}
        <div className={`rounded-lg p-4 shadow-sm ${
          isUser 
            ? 'bg-blue-600 text-white ml-12' 
            : 'bg-gray-50 text-gray-900 mr-12'
        }`} style={{ minHeight: '44px' }}>
          {isAssistant ? (
            <StreamingMessage
              content={message.content}
              isStreaming={isLatest && message.status === 'sending'}
              showActions={!isUser}
              onCopy={() => {
                // Handle copy
                console.log('Copied message');
              }}
              onLike={() => {
                // Handle like
                console.log('Liked message');
              }}
              onDislike={() => {
                // Handle dislike
                console.log('Disliked message');
              }}
              onRegenerate={() => {
                // Handle regenerate
                console.log('Regenerate message');
              }}
            />
          ) : (
            <div 
              className={`prose prose-sm max-w-none ${isUser ? 'text-white' : 'text-gray-900'}`}
              style={{ 
                minHeight: '20px',
                lineHeight: '1.7',
                letterSpacing: '0.01em'
              }}
            >
              <div 
                style={{ 
                  marginBottom: '1.25rem', 
                  lineHeight: '1.7' 
                }}
                className={`leading-relaxed whitespace-pre-wrap ${isUser ? 'text-white' : 'text-gray-900'}`}
              >
                {message.content}
              </div>
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className={`flex items-center space-x-2 p-2 rounded ${
                    isUser ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">{attachment.name}</span>
                  <span className="text-xs opacity-75">
                    {(attachment.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Metadata */}
        <div className={`flex items-center space-x-2 mt-1 text-xs text-gray-500 ${
          isUser ? 'flex-row-reverse space-x-reverse' : ''
        }`} style={{ minHeight: '16px' }}>
          <span>{formatTimeAgo(message.timestamp)}</span>
          {getStatusIcon()}
          {message.confidence && message.confidence < 1 && (
            <span className="text-orange-500">
              {Math.round(message.confidence * 100)}% confidence
            </span>
          )}
        </div>

        {/* Follow-up Questions (for assistant messages) */}
        {isAssistant && message.followUpQuestions && message.followUpQuestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-3 space-y-2"
            style={{ minHeight: '60px' }}
          >
            <div className="text-sm text-gray-600 font-medium">Suggested questions:</div>
            <div className="flex flex-wrap gap-2">
              {message.followUpQuestions.slice(0, 3).map((question, index) => (
                <button
                  key={index}
                  className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    // Handle follow-up question click
                    console.log('Follow-up question:', question);
                  }}
                >
                  {question}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Sources (for assistant messages) */}
        {isAssistant && message.sources && message.sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-3"
            style={{ minHeight: '80px' }}
          >
            <div className="text-sm text-gray-600 font-medium mb-2">Sources:</div>
            <div className="space-y-1">
              {message.sources.slice(0, 3).map((source, index) => (
                <div
                  key={source.id}
                  className="flex items-center space-x-2 p-2 bg-white border border-gray-200 rounded text-sm"
                >
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 truncate">{source.title}</span>
                  <span className="text-xs text-gray-500">
                    {Math.round(source.relevanceScore * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
} 