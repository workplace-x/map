import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Message {
  id: string;
  question: string;
  answer: string;
  isGeneralQuestion: boolean;
  timestamp: string;
  sources?: any[];
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneralQuestion, setIsGeneralQuestion] = useState(false);
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    setIsLoading(true);
    const question = input.trim();
    setInput('');

    try {
      const response = await fetch('/api/chat/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          question,
          isGeneralQuestion,
          askedBy: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: data.questionId,
        question,
        answer: data.answer,
        isGeneralQuestion,
        timestamp: new Date().toISOString(),
        sources: data.sources,
      }]);
    } catch (error) {
      console.error('Error:', error);
      // Handle error appropriately
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto h-[80vh] flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-xl font-semibold">Chat Assistant</h2>
        <div className="flex items-center space-x-2">
          <Switch
            id="question-type"
            checked={isGeneralQuestion}
            onCheckedChange={setIsGeneralQuestion}
          />
          <Label htmlFor="question-type">
            {isGeneralQuestion ? 'General Chat' : 'RFP Assistant'}
          </Label>
        </div>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages.map((message) => (
          <div key={message.id} className="mb-4">
            <div className="bg-muted p-3 rounded-lg mb-2">
              <p className="font-medium">You:</p>
              <p>{message.question}</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-lg">
              <p className="font-medium">Assistant:</p>
              <p>{message.answer}</p>
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <p className="font-medium">Sources:</p>
                  <ul className="list-disc pl-4">
                    {message.sources.map((source, index) => (
                      <li key={index}>{source.filename}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isGeneralQuestion ? "Ask anything..." : "Ask about RFP documents..."}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>
    </Card>
  );
} 