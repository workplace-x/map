import React, { useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { 
  ThumbsUp, 
  ThumbsDown, 
  Copy, 
  MoreVertical,
  RotateCcw,
  Quote,
  ExternalLink,
  User,
  Bot
} from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { EnhancedMessage } from '../../types/chat'

interface MessageBubbleProps {
  message: EnhancedMessage
  isLast?: boolean
  className?: string
}

export const MessageBubble = memo<MessageBubbleProps>(({ 
  message, 
  isLast = false, 
  className 
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const user = { id: 'current-user', avatar_url: undefined as string | undefined }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleReaction = (type: 'up' | 'down') => {
    console.log('Reaction:', type, message.id)
  }

  const handleRegenerate = () => {
    console.log('Regenerate:', message.id)
  }

  const isUser = message.role === 'user'
  const isError = message.status === 'error'
  const isLoading = message.status === 'sending'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'group flex gap-3 p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors',
        isUser ? 'flex-row-reverse' : 'flex-row',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="bg-blue-500 text-white">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <Bot className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        'flex-1 max-w-3xl space-y-1',
        isUser ? 'items-end' : 'items-start'
      )}>
        {/* Message Header */}
        <div className={cn(
          'flex items-center gap-2 text-xs text-muted-foreground',
          isUser ? 'justify-end' : 'justify-start'
        )}>
          <span className="font-medium">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span>
            {format(message.timestamp, 'MMM d, h:mm a')}
          </span>
          
          {/* Status indicators */}
          {isLoading && (
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0ms]" />
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:150ms]" />
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          )}
          
          {message.confidence && message.confidence < 0.8 && !isUser && (
            <Badge variant="outline" className="text-xs">
              Low Confidence
            </Badge>
          )}
        </div>

        {/* Message Bubble */}
        <div className={cn(
          'rounded-2xl px-4 py-3 shadow-sm border transition-all duration-200',
          isUser 
            ? 'bg-blue-600 text-white border-blue-600 rounded-br-md ml-auto'
            : isError
              ? 'bg-red-50 border-red-200 text-red-900 rounded-bl-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
              : 'bg-card text-card-foreground border-border rounded-bl-md',
          isLoading && 'opacity-70'
        )}>
          {/* Message Content */}
          <div className={cn(
            'prose prose-sm prose-chat max-w-none',
            isUser ? 'prose-invert' : ''
          )}>
            <ReactMarkdown
              components={{
                // Custom paragraph component with better spacing
                p: ({ children, ...props }) => (
                  <p 
                    className="mb-4 leading-relaxed text-current"
                    style={{ marginBottom: '1.25rem', lineHeight: '1.7' }}
                    {...props}
                  >
                    {children}
                  </p>
                ),
                // Custom heading components
                h1: ({ children, ...props }) => (
                  <h1 className="text-xl font-bold mb-4 mt-6 text-current" {...props}>
                    {children}
                  </h1>
                ),
                h2: ({ children, ...props }) => (
                  <h2 className="text-lg font-semibold mb-3 mt-5 text-current" {...props}>
                    {children}
                  </h2>
                ),
                h3: ({ children, ...props }) => (
                  <h3 className="text-base font-medium mb-2 mt-4 text-current" {...props}>
                    {children}
                  </h3>
                ),
                // Custom list components with better spacing
                ul: ({ children, ...props }) => (
                  <ul className="mb-4 pl-6 space-y-2" {...props}>
                    {children}
                  </ul>
                ),
                ol: ({ children, ...props }) => (
                  <ol className="mb-4 pl-6 space-y-2" {...props}>
                    {children}
                  </ol>
                ),
                li: ({ children, ...props }) => (
                  <li className="leading-relaxed text-current" {...props}>
                    {children}
                  </li>
                ),
                // Custom blockquote
                blockquote: ({ children, ...props }) => (
                  <blockquote 
                    className={cn(
                      "border-l-4 pl-4 py-2 mb-4 italic rounded-r-lg",
                      isUser 
                        ? "border-white/30 bg-white/10 text-white/90" 
                        : "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-muted-foreground"
                    )}
                    {...props}
                  >
                    {children}
                  </blockquote>
                ),
                // Custom strong/bold text
                strong: ({ children, ...props }) => (
                  <strong className="font-semibold text-current" {...props}>
                    {children}
                  </strong>
                ),
                // Custom emphasis/italic
                em: ({ children, ...props }) => (
                  <em className={cn(
                    "italic",
                    isUser ? "text-white/90" : "text-muted-foreground"
                  )} {...props}>
                    {children}
                  </em>
                ),
                // Improved code blocks
                code({ inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={isUser ? oneDark : oneLight}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-lg !my-4"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code 
                      className={cn(
                        'px-1.5 py-0.5 rounded text-sm font-mono',
                        isUser 
                          ? 'bg-white/20 text-white' 
                          : 'bg-muted text-muted-foreground'
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
                // Custom horizontal rule
                hr: ({ ...props }) => (
                  <hr className="my-6 border-border" {...props} />
                ),
                // Custom links
                a: ({ children, ...props }) => (
                  <a 
                    className={cn(
                      "underline decoration-2 underline-offset-2",
                      isUser 
                        ? "text-white hover:text-white/80" 
                        : "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    )}
                    {...props}
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Attachments */}
          {message.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.attachments.map(attachment => (
                <div key={attachment.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">{(attachment.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sources */}
        {message.sources.length > 0 && (
          <div className="mt-2 p-3 bg-muted rounded-lg border">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-foreground">
                <span>Sources ({message.sources.length})</span>
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-2 space-y-2">
                {message.sources.map((source, index) => {
                  const metadata = (source as any).metadata || {}
                  return (
                    <div key={source.id} className="text-xs p-3 bg-card rounded border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium text-card-foreground flex-1">
                          {source.title}
                        </div>
                        <div className="flex gap-1 ml-2">
                          {metadata.client_type && (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                              {metadata.client_type}
                            </span>
                          )}
                          {metadata.content_type && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              metadata.content_type.includes('case study') || metadata.content_type.includes('success')
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-300'
                            }`}>
                              {metadata.content_type}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-muted-foreground mb-2">{source.excerpt}</div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        {source.pageNumber && (
                          <div>Page {source.pageNumber}</div>
                        )}
                        <div className="text-right">
                          Relevance: {Math.round((source.relevanceScore || 0) * 100)}%
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </details>
          </div>
        )}

        {/* Follow-up Questions */}
        {message.followUpQuestions.length > 0 && isLast && (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium text-foreground">Follow-up questions:</p>
            <div className="space-y-1">
              {message.followUpQuestions.map((question, index) => (
                <button
                  key={index}
                  className="block w-full text-left p-2 text-sm bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                  onClick={() => {
                    // TODO: Send this question
                    console.log('Send question:', question)
                  }}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <AnimatePresence>
          {(isHovered || message.reactions.length > 0) && !isUser && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-1 mt-2"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReaction('up')}
                className={cn(
                  "h-8 px-2 text-muted-foreground hover:text-green-600",
                  message.reactions.some(r => r.type === 'up' && r.userId === user?.id) && "bg-green-100 text-green-600"
                )}
              >
                <ThumbsUp className="w-4 h-4" />
                {message.helpfulVotes > 0 && (
                  <span className="ml-1 text-xs">{message.helpfulVotes}</span>
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReaction('down')}
                className={cn(
                  "h-8 px-2 text-muted-foreground hover:text-red-600",
                  message.reactions.some(r => r.type === 'down' && r.userId === user?.id) && "bg-red-100 text-red-600"
                )}
              >
                <ThumbsDown className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 px-2 text-muted-foreground hover:text-blue-600"
              >
                <Copy className="w-4 h-4" />
                {isCopied && <span className="ml-1 text-xs">Copied!</span>}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-muted-foreground"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={handleRegenerate}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Regenerate
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Quote className="w-4 h-4 mr-2" />
                    Quote Reply
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
})

MessageBubble.displayName = 'MessageBubble' 