import {
  CheckCircle2, XCircle, Clock, Link, Activity,
  Search, Globe, BookOpen, Zap, Database, FileText, Brain,
  Loader2, ChevronDown, ChevronRight, Circle, Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import type { ChatMessage } from '@/types';

interface Props {
  messages: ChatMessage[];
  currentSteps: string[];
  isStreaming: boolean;
}

function stepStatus(step: string, isActive: boolean): 'active' | 'failed' | 'done' {
  if (isActive) return 'active';
  const s = step.toLowerCase();
  if (s.includes('could not') || s.includes('failed') || s.includes('error')) return 'failed';
  return 'done';
}

function stepIcon(step: string) {
  const s = step.toLowerCase();
  if (s.includes('search') || s.includes('query') || s.includes('querying')) return Search;
  if (s.includes('fetch') || s.includes('read') || s.includes('url') || s.includes('web')) return Globe;
  if (s.includes('research') || s.includes('deep') || s.includes('plan')) return BookOpen;
  if (s.includes('vector') || s.includes('embed') || s.includes('database')) return Database;
  if (s.includes('rank') || s.includes('score') || s.includes('found') || s.includes('result')) return Sparkles;
  if (s.includes('generat') || s.includes('answer') || s.includes('synth') || s.includes('response')) return Brain;
  if (s.includes('intent')) return Zap;
  return FileText;
}

function stepLabel(step: string): string {
  return step.replace(/^\[STEP\]/i, '').replace(/\.\.\.$/, '').trim();
}

/* Step node with connector flow */
function StepNode({ step, index, isLast, isActive }: {
  step: string; index: number; isLast: boolean; isActive: boolean;
}) {
  const status = stepStatus(step, isActive);
  const label = stepLabel(step);
  const Icon = stepIcon(step);

  return (
    <div
      className="flex items-start gap-3.5 relative animate-slide-up"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}
    >
      {/* Vertical connector */}
      {!isLast && (
        <div className="absolute left-[14px] top-[30px] w-[1.5px] bottom-0 animate-line-grow"
          style={{
            background: status === 'done'
              ? 'hsl(var(--success) / 0.25)'
              : 'hsl(var(--border))',
            animationDelay: `${index * 80 + 200}ms`,
            animationFillMode: 'backwards'
          }}
        />
      )}

      {/* Step circle */}
      <div className={`relative z-10 shrink-0 w-[28px] h-[28px] rounded-full flex items-center justify-center transition-all duration-300 ${
        status === 'active'
          ? 'bg-primary/15 ring-2 ring-primary/20 animate-orchestration-pulse'
          : status === 'failed'
          ? 'bg-destructive/10 ring-1 ring-destructive/20'
          : 'bg-success/10 ring-1 ring-success/20'
      }`}>
        {status === 'active' ? (
          <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
        ) : status === 'failed' ? (
          <XCircle className="h-3.5 w-3.5 text-destructive" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
        )}
      </div>

      {/* Step label */}
      <div className="flex-1 min-w-0 pt-0.5 pb-5">
        <div className="flex items-start gap-2">
          <Icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${
            status === 'active' ? 'text-primary' : status === 'failed' ? 'text-destructive' : 'text-muted-foreground/60'
          }`} />
          <span className={`text-[13px] leading-snug ${
            status === 'active'
              ? 'text-foreground font-medium'
              : status === 'failed'
              ? 'text-destructive'
              : 'text-muted-foreground'
          }`}>
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ChatContextPanel({ messages, currentSteps, isStreaming }: Props) {
  const [metaOpen, setMetaOpen] = useState(true);
  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');

  const urls = lastAssistant?.content
    ? Array.from(lastAssistant.content.matchAll(/https?:\/\/[^\s)>\]]+/g)).map(m => m[0])
    : [];

  const steps = isStreaming ? currentSteps : (lastAssistant?.steps ?? []);
  const intent = lastAssistant?.meta?.intent ?? '';
  const isDeepResearch = intent === 'deep_research';
  const isUrlRead = intent === 'url_read';

  return (
    <div className="flex flex-col h-full bg-background border-l border-border overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-[14px] font-semibold text-foreground tracking-tight">Orchestration</h3>
          {isStreaming && (
            <span className="ml-auto flex items-center gap-1.5 text-[11px] font-medium text-success">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Pipeline */}
        {steps.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-4">
              Pipeline
            </p>
            <div className="relative">
              {steps.map((step, i) => (
                <StepNode
                  key={i}
                  step={step}
                  index={i}
                  isLast={i === steps.length - 1}
                  isActive={isStreaming && i === steps.length - 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        {lastAssistant && !lastAssistant.isStreaming && lastAssistant.meta && (
          <div>
            <button
              onClick={() => setMetaOpen(!metaOpen)}
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/60 w-full hover:text-muted-foreground transition-colors mb-3"
            >
              {metaOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Metadata
            </button>
            {metaOpen && (
              <div className="rounded-lg border border-border bg-card/50 divide-y divide-border/50 animate-fade-in">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[12px] text-muted-foreground">Intent</span>
                  <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wide bg-primary/10 text-primary border-0">
                    {lastAssistant.meta.intent}
                  </Badge>
                </div>
                {lastAssistant.meta.type && (
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-[12px] text-muted-foreground">Type</span>
                    <span className="text-[12px] font-mono text-foreground">{lastAssistant.meta.type}</span>
                  </div>
                )}
                {lastAssistant.meta.limit && (
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-[12px] text-muted-foreground">Limit</span>
                    <span className="text-[12px] font-mono text-foreground">{lastAssistant.meta.limit}</span>
                  </div>
                )}
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[12px] text-muted-foreground">Steps</span>
                  <span className="text-[12px] font-mono text-foreground">{lastAssistant.steps?.length ?? 0}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sources */}
        {(isDeepResearch || isUrlRead) && urls.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-3">
              Sources
            </p>
            <div className="space-y-1">
              {urls.slice(0, 10).map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-[12px] text-primary hover:text-primary/80 group transition-colors rounded-lg hover:bg-primary/5 px-3 py-2 -mx-1"
                >
                  <Link className="h-3 w-3 shrink-0 text-primary/40 group-hover:text-primary" />
                  <span className="truncate">{url}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!lastAssistant && !isStreaming && (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
              <Clock className="h-5 w-5 text-muted-foreground/25" />
            </div>
            <p className="text-[12px] text-muted-foreground/50 leading-relaxed max-w-[200px]">
              Orchestration details will appear here during queries
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
