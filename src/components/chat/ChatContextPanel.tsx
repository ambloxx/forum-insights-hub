import { Circle, CheckCircle2, Clock, Link } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ChatMessage } from '@/types';

interface Props {
  messages: ChatMessage[];
  currentSteps: string[];
  isStreaming: boolean;
}

export function ChatContextPanel({ messages, currentSteps, isStreaming }: Props) {
  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');

  // Extract URLs from content for deep_research
  const urls = lastAssistant?.content
    ? Array.from(lastAssistant.content.matchAll(/https?:\/\/[^\s)>\]]+/g)).map(m => m[0])
    : [];

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto scrollbar-thin">
      <h3 className="text-sm font-semibold text-foreground mb-4">Context Panel</h3>

      {/* Steps timeline */}
      {(isStreaming ? currentSteps : lastAssistant?.steps || []).length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Pipeline Steps
          </h4>
          <div className="space-y-2">
            {(isStreaming ? currentSteps : lastAssistant?.steps || []).map((step, i) => {
              const isLast = isStreaming && i === currentSteps.length - 1;
              return (
                <div key={i} className="flex items-start gap-2">
                  {isLast ? (
                    <Circle className="h-3 w-3 text-primary mt-0.5 animate-pulse-dot shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3 text-success mt-0.5 shrink-0" />
                  )}
                  <span className="text-xs font-mono text-muted-foreground">{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Metadata */}
      {lastAssistant && !lastAssistant.isStreaming && lastAssistant.meta && (
        <div className="mb-6">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Metadata
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Intent</span>
              <Badge variant="secondary" className="font-mono text-xs">{lastAssistant.meta.intent}</Badge>
            </div>
            {lastAssistant.meta.type && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Type</span>
                <span className="text-foreground">{lastAssistant.meta.type}</span>
              </div>
            )}
            {lastAssistant.meta.limit && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Limit</span>
                <span className="text-foreground">{lastAssistant.meta.limit}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Steps</span>
              <span className="text-foreground">{lastAssistant.steps.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sources for deep_research */}
      {lastAssistant?.meta?.intent === 'deep_research' && urls.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Sources
          </h4>
          <div className="space-y-1.5">
            {urls.slice(0, 10).map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-primary hover:underline truncate"
              >
                <Link className="h-3 w-3 shrink-0" />
                <span className="truncate">{url}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!lastAssistant && !isStreaming && (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <Clock className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">
            Pipeline details will appear here during queries
          </p>
        </div>
      )}
    </div>
  );
}
