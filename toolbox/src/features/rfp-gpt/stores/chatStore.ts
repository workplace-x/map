import { create } from 'zustand'
import { 
  ChatStore, 
  ChatSession, 
  EnhancedMessage, 
  DocumentContext,
  ReactionType,
  StreamingResponse
} from '../types/chat'
import { aiService } from '../services/aiService'
import { immer } from 'zustand/middleware/immer'

// Simplified store interface that matches component expectations
interface SimpleChatStore {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  messages: EnhancedMessage[];
  documents: DocumentContext[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setError: (error: string | null) => void;
  addMessage: (message: EnhancedMessage) => void;
  updateMessage: (id: string, updates: Partial<EnhancedMessage>) => void;
  setIsLoading: (loading: boolean) => void;
  createNewSession: (title?: string) => Promise<ChatSession>;
  deleteSession: (sessionId: string) => Promise<void>;
  loadSessions: () => Promise<void>;
  setCurrentSession: (session: ChatSession | null) => void;
  setMessages: (messages: EnhancedMessage[]) => void;
  loadDocuments: (sessionId?: string) => Promise<void>;
}

const useChatStoreNew = create<SimpleChatStore>((set, get) => ({
  currentSession: null,
  sessions: [],
  messages: [],
  documents: [],
  isLoading: false,
  error: null,

  setError: (error) => set({ error }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    )
  })),
  
  setIsLoading: (isLoading) => set({ isLoading }),
  
  createNewSession: async (title) => {
    try {
      const session = await aiService.createSession(title);
      set((state) => ({ 
        currentSession: session, 
        sessions: [session, ...state.sessions],
        messages: [],
        documents: [] // Clear documents when switching sessions
      }));
      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  },

  deleteSession: async (sessionId) => {
    try {
      await aiService.deleteSession(sessionId);
      set((state) => ({
        sessions: state.sessions.filter(s => s.id !== sessionId),
        currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
        messages: state.currentSession?.id === sessionId ? [] : state.messages,
        documents: state.currentSession?.id === sessionId ? [] : state.documents
      }));
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  },
  
  loadSessions: async () => {
    try {
      const sessions = await aiService.loadSessions();
      set({ sessions });
      if (sessions.length > 0 && !get().currentSession) {
        set({ currentSession: sessions[0] });
        // Load documents for the first session
        get().loadDocuments(sessions[0].id);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      set({ error: 'Failed to load chat sessions' });
    }
  },

  setCurrentSession: (session) => {
    set({ currentSession: session });
    // Load documents when session changes
    if (session?.id) {
      get().loadDocuments(session.id);
    }
  },
  
  setMessages: (messages) => set({ messages }),

  loadDocuments: async (sessionId) => {
    if (!sessionId) return;
    
    try {
      const documents = await aiService.getSessionDocuments(sessionId);
      set({ documents });
    } catch (error) {
      console.error('Failed to load documents:', error);
      // Don't set error for documents loading failure - it's not critical
    }
  }
}));

// Use the simple store as the main export
export const useChatStore = useChatStoreNew;

// Legacy exports for backward compatibility (but they all point to the same store)
export const useChatStoreFull = useChatStoreNew;
export const useChatStoreMinimal = useChatStoreNew;

// Selectors for optimized subscriptions
export const useActiveChatSession = () => 
  useChatStore(state => state.currentSession);

export const useFilteredSessions = () =>
  useChatStore(state => state.sessions.filter(s => !s.isArchived));

export const useStreamingState = () =>
  useChatStore(state => ({
    isStreaming: state.isLoading,
    content: ''
  }));

export const useChatUIState = () =>
  useChatStore(state => ({
    sidebarCollapsed: false,
    showDocumentPanel: false,
    selectedMessageId: null,
    error: state.error,
    isLoading: state.isLoading
  })); 