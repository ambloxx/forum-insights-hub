import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, ChevronDown, ChevronRight, Check, User, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ChatMessage } from '@/types';

interface Props {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: Props) {
  const [thinkOpen, setThinkOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const thinkWordCount = message.think ? message.think.split(/\s+/).filter(Boolean).length : 0;

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex items-start gap-2 max-w-[80%]">
          <div className="rounded-lg bg-primary/15 border border-primary/20 px-4 py-2.5">
            <p className="text-sm text-foreground">{message.content}</p>
          </div>
          <div className="shrink-0 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2 max-w-[85%]">
        <div className="shrink-0 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
          <Bot className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="space-y-2 min-w-0">
          {/* Step indicator while streaming */}
          {message.isStreaming && message.steps.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />
              <span className="font-mono">{message.steps[message.steps.length - 1]}</span>
            </div>
          )}

          {/* Meta badge */}
          {message.meta && (
            <Badge variant="secondary" className="text-xs font-mono">
              {message.meta.intent}
            </Badge>
          )}

          {/* Think section */}
          {message.think && (
            <div className={`rounded-md border ${message.isStreaming ? 'think-border' : 'border-border'} overflow-hidden`}>
              <button
                onClick={() => setThinkOpen(!thinkOpen)}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary/50 transition-colors"
              >
                {thinkOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Thought process {!message.isStreaming && `(${thinkWordCount} words)`}
              </button>
              {thinkOpen && (
                <div className="px-3 py-2 border-t border-border bg-muted/30">
                  <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-words">
                    {message.think}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="prose prose-sm prose-invert max-w-none text-foreground">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>

          {/* Skeleton while streaming with no content */}
          {message.isStreaming && !message.content && (
            <div className="space-y-2">
              <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
            </div>
          )}

          {/* Copy button */}
          {!message.isStreaming && message.content && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
              {copied ? 'Copied' : 'Copy response'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
