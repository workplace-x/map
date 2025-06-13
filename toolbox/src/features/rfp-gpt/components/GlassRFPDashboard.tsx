import React from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  FileText, 
  Zap, 
  MessageSquare,
  Upload,
  Download,
  BarChart3,
  Clock,
  CheckCircle,
  Sparkles
} from 'lucide-react'
import { 
  GlassPageWrapper, 
  GlassGrid, 
  GlassKPICard,
  GlassSectionDivider 
} from '@/components/layout/glass-layout'
import { GlassCard, GlassBadge, GlassButton } from '@/components/ui/glass-card'

// Mock data for AI tools
const aiMetrics = [
  {
    title: 'Documents Processed',
    value: '1,247',
    subtitle: 'this month',
    icon: FileText,
    trend: { value: 23.5, direction: 'up' as const, label: 'vs last month' },
    color: 'success' as const
  },
  {
    title: 'AI Responses Generated',
    value: '3,891',
    subtitle: 'total queries',
    icon: Brain,
    trend: { value: 18.2, direction: 'up' as const, label: 'this week' },
    color: 'default' as const
  },
  {
    title: 'Processing Speed',
    value: '2.3s',
    subtitle: 'average response time',
    icon: Zap,
    trend: { value: 12.1, direction: 'down' as const, label: 'improvement' },
    color: 'success' as const
  },
  {
    title: 'Accuracy Rate',
    value: '96.8%',
    subtitle: 'content analysis',
    icon: CheckCircle,
    trend: { value: 4.2, direction: 'up' as const, label: 'this quarter' },
    color: 'success' as const
  }
]

const recentDocuments = [
  {
    id: 1,
    name: 'Healthcare RFP - Memorial Hospital',
    type: 'RFP Analysis',
    status: 'completed',
    time: '2 hours ago',
    size: '2.4 MB'
  },
  {
    id: 2,
    name: 'Office Furniture Specifications',
    type: 'Document Processing',
    status: 'processing',
    time: '1 hour ago',
    size: '1.8 MB'
  },
  {
    id: 3,
    name: 'Design Guidelines - Corporate',
    type: 'Content Analysis',
    status: 'completed',
    time: '3 hours ago',
    size: '3.2 MB'
  },
  {
    id: 4,
    name: 'Vendor Comparison Report',
    type: 'AI Summary',
    status: 'completed',
    time: '5 hours ago',
    size: '1.1 MB'
  }
]

const aiCapabilities = [
  {
    title: 'Document Analysis',
    description: 'Extract key insights from RFPs and proposals',
    icon: FileText,
    color: 'bg-blue-500/20'
  },
  {
    title: 'Smart Responses',
    description: 'Generate contextual responses to queries',
    icon: MessageSquare,
    color: 'bg-green-500/20'
  },
  {
    title: 'Content Summarization',
    description: 'Create concise summaries of complex documents',
    icon: BarChart3,
    color: 'bg-purple-500/20'
  },
  {
    title: 'Intelligent Search',
    description: 'Find relevant information across all documents',
    icon: Sparkles,
    color: 'bg-orange-500/20'
  }
]

export function GlassRFPDashboard() {
  return (
    <GlassPageWrapper
      title="AI Composer"
      description="Harness the power of artificial intelligence for document processing and analysis"
      section="ai"
      showParticles
    >
      {/* AI Metrics */}
      <GlassGrid cols={4} className="mb-8">
        {aiMetrics.map((metric, index) => (
          <GlassKPICard
            key={index}
            title={metric.title}
            value={metric.value}
            subtitle={metric.subtitle}
            icon={metric.icon}
            trend={metric.trend}
            color={metric.color}
          />
        ))}
      </GlassGrid>

      <GlassSectionDivider 
        title="AI Capabilities" 
        subtitle="Explore what our AI can do for you"
      />

      {/* AI Capabilities Grid */}
      <GlassGrid cols={4} className="mb-8">
        {aiCapabilities.map((capability, index) => (
          <GlassCard key={index} variant="elevated" interactive animated className="p-6">
            <div className={`p-4 rounded-xl ${capability.color} mb-4 w-fit`}>
              <capability.icon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{capability.title}</h3>
            <p className="text-white/70 text-sm">{capability.description}</p>
          </GlassCard>
        ))}
      </GlassGrid>

      <GlassSectionDivider 
        title="Document Processing" 
        subtitle="Upload and analyze your documents with AI"
      />

      {/* Main Content */}
      <GlassGrid cols={3} gap="lg" className="mb-8">
        {/* Upload Area */}
        <GlassCard variant="elevated" className="col-span-2 p-8">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">Upload Documents</h3>
              <p className="text-white/70">Drag and drop your files here or click to browse</p>
            </div>
            
            <motion.div
              className="border-2 border-dashed border-white/30 rounded-2xl p-12 mb-6 
                         hover:border-white/50 transition-all duration-300 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-white/60">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p className="text-lg">Drop files here</p>
                <p className="text-sm">Supports PDF, DOC, DOCX, TXT</p>
              </div>
            </motion.div>
            
            <div className="flex gap-4 justify-center">
              <GlassButton variant="primary">
                <Upload className="h-4 w-4 mr-2" />
                Choose Files
              </GlassButton>
              <GlassButton variant="secondary">
                <Brain className="h-4 w-4 mr-2" />
                Start Analysis
              </GlassButton>
            </div>
          </div>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard variant="elevated" className="p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Quick Actions</h3>
          <div className="space-y-4">
            <GlassButton variant="primary" className="w-full justify-start">
              <MessageSquare className="h-5 w-5 mr-3" />
              New Chat Session
            </GlassButton>
            <GlassButton variant="default" className="w-full justify-start">
              <FileText className="h-5 w-5 mr-3" />
              Document Library
            </GlassButton>
            <GlassButton variant="default" className="w-full justify-start">
              <BarChart3 className="h-5 w-5 mr-3" />
              Analytics Dashboard
            </GlassButton>
            <GlassButton variant="default" className="w-full justify-start">
              <Download className="h-5 w-5 mr-3" />
              Export Results
            </GlassButton>
          </div>
        </GlassCard>
      </GlassGrid>

      <GlassSectionDivider 
        title="Recent Activity" 
        subtitle="Your latest document processing history"
      />

      {/* Recent Documents */}
      <GlassCard variant="elevated" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Recent Documents</h3>
          <GlassBadge variant="default">{recentDocuments.length} items</GlassBadge>
        </div>
        
        <div className="space-y-4">
          {recentDocuments.map((doc) => (
            <motion.div
              key={doc.id}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 
                         backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">{doc.name}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-white/60 text-sm">{doc.type}</span>
                    <span className="text-white/40 text-sm">•</span>
                    <span className="text-white/60 text-sm">{doc.size}</span>
                    <span className="text-white/40 text-sm">•</span>
                    <span className="text-white/60 text-sm">{doc.time}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <GlassBadge 
                  variant={doc.status === 'completed' ? 'success' : 'warning'}
                >
                  {doc.status === 'completed' ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 mr-1" />
                      Processing
                    </>
                  )}
                </GlassBadge>
                
                <motion.button
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Download className="h-4 w-4 text-white" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </GlassPageWrapper>
  )
} 