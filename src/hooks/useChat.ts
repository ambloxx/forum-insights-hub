import { useState, useCallback, useRef } from 'react';
import { streamChat } from '@/lib/api';
import type { ChatMessage } from '@/types';

// crypto.randomUUID() requires HTTPS — use this fallback for HTTP previews
const genId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentSteps, setCurrentSteps] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (question: string) => {
    const userMsg: ChatMessage = {
      id: genId(),
      role: 'user',
      content: question,
      steps: [],
      timestamp: new Date(),
    };

    const assistantId = genId();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      think: '',
      steps: [],
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);
    setCurrentSteps([]);

    try {
      const response = await streamChat(question);
      if (!response.ok) throw new Error('Stream request failed');

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let content = '';
      let think = '';
      let meta: ChatMessage['meta'] = undefined;
      const steps: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).replace(/\\n/g, '\n');

          if (data === '[DONE]') break;
          else if (data.startsWith('[META:')) {
            const parts = data.slice(6, -1).split('|');
            meta = { intent: parts[0] || '', type: parts[1] || '', limit: parts[2] || '' };
          } else if (data.startsWith('[STEP]')) {
            const step = data.slice(6);
            steps.push(step);
            setCurrentSteps([...steps]);
          } else if (data.startsWith('[THINK]')) {
            think += data.slice(7);
          } else if (data.startsWith('[ERROR]')) {
            content += `\n\n**Error:** ${data.slice(7)}`;
          } else {
            content += data;
          }

          setMessages(prev => prev.map(m =>
            m.id === assistantId
              ? { ...m, content, think, meta, steps: [...steps], isStreaming: true }
              : m
          ));
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content, think, meta, steps: [...steps], isStreaming: false }
          : m
      ));
    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: `Error: ${err.message}`, isStreaming: false }
          : m
      ));
    } finally {
      setIsStreaming(false);
      setCurrentSteps([]);
    }
  }, []);

  return { messages, isStreaming, currentSteps, sendMessage };
}