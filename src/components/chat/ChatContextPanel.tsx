import {
  Circle, CheckCircle2, XCircle, Clock, Link, Activity,
  Search, Globe, BookOpen, Zap, Database, FileText, Brain,
  Loader2, ChevronDown, ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import type { ChatMessage } from '@/types';

interface Props {
  messages: ChatMessage[];
  currentSteps: string[];
  isStreaming: boolean;
}

/* ── Step helpers ────────────────────────────── */
function stepStatus(step: string, isActive: boolean): 'active' | 'failed' | 'done' {
  if (isActive) return 'active';
  const s = step.toLowerCase();
  if (s.includes('could not') || s.includes('failed') || s.includes('error')) return 'failed';
  return 'done';
}

function stepIcon(step: string) {
  const s = step.toLowerCase();
  if (s.includes('search') || s.includes('query')) return Search;
  if (s.includes('fetch') || s.includes('read') || s.includes('url')) return Globe;
  if (s.includes('research') || s.includes('deep')) return BookOpen;
  if (s.includes('vector') || s.includes('embed')) return Database;
  if (s.includes('rank') || s.includes('score')) return Zap;
  if (s.includes('generat') || s.includes('answer') || s.includes('think')) return Brain;
  if (s.includes('found') || s.includes('result')) return FileText;
  return Circle;
}

function stepLabel(step: string): string {
  return step.replace(/^\[STEP\]/i, '').replace(/\.\.\.$/, '').trim();
}

/* ── Step Node component ────────────────────── */
function StepNode({ step, index, isLast, isActive }: {
  step: string;
  index: number;
  isLast: boolean;
  isActive: boolean;
}) {
  const status = stepStatus(step, isActive);
  const label = stepLabel(step);
  const Icon = stepIcon(step);

  return (
    <div
      className="flex items-start gap-3 relative animate-slide-up"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }}
    >
      {/* Vertical connector line */}
      {!isLast && (
        <div className="absolute left-[13px] top-[28px] w-[2px] bottom-0 bg-border" />
      )}

      {/* Step dot / icon */}
      <div className={`relative z-10 shrink-0 w-[26px] h-[26px] rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
        status === 'active'
          ? 'border-primary bg-primary/15 animate-orchestration-pulse'
          : status === 'failed'
          ? 'border-destructive bg-destructive/10'
          : 'border-success/60 bg-success/10'
      }`}>
        {status === 'active' ? (
          <Loader2 className="h-3 w-3 text-primary animate-spin" />
        ) : status === 'failed' ? (
          <XCircle className="h-3 w-3 text-destructive" />
        ) : (
          <CheckCircle2 className="h-3 w-3 text-success" />
        )}
      </div>

      {/* Step content */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-center gap-2">
          <Icon className={`h-3 w-3 shrink-0 ${
            status === 'active' ? 'text-primary' : status === 'failed' ? 'text-destructive' : 'text-muted-foreground'
          }`} />
          <span className={`text-xs font-medium leading-snug ${
            status === 'active'
              ? 'text-foreground'
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

/* ── Main Context Panel ─────────────────────── */
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
    <div className="flex flex-col h-full bg-card/50 border-l border-border overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Orchestration</h3>
          {isStreaming && (
            <span className="ml-auto flex items-center gap-1.5 text-[10px] font-medium text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Live
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Pipeline Steps */}
        {steps.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70 mb-3">
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
          <div className="space-y-1">
            <button
              onClick={() => setMetaOpen(!metaOpen)}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70 w-full hover:text-muted-foreground transition-colors"
            >
              {metaOpen ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
              Metadata
            </button>
            {metaOpen && (
              <div className="rounded-xl border border-border bg-background/50 p-3 space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Intent</span>
                  <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wide bg-primary/8 text-primary border-0">
                    {lastAssistant.meta.intent}
                  </Badge>
                </div>
                {lastAssistant.meta.type && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Type</span>
                    <span className="text-xs font-mono text-foreground">{lastAssistant.meta.type}</span>
                  </div>
                )}
                {lastAssistant.meta.limit && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Limit</span>
                    <span className="text-xs font-mono text-foreground">{lastAssistant.meta.limit}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Steps</span>
                  <span className="text-xs font-mono text-foreground">{lastAssistant.steps.length}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sources */}
        {(isDeepResearch || isUrlRead) && urls.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70">
              Sources
            </p>
            <div className="space-y-1.5">
              {urls.slice(0, 10).map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 group transition-colors rounded-lg hover:bg-primary/5 px-2 py-1.5 -mx-2"
                >
                  <Link className="h-3 w-3 shrink-0 text-primary/50 group-hover:text-primary" />
                  <span className="truncate">{url}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!lastAssistant && !isStreaming && (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
              <Clock className="h-5 w-5 text-muted-foreground/30" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[180px]">
              Orchestration details will appear here during queries
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
