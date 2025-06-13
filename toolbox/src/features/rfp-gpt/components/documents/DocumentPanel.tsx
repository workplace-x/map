import React from 'react'
import { motion } from 'framer-motion'
import { FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { DocumentContext } from '../../types/chat'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface DocumentPanelProps {
  context: DocumentContext
  className?: string
}

export const DocumentPanel: React.FC<DocumentPanelProps> = ({ context, className }) => {
  const getStatusIcon = () => {
    switch (context.status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-600 animate-spin" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <FileText className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = () => {
    switch (context.status) {
      case 'ready':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn('p-4 space-y-4', className)}
    >
      {/* Document Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {context.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {getStatusIcon()}
              <Badge className={cn('text-xs', getStatusColor())}>
                {context.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Document Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <div className="text-gray-500 dark:text-gray-400">Pages</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {context.totalPages || 'N/A'}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-gray-500 dark:text-gray-400">Chunks</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {context.totalChunks}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-gray-500 dark:text-gray-400">Size</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {(context.fileSize / 1024 / 1024).toFixed(1)} MB
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-gray-500 dark:text-gray-400">Type</div>
            <div className="font-medium text-gray-900 dark:text-white uppercase">
              {context.fileType}
            </div>
          </div>
        </div>
      </div>

      {/* Document Metadata */}
      {context.metadata && (
        <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Document Details</h4>
          
          {context.metadata.summary && (
            <div className="space-y-2">
              <div className="text-sm text-gray-500 dark:text-gray-400">Summary</div>
              <div className="text-sm text-gray-900 dark:text-white leading-relaxed">
                {context.metadata.summary}
              </div>
            </div>
          )}

          {context.metadata.keywords.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-gray-500 dark:text-gray-400">Keywords</div>
              <div className="flex flex-wrap gap-1">
                {context.metadata.keywords.slice(0, 8).map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded"
                  >
                    {keyword}
                  </span>
                ))}
                {context.metadata.keywords.length > 8 && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs rounded">
                    +{context.metadata.keywords.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}

          {context.metadata.author && (
            <div className="space-y-1">
              <div className="text-sm text-gray-500 dark:text-gray-400">Author</div>
              <div className="text-sm text-gray-900 dark:text-white">
                {context.metadata.author}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <div className="text-sm text-gray-500 dark:text-gray-400">Uploaded</div>
            <div className="text-sm text-gray-900 dark:text-white">
              {format(context.uploadedAt, 'MMM d, yyyy h:mm a')}
            </div>
          </div>

          {context.processedAt && (
            <div className="space-y-1">
              <div className="text-sm text-gray-500 dark:text-gray-400">Processed</div>
              <div className="text-sm text-gray-900 dark:text-white">
                {format(context.processedAt, 'MMM d, yyyy h:mm a')}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <div className="text-sm text-gray-500 dark:text-gray-400">Confidence</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${context.metadata.confidence * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-900 dark:text-white">
                {Math.round(context.metadata.confidence * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
        <button className="w-full px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
          View Document
        </button>
        <button className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          Download Original
        </button>
      </div>
    </motion.div>
  )
} 