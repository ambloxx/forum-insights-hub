import { Circle, CheckCircle2, Clock, Link, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChatMessage } from '@/types';

interface Props {
  messages: ChatMessage[];
  currentSteps: string[];
  isStreaming: boolean;
}

export function ChatContextPanel({ messages, currentSteps, isStreaming }: Props) {
  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');

  const urls = lastAssistant?.content
    ? Array.from(lastAssistant.content.matchAll(/https?:\/\/[^\s)>\]]+/g)).map(m => m[0])
    : [];

  const steps = isStreaming ? currentSteps : lastAssistant?.steps || [];

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto scrollbar-thin space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Context Panel</h3>
      </div>

      {/* Pipeline Steps */}
      {steps.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pipeline Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {steps.map((step, i) => {
                const isLast = isStreaming && i === currentSteps.length - 1;
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    {isLast ? (
                      <Circle className="h-3.5 w-3.5 text-primary mt-0.5 animate-pulse-dot shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                    )}
                    <span className="text-xs font-mono text-muted-foreground leading-relaxed">{step}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      {lastAssistant && !lastAssistant.isStreaming && lastAssistant.meta && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Intent</span>
                <Badge variant="secondary" className="font-mono text-xs">{lastAssistant.meta.intent}</Badge>
              </div>
              {lastAssistant.meta.type && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Type</span>
                  <span className="text-foreground font-mono">{lastAssistant.meta.type}</span>
                </div>
              )}
              {lastAssistant.meta.limit && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Limit</span>
                  <span className="text-foreground font-mono">{lastAssistant.meta.limit}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Steps</span>
                <span className="text-foreground font-mono">{lastAssistant.steps.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sources */}
      {lastAssistant?.meta?.intent === 'deep_research' && urls.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {urls.slice(0, 10).map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-primary hover:underline group"
                >
                  <Link className="h-3 w-3 shrink-0 text-primary/60 group-hover:text-primary" />
                  <span className="truncate">{url}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!lastAssistant && !isStreaming && (
        <div className="flex flex-col items-center justify-center flex-1 text-center py-12">
          <Clock className="h-8 w-8 text-muted-foreground/20 mb-3" />
          <p className="text-xs text-muted-foreground">
            Pipeline details will appear here during queries
          </p>
        </div>
      )}
    </div>
  );
}
