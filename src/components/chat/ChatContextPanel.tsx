import {
  CheckCircle2, XCircle, Clock, Link, Activity,
  Search, Globe, BookOpen, Zap, Database, FileText, Brain,
  Loader2, ChevronDown, ChevronRight, Sparkles, AlertTriangle,
  RefreshCw, MemoryStick, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import type { ChatMessage } from '@/types';

interface Props {
  messages: ChatMessage[];
  currentSteps: string[];
  isStreaming: boolean;
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

function getFaviconUrl(url: string): string {
  try {
    const { protocol, hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?sz=32&domain_url=${protocol}//${hostname}`;
  } catch { return ''; }
}

function stepIcon(step: string) {
  const s = step.toLowerCase();
  if (s.startsWith('fetching:'))                                    return Globe;
  if (s.includes('memory'))                                         return MemoryStick;
  if (s.includes('attempt') && s.includes('refin'))                 return RefreshCw;
  if (s.includes('answer quality') && s.includes('sufficient'))     return ThumbsUp;
  if (s.includes('answer quality') && s.includes('insufficient'))   return ThumbsDown;
  if (s.includes('search') || s.includes('query') || s.includes('querying')) return Search;
  if (s.includes('fetch') || s.includes('read') || s.includes('url')) return Globe;
  if (s.includes('research') || s.includes('deep') || s.includes('plan')) return BookOpen;
  if (s.includes('vector') || s.includes('embed') || s.includes('database')) return Database;
  if (s.includes('found') || s.includes('result') || s.includes('score'))    return Sparkles;
  if (s.includes('generat') || s.includes('synth') || s.includes('response') || s.includes('answer')) return Brain;
  if (s.includes('intent'))                                         return Zap;
  return FileText;
}

function stepStatus(step: string, isActive: boolean): 'active' | 'failed' | 'done' | 'warn' {
  if (isActive) return 'active';
  const s = step.toLowerCase();
  if (s.includes('could not') || s.includes('failed') || s.includes('error')) return 'failed';
  if (s.includes('insufficient') || s.includes('retrying') || s.includes('no results')) return 'warn';
  return 'done';
}

function stepLabel(step: string): string {
  return step.replace(/^\[STEP\]/i, '').replace(/\.\.\.$/, '').trim();
}

interface Iteration {
  attempt: number;
  steps: string[];
  quality: 'sufficient' | 'insufficient' | 'pending' | null;
  refinedQuery: string | null;
}

function parseIterations(steps: string[]): {
  preSteps: string[];
  iterations: Iteration[];
  postSteps: string[];
} {
  const preSteps: string[] = [];
  const iterations: Iteration[] = [];
  const postSteps: string[] = [];

  let currentIter: Iteration | null = null;
  let phase: 'pre' | 'iter' | 'post' = 'pre';

  for (const step of steps) {
    const s = step.toLowerCase();

    const attemptMatch = s.match(/attempt\s+(\d+)\s*[:/]/);
    if (attemptMatch || (s.includes('querying database') && phase === 'pre' && iterations.length === 0)) {
      phase = 'iter';
      const attempt = attemptMatch ? parseInt(attemptMatch[1]) : 1;
      const refinedMatch = step.match(/→\s*"(.+?)"/);
      currentIter = { attempt, steps: [], quality: null, refinedQuery: refinedMatch ? refinedMatch[1] : null };
      iterations.push(currentIter);
      currentIter.steps.push(step);
      continue;
    }

    if (s.includes('answer quality')) {
      if (currentIter) {
        currentIter.quality = s.includes('sufficient') && !s.includes('insufficient') ? 'sufficient' : 'insufficient';
        currentIter.steps.push(step);
      }
      continue;
    }

    if (s.includes('streaming final answer') || s.includes('streaming answer') || s.includes('streaming refined answer') || s.includes('using raw fallback')) {
      phase = 'post';
      postSteps.push(step);
      currentIter = null;
      continue;
    }

    if (phase === 'pre') {
      if (s.includes('querying database')) {
        phase = 'iter';
        currentIter = { attempt: 1, steps: [step], quality: null, refinedQuery: null };
        iterations.push(currentIter);
      } else {
        preSteps.push(step);
      }
    } else if (phase === 'iter' && currentIter) {
      currentIter.steps.push(step);
    } else if (phase === 'post') {
      postSteps.push(step);
    }
  }

  return { preSteps, iterations, postSteps };
}

// ── Tree node component ──────────────────────────────────────────────────────

function TreeNode({ step, isLast, isActive, depth = 0 }: {
  step: string; isLast: boolean; isActive: boolean; depth?: number;
}) {
  const isFetch = step.startsWith('Fetching:');
  const label   = isFetch ? step.slice(9).trim() : stepLabel(step);
  const status  = stepStatus(step, isActive);
  const Icon    = stepIcon(step);

  const statusColor = {
    active: 'border-primary bg-primary/10',
    done: 'border-success/40 bg-success/5',
    failed: 'border-destructive/40 bg-destructive/5',
    warn: 'border-warning/40 bg-warning/5',
  }[status];

  const iconColor = {
    active: 'text-primary',
    done: 'text-success',
    failed: 'text-destructive',
    warn: 'text-warning',
  }[status];

  const textColor = {
    active: 'text-foreground font-medium',
    done: 'text-muted-foreground',
    failed: 'text-destructive',
    warn: 'text-warning',
  }[status];

  return (
    <div className="relative flex items-stretch animate-fade-in" style={{ animationDelay: `${depth * 50}ms` }}>
      {/* Vertical connector */}
      <div className="flex flex-col items-center w-6 shrink-0">
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${statusColor}`}>
          {status === 'active' ? (
            <Loader2 className={`h-3 w-3 animate-spin ${iconColor}`} />
          ) : status === 'done' ? (
            <CheckCircle2 className={`h-3 w-3 ${iconColor}`} />
          ) : status === 'failed' ? (
            <XCircle className={`h-3 w-3 ${iconColor}`} />
          ) : (
            <AlertTriangle className={`h-3 w-3 ${iconColor}`} />
          )}
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-border/50 animate-line-grow" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4 pl-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-3.5 w-3.5 shrink-0 ${iconColor}`} />
          <span className={`text-[12px] leading-snug break-words ${textColor}`}>
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Iteration block ──────────────────────────────────────────────────────────

function IterationBlock({ iter, isStreaming, isLast }: {
  iter: Iteration; isStreaming: boolean; isLast: boolean;
}) {
  const [open, setOpen] = useState(true);
  const isActive = isStreaming && isLast && iter.quality === null;

  const qualityBadge = {
    sufficient: { text: '✓ Sufficient', cls: 'text-success bg-success/10 border-success/20' },
    insufficient: { text: '↻ Retrying', cls: 'text-warning bg-warning/10 border-warning/20' },
  }[iter.quality || ''] || (isActive
    ? { text: 'Running', cls: 'text-primary bg-primary/10 border-primary/20' }
    : { text: 'Pending', cls: 'text-muted-foreground bg-muted border-border' }
  );

  return (
    <div className={`rounded-lg border overflow-hidden transition-all duration-200 ${
      isActive ? 'border-primary/30 shadow-sm shadow-primary/5' :
      iter.quality === 'sufficient' ? 'border-success/20' :
      iter.quality === 'insufficient' ? 'border-warning/20' :
      'border-border/50'
    }`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2.5 w-full px-3 py-2.5 hover:bg-muted/20 transition-colors"
      >
        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
          iter.quality === 'sufficient' ? 'bg-success/10 text-success' :
          iter.quality === 'insufficient' ? 'bg-warning/10 text-warning' :
          isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        }`}>
          {iter.attempt}
        </div>

        <span className="text-[12px] font-medium text-foreground flex-1 text-left">
          {iter.refinedQuery
            ? <span>Attempt {iter.attempt} <span className="font-normal text-muted-foreground">— "{iter.refinedQuery.slice(0, 35)}{iter.refinedQuery.length > 35 ? '…' : ''}"</span></span>
            : `Attempt ${iter.attempt}`
          }
        </span>

        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${qualityBadge.cls}`}>
          {qualityBadge.text}
        </span>

        {isActive && <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />}
        {!isActive && (open
          ? <ChevronDown className="h-3 w-3 text-muted-foreground/40 shrink-0" />
          : <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
        )}
      </button>

      {open && iter.steps.length > 0 && (
        <div className="px-3 pb-3 pt-2 border-t border-border/30 bg-muted/5">
          {iter.steps.map((step, i) => (
            <TreeNode
              key={i}
              step={step}
              isLast={i === iter.steps.length - 1}
              isActive={isActive && i === iter.steps.length - 1}
              depth={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Source card ───────────────────────────────────────────────────────────────

function SourceCard({ url, index }: { url: string; index: number }) {
  const domain = getDomain(url);
  const favicon = getFaviconUrl(url);

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="group flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/50 hover:bg-muted/30 hover:border-border transition-all">
      <div className="shrink-0 w-5 h-5 rounded overflow-hidden bg-muted/50 flex items-center justify-center">
        {favicon ? <img src={favicon} alt="" width={16} height={16} className="w-4 h-4 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
          : <Globe className="h-3 w-3 text-muted-foreground/40" />}
      </div>
      <span className="text-[12px] text-muted-foreground truncate flex-1">{domain}</span>
      <Link className="h-3 w-3 shrink-0 text-muted-foreground/20 group-hover:text-primary transition-colors" />
    </a>
  );
}

// ── Main panel ───────────────────────────────────────────────────────────────

export function ChatContextPanel({ messages, currentSteps, isStreaming }: Props) {
  const [metaOpen, setMetaOpen]           = useState(true);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const [fetchesExpanded, setFetchesExpanded] = useState(false);

  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');

  const urls = lastAssistant?.content
    ? Array.from(lastAssistant.content.matchAll(/https?:\/\/[^\s)>\]"]+/g))
        .map(m => m[0]).filter((u, i, a) => a.indexOf(u) === i)
    : [];

  const steps   = isStreaming ? currentSteps : (lastAssistant?.steps ?? []);
  const intent  = lastAssistant?.meta?.intent ?? '';
  const isDeep  = intent === 'deep_research';
  const isUrl   = intent === 'url_read';
  const isConfirm = lastAssistant?.confirmPending;
  const confirmType = lastAssistant?.confirmType;

  const { preSteps, iterations, postSteps } = parseIterations(steps);

  const fetchSteps     = steps.filter(s => s.startsWith('Fetching:'));
  const successFetches = fetchSteps.filter(s => !s.includes('skipped'));
  const FETCH_PREVIEW  = 5;
  const visibleFetches = fetchesExpanded ? fetchSteps : fetchSteps.slice(0, FETCH_PREVIEW);

  const hasReasoningLoop = iterations.length > 0;
  const totalAttempts    = iterations.length;
  const successAttempt   = iterations.find(i => i.quality === 'sufficient');

  const SOURCES_PREVIEW = 5;
  const visibleUrls = sourcesExpanded ? urls : urls.slice(0, SOURCES_PREVIEW);

  return (
    <div className="flex flex-col h-full bg-background border-l border-border overflow-y-auto scrollbar-thin">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-[14px] font-semibold text-foreground tracking-tight">Orchestration</h3>
          {isStreaming && (
            <span className="ml-auto flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-6">

        {/* Confirmation pending — research */}
        {isConfirm && confirmType !== 'reasoning' && (
          <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 space-y-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
              <span className="text-[13px] font-medium text-foreground">Awaiting confirmation</span>
            </div>
            <p className="text-[12px] text-muted-foreground pl-6">Outside Zoho Desk context — waiting for user response.</p>
          </div>
        )}

        {/* Confirmation pending — reasoning */}
        {isConfirm && confirmType === 'reasoning' && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary shrink-0" />
              <span className="text-[13px] font-medium text-foreground">Refine search?</span>
            </div>
            <p className="text-[12px] text-muted-foreground pl-6">Initial results may be incomplete — waiting for user to confirm.</p>
          </div>
        )}

        {/* Pre-loop steps — tree flow */}
        {preSteps.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/50 mb-4">Pipeline</p>
            <div className="ml-0.5">
              {preSteps.map((step, i) => (
                <TreeNode key={i} step={step} isLast={i === preSteps.length - 1}
                  isActive={isStreaming && iterations.length === 0 && i === preSteps.length - 1} depth={i} />
              ))}
            </div>
          </div>
        )}

        {/* Reasoning loop iterations */}
        {hasReasoningLoop && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/50">
                Reasoning Loop
              </p>
              <div className="flex items-center gap-2">
                {successAttempt && (
                  <span className="text-[10px] text-success bg-success/10 px-2 py-0.5 rounded-full font-mono border border-success/20">
                    resolved #{successAttempt.attempt}
                  </span>
                )}
                {isStreaming && !successAttempt && (
                  <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-mono border border-primary/20">
                    {totalAttempts} / 3
                  </span>
                )}
                {isConfirm && confirmType === 'reasoning' && !isStreaming && (
                  <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-mono border border-primary/20 animate-pulse">
                    awaiting
                  </span>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-1 overflow-hidden mb-4">
              <div className={`h-full rounded-full transition-all duration-500 ${
                successAttempt ? 'bg-success' :
                isConfirm && confirmType === 'reasoning' ? 'bg-primary/50' :
                'bg-primary'
              }`}
                style={{ width: successAttempt ? '100%' : `${(totalAttempts / 3) * 100}%` }}
              />
            </div>

            <div className="space-y-3">
              {iterations.map((iter, i) => (
                <IterationBlock key={i} iter={iter} isStreaming={isStreaming} isLast={i === iterations.length - 1} />
              ))}
            </div>
          </div>
        )}

        {/* Post-loop steps */}
        {postSteps.length > 0 && (
          <div className="ml-0.5">
            {postSteps.map((step, i) => (
              <TreeNode key={i} step={step} isLast={i === postSteps.length - 1}
                isActive={isStreaming && i === postSteps.length - 1} depth={i} />
            ))}
          </div>
        )}

        {/* Web fetches */}
        {fetchSteps.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/50">Web Fetches</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-success bg-success/10 px-2 py-0.5 rounded-full">
                  {successFetches.length}/{fetchSteps.length}
                </span>
                {isStreaming && <Loader2 className="h-3 w-3 text-primary animate-spin" />}
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-1 overflow-hidden mb-4">
              <div className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${Math.min((successFetches.length / Math.max(fetchSteps.length, 1)) * 100, 100)}%` }}
              />
            </div>
            <div className="rounded-lg border border-border/40 bg-muted/5 px-3 py-3">
              {visibleFetches.map((step, i) => (
                <TreeNode key={i} step={step} isLast={i === visibleFetches.length - 1}
                  isActive={isStreaming && i === fetchSteps.length - 1} depth={i} />
              ))}
              {fetchSteps.length > FETCH_PREVIEW && (
                <button onClick={() => setFetchesExpanded(p => !p)}
                  className="w-full text-[11px] text-muted-foreground hover:text-foreground py-1.5 transition-colors text-center mt-1">
                  {fetchesExpanded ? 'Show less' : `+${fetchSteps.length - FETCH_PREVIEW} more`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        {lastAssistant && !lastAssistant.isStreaming && !isConfirm && lastAssistant.meta && (
          <div>
            <button onClick={() => setMetaOpen(o => !o)}
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/50 w-full hover:text-muted-foreground transition-colors mb-3">
              {metaOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Metadata
            </button>
            {metaOpen && (
              <div className="rounded-lg border border-border bg-card/50 divide-y divide-border/50">
                {[
                  ['Intent', <Badge key="i" variant="secondary" className="text-[10px] font-mono uppercase bg-primary/10 text-primary border-0">{lastAssistant.meta.intent}</Badge>],
                  lastAssistant.meta.type && ['Type', <span key="t" className="text-[12px] font-mono text-foreground">{lastAssistant.meta.type}</span>],
                  lastAssistant.meta.limit && ['Limit', <span key="l" className="text-[12px] font-mono text-foreground">{lastAssistant.meta.limit}</span>],
                  ['Steps', <span key="s" className="text-[12px] font-mono text-foreground">{lastAssistant.steps?.length ?? 0}</span>],
                  hasReasoningLoop && ['Attempts', <span key="a" className="text-[12px] font-mono text-foreground">{totalAttempts}</span>],
                  successFetches.length > 0 && ['Pages read', <span key="p" className="text-[12px] font-mono text-success">{successFetches.length}</span>],
                ].filter(Boolean).map(([label, value], i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-[12px] text-muted-foreground">{label as string}</span>
                    {value}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sources */}
        {(isDeep || isUrl) && urls.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/50">Sources</p>
              <span className="text-[10px] font-mono text-muted-foreground/40 bg-muted/40 px-2 py-0.5 rounded-full">{urls.length}</span>
            </div>
            <div className="space-y-1.5">
              {visibleUrls.map((url, i) => <SourceCard key={url} url={url} index={i} />)}
            </div>
            {urls.length > SOURCES_PREVIEW && (
              <button onClick={() => setSourcesExpanded(p => !p)}
                className="mt-2 w-full flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors py-2 rounded-lg hover:bg-muted/20">
                {sourcesExpanded
                  ? <><ChevronDown className="h-3 w-3 rotate-180" />Show fewer</>
                  : <><ChevronDown className="h-3 w-3" />{urls.length - SOURCES_PREVIEW} more</>
                }
              </button>
            )}
          </div>
        )}

        {/* Empty state */}
        {!lastAssistant && !isStreaming && (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mb-4">
              <Clock className="h-5 w-5 text-muted-foreground/20" />
            </div>
            <p className="text-[12px] text-muted-foreground/40 leading-relaxed max-w-[200px]">
              Orchestration details will appear here during queries
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
