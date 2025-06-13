import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Copy, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StreamingMessageProps {
  content: string;
  isStreaming: boolean;
  onComplete?: () => void;
  onCopy?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  onRegenerate?: () => void;
  showActions?: boolean;
}

export function StreamingMessage({
  content,
  isStreaming = false,
  showActions = true,
  onCopy,
  onLike,
  onDislike,
  onRegenerate,
  onComplete
}: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState(content);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Memoize the full content to prevent unnecessary re-renders
  const memoizedContent = useMemo(() => content, [content]);

  // Update displayed content based on streaming state
  useEffect(() => {
    if (isStreaming) {
      // Show simple "AI writing..." when streaming
      setDisplayedContent("AI writing...");
    } else {
      // Show full content when not streaming
      setDisplayedContent(memoizedContent);
    }
  }, [memoizedContent, isStreaming]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(displayedContent);
    onCopy?.();
  };

  return (
    <div 
      ref={containerRef}
      className="space-y-4"
      style={{ minHeight: '60px' }} // Prevent layout shifts with minimum height
    >
      {/* Message Content */}
      <div className="relative">
        <div 
          ref={contentRef}
          className="prose prose-sm max-w-none dark:prose-invert"
          style={{ 
            minHeight: '24px',
            lineHeight: '1.7',
            letterSpacing: '0.01em',
            color: 'inherit' // Ensure text inherits color from parent
          }}
        >
          {isStreaming ? (
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <span className="animate-pulse">AI writing...</span>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          ) : (
            <ReactMarkdown
              components={{
                // Custom paragraph component with better spacing
                p: ({ children, ...props }) => (
                  <p 
                    className="mb-4 last:mb-0 text-gray-900 dark:text-gray-100" 
                    style={{ lineHeight: '1.7' }}
                    {...props}
                  >
                    {children}
                  </p>
                ),
                
                // Custom headings with proper spacing
                h1: ({ children, ...props }) => (
                  <h1 className="text-xl font-bold mb-3 text-gray-900 dark:text-white" {...props}>
                    {children}
                  </h1>
                ),
                
                h2: ({ children, ...props }) => (
                  <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white" {...props}>
                    {children}
                  </h2>
                ),
                
                h3: ({ children, ...props }) => (
                  <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-white" {...props}>
                    {children}
                  </h3>
                ),
                
                // Custom lists with better spacing
                ul: ({ children, ...props }) => (
                  <ul className="list-disc list-outside ml-6 mb-4 space-y-1 text-gray-900 dark:text-gray-100" {...props}>
                    {children}
                  </ul>
                ),
                
                ol: ({ children, ...props }) => (
                  <ol className="list-decimal list-outside ml-6 mb-4 space-y-1 text-gray-900 dark:text-gray-100" {...props}>
                    {children}
                  </ol>
                ),
                
                // Custom blockquotes
                blockquote: ({ children, ...props }) => (
                  <blockquote 
                    className="border-l-4 border-blue-500 pl-4 italic my-4 text-gray-700 dark:text-gray-300"
                    {...props}
                  >
                    {children}
                  </blockquote>
                ),
                
                // Custom code blocks
                code: ({ node, className, children, ...props }: any) => {
                  const isInline = !node || node.tagName !== 'pre';
                  
                  if (isInline) {
                    return (
                      <code 
                        className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-1.5 py-0.5 rounded text-sm font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  }
                  return (
                    <pre className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                      <code className="font-mono text-sm" {...props}>
                        {children}
                      </code>
                    </pre>
                  )
                },
                
                // Custom links
                a: ({ children, ...props }) => (
                  <a 
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-2 underline-offset-2"
                    {...props}
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {displayedContent}
            </ReactMarkdown>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && !isStreaming && displayedContent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center space-x-2 pt-2"
          style={{ minHeight: '36px' }} // Fixed height for actions
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-8 px-2 text-gray-500 hover:text-gray-700"
          >
            <Copy className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onLike}
            className="h-8 px-2 text-gray-500 hover:text-green-600"
          >
            <ThumbsUp className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onDislike}
            className="h-8 px-2 text-gray-500 hover:text-red-600"
          >
            <ThumbsDown className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
            className="h-8 px-2 text-gray-500 hover:text-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// Optimized typing dots animation component
export function TypingIndicator() {
  return (
    <div 
      className="flex items-center space-x-1 text-gray-500"
      style={{ minHeight: '24px' }} // Fixed height to prevent layout shifts
    >
      <span className="text-sm">AI is thinking</span>
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            className="w-1.5 h-1.5 bg-gray-400 rounded-full"
          />
        ))}
      </div>
    </div>
  );
} 