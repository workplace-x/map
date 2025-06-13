import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { type RFPChat, type RFPMessage, type RFPContextType } from '../data/rfp-types'
import { apiFetch } from '../apiFetch'
import { useAuth } from '@/stores/authStore'

const RFPContext = createContext<RFPContextType | undefined>(undefined)

export function useRFP() {
  const context = useContext(RFPContext)
  if (!context) {
    throw new Error('useRFP must be used within an RFPProvider')
  }
  return context
}

interface RFPProviderProps {
  children: ReactNode
}

export function RFPProvider({ children }: RFPProviderProps) {
  const [chats, setChats] = useState<RFPChat[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const { accessToken, refreshSession } = useAuth()

  // On mount, fetch all chats and their messages
  useEffect(() => {
    const fetchChats = async () => {
      if (!accessToken) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        console.log('accessToken:', accessToken); // DEBUG: log the accessToken before API call
        const chatList = await apiFetch<Array<{ id: string; title: string; created_at: string; document_url: string }>>('/api/rfp-gpt/chats', {}, accessToken)
        // For each chat, fetch its messages
        const chatsWithMessages: RFPChat[] = await Promise.all(
          chatList.map(async (chat) => {
            const messages = await apiFetch<Array<{
              id: string;
              content: string;
              sender: string;
              role?: 'user' | 'assistant';
              timestamp: string;
              sources: any[];
              question_id: string;
              feedback: 'up' | 'down' | 'flag';
            }>>(`/api/rfp-gpt/chats/${chat.id}/messages`, {}, accessToken)
            return {
              id: chat.id,
              title: chat.title,
              documentUrl: chat.document_url,
              uploadedAt: new Date(chat.created_at),
              messages: messages.map((m) => ({
                id: m.id,
                content: m.content,
                role: m.role || (m.sender === 'user' ? 'user' : 'assistant'),
                timestamp: new Date(m.timestamp),
                sources: m.sources,
                questionId: m.question_id,
                feedback: m.feedback,
              }))
            }
          })
        )
        setChats(chatsWithMessages)
        if (chatsWithMessages.length > 0) setSelectedChatId(chatsWithMessages[0].id)
        else setSelectedChatId(undefined)
      } catch (err) {
        console.error('Error fetching chats:', err)
        // If we get a 401, try to refresh the session
        if (err instanceof Error && err.message.includes('401')) {
          await refreshSession()
        }
      } finally {
        setLoading(false)
      }
    }

    fetchChats()
  }, [accessToken, refreshSession])

  const addMessage = async (chatId: string, message: RFPMessage) => {
    // Optimistically update UI
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, message] }
          : chat
      )
    )
    // Persist to backend
    try {
      await apiFetch(`/api/rfp-gpt/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: message.role,
          content: message.content,
          timestamp: message.timestamp,
          sources: message.sources,
          question_id: message.questionId,
          feedback: message.feedback,
        })
      }, accessToken || undefined)
    } catch (err) {
      console.error('Error adding message:', err)
    }
  }

  const createChat = async (title: string, documentUrl: string): Promise<RFPChat> => {
    try {
      const chat = await apiFetch<{ id: string; title: string; created_at: string }>('/api/rfp-gpt/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      }, accessToken || undefined)
      const newChat: RFPChat = {
        id: chat.id,
        title: chat.title,
        documentUrl,
        uploadedAt: new Date(chat.created_at),
        messages: []
      }
      setChats(prevChats => [...prevChats, newChat])
      setSelectedChatId(newChat.id)
      return newChat
    } catch (err) {
      console.error('Error creating chat:', err)
      throw err
    }
  }

  const deleteChat = (chatId: string) => {
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId))
    if (selectedChatId === chatId) {
      setSelectedChatId(undefined)
    }
    // Optionally: call backend to delete chat
  }

  const value: RFPContextType = {
    chats,
    selectedChatId,
    setSelectedChatId,
    addMessage,
    createChat,
    deleteChat
  }

  return <RFPContext.Provider value={value}>{children}</RFPContext.Provider>
} 