import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Bell, BellRing, Check, X, Search, Filter, Settings,
  AlertTriangle, CheckCircle, Info, MessageSquare, Calendar,
  DollarSign, Users, FileText, Zap, Clock, Eye, EyeOff,
  MoreHorizontal, Archive, Trash2, Star, StarOff
} from 'lucide-react'

// Types
interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'message' | 'system'
  category: 'sales' | 'system' | 'team' | 'project' | 'finance' | 'general'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  read: boolean
  starred: boolean
  archived: boolean
  timestamp: Date
  sender?: {
    id: string
    name: string
    avatar?: string
  }
  actionUrl?: string
  metadata?: {
    amount?: number
    projectName?: string
    dealValue?: number
    dueDate?: Date
  }
}

// Mock data
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Deal Closed',
    message: 'Healthcare project worth $125,000 has been successfully closed by Sarah Johnson.',
    type: 'success',
    category: 'sales',
    priority: 'high',
    read: false,
    starred: true,
    archived: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    sender: {
      id: '1',
      name: 'Sarah Johnson',
      avatar: undefined
    },
    metadata: {
      dealValue: 125000,
      projectName: 'Regional Medical Center'
    }
  },
  {
    id: '2',
    title: 'System Maintenance Scheduled',
    message: 'Planned maintenance window scheduled for tonight at 2:00 AM EST. Expected downtime: 30 minutes.',
    type: 'warning',
    category: 'system',
    priority: 'medium',
    read: false,
    starred: false,
    archived: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    metadata: {
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 8)
    }
  },
  {
    id: '3',
    title: 'Team Meeting Reminder',
    message: 'Weekly team standup meeting starts in 15 minutes. Join the video call in the main conference room.',
    type: 'info',
    category: 'team',
    priority: 'medium',
    read: true,
    starred: false,
    archived: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    sender: {
      id: '2',
      name: 'Michael Chen',
      avatar: undefined
    }
  },
  {
    id: '4',
    title: 'Invoice Payment Received',
    message: 'Payment of $45,000 received from TechCorp for Project Alpha. Invoice #INV-2024-001 marked as paid.',
    type: 'success',
    category: 'finance',
    priority: 'low',
    read: true,
    starred: false,
    archived: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
    metadata: {
      amount: 45000,
      projectName: 'Project Alpha'
    }
  },
  {
    id: '5',
    title: 'Project Deadline Approaching',
    message: 'Dashboard redesign project is due in 2 days. Current progress: 85% complete.',
    type: 'warning',
    category: 'project',
    priority: 'high',
    read: false,
    starred: true,
    archived: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
    metadata: {
      projectName: 'Dashboard Redesign',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48)
    }
  },
  {
    id: '6',
    title: 'New Message from Client',
    message: 'Emily Rodriguez sent you a message regarding the healthcare facility project specifications.',
    type: 'message',
    category: 'general',
    priority: 'medium',
    read: true,
    starred: false,
    archived: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    sender: {
      id: '3',
      name: 'Emily Rodriguez',
      avatar: undefined
    }
  }
]

// Utility functions
const formatRelativeTime = (date: Date) => {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
  if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`
  return date.toLocaleDateString()
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    case 'error': return <X className="h-4 w-4 text-red-600" />
    case 'message': return <MessageSquare className="h-4 w-4 text-blue-600" />
    case 'system': return <Settings className="h-4 w-4 text-purple-600" />
    default: return <Info className="h-4 w-4 text-gray-600" />
  }
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'sales': return <DollarSign className="h-4 w-4" />
    case 'team': return <Users className="h-4 w-4" />
    case 'project': return <FileText className="h-4 w-4" />
    case 'finance': return <DollarSign className="h-4 w-4" />
    case 'system': return <Settings className="h-4 w-4" />
    default: return <Bell className="h-4 w-4" />
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low': return 'bg-green-100 text-green-800 border-green-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// Components
const NotificationCard: React.FC<{ 
  notification: Notification
  index: number
  onMarkRead: (id: string) => void
  onToggleStar: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
}> = ({ notification, index, onMarkRead, onToggleStar, onArchive, onDelete }) => {
  const [showActions, setShowActions] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className="group"
    >
      <Card className={cn(
        'border transition-all duration-200 hover:shadow-md',
        notification.read ? 'bg-white' : 'bg-blue-50/50 border-blue-200',
        notification.priority === 'urgent' && 'border-l-4 border-l-red-500',
        notification.priority === 'high' && 'border-l-4 border-l-orange-500'
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Type Icon */}
            <div className="mt-1">
              {getTypeIcon(notification.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className={cn(
                    'font-semibold text-sm',
                    notification.read ? 'text-gray-700' : 'text-gray-900'
                  )}>
                    {notification.title}
                  </h3>
                  {!notification.read && (
                    <div className="h-2 w-2 bg-blue-600 rounded-full" />
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={cn('text-xs', getPriorityColor(notification.priority))}>
                    {notification.priority}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatRelativeTime(notification.timestamp)}
                  </span>
                </div>
              </div>

              <p className={cn(
                'text-sm mb-3',
                notification.read ? 'text-gray-600' : 'text-gray-700'
              )}>
                {notification.message}
              </p>

              {/* Metadata */}
              {notification.metadata && (
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  {notification.metadata.amount && (
                    <span className="font-medium text-green-600">
                      {formatCurrency(notification.metadata.amount)}
                    </span>
                  )}
                  {notification.metadata.dealValue && (
                    <span className="font-medium text-green-600">
                      Deal: {formatCurrency(notification.metadata.dealValue)}
                    </span>
                  )}
                  {notification.metadata.projectName && (
                    <span>Project: {notification.metadata.projectName}</span>
                  )}
                  {notification.metadata.dueDate && (
                    <span>Due: {notification.metadata.dueDate.toLocaleDateString()}</span>
                  )}
                </div>
              )}

              {/* Sender */}
              {notification.sender && (
                <div className="flex items-center gap-2 mb-3">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={notification.sender.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                      {notification.sender.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-600">{notification.sender.name}</span>
                </div>
              )}

              {/* Actions */}
              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center gap-2"
                  >
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMarkRead(notification.id)}
                        className="h-7 px-2 text-xs"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Mark Read
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleStar(notification.id)}
                      className="h-7 px-2 text-xs"
                    >
                      {notification.starred ? (
                        <StarOff className="h-3 w-3 mr-1" />
                      ) : (
                        <Star className="h-3 w-3 mr-1" />
                      )}
                      {notification.starred ? 'Unstar' : 'Star'}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onArchive(notification.id)}
                      className="h-7 px-2 text-xs"
                    >
                      <Archive className="h-3 w-3 mr-1" />
                      Archive
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(notification.id)}
                      className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const NotificationStats: React.FC<{ notifications: Notification[] }> = ({ notifications }) => {
  const stats = useMemo(() => {
    const unread = notifications.filter(n => !n.read && !n.archived).length
    const starred = notifications.filter(n => n.starred && !n.archived).length
    const urgent = notifications.filter(n => n.priority === 'urgent' && !n.read && !n.archived).length
    const today = notifications.filter(n => {
      const today = new Date()
      const notifDate = new Date(n.timestamp)
      return notifDate.toDateString() === today.toDateString() && !n.archived
    }).length

    return { unread, starred, urgent, today }
  }, [notifications])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BellRing className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Unread</p>
              <p className="text-lg font-bold text-gray-900">{stats.unread}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Starred</p>
              <p className="text-lg font-bold text-gray-900">{stats.starred}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Zap className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Urgent</p>
              <p className="text-lg font-bold text-gray-900">{stats.urgent}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Today</p>
              <p className="text-lg font-bold text-gray-900">{stats.today}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Main Component
export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'starred'>('all')

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      if (notification.archived) return false
      
      const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           notification.message.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = selectedCategory === 'all' || notification.category === selectedCategory
      
      const matchesFilter = selectedFilter === 'all' ||
                           (selectedFilter === 'unread' && !notification.read) ||
                           (selectedFilter === 'starred' && notification.starred)
      
      return matchesSearch && matchesCategory && matchesFilter
    })
  }, [notifications, searchQuery, selectedCategory, selectedFilter])

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const handleToggleStar = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, starred: !n.starred } : n
    ))
  }

  const handleArchive = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, archived: true } : n
    ))
  }

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const categories = [
    { value: 'all', label: 'All Categories', icon: Bell },
    { value: 'sales', label: 'Sales', icon: DollarSign },
    { value: 'team', label: 'Team', icon: Users },
    { value: 'project', label: 'Projects', icon: FileText },
    { value: 'finance', label: 'Finance', icon: DollarSign },
    { value: 'system', label: 'System', icon: Settings }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notification Center</h1>
          <p className="text-gray-600 mt-1">Stay updated with important events and messages</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="default" size="sm" onClick={handleMarkAllRead}>
            <Check className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Stats */}
      <NotificationStats notifications={notifications} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Tabs value={selectedFilter} onValueChange={(v) => setSelectedFilter(v as any)}>
            <TabsList className="bg-gray-100">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">Unread</TabsTrigger>
              <TabsTrigger value="starred" className="text-xs">Starred</TabsTrigger>
            </TabsList>
          </Tabs>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification, index) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              index={index}
              onMarkRead={handleMarkRead}
              onToggleStar={handleToggleStar}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-600">
                {searchQuery || selectedFilter !== 'all' || selectedCategory !== 'all'
                  ? 'Try adjusting your filters to see more notifications.'
                  : 'You\'re all caught up! No new notifications at the moment.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default NotificationCenter 