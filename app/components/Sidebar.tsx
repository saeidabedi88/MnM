import React from 'react';
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

interface SidebarProps {
  conversations: Array<{
    id: string;
    title: string;
    active?: boolean;
  }>;
  onConversationSelect: (id: string) => void;
  onNewChat: () => void;
}

export function Sidebar({ conversations, onConversationSelect, onNewChat }: SidebarProps) {
  return (
    <aside className="hidden w-[300px] border-r bg-muted/40 lg:block">
      <div className="flex h-full flex-col">
        <div className="px-4 py-4">
          <h2 className="mb-2 px-2 text-lg font-semibold">Conversations</h2>
          <Button
            onClick={onNewChat}
            className="w-full justify-start"
            variant="outline"
          >
            <span className="mr-2">+</span>
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="px-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onConversationSelect(conversation.id)}
                className={`w-full rounded-lg p-2 text-left hover:bg-accent ${
                  conversation.active ? 'bg-accent' : ''
                }`}
              >
                {conversation.title}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
} 