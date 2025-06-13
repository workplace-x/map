import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, Paperclip, Mic, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>
  disabled?: boolean
  placeholder?: string
  className?: string
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Type your message...',
  className
}) => {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() && attachments.length === 0) return

    try {
      await onSendMessage(message.trim(), attachments)
      setMessage('')
      setAttachments([])
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && (message.trim() || attachments.length > 0)) {
        handleSubmit(e)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments(prev => [...prev, ...files])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleVoiceRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false)
      // TODO: Implement voice recording functionality
    } else {
      // Start recording
      setIsRecording(true)
      // TODO: Implement voice recording functionality
    }
  }

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [message])

  const canSend = !disabled && (message.trim() || attachments.length > 0)

  return (
    <div className={cn('border-t bg-white dark:bg-gray-900 p-4', className)}>
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-3 flex flex-wrap gap-2"
        >
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg text-sm"
            >
              <Paperclip className="w-4 h-4" />
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button
                onClick={() => removeAttachment(index)}
                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200"
              >
                ×
              </button>
            </div>
          ))}
        </motion.div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'w-full resize-none rounded-2xl border border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800 px-4 py-3 pr-12',
              'text-sm placeholder-gray-500 dark:placeholder-gray-400',
              'focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
              'transition-colors max-h-32 overflow-y-auto',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            style={{ minHeight: '48px' }}
          />
          
          {/* Character count for long messages */}
          {message.length > 500 && (
            <div className="absolute bottom-2 right-12 text-xs text-gray-400">
              {message.length}/2000
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* File Upload */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="rounded-full"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Attach file</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Voice Recording */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleVoiceRecording}
                  disabled={disabled}
                  className={cn(
                    "rounded-full",
                    isRecording && "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  )}
                >
                  {isRecording ? (
                    <Square className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isRecording ? 'Stop recording' : 'Voice message'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Send Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  disabled={!canSend}
                  size="icon"
                  className={cn(
                    "rounded-full transition-all duration-200",
                    canSend 
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:scale-105" 
                      : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  )}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send message (⌘+Enter)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx,.ppt,.pptx,image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </form>

      {/* Keyboard Shortcuts Hint */}
      {message.length === 0 && (
        <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 text-center">
          Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">⌘+Enter</kbd> to send, 
          <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs ml-1">Shift+Enter</kbd> for new line
        </div>
      )}
    </div>
  )
} 