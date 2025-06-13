import React, { useRef } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useChatStore } from '../stores/chatStore';
import { aiService } from '../services/aiService';
import type { DocumentContext, EnhancedMessage } from '../types/chat';

export function DocumentPanel() {
  const { documents, currentSession, addMessage, setError } = useChatStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    try {
      // Create session if needed
      let sessionId = currentSession?.id;
      if (!sessionId) {
        console.error('No active session for document upload');
        setError('Please start a chat session before uploading documents');
        return;
      }

      for (const file of Array.from(files)) {
        try {
          const result = await aiService.uploadDocument(file, sessionId);
          console.log(`Uploaded ${file.name}:`, result);
          
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
          setError(`Failed to upload ${file.name}: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload files');
    } finally {
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="h-1/2 border-b p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Documents</h3>
        <Button variant="outline" size="sm" onClick={handleUploadClick}>
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No documents uploaded</p>
          </div>
        ) :
          documents.map((doc: DocumentContext) => (
            <Card key={doc.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {doc.title}
                  </h4>
                  {doc.metadata && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {doc.metadata.filename} • {Math.round((doc.metadata.size || 0) / 1024)}KB
                    </div>
                  )}
                  {doc.metadata?.processingStatus && (
                    <div className="text-xs mt-1 text-gray-600 dark:text-gray-300">
                      Status: <span className="capitalize">{doc.metadata.processingStatus}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        }
      </div>

      {/* Hidden file input */}
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