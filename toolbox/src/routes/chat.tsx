import { createFileRoute } from '@tanstack/react-router';
import { ChatInterface } from '@/features/chat/components/ChatInterface';
import { DocumentManager } from '@/features/chat/components/DocumentManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const Route = createFileRoute('/chat')({
  component: ChatPage,
});

export function ChatPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">AI Assistant</h1>
      
      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat">
          <ChatInterface />
        </TabsContent>
        
        <TabsContent value="documents">
          <DocumentManager />
        </TabsContent>
      </Tabs>
    </div>
  );
} 