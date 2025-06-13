import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Upload, FileText, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageList } from './message-list';
import { ChatHeader } from './chat-header';
import { DocumentPanel } from './document-panel';
import { AnalysisPanel } from './analysis-panel';
import { useChatStore } from '../stores/chatStore';
import { aiService } from '../services/aiService';
import type { EnhancedMessage } from '../types/chat';

export function ChatInterface() {
  const {
    currentSession,
    messages,
    isLoading,
    error,
    setError,
    addMessage,
    updateMessage,
    setIsLoading,
    createNewSession,
    loadSessions,
    setCurrentSession,
    setMessages
  } = useChatStore();

  const [input, setInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load messages when session changes
  useEffect(() => {
    if (currentSession?.id) {
      loadMessages();
    }
  }, [currentSession?.id]);

  const loadMessages = async () => {
    if (!currentSession?.id) return;
    
    try {
      setIsLoading(true);
      const sessionMessages = await aiService.loadMessages(currentSession.id);
      setMessages(sessionMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError('Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const messageText = input.trim();
    setInput('');

    try {
      // Create new session if none exists
      let sessionId = currentSession?.id;
      if (!sessionId) {
        const newSession = await createNewSession(messageText.slice(0, 50));
        sessionId = newSession.id;
      }

      if (!sessionId) {
        throw new Error('Failed to get or create session');
      }

      // Add user message optimistically
      const userMessage: EnhancedMessage = {
        id: `user-${Date.now()}`,
        content: messageText,
        role: 'user',
        timestamp: new Date(),
        status: 'delivered',
        sources: [],
        confidence: 1,
        citations: [],
        followUpQuestions: [],
        attachments: [],
        mentions: [],
        reactions: [],
        helpfulVotes: 0,
      };

      addMessage(userMessage);
      setIsLoading(true);
      setError(null);

      // Create AI message placeholder for streaming
      const aiMessage: EnhancedMessage = {
        id: `ai-${Date.now()}`,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        status: 'sending',
        sources: [],
        confidence: 0.8,
        citations: [],
        followUpQuestions: [
          "Would you like me to analyze a specific RFP document?",
          "Do you need help with compliance requirements?",
          "Should I help you generate a response template?",
          "Would you like to upload documents for analysis?"
        ],
        attachments: [],
        mentions: [],
        reactions: [],
        helpfulVotes: 0,
      };

      addMessage(aiMessage);

      // Use streaming API
      await aiService.sendMessageStreaming(
        messageText,
        sessionId,
        // On chunk received
        (chunk: string) => {
          updateMessage(aiMessage.id, {
            content: (messages.find(m => m.id === aiMessage.id)?.content || '') + chunk,
            status: 'sending'
          });
        },
        // On complete
        (fullResponse: string, metadata?: any) => {
          // Extract sources from metadata if available
          const sources = metadata?.sources?.map((source: any) => ({
            id: source.id || `source-${Math.random()}`,
            title: source.title || source.filename || 'Unknown Document',
            relevanceScore: source.relevanceScore || 0,
            excerpt: source.content || '',
            source: source.metadata?.filename || source.title || 'Unknown',
            metadata: source.metadata || {}
          })) || [];

          updateMessage(aiMessage.id, {
            content: fullResponse,
            status: 'delivered',
            confidence: metadata?.confidence || 0.85,
            sources: sources,
            // Add follow-up questions based on whether we found context
            followUpQuestions: metadata?.hasContext ? [
              "Can you provide more details about these documents?",
              "Do you have questions about specific requirements?",
              "Would you like me to analyze any particular section?",
              "Should I help you generate a response based on this information?"
            ] : [
              "Would you like me to analyze a specific RFP document?",
              "Do you need help with compliance requirements?",
              "Should I help you generate a response template?",
              "Would you like to upload documents for analysis?"
            ]
          });
          setIsLoading(false);
        },
        // On error
        (error: string) => {
          updateMessage(aiMessage.id, {
            content: 'I apologize, but I encountered an error while processing your request. Please try again.',
            status: 'error'
          });
          setError(`Streaming error: ${error}`);
          setIsLoading(false);
        }
      );

    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again.');
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    console.log('Starting file upload for', files.length, 'files'); // Debug log

    try {
      setIsLoading(true);
      setError(null);

      // Create session if needed
      let sessionId = currentSession?.id;
      if (!sessionId) {
        console.log('Creating new session for file upload');
        const newSession = await createNewSession('Document Upload Session');
        sessionId = newSession.id;
      }

      console.log('Uploading to session:', sessionId);

      for (const file of Array.from(files)) {
        try {
          console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
          const result = await aiService.uploadDocument(file, sessionId);
          console.log(`Successfully uploaded ${file.name}:`, result);
          
          // Add a message about the upload
          const uploadMessage: EnhancedMessage = {
            id: `upload-${Date.now()}-${Math.random()}`,
            content: `📄 Uploaded document: **${result.filename}** (${(result.size / 1024 / 1024).toFixed(2)} MB)\n\nProcessing status: ${result.processingStatus}`,
            role: 'assistant',
            timestamp: new Date(),
            status: 'delivered',
            sources: [],
            confidence: 1,
            citations: [],
            followUpQuestions: [
              "Would you like me to analyze this document?",
              "Do you have questions about the uploaded content?",
              "Should I extract key requirements from this document?"
            ],
            attachments: [{
              id: result.id,
              name: result.filename,
              type: result.type,
              size: result.size,
              url: '',
              uploadStatus: 'completed' as const
            }],
            mentions: [],
            reactions: [],
            helpfulVotes: 0,
          };

          addMessage(uploadMessage);
        } catch (uploadError) {
          console.error(`Failed to upload ${file.name}:`, uploadError);
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
          setError(`Failed to upload ${file.name}: ${errorMessage}`);
          
          // Add an error message to the chat
          const errorChatMessage: EnhancedMessage = {
            id: `error-${Date.now()}-${Math.random()}`,
            content: `❌ Failed to upload document: **${file.name}**\n\nError: ${errorMessage}`,
            role: 'assistant',
            timestamp: new Date(),
            status: 'error',
            sources: [],
            confidence: 0,
            citations: [],
            followUpQuestions: [
              "Would you like to try uploading again?",
              "Do you need help with supported file formats?",
              "Should I help you with a different approach?"
            ],
            attachments: [],
            mentions: [],
            reactions: [],
            helpfulVotes: 0,
          };

          addMessage(errorChatMessage);
        }
      }
    } catch (error) {
      console.error('General upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to upload files: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const dismissError = () => {
    setError(null);
  };

  // Welcome screen when no session or messages
  if (!currentSession || messages.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <ChatHeader />
        
        {error && (
          <Alert className="mx-4 mt-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 flex items-center justify-between">
              {error}
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissError}
                className="h-auto p-1 text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to AI Composer
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Your intelligent assistant for RFP analysis and response generation. 
              Upload documents, ask questions, and get expert insights.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Card className="p-4 text-left hover:shadow-md transition-shadow">
                <FileText className="w-6 h-6 text-blue-500 mb-2" />
                <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">Document Analysis</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Upload and analyze RFP documents with AI-powered insights</p>
              </Card>
              
              <Card className="p-4 text-left hover:shadow-md transition-shadow">
                <Send className="w-6 h-6 text-green-500 mb-2" />
                <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">Smart Responses</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Generate compelling responses based on your requirements</p>
              </Card>
              
              <Card className="p-4 text-left hover:shadow-md transition-shadow">
                <Plus className="w-6 h-6 text-purple-500 mb-2" />
                <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">Collaborative Review</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Share and collaborate on RFP responses with your team</p>
              </Card>
            </div>

            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <p>Try asking:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full">"Analyze this RFP"</span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full">"Help me write a response"</span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full">"What are the key requirements?"</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Message Input */}
        <div className="border-t bg-white p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleFileUpload}
                className="shrink-0"
                disabled={isLoading}
              >
                <Upload className="w-4 h-4" />
              </Button>
              
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  placeholder="Ask me anything about RFPs, upload documents, or request analysis..."
                  className="min-h-[44px] max-h-32 resize-none pr-12"
                  disabled={isLoading}
                />
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  // Chat interface with messages
  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader />
        
        {error && (
          <Alert className="mx-4 mt-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 flex items-center justify-between">
              {error}
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissError}
                className="h-auto p-1 text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <MessageList />

        {/* Message Input */}
        <div className="border-t bg-white p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleFileUpload}
                className="shrink-0"
                disabled={isLoading}
              >
                <Upload className="w-4 h-4" />
              </Button>
              
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  placeholder="Type your message..."
                  className="min-h-[44px] max-h-32 resize-none pr-12 text-gray-900 placeholder-gray-500"
                  disabled={isLoading}
                />
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Side Panels - Responsive width */}
      <div className="w-80 max-w-[320px] min-w-[280px] border-l bg-gray-50 flex-shrink-0 overflow-hidden">
        <div className="h-full flex flex-col">
          <DocumentPanel />
          <AnalysisPanel />
        </div>
      </div>
    </div>
  );
} 