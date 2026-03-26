import { ChatConversation } from '@/components/chat/ChatConversation';
import { ChatContextPanel } from '@/components/chat/ChatContextPanel';
import { useChat } from '@/hooks/useChat';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ChatPage() {
  const {
    messages, isStreaming, currentSteps,
    sendMessage,
    confirmResearch, declineResearch,
    confirmReasoning, declineReasoning,
  } = useChat();
  const [contextOpen, setContextOpen] = useState(true);

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-hidden">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={contextOpen ? 72 : 100} minSize={50}>
          <div className="relative h-full">
            <ChatConversation
              messages={messages}
              isStreaming={isStreaming}
              onSendMessage={sendMessage}
              onConfirmResearch={confirmResearch}
              onDeclineResearch={declineResearch}
              onConfirmReasoning={confirmReasoning}
              onDeclineReasoning={declineReasoning}
            />
            {!contextOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setContextOpen(true)}
                className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <PanelRightOpen className="h-4 w-4" />
              </Button>
            )}
          </div>
        </ResizablePanel>

        {contextOpen && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={28} minSize={20} maxSize={45}>
              <div className="relative h-full">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setContextOpen(false)}
                  className="absolute top-2.5 right-2.5 z-20 h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                >
                  <PanelRightClose className="h-3.5 w-3.5" />
                </Button>
                <ChatContextPanel
                  messages={messages}
                  currentSteps={currentSteps}
                  isStreaming={isStreaming}
                />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}