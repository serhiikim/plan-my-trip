// src/components/chat/ChatInterface.jsx
import { useState, useEffect, useRef } from 'react';
import { SendHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageBubble } from './MessageBubble';
import { chatService } from '@/services/chat';
import { cn } from "@/lib/utils";

const WELCOME_MESSAGE = {
  id: 'welcome',
  type: 'assistant',
  content: "Hi! I'm your travel planning assistant. To get started, tell me where you'd like to go and when you're planning to travel."
};

export function ChatInterface() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChatHistory();
    inputRef.current?.focus();
  }, []);

  const loadChatHistory = async () => {
    try {
      const history = await chatService.getChatHistory();
      if (history && history.length > 0) {
        setMessages(history);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message;
    setMessage('');
    setIsLoading(true);

    try {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'user',
        content: userMessage,
        timestamp: new Date()
      }]);

      const response = await chatService.sendMessage(userMessage);

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.message,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      <Card className="flex-1 overflow-hidden flex flex-col bg-muted/50">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
          {isLoading && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="p-4 bg-background border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={isLoading}
              size="icon"
            >
              <SendHorizontal className={cn(
                "h-4 w-4",
                isLoading && "animate-pulse"
              )} />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}