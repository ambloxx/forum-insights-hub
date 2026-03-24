import { useState } from 'react';
import { ChatConversation } from '@/components/chat/ChatConversation';
import { ChatContextPanel } from '@/components/chat/ChatContextPanel';
import { useChat } from '@/hooks/useChat';

export default function ChatPage() {
  const { messages, isStreaming, currentSteps, sendMessage } = useChat();

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="flex-[3] flex flex-col border-r border-border min-w-0">
        <ChatConversation
          messages={messages}
          isStreaming={isStreaming}
          onSendMessage={sendMessage}
        />
      </div>
      <div className="flex-[2] flex flex-col min-w-0 hidden lg:flex">
        <ChatContextPanel
          messages={messages}
          currentSteps={currentSteps}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}
