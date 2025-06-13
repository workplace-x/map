export interface EnhancedMessage {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: Date
  status: 'sending' | 'sent' | 'delivered' | 'error'
  
  // AI enhancements
  sources: DocumentSource[]
  confidence: number
  citations: Citation[]
  followUpQuestions: string[]
  
  // Rich content
  attachments: Attachment[]
  mentions: Mention[]
  reactions: Reaction[]
  
  // Analytics
  readTime?: number
  helpfulVotes: number
  metadata?: Record<string, any>
}

export interface DocumentSource {
  id: string
  title: string
  excerpt: string
  relevanceScore: number
  pageNumber?: number
  documentType: 'pdf' | 'docx' | 'excel' | 'image'
  url?: string
}

export interface Citation {
  id: string
  text: string
  sourceId: string
  startIndex: number
  endIndex: number
}

export interface Attachment {
  id: string
  name: string
  size: number
  type: string
  url?: string
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'error'
  uploadProgress?: number
}

export interface Mention {
  id: string
  userId: string
  username: string
  startIndex: number
  endIndex: number
}

export interface Reaction {
  id: string
  type: 'up' | 'down' | 'helpful' | 'flag'
  userId: string
  timestamp: Date
}

export interface ChatSession {
  id: string
  title: string
  messages?: EnhancedMessage[]
  createdAt: Date
  updatedAt: Date
  tags: string[]
  isArchived: boolean
  documentContext?: DocumentContext
  settings: ChatSettings
  collaborators?: string[]
  isShared: boolean
}

export interface ChatSettings {
  aiPersona: 'general' | 'legal' | 'technical' | 'commercial'
  responseStyle: 'concise' | 'detailed' | 'analytical'
  includeSourcesAlways: boolean
  enableFollowUpQuestions: boolean
  language: string
  maxTokens?: number
}

export interface DocumentContext {
  id: string
  title: string
  uploadedAt: Date
  processedAt?: Date
  status: 'processing' | 'ready' | 'error'
  totalChunks: number
  totalPages?: number
  fileSize: number
  fileType: string
  metadata: DocumentMetadata
}

export interface DocumentMetadata {
  author?: string
  createdDate?: Date
  modifiedDate?: Date
  keywords: string[]
  summary?: string
  language?: string
  confidence: number
  filename?: string
  size?: number
  type?: string
  uploadedAt?: Date
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed'
  analysis?: AnalysisResult
}

export interface AICapabilities {
  reasoning: boolean
  webSearch: boolean
  codeExecution: boolean
  imageAnalysis: boolean
  documentAnalysis: boolean
  dataVisualization: boolean
  customInstructions: boolean
}

export interface StreamingResponse {
  content: string
  sources: DocumentSource[]
  confidence: number
  citations: Citation[]
  followUpQuestions: string[]
  isComplete: boolean
}

export interface ChatStore {
  // State
  sessions: ChatSession[]
  activeSessionId: string | null
  isLoading: boolean
  isStreamingMessage: boolean
  streamingContent: string
  error: string | null
  
  // UI State
  sidebarCollapsed: boolean
  selectedMessageId: string | null
  searchQuery: string
  showDocumentPanel: boolean
  
  // Actions
  createSession: (title?: string, context?: DocumentContext) => Promise<ChatSession>
  deleteSession: (sessionId: string) => Promise<void>
  archiveSession: (sessionId: string) => Promise<void>
  setActiveSession: (sessionId: string) => void
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>
  
  sendMessage: (content: string, attachments?: File[]) => Promise<void>
  regenerateMessage: (messageId: string) => Promise<void>
  addReaction: (messageId: string, reaction: Reaction['type']) => Promise<void>
  searchMessages: (query: string) => void
  
  // UI Actions
  toggleSidebar: () => void
  toggleDocumentPanel: () => void
  selectMessage: (messageId: string | null) => void
  clearError: () => void
  setSearchQuery: (query: string) => void
}

export interface UploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
}

export type ReactionType = Reaction['type']
export type MessageStatus = EnhancedMessage['status']
export type MessageRole = EnhancedMessage['role']

export interface AnalysisResult {
  summary: string;
  keyPoints: string[];
  requirements: string[];
  recommendations: string[];
  confidence: number;
} 