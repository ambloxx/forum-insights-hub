import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, ChevronDown, ChevronRight, Check, Brain, Globe, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ChatMessage } from '@/types';

const URL_PATTERN = /https?:\/\/[^\s'"<>]+/gi;

function extractUrl(text: string): string | null {
  const m = text.match(URL_PATTERN);
  return m ? m[0] : null;
}

interface Props {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: Props) {
  const [thinkOpen, setThinkOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const urlInMessage = isUser ? extractUrl(message.content) : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const thinkWordCount = message.think
    ? message.think.split(/\s+/).filter(Boolean).length
    : 0;

  // User message — right-aligned minimal bubble
  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="max-w-[75%] space-y-1.5">
          <div className="rounded-2xl rounded-br-md bg-foreground text-background px-4 py-2.5">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          {urlInMessage && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-xs text-muted-foreground">
              <Globe className="h-3 w-3 shrink-0 text-info" />
              <span className="truncate">{urlInMessage}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant message — left-aligned with full features
  return (
    <div className="animate-slide-up">
      <div className="max-w-3xl mx-auto space-y-3">
        {/* Intent badge */}
        {message.meta && !message.isStreaming && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] font-mono tracking-wide uppercase px-2 py-0.5 bg-primary/8 text-primary border-0">
              {message.meta.intent}
            </Badge>
          </div>
        )}

        {/* Thinking section */}
        {message.think && (
          <div
            className={`rounded-xl border overflow-hidden transition-all duration-300 ${
              message.isStreaming ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'
            }`}
          >
            <button
              onClick={() => setThinkOpen(!thinkOpen)}
              className="flex items-center gap-2 w-full px-3.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Brain className={`h-3.5 w-3.5 ${message.isStreaming ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
              <span className="font-medium">Thinking</span>
              {!message.isStreaming && (
                <span className="text-muted-foreground/60 ml-1">({thinkWordCount} words)</span>
              )}
              {message.isStreaming && (
                <span className="flex gap-0.5 ml-1">
                  <span className="w-1 h-1 rounded-full bg-primary animate-typing-dot" />
                  <span className="w-1 h-1 rounded-full bg-primary animate-typing-dot" />
                  <span className="w-1 h-1 rounded-full bg-primary animate-typing-dot" />
                </span>
              )}
              <div className="ml-auto">
                {thinkOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </div>
            </button>
            {thinkOpen && (
              <div className="px-3.5 py-2.5 border-t border-border/50 bg-muted/20">
                <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-words leading-relaxed">
                  {message.think}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Markdown content */}
        <div className="chat-markdown text-sm text-foreground leading-[1.7] tracking-[-0.01em]">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ children }) => (
                <div className="overflow-x-auto my-4 rounded-xl border border-border">
                  <table className="w-full text-[13px] border-collapse">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-muted/50">{children}</thead>
              ),
              tbody: ({ children }) => (
                <tbody className="divide-y divide-border">{children}</tbody>
              ),
              tr: ({ children }) => (
                <tr className="hover:bg-muted/20 transition-colors">{children}</tr>
              ),
              th: ({ children }) => (
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-3 py-2.5 text-foreground align-top">{children}</td>
              ),
              h1: ({ children }) => (
                <h1 className="text-lg font-bold text-foreground mt-6 mb-3 first:mt-0 tracking-tight">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-base font-semibold text-foreground mt-5 mb-2 first:mt-0 tracking-tight">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-semibold text-foreground mt-4 mb-1.5 first:mt-0">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="text-sm text-foreground leading-[1.7] mb-3 last:mb-0">{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">{children}</strong>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-5 space-y-1 mb-3 text-sm text-foreground">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-5 space-y-1 mb-3 text-sm text-foreground">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-sm text-foreground leading-[1.7]">{children}</li>
              ),
              code: ({ inline, children }: any) =>
                inline ? (
                  <code className="px-1.5 py-0.5 rounded-md bg-muted text-xs font-mono text-primary">{children}</code>
                ) : (
                  <code className="block p-4 rounded-lg bg-muted text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed">{children}</code>
                ),
              pre: ({ children }) => (
                <pre className="my-3 rounded-xl bg-muted overflow-x-auto">{children}</pre>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-primary/40 pl-4 my-3 text-muted-foreground italic text-sm">{children}</blockquote>
              ),
              hr: () => <hr className="border-border my-4" />,
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 decoration-primary/30 hover:decoration-primary transition-colors">
                  {children}
                </a>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Streaming skeleton */}
        {message.isStreaming && !message.content && (
          <div className="flex items-center gap-1.5 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-typing-dot" />
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-typing-dot" />
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-typing-dot" />
          </div>
        )}

        {/* Action buttons */}
        {!message.isStreaming && message.content && (
          <div className="flex items-center gap-1 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 text-xs text-muted-foreground hover:text-foreground px-2 rounded-lg"
            >
              {copied ? <Check className="h-3 w-3 mr-1.5" /> : <Copy className="h-3 w-3 mr-1.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
