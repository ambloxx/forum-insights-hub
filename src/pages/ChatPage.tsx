import { ChatConversation } from '@/components/chat/ChatConversation';
import { ChatContextPanel } from '@/components/chat/ChatContextPanel';
import { useChat } from '@/hooks/useChat';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

export default function ChatPage() {
  const { messages, isStreaming, currentSteps, sendMessage } = useChat();

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-hidden">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={80} minSize={40}>
          <ChatConversation
            messages={messages}
            isStreaming={isStreaming}
            onSendMessage={sendMessage}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={20} minSize={20} className="hidden lg:block">
          <ChatContextPanel
            messages={messages}
            currentSteps={currentSteps}
            isStreaming={isStreaming}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
