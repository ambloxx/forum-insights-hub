import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

  const thinkWordCount = message.think
    ? message.think.split(/\s+/).filter(Boolean).length
    : 0;

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
      <div className="flex items-start gap-2 max-w-[95%] w-full">
        <div className="shrink-0 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
          <Bot className="h-3.5 w-3.5 text-primary" />
        </div>

        <div className="space-y-2 min-w-0 flex-1">
          {/* Step indicator while streaming */}
          {message.isStreaming && message.steps.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
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
            <div
              className={`rounded-md border overflow-hidden ${
                message.isStreaming ? 'border-primary/40' : 'border-border'
              }`}
            >
              <button
                onClick={() => setThinkOpen(!thinkOpen)}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary/50 transition-colors"
              >
                {thinkOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                Thought process
                {!message.isStreaming && ` (${thinkWordCount} words)`}
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

          {/* Markdown content */}
          <div className="markdown-body text-sm text-foreground leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Tables
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3 rounded-md border border-border">
                    <table className="w-full text-xs border-collapse">{children}</table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-muted/60">{children}</thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-border">{children}</tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
                ),
                th: ({ children }) => (
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap border-b border-border">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 text-foreground align-top">{children}</td>
                ),
                // Headings
                h1: ({ children }) => (
                  <h1 className="text-base font-semibold text-foreground mt-4 mb-2 first:mt-0">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-sm font-semibold text-foreground mt-3 mb-1.5 first:mt-0">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-medium text-foreground mt-2 mb-1 first:mt-0">
                    {children}
                  </h3>
                ),
                // Paragraphs
                p: ({ children }) => (
                  <p className="text-sm text-foreground leading-relaxed mb-2 last:mb-0">
                    {children}
                  </p>
                ),
                // Bold
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
                // Lists
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1 mb-2 text-sm text-foreground pl-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-1 mb-2 text-sm text-foreground pl-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-sm text-foreground leading-relaxed">{children}</li>
                ),
                // Code
                code: ({ inline, children }: any) =>
                  inline ? (
                    <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono text-primary">
                      {children}
                    </code>
                  ) : (
                    <code className="block p-3 rounded-md bg-muted text-xs font-mono text-foreground whitespace-pre-wrap">
                      {children}
                    </code>
                  ),
                pre: ({ children }) => (
                  <pre className="my-2 rounded-md bg-muted overflow-x-auto">{children}</pre>
                ),
                // Blockquote
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-muted-foreground italic text-sm">
                    {children}
                  </blockquote>
                ),
                // Horizontal rule
                hr: () => <hr className="border-border my-3" />,
                // Links
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Skeleton while streaming with no content yet */}
          {message.isStreaming && !message.content && (
            <div className="space-y-2 pt-1">
              <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
            </div>
          )}

          {/* Copy button */}
          {!message.isStreaming && message.content && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
            >
              {copied ? (
                <Check className="h-3 w-3 mr-1" />
              ) : (
                <Copy className="h-3 w-3 mr-1" />
              )}
              {copied ? 'Copied' : 'Copy response'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}