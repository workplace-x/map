import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Plus, Search, Filter, Calendar, Clock, Flag, User, Users,
  CheckCircle2, Circle, AlertTriangle, Star, MoreHorizontal,
  Edit3, Trash2, MessageSquare, Paperclip, Eye, Target,
  TrendingUp, BarChart3, Zap, Timer, PlayCircle, PauseCircle
} from 'lucide-react'

// Types
interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'review' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee?: {
    id: string
    name: string
    avatar?: string
  }
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
  tags: string[]
  comments: number
  attachments: number
  timeTracked?: number
  estimatedTime?: number
  project?: string
}

interface Project {
  id: string
  name: string
  color: string
  progress: number
  tasks: number
  completedTasks: number
  dueDate?: Date
}

// Mock data
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Design new dashboard layout',
    description: 'Create wireframes and mockups for the executive dashboard redesign',
    status: 'in-progress',
    priority: 'high',
    assignee: {
      id: '1',
      name: 'Sarah Johnson',
      avatar: undefined
    },
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    tags: ['design', 'ui/ux', 'dashboard'],
    comments: 3,
    attachments: 2,
    timeTracked: 4.5,
    estimatedTime: 8,
    project: 'Dashboard Redesign'
  },
  {
    id: '2',
    title: 'Implement user authentication',
    description: 'Set up OAuth integration with Azure AD',
    status: 'todo',
    priority: 'urgent',
    assignee: {
      id: '2',
      name: 'Michael Chen',
      avatar: undefined
    },
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
    tags: ['backend', 'security', 'auth'],
    comments: 1,
    attachments: 0,
    estimatedTime: 6,
    project: 'Security Enhancement'
  },
  {
    id: '3',
    title: 'Write API documentation',
    description: 'Document all endpoints with examples and response schemas',
    status: 'review',
    priority: 'medium',
    assignee: {
      id: '3',
      name: 'Emily Rodriguez',
      avatar: undefined
    },
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    tags: ['documentation', 'api'],
    comments: 5,
    attachments: 1,
    timeTracked: 3,
    estimatedTime: 4,
    project: 'Documentation'
  },
  {
    id: '4',
    title: 'Performance optimization',
    description: 'Optimize database queries and implement caching',
    status: 'completed',
    priority: 'high',
    assignee: {
      id: '2',
      name: 'Michael Chen',
      avatar: undefined
    },
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    tags: ['performance', 'backend', 'optimization'],
    comments: 8,
    attachments: 3,
    timeTracked: 12,
    estimatedTime: 10,
    project: 'Performance'
  }
]

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Dashboard Redesign',
    color: 'blue',
    progress: 65,
    tasks: 8,
    completedTasks: 5,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  },
  {
    id: '2',
    name: 'Security Enhancement',
    color: 'red',
    progress: 30,
    tasks: 5,
    completedTasks: 1,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: '3',
    name: 'Documentation',
    color: 'green',
    progress: 80,
    tasks: 4,
    completedTasks: 3,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
  }
]

// Utility functions
const formatTimeTracked = (hours: number) => {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`
  }
  return `${hours.toFixed(1)}h`
}

const formatDueDate = (date: Date) => {
  const now = new Date()
  const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays < 0) {
    return `${Math.abs(diffInDays)} days overdue`
  } else if (diffInDays === 0) {
    return 'Due today'
  } else if (diffInDays === 1) {
    return 'Due tomorrow'
  } else {
    return `Due in ${diffInDays} days`
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 border-green-200'
    case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'review': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'todo': return 'bg-gray-100 text-gray-800 border-gray-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// Components
const TaskCard: React.FC<{ task: Task; index: number }> = ({ task, index }) => {
  const [isTracking, setIsTracking] = useState(false)

  const progressPercentage = task.estimatedTime 
    ? Math.min((task.timeTracked || 0) / task.estimatedTime * 100, 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="group"
    >
      <Card className="bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-5 w-5 p-0 hover:bg-gray-100"
              >
                {task.status === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-400" />
                )}
              </Button>
              <Badge className={cn('text-xs px-2 py-1', getPriorityColor(task.priority))}>
                {task.priority}
              </Badge>
            </div>
            <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Title and Description */}
          <div className="mb-3">
            <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-xs text-gray-600 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {task.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs px-2 py-0.5">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  +{task.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Progress */}
          {task.estimatedTime && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{formatTimeTracked(task.timeTracked || 0)} / {formatTimeTracked(task.estimatedTime)}</span>
              </div>
              <Progress value={progressPercentage} className="h-1.5" />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {task.assignee && (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.assignee.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                    {task.assignee.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {task.comments > 0 && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{task.comments}</span>
                  </div>
                )}
                {task.attachments > 0 && (
                  <div className="flex items-center gap-1">
                    <Paperclip className="h-3 w-3" />
                    <span>{task.attachments}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {task.estimatedTime && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setIsTracking(!isTracking)}
                >
                  {isTracking ? (
                    <PauseCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <PlayCircle className="h-4 w-4 text-green-600" />
                  )}
                </Button>
              )}
              {task.dueDate && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDueDate(task.dueDate)}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const ProjectCard: React.FC<{ project: Project; index: number }> = ({ project, index }) => {
  const colorClasses = {
    blue: 'from-blue-50 to-indigo-50 border-blue-200',
    red: 'from-red-50 to-pink-50 border-red-200',
    green: 'from-green-50 to-emerald-50 border-green-200',
    purple: 'from-purple-50 to-violet-50 border-purple-200',
    orange: 'from-orange-50 to-amber-50 border-orange-200'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className={cn(
        'bg-gradient-to-br border transition-all duration-200 hover:shadow-md',
        colorClasses[project.color as keyof typeof colorClasses]
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-gray-900">{project.name}</h3>
            <Badge variant="outline" className="text-xs">
              {project.completedTasks}/{project.tasks} tasks
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>
            
            {project.dueDate && (
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Due date</span>
                <span>{formatDueDate(project.dueDate)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const TaskColumn: React.FC<{ 
  title: string
  status: string
  tasks: Task[]
  count: number
}> = ({ title, status, tasks, count }) => {
  const statusTasks = tasks.filter(task => task.status === status)

  return (
    <div className="flex-1 min-w-80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <Badge variant="outline" className="text-xs">
            {count}
          </Badge>
        </div>
        <Button variant="ghost" size="icon-sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-3 min-h-96">
        {statusTasks.map((task, index) => (
          <TaskCard key={task.id} task={task} index={index} />
        ))}
      </div>
    </div>
  )
}

// Main Component
export const TaskManagementHub: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [view, setView] = useState<'board' | 'list' | 'calendar'>('board')

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesProject = selectedProject === 'all' || task.project === selectedProject
      return matchesSearch && matchesProject
    })
  }, [tasks, searchQuery, selectedProject])

  const taskCounts = useMemo(() => {
    return {
      todo: filteredTasks.filter(t => t.status === 'todo').length,
      'in-progress': filteredTasks.filter(t => t.status === 'in-progress').length,
      review: filteredTasks.filter(t => t.status === 'review').length,
      completed: filteredTasks.filter(t => t.status === 'completed').length
    }
  }, [filteredTasks])

  const totalTimeTracked = useMemo(() => {
    return tasks.reduce((total, task) => total + (task.timeTracked || 0), 0)
  }, [tasks])

  const completionRate = useMemo(() => {
    const completed = tasks.filter(t => t.status === 'completed').length
    return tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
  }, [tasks])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600 mt-1">Organize and track your team's work efficiently</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="gradient" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Timer className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Time Tracked</p>
                <p className="text-2xl font-bold text-gray-900">{formatTimeTracked(totalTimeTracked)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Projects</option>
          {projects.map(project => (
            <option key={project.id} value={project.name}>{project.name}</option>
          ))}
        </select>
      </div>

      {/* Main Content */}
      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="board">Board View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-6">
          <div className="flex gap-6 overflow-x-auto pb-4">
            <TaskColumn
              title="To Do"
              status="todo"
              tasks={filteredTasks}
              count={taskCounts.todo}
            />
            <TaskColumn
              title="In Progress"
              status="in-progress"
              tasks={filteredTasks}
              count={taskCounts['in-progress']}
            />
            <TaskColumn
              title="Review"
              status="review"
              tasks={filteredTasks}
              count={taskCounts.review}
            />
            <TaskColumn
              title="Completed"
              status="completed"
              tasks={filteredTasks}
              count={taskCounts.completed}
            />
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="space-y-0">
                {filteredTasks.map((task, index) => (
                  <div key={task.id} className="flex items-center gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <Button variant="ghost" size="icon-sm" className="h-5 w-5 p-0">
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm text-gray-900 truncate">{task.title}</h3>
                        <Badge className={cn('text-xs', getPriorityColor(task.priority))}>
                          {task.priority}
                        </Badge>
                        <Badge className={cn('text-xs', getStatusColor(task.status))}>
                          {task.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-600 truncate">{task.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {task.assignee && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={task.assignee.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                              {task.assignee.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span>{task.assignee.name}</span>
                        </div>
                      )}
                      
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDueDate(task.dueDate)}</span>
                        </div>
                      )}
                      
                      {task.timeTracked && task.estimatedTime && (
                        <div className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          <span>{formatTimeTracked(task.timeTracked)} / {formatTimeTracked(task.estimatedTime)}</span>
                        </div>
                      )}
                    </div>

                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default TaskManagementHub 