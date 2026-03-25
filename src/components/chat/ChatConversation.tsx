import { useRef, useEffect } from 'react';
import type { ChatMessage } from '@/types';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatInput } from './ChatInput';
import { WelcomeScreen } from './WelcomeScreen';

interface Props {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSendMessage: (msg: string, mode?: 'default' | 'deep_research' | 'url_read') => void;
  onConfirmResearch: (assistantId: string, question: string) => void;
  onDeclineResearch: (assistantId: string) => void;
}

export function ChatConversation({
  messages,
  isStreaming,
  onSendMessage,
  onConfirmResearch,
  onDeclineResearch,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-background">
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        {messages.length === 0 ? (
          <WelcomeScreen onQuerySelect={onSendMessage} />
        ) : (
          <div className="max-w-[680px] mx-auto py-6 px-4 space-y-6">
            {messages.map(msg => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                onConfirmResearch={onConfirmResearch}
                onDeclineResearch={onDeclineResearch}
              />
            ))}
          </div>
        )}
      </div>
      <ChatInput onSend={onSendMessage} isStreaming={isStreaming} />
    </div>
  );
}