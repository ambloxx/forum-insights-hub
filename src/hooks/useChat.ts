import { useState, useCallback } from 'react';
import type { ChatMessage } from '@/types';
import { getSessionId } from '@/lib/session';

const API = 'http://issath-3653-ait.tsi.zohocorpin.com:8001';

const genId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
};

async function* readStream(response: Response) {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    for (const line of chunk.split('\n')) {
      if (line.startsWith('data: ')) {
        yield line.slice(6).replace(/\\n/g, '\n');
      }
    }
  }
}

/**
 * Transform the question based on selected mode before sending.
 * - deep_research: prefix with "research " so the detector fires reliably
 * - url_read:      wrap with "read and summarise this URL: ..." so url_handler fires
 * - default:       send as-is
 */
function applyMode(question: string, mode: 'default' | 'deep_research' | 'url_read'): string {
  const q = question.trim();
  if (mode === 'deep_research') {
    // Only prefix if not already a deep-research-style query
    const alreadyDeep = /^(research|deep|explain|analyse|analyze|why|how does)\b/i.test(q);
    return alreadyDeep ? q : `research ${q}`;
  }
  if (mode === 'url_read') {
    // If the query is already a bare URL, wrap it
    const isUrl = /^https?:\/\//i.test(q);
    return isUrl ? `read and summarise this URL: ${q}` : q;
  }
  return q;
}

export function useChat() {
  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming]  = useState(false);
  const [currentSteps, setCurrentSteps] = useState<string[]>([]);

  const _runStream = useCallback(async (
    endpoint: string,
    question: string,
    assistantId: string,
  ) => {
    setIsStreaming(true);
    setCurrentSteps([]);

    const response = await fetch(`${API}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        session_id: getSessionId(),
      }),
    });

    if (!response.ok) throw new Error('Stream request failed');

    let content = '';
    let think   = '';
    let meta: ChatMessage['meta'];
    const steps: string[]   = [];
    const fetches: string[] = [];

    for await (const data of readStream(response)) {
      if (data === '[DONE]') break;

      if (data.startsWith('[META:')) {
        const parts = data.slice(6, -1).split('|');
        meta = { intent: parts[0] || '', type: parts[1] || '', limit: parts[2] || '' };

      } else if (data.startsWith('[STEP]')) {
        const step = data.slice(6);
        steps.push(step);
        setCurrentSteps([...steps]);

      } else if (data.startsWith('[FETCH]')) {
        const fetchInfo = data.slice(7);
        fetches.push(fetchInfo);
        steps.push(`Fetching: ${fetchInfo}`);
        setCurrentSteps([...steps]);

      } else if (data.startsWith('[THINK]')) {
        think += data.slice(7);

      } else if (data.startsWith('[CONFIRM_RESEARCH]')) {
        const originalQuestion = data.slice(18);
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? {
                ...m,
                isStreaming: false,
                confirmPending: true,
                confirmQuestion: originalQuestion,
                meta: { intent: 'deep_research', type: 'all', limit: '20' },
              }
            : m
        ));
        setIsStreaming(false);
        return;

      } else if (data.startsWith('[ERROR]')) {
        content += `\n\n**Error:** ${data.slice(7)}`;

      } else {
        content += data;
      }

      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content, think, meta, steps: [...steps], fetches: [...fetches], isStreaming: true }
          : m
      ));
    }

    setMessages(prev => prev.map(m =>
      m.id === assistantId
        ? { ...m, content, think, meta, steps: [...steps], fetches: [...fetches], isStreaming: false }
        : m
    ));
  }, []);

  const sendMessage = useCallback(async (
    question: string,
    mode: 'default' | 'deep_research' | 'url_read' = 'default',
  ) => {
    const finalQuestion = applyMode(question, mode);

    const userMsg: ChatMessage = {
      id: genId(), role: 'user',
      // Show original question in bubble, but send transformed version to API
      content: question,
      steps: [], fetches: [], timestamp: new Date(),
    };
    const assistantId = genId();
    const assistantMsg: ChatMessage = {
      id: assistantId, role: 'assistant', content: '',
      think: '', steps: [], fetches: [], timestamp: new Date(), isStreaming: true,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);

    try {
      await _runStream('/ask/stream', finalQuestion, assistantId);
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
  }, [_runStream]);

  const confirmResearch = useCallback(async (
    assistantId: string,
    question: string,
  ) => {
    setMessages(prev => prev.map(m =>
      m.id === assistantId
        ? { ...m, confirmPending: false, content: '', isStreaming: true, steps: [], fetches: [] }
        : m
    ));
    try {
      await _runStream('/ask/stream/confirmed', question, assistantId);
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
  }, [_runStream]);

  const declineResearch = useCallback((assistantId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === assistantId
        ? {
            ...m,
            confirmPending: false,
            content: "Research cancelled. Feel free to ask me anything about the **Zoho Desk** forum instead.",
            isStreaming: false,
          }
        : m
    ));
  }, []);

  return {
    messages, isStreaming, currentSteps,
    sendMessage, confirmResearch, declineResearch,
  };
}