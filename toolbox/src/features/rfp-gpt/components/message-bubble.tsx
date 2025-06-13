import React from 'react';
import { format } from 'date-fns';
import { User, Bot, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { EnhancedMessage } from '../types/chat';

interface MessageBubbleProps {
  message: EnhancedMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2 max-w-4xl`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-500 ml-2' : 'bg-gray-200 mr-2'}`}>
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : (
            <Bot className="w-5 h-5 text-gray-600" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex-1 ${isUser ? 'mr-0' : 'ml-0'}`}>
          <Card className={`p-4 ${isUser ? 'bg-blue-500 text-white' : 'bg-white border'}`}>
            <div className="space-y-2">
              {/* Message Text */}
              <div className="prose prose-sm max-w-none">
                {isAssistant ? (
                  <ReactMarkdown
                    components={{
                      code({ className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !className;
                        return !isInline && match ? (
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-sm leading-relaxed">{message.content}</p>
                )}
              </div>

              {/* Metadata */}
              {message.metadata && (
                <div className="text-xs opacity-75 space-y-1">
                  {message.metadata.confidence && (
                    <div>Confidence: {Math.round(message.metadata.confidence * 100)}%</div>
                  )}
                  {message.metadata.sources && message.metadata.sources.length > 0 && (
                    <div>Sources: {message.metadata.sources.join(', ')}</div>
                  )}
                </div>
              )}

              {/* Follow-up Questions */}
              {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium opacity-75">Suggested questions:</p>
                  {message.followUpQuestions.map((question, index) => (
                    <button
                      key={index}
                      className="block text-xs text-left p-2 bg-white bg-opacity-10 rounded hover:bg-opacity-20 transition-colors w-full"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Message Actions */}
          <div className={`flex items-center space-x-2 mt-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs text-gray-500">
              {format(message.timestamp, 'HH:mm')}
            </span>
            
            {isAssistant && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(message.content)}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <ThumbsUp className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <ThumbsDown className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 