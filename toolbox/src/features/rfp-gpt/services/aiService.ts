import { apiFetch } from '@/lib/api-client';
import { azureAdAuth } from '@/lib/azureAdClient';
import type { ChatSession, EnhancedMessage, DocumentContext, AnalysisResult } from '../types/chat';

export interface SendMessageResponse {
  content: string;
  metadata?: {
    sources?: string[];
    confidence?: number;
    responseType?: 'analysis' | 'generation' | 'clarification';
  };
}

export interface UploadDocumentResponse {
  id: string;
  filename: string;
  size: number;
  type: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
}

class AIService {
  private baseURL = '/api';

  private async getAccessToken(): Promise<string | undefined> {
    try {
      // Use Azure AD authentication instead of localStorage
      const token = await azureAdAuth.getAccessToken();
      return token;
    } catch (error) {
      console.error('Error getting Azure AD auth token:', error);
      return undefined;
    }
  }

  async loadSessions(): Promise<ChatSession[]> {
    try {
      const token = await this.getAccessToken();
      // Use correct RFP GPT endpoint
      const response = await apiFetch(`${this.baseURL}/rfp-gpt/chats`, {}, token);
      
      // Transform backend session format to frontend ChatSession format
      const sessions = (response || []).map((session: any) => ({
        id: session.id,
        title: session.title || 'Untitled Chat',
        messages: [], // Messages loaded separately when session is selected
        createdAt: new Date(session.created_at || session.uploadedAt),
        updatedAt: new Date(session.updated_at || session.created_at || session.uploadedAt),
        tags: session.tags || [],
        isArchived: session.is_archived || false,
        documentContext: session.document_context,
        settings: session.settings || {
          aiPersona: 'general',
          responseStyle: 'detailed',
          includeSourcesAlways: true,
          enableFollowUpQuestions: true,
          language: 'en'
        },
        collaborators: session.collaborators || [],
        isShared: session.is_shared || false
      }));
      
      return sessions;
    } catch (error) {
      console.error('Failed to load sessions:', error);
      return [];
    }
  }

  async createSession(title?: string): Promise<ChatSession> {
    try {
      const token = await this.getAccessToken();
      // Use correct RFP GPT endpoint
      const response = await apiFetch(`${this.baseURL}/rfp-gpt/chats`, {
        method: 'POST',
        body: JSON.stringify({
          title: title || `Chat ${new Date().toLocaleDateString()}`
        })
      }, token);
      
      // Transform response to match ChatSession interface
      return {
        id: response.id,
        title: response.title || title || 'New Chat',
        messages: [],
        createdAt: new Date(response.created_at),
        updatedAt: new Date(response.created_at),
        tags: [],
        isArchived: false,
        documentContext: undefined,
        settings: {
          aiPersona: 'general',
          responseStyle: 'detailed',
          includeSourcesAlways: true,
          enableFollowUpQuestions: true,
          language: 'en'
        },
        collaborators: [],
        isShared: false
      };
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('Failed to create new chat session');
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      // Note: Backend doesn't have delete endpoint yet, so this is a placeholder
      await apiFetch(`${this.baseURL}/rfp-gpt/chats/${sessionId}`, {
        method: 'DELETE'
      }, token);
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw new Error('Failed to delete chat session');
    }
  }

  async loadMessages(sessionId: string): Promise<EnhancedMessage[]> {
    try {
      const token = await this.getAccessToken();
      // Use correct RFP GPT endpoint
      const response = await apiFetch(`${this.baseURL}/rfp-gpt/chats/${sessionId}/messages`, {}, token);
      
      console.log('Backend messages response:', response); // Debug log
      
      // Transform backend message format to frontend EnhancedMessage format
      const messages = (response.messages || response || []).map((msg: any) => {
        console.log('Processing message:', msg); // Debug log
        
        return {
          id: msg.id || `msg-${Date.now()}-${Math.random()}`,
          content: msg.content,
          role: msg.role || (msg.sender === 'user' ? 'user' : 'assistant'), // Handle both role and sender fields
          timestamp: new Date(msg.created_at || msg.timestamp || Date.now()),
          status: msg.status || 'delivered',
          sources: msg.sources || [],
          confidence: msg.metadata?.confidence || (msg.role === 'user' ? 1 : 0.8),
          citations: msg.citations || [],
          followUpQuestions: msg.followUpQuestions || [],
          attachments: msg.attachments || [],
          mentions: msg.mentions || [],
          reactions: msg.reactions || [],
          helpfulVotes: msg.helpfulVotes || 0,
          metadata: msg.metadata || {}
        };
      });
      
      console.log('Transformed messages:', messages); // Debug log
      
      return messages;
    } catch (error) {
      console.error('Failed to load messages:', error);
      return [];
    }
  }

  async sendMessage(content: string, sessionId: string): Promise<SendMessageResponse> {
    try {
      const token = await this.getAccessToken();
      // Use correct RFP GPT endpoint
      const response = await apiFetch(`${this.baseURL}/rfp-gpt/chats/${sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          sender: 'user'
        })
      }, token);

      return {
        content: response.content || response.answer || response.assistantResponse || 'I received your message.',
        metadata: response.metadata || {
          responseType: 'generation',
          confidence: 0.8,
          sources: response.sources || []
        }
      };
    } catch (error) {
      console.error('Failed to send message:', error);
      // Return a fallback response instead of throwing
      return {
        content: 'I apologize, but I\'m experiencing some technical difficulties right now. Please try again in a moment.',
        metadata: {
          responseType: 'clarification',
          confidence: 0.5
        }
      };
    }
  }

  async sendMessageStreaming(
    content: string, 
    sessionId: string,
    onChunk?: (chunk: string) => void,
    onComplete?: (fullResponse: string, metadata?: any) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    try {
      const token = await this.getAccessToken();
      
      // Check if streaming endpoint exists, otherwise fall back to regular send
      const response = await fetch(`${this.baseURL}/rfp-gpt/chats/${sessionId}/messages/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          sender: 'user'
        })
      });

      if (!response.ok) {
        // Fall back to regular message sending if streaming not available
        const fallbackResponse = await this.sendMessage(content, sessionId);
        onComplete?.(fallbackResponse.content, fallbackResponse.metadata);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                switch (data.type) {
                  case 'streamChunk':
                    fullResponse += data.content;
                    onChunk?.(data.content);
                    break;
                  case 'streamComplete':
                    onComplete?.(fullResponse, data.metadata);
                    break;
                  case 'error':
                    onError?.(data.error);
                    break;
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Streaming error:', error);
      onError?.(error instanceof Error ? error.message : 'Unknown streaming error');
    }
  }

  async uploadDocument(file: File, sessionId?: string): Promise<UploadDocumentResponse> {
    try {
      const token = await this.getAccessToken();
      const formData = new FormData();
      formData.append('file', file);
      if (sessionId) {
        formData.append('sessionId', sessionId);
      }

      // Use correct RFP GPT upload endpoint
      const response = await apiFetch(`${this.baseURL}/rfp-gpt/upload`, {
        method: 'POST',
        body: formData,
        headers: {} // Let browser set Content-Type for FormData
      }, token);

      const document = response.document || response;
      return {
        id: document?.id || `doc-${Date.now()}`,
        filename: document?.filename || file.name,
        size: document?.size || file.size,
        type: document?.type || file.type,
        processingStatus: document?.processingStatus || 'processing'
      };
    } catch (error) {
      console.error('Failed to upload document:', error);
      throw new Error('Failed to upload document');
    }
  }

  async analyzeDocument(documentId: string): Promise<AnalysisResult> {
    try {
      const token = await this.getAccessToken();
      const response = await apiFetch(`${this.baseURL}/rfp-gpt/documents/${documentId}/analyze`, {
        method: 'POST'
      }, token);

      return {
        summary: response.analysis?.summary || 'Document analysis is being processed.',
        keyPoints: response.analysis?.keyPoints || [],
        requirements: response.analysis?.requirements || [],
        recommendations: response.analysis?.recommendations || [],
        confidence: response.analysis?.confidence || 0.7
      };
    } catch (error) {
      console.error('Failed to analyze document:', error);
      throw new Error('Failed to analyze document');
    }
  }

  async searchDocuments(query: string, sessionId?: string): Promise<DocumentContext[]> {
    try {
      const token = await this.getAccessToken();
      const params = new URLSearchParams({ query });
      if (sessionId) {
        params.append('sessionId', sessionId);
      }

      const response = await apiFetch(`${this.baseURL}/rfp-gpt/documents/search?${params}`, {}, token);
      return response.documents || [];
    } catch (error) {
      console.error('Failed to search documents:', error);
      return [];
    }
  }

  async getSessionDocuments(sessionId: string): Promise<DocumentContext[]> {
    try {
      const token = await this.getAccessToken();
      const response = await apiFetch(`${this.baseURL}/rfp-gpt/chats/${sessionId}/documents`, {}, token);
      
      // Transform backend document format to frontend DocumentContext format
      const documents = (response.documents || response || []).map((doc: any) => ({
        id: doc.id,
        title: doc.filename,
        excerpt: 'Document content preview...',
        source: doc.filename,
        relevanceScore: 1.0,
        metadata: {
          filename: doc.filename,
          size: doc.size,
          type: doc.type,
          uploadedAt: new Date(doc.uploadedAt),
          processingStatus: doc.processingStatus,
          analysis: doc.analysis || {}
        }
      }));
      
      return documents;
    } catch (error) {
      console.error('Failed to load session documents:', error);
      return [];
    }
  }

  async generateResponse(prompt: string, context?: {
    documents?: DocumentContext[];
    previousMessages?: EnhancedMessage[];
    responseType?: 'analysis' | 'generation' | 'clarification';
  }): Promise<SendMessageResponse> {
    try {
      const token = await this.getAccessToken();
      const response = await apiFetch(`${this.baseURL}/rfp-gpt/generate`, {
        method: 'POST',
        body: JSON.stringify({
          prompt,
          context: context || {}
        })
      }, token);

      return {
        content: response.generated_text || 'I\'m processing your request and will provide a detailed response shortly.',
        metadata: {
          responseType: context?.responseType || 'generation',
          confidence: response.confidence || 0.8,
          sources: response.sources || []
        }
      };
    } catch (error) {
      console.error('Failed to generate response:', error);
      return {
        content: 'I\'m having trouble generating a response right now. Please try rephrasing your question.',
        metadata: {
          responseType: 'clarification',
          confidence: 0.3
        }
      };
    }
  }
}

export const aiService = new AIService(); 