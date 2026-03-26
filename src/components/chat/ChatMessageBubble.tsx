import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, ChevronDown, ChevronRight, Check, Brain, Globe, Search, AlertTriangle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ChatMessage } from '@/types';

const URL_PATTERN = /https?:\/\/[^\s'"<>]+/gi;

function extractUrl(text: string): string | null {
  const m = text.match(URL_PATTERN);
  return m ? m[0] : null;
}

function cleanResponseContent(content: string): string {
  if (!content) return content;
  let c = content;
  c = c.replace(/\n?##\s*sources[\s\S]*/i, '');
  c = c.replace(/\s*->\s*https?:\/\/[^\s)>\]]+/gi, '');
  c = c.replace(/\s*->\s*$/gm, '');
  return c.trim();
}

interface Props {
  message: ChatMessage;
  onConfirmResearch?: (assistantId: string, question: string) => void;
  onDeclineResearch?: (assistantId: string) => void;
  onConfirmReasoning?: (assistantId: string, question: string) => void;
  onDeclineReasoning?: (assistantId: string) => void;
}

const thinkMarkdownComponents = {
  p: ({ children }: any) => <p className="text-[12px] text-muted-foreground leading-[1.7] mb-2 last:mb-0">{children}</p>,
  strong: ({ children }: any) => <strong className="font-semibold text-foreground/80">{children}</strong>,
  em: ({ children }: any) => <em className="italic">{children}</em>,
  code: ({ children }: any) => (
    <code className="px-1 py-0.5 rounded bg-muted text-[11px] font-mono text-foreground/70">{children}</code>
  ),
  ul: ({ children }: any) => <ul className="list-disc pl-4 space-y-0.5 mb-2 text-[12px] text-muted-foreground">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-4 space-y-0.5 mb-2 text-[12px] text-muted-foreground">{children}</ol>,
  li: ({ children }: any) => <li className="text-[12px] text-muted-foreground leading-[1.7]">{children}</li>,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-border pl-3 my-2 text-muted-foreground/70 italic text-[12px]">{children}</blockquote>
  ),
  a: ({ href, children }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">{children}</a>
  ),
};

export function ChatMessageBubble({
  message,
  onConfirmResearch, onDeclineResearch,
  onConfirmReasoning, onDeclineReasoning,
}: Props) {
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

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="max-w-[75%] space-y-1.5">
          <div className="rounded-2xl rounded-br-md bg-[#282A2C] text-[#fff] px-4 py-2.5">
            <p className="text-[14px] leading-relaxed">{message.content}</p>
          </div>
          {urlInMessage && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-[11px] text-muted-foreground">
              <Globe className="h-3 w-3 shrink-0 text-info" />
              <span className="truncate">{urlInMessage}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isResearchConfirm  = message.confirmPending && message.confirmType === 'research';
  const isReasoningConfirm = message.confirmPending && message.confirmType === 'reasoning';
  // Legacy fallback: if confirmPending but no confirmType, treat as research
  const isLegacyConfirm    = message.confirmPending && !message.confirmType;

  return (
    <div className="animate-slide-up">
      <div className="max-w-3xl mx-auto space-y-3">

        {/* Confirmation UI for off-topic deep research */}
        {(isResearchConfirm || isLegacyConfirm) && message.confirmQuestion && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </div>
              <div className="space-y-1">
                <p className="text-[13px] font-medium text-foreground">
                  This question is outside Zoho Desk context
                </p>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Your query <span className="text-foreground font-medium">"{message.confirmQuestion}"</span> doesn't appear to be about Zoho Desk.
                  Would you like to proceed with a general deep research on this topic?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-11">
              <button
                onClick={() => onConfirmResearch?.(message.id, message.confirmQuestion!)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 transition-colors"
              >
                <Search className="h-3 w-3" />
                Yes, research this
              </button>
              <button
                onClick={() => onDeclineResearch?.(message.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              >
                No, cancel
              </button>
            </div>
          </div>
        )}

        {/* Meta badge */}
        {message.meta && !message.isStreaming && !message.confirmPending && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] font-mono tracking-wide uppercase px-2 py-0.5 bg-primary/8 text-primary border-0">
              {message.meta.intent}
            </Badge>
          </div>
        )}

        {/* Thinking section */}
        {message.think && (
          <div className="rounded-xl overflow-hidden border border-border/60 transition-all duration-300">
            {message.isStreaming && (
              <div className="h-[2px] think-shimmer" />
            )}
            <button
              onClick={() => setThinkOpen(!thinkOpen)}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-left hover:bg-muted/30 transition-colors"
            >
              <Brain className={`h-3.5 w-3.5 shrink-0 ${message.isStreaming ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
              <span className="text-[12px] font-medium text-foreground/80">Thinking</span>
              {message.isStreaming ? (
                <span className="flex gap-0.5 ml-1">
                  <span className="w-1 h-1 rounded-full bg-primary animate-typing-dot" />
                  <span className="w-1 h-1 rounded-full bg-primary animate-typing-dot" />
                  <span className="w-1 h-1 rounded-full bg-primary animate-typing-dot" />
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground/50 ml-1">({thinkWordCount} words)</span>
              )}
              <div className="ml-auto">
                {thinkOpen
                  ? <ChevronDown className="h-3 w-3 text-muted-foreground/50" />
                  : <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                }
              </div>
            </button>
            {thinkOpen && (
              <div className="px-4 py-3 border-t border-border/40 bg-muted/20 animate-fade-in">
                <div className="think-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={thinkMarkdownComponents}>
                    {message.think}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main content */}
        {message.content && (
          <div className="chat-markdown text-[14px] text-foreground leading-[1.75] tracking-[-0.005em]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4 rounded-lg border border-border">
                    <table className="w-full text-[13px] border-collapse">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-muted/40">{children}</thead>,
                tbody: ({ children }) => <tbody className="divide-y divide-border/60">{children}</tbody>,
                tr: ({ children }) => {
                  const findHref = (node: any): string | null => {
                    if (!node || typeof node !== 'object') return null;
                    if (node.type === 'a' && node.props?.href) return node.props.href;
                    const kids = node.props?.children;
                    if (!kids) return null;
                    for (const child of (Array.isArray(kids) ? kids : [kids])) {
                      const found = findHref(child);
                      if (found) return found;
                    }
                    return null;
                  };
                  const cells = Array.isArray(children) ? children.flat() : [children];
                  const href = cells.map(findHref).find(Boolean) ?? null;
                  return (
                    <tr
                      className={`divide-x divide-border/30 transition-colors ${href ? 'hover:bg-primary/5 cursor-pointer' : 'hover:bg-muted/20'}`}
                      onClick={() => href && window.open(href, '_blank')}
                    >
                      {children}
                    </tr>
                  );
                },
                th: ({ children }) => (
                  <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground text-[11px] uppercase tracking-wider whitespace-nowrap border-b border-border">
                    {children}
                  </th>
                ),
                td: ({ children }) => {
                  const hasOnlyLink =
                    children &&
                    typeof children === 'object' &&
                    !Array.isArray(children) &&
                    (children as any).type === 'a';
                  if (hasOnlyLink) {
                    return (
                      <td className="px-3 py-2.5 align-top text-[13px]">
                        <span className="text-primary text-[11px] underline underline-offset-2 opacity-60">↗</span>
                      </td>
                    );
                  }
                  return (
                    <td className="px-3 py-2.5 text-foreground align-top text-[13px]">{children}</td>
                  );
                },
                h1: ({ children }) => <h1 className="text-lg font-bold text-foreground mt-6 mb-3 first:mt-0 tracking-tight">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-semibold text-foreground mt-5 mb-2 first:mt-0 tracking-tight">{children}</h2>,
                h3: ({ children }) => <h3 className="text-[14px] font-semibold text-foreground mt-4 mb-1.5 first:mt-0">{children}</h3>,
                p: ({ children }) => <p className="text-[14px] text-foreground leading-[1.75] mb-3 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-3 text-[14px] text-foreground">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-3 text-[14px] text-foreground">{children}</ol>,
                li: ({ children }) => <li className="text-[14px] text-foreground leading-[1.75]">{children}</li>,
                code: ({ inline, children }: any) =>
                  inline ? (
                    <code className="px-1.5 py-0.5 rounded-md bg-muted text-[12px] font-mono text-foreground/80">{children}</code>
                  ) : (
                    <code className="block p-4 rounded-lg bg-muted text-[12px] font-mono text-foreground whitespace-pre-wrap leading-relaxed">{children}</code>
                  ),
                pre: ({ children }) => <pre className="my-3 rounded-lg bg-muted overflow-x-auto">{children}</pre>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-primary/30 pl-4 my-3 text-muted-foreground italic text-[14px]">{children}</blockquote>
                ),
                hr: () => <hr className="border-border my-4" />,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 decoration-primary/30 hover:decoration-primary transition-colors">
                    {children}
                  </a>
                ),
              }}
            >
              {cleanResponseContent(message.content)}
            </ReactMarkdown>
          </div>
        )}

        {/* Streaming dots */}
        {message.isStreaming && !message.content && (
          <div className="flex items-center gap-1.5 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-typing-dot" />
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-typing-dot" />
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-typing-dot" />
          </div>
        )}

        {/* Copy button */}
        {!message.isStreaming && !message.confirmPending && message.content && (
          <div className="flex items-center gap-1 pt-0.5">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 h-7 text-[12px] text-muted-foreground hover:text-foreground px-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}

        {/* Confirmation UI for reasoning loop retry — shown AFTER the response */}
        {isReasoningConfirm && message.confirmQuestion && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <RefreshCw className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-[13px] font-medium text-foreground">
                  Results may be incomplete
                </p>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  The initial search for <span className="text-foreground font-medium">"{message.confirmQuestion}"</span> returned limited results.
                  Would you like me to refine the query and search again with broader terms?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-11">
              <button
                onClick={() => onConfirmReasoning?.(message.id, message.confirmQuestion!)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Yes, refine search
              </button>
              <button
                onClick={() => onDeclineReasoning?.(message.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              >
                Keep current results
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}