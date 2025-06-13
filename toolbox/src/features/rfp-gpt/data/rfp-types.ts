export interface RFPChat {
  id: string
  title: string
  documentUrl: string
  uploadedAt: Date
  messages: RFPMessage[]
}

export interface RFPMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  sources?: any[]
  questionId?: string
  feedback?: 'up' | 'down' | 'flag'
}

export interface RFPContextType {
  chats: RFPChat[]
  selectedChatId: string | undefined
  setSelectedChatId: (id: string | undefined) => void
  addMessage: (chatId: string, message: RFPMessage) => void
  createChat: (title: string, documentUrl: string) => Promise<RFPChat>
  deleteChat: (chatId: string) => void
} 