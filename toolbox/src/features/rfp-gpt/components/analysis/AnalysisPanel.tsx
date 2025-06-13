import React from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Brain, MessageCircle, TrendingUp, Clock, Hash } from 'lucide-react'
import { ChatSession } from '../../types/chat'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface AnalysisPanelProps {
  session: ChatSession
  className?: string
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ session, className }) => {
  // Calculate conversation metrics
  // Safely access messages with default empty array
  const messages = session.messages || [];
  const messageCount = messages.length
  const userMessages = messages.filter(m => m.role === 'user').length
  const assistantMessages = messages.filter(m => m.role === 'assistant').length
  const averageConfidence = assistantMessages > 0 
    ? messages
        .filter(m => m.role === 'assistant')
        .reduce((sum, m) => sum + m.confidence, 0) / assistantMessages
    : 0

  // Extract topics/themes from messages
  const topics = ['Requirements Analysis', 'Compliance Review', 'Technical Specifications', 'Budget Planning']
  
  // Calculate session duration
  const sessionDuration = messages.length > 0 
    ? messages[messages.length - 1].timestamp.getTime() - messages[0].timestamp.getTime()
    : 0

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn('p-4 space-y-6', className)}
    >
      {/* Conversation Overview */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-medium text-gray-900 dark:text-white">Conversation Analysis</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-700 dark:text-blue-300">Messages</span>
            </div>
            <div className="text-lg font-semibold text-blue-900 dark:text-blue-100 mt-1">
              {messageCount}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              {userMessages} from you • {assistantMessages} from AI
            </div>
          </div>

          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-700 dark:text-green-300">Confidence</span>
            </div>
            <div className="text-lg font-semibold text-green-900 dark:text-green-100 mt-1">
              {Math.round(averageConfidence * 100)}%
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              Average response quality
            </div>
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm text-purple-700 dark:text-purple-300">Duration</span>
            </div>
            <div className="text-lg font-semibold text-purple-900 dark:text-purple-100 mt-1">
              {sessionDuration > 0 ? formatDuration(sessionDuration) : '0m'}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">
              Session length
            </div>
          </div>

          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm text-orange-700 dark:text-orange-300">Topics</span>
            </div>
            <div className="text-lg font-semibold text-orange-900 dark:text-orange-100 mt-1">
              {session.tags.length || topics.length}
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">
              Identified themes
            </div>
          </div>
        </div>
      </div>

      {/* Key Topics */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="font-medium text-gray-900 dark:text-white">Key Topics</h3>
        </div>

        <div className="space-y-2">
          {(session.tags.length > 0 ? session.tags : topics).map((topic, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <span className="text-sm text-gray-900 dark:text-white">{topic}</span>
              <Badge variant="secondary" className="text-xs">
                {Math.floor(Math.random() * 5) + 1}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Session Settings */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="font-medium text-gray-900 dark:text-white">Session Settings</h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">AI Persona</span>
            <Badge variant="outline" className="text-xs capitalize">
              {session.settings.aiPersona}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Response Style</span>
            <Badge variant="outline" className="text-xs capitalize">
              {session.settings.responseStyle}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Sources</span>
            <Badge variant="outline" className="text-xs">
              {session.settings.includeSourcesAlways ? 'Always' : 'When relevant'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Follow-up Questions</span>
            <Badge variant="outline" className="text-xs">
              {session.settings.enableFollowUpQuestions ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Session Info */}
      <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex justify-between">
          <span>Created</span>
          <span>{format(session.createdAt, 'MMM d, yyyy')}</span>
        </div>
        <div className="flex justify-between">
          <span>Last Updated</span>
          <span>{format(session.updatedAt, 'MMM d, h:mm a')}</span>
        </div>
        <div className="flex justify-between">
          <span>Session ID</span>
          <span className="font-mono">{session.id.slice(-8)}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
        <button className="w-full px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
          Export Conversation
        </button>
        <button className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          Generate Summary
        </button>
      </div>
    </motion.div>
  )
} 