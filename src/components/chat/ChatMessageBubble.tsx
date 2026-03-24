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
        <div className="flex items-start gap-2.5 max-w-[80%]">
          <div className="rounded-2xl bg-primary/15 border border-primary/20 px-4 py-2.5">
            <p className="text-sm text-foreground leading-relaxed">{message.content}</p>
          </div>
          <div className="shrink-0 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2.5 max-w-[90%]">
        <div className="shrink-0 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
          <Bot className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="space-y-2.5 min-w-0 flex-1">
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
            <div className={`rounded-lg border ${message.isStreaming ? 'think-border' : 'border-border'} overflow-hidden`}>
              <button
                onClick={() => setThinkOpen(!thinkOpen)}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:bg-secondary/50 transition-colors"
              >
                {thinkOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Thought process {!message.isStreaming && `(${thinkWordCount} words)`}
              </button>
              {thinkOpen && (
                <div className="px-3 py-2 border-t border-border bg-muted/30">
                  <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-words leading-relaxed">
                    {message.think}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Content with proper markdown table styling */}
          <div className="chat-markdown prose prose-sm prose-invert max-w-none text-foreground">
            <ReactMarkdown
              components={{
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3 rounded-lg border border-border">
                    <table className="w-full text-sm">{children}</table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-secondary/50">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground border-b border-border whitespace-nowrap">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 text-xs text-muted-foreground border-b border-border/50">{children}</td>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-secondary/20 transition-colors">{children}</tr>
                ),
                strong: ({ children }) => (
                  <strong className="text-foreground font-semibold">{children}</strong>
                ),
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {children}
                  </a>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-sm text-foreground/90 leading-relaxed">{children}</li>
                ),
                p: ({ children }) => (
                  <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
                ),
                code: ({ children, className }) => {
                  const isInline = !className;
                  if (isInline) {
                    return <code className="text-xs bg-secondary/80 px-1.5 py-0.5 rounded font-mono text-primary">{children}</code>;
                  }
                  return (
                    <code className="block text-xs bg-secondary/50 p-3 rounded-lg font-mono overflow-x-auto">{children}</code>
                  );
                },
                h1: ({ children }) => <h1 className="text-lg font-bold text-foreground mt-4 mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold text-foreground mt-3 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold text-foreground mt-3 mb-1">{children}</h3>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-primary/50 pl-3 my-2 text-muted-foreground italic">{children}</blockquote>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
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
