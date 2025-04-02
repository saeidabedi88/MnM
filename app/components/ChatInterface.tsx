import React from 'react';
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  thinking?: boolean;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSend: (e: React.FormEvent) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  isThinking?: boolean;
}

export function ChatInterface({ 
  messages, 
  onSend, 
  inputValue, 
  setInputValue,
  isThinking 
}: ChatInterfaceProps) {
  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.content}
                {message.thinking && (
                  <div className="animate-pulse">...</div>
                )}
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="rounded-lg px-4 py-2 max-w-[80%] bg-muted">
                <div className="animate-pulse">...</div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="border-t p-4">
        <form onSubmit={onSend} className="flex gap-3">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-background rounded-md border px-3 py-2 text-sm"
          />
          <Button type="submit" disabled={isThinking}>Send</Button>
        </form>
      </div>
    </div>
  );
} 