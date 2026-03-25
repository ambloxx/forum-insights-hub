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

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Parse steps into reasoning iterations ─────────────────────────────────────

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

    // Detect start of an iteration
    const attemptMatch = s.match(/attempt\s+(\d+)\s*[:/]/);
    if (attemptMatch || (s.includes('querying database') && phase === 'pre' && iterations.length === 0)) {
      phase = 'iter';
      const attempt = attemptMatch ? parseInt(attemptMatch[1]) : 1;
      const refinedMatch = step.match(/→\s*"(.+?)"/);
      currentIter = {
        attempt,
        steps: [],
        quality: null,
        refinedQuery: refinedMatch ? refinedMatch[1] : null,
      };
      iterations.push(currentIter);
      currentIter.steps.push(step);
      continue;
    }

    // Detect quality evaluation
    if (s.includes('answer quality')) {
      if (currentIter) {
        currentIter.quality = s.includes('sufficient') && !s.includes('insufficient')
          ? 'sufficient' : 'insufficient';
        currentIter.steps.push(step);
      }
      continue;
    }

    // Detect streaming final answer = post phase
    if (s.includes('streaming final answer') || s.includes('using raw fallback')) {
      phase = 'post';
      postSteps.push(step);
      currentIter = null;
      continue;
    }

    if (phase === 'pre') {
      // First "querying database" starts an implicit iteration 1
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

// ── Step node ─────────────────────────────────────────────────────────────────

function StepNode({ step, isLast, isActive, compact = false }: {
  step: string; isLast: boolean; isActive: boolean; compact?: boolean;
}) {
  const isFetch = step.startsWith('Fetching:');
  const label   = isFetch ? step.slice(9).trim() : stepLabel(step);
  const status  = stepStatus(step, isActive);
  const Icon    = stepIcon(step);

  if (isFetch) {
    const skipped = label.includes('skipped');
    return (
      <div className="flex items-center gap-2 pl-2 py-0.5">
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          skipped ? 'bg-muted-foreground/20' :
          isActive ? 'bg-primary animate-pulse' : 'bg-green-500/60'
        }`} />
        <Globe className="h-3 w-3 text-muted-foreground/40 shrink-0" />
        <span className={`text-[11px] font-mono truncate ${
          skipped ? 'text-muted-foreground/30 line-through' :
          isActive ? 'text-primary' : 'text-muted-foreground/60'
        }`}>{label}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-2.5 relative ${compact ? '' : 'mb-1'}`}>
      {!isLast && !compact && (
        <div className="absolute left-[10px] top-[22px] w-px bottom-0"
          style={{ background: status === 'done' ? 'hsl(var(--success) / 0.2)' : 'hsl(var(--border))' }}
        />
      )}
      <div className={`relative z-10 shrink-0 flex items-center justify-center rounded-full transition-all ${
        compact ? 'w-4 h-4 mt-0.5' : 'w-5 h-5 mt-0.5'
      } ${
        status === 'active'  ? 'bg-primary/15 ring-1 ring-primary/30' :
        status === 'failed'  ? 'bg-destructive/10' :
        status === 'warn'    ? 'bg-amber-500/10' :
                               'bg-success/10'
      }`}>
        {status === 'active'  ? <Loader2 className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-primary animate-spin`} />
        : status === 'failed' ? <XCircle className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-destructive`} />
        : status === 'warn'   ? <AlertTriangle className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-amber-400`} />
        : <CheckCircle2 className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-green-500`} />}
      </div>
      <div className="flex items-start gap-1.5 flex-1 min-w-0 pt-0.5">
        <Icon className={`shrink-0 mt-0.5 ${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} ${
          status === 'active' ? 'text-primary' :
          status === 'failed' ? 'text-destructive' :
          status === 'warn'   ? 'text-amber-400' : 'text-muted-foreground/50'
        }`} />
        <span className={`leading-snug break-words ${compact ? 'text-[11px]' : 'text-[12px]'} ${
          status === 'active' ? 'text-foreground font-medium' :
          status === 'failed' ? 'text-destructive' :
          status === 'warn'   ? 'text-amber-400' : 'text-muted-foreground'
        }`}>{label}</span>
      </div>
    </div>
  );
}

// ── Iteration block ───────────────────────────────────────────────────────────

function IterationBlock({ iter, isStreaming, isLast }: {
  iter: Iteration; isStreaming: boolean; isLast: boolean;
}) {
  const [open, setOpen] = useState(true);
  const isActive = isStreaming && isLast && iter.quality === null;

  const qualityColor =
    iter.quality === 'sufficient'   ? 'text-green-500 bg-green-500/10 border-green-500/20' :
    iter.quality === 'insufficient' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
    isActive ? 'text-primary bg-primary/10 border-primary/20' :
    'text-muted-foreground bg-muted/20 border-border';

  const qualityLabel =
    iter.quality === 'sufficient'   ? '✓ sufficient' :
    iter.quality === 'insufficient' ? '↻ retrying' :
    isActive ? 'running...' : 'pending';

  return (
    <div className={`rounded-lg border overflow-hidden ${
      isActive ? 'border-primary/30' :
      iter.quality === 'sufficient' ? 'border-green-500/20' :
      iter.quality === 'insufficient' ? 'border-amber-500/20' :
      'border-border/50'
    }`}>
      {/* Iteration header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted/20 transition-colors"
      >
        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
          iter.quality === 'sufficient'   ? 'bg-green-500/15 text-green-500' :
          iter.quality === 'insufficient' ? 'bg-amber-500/15 text-amber-400' :
          isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
        }`}>
          {iter.attempt}
        </div>

        <span className="text-[12px] font-medium text-foreground flex-1 text-left">
          {iter.refinedQuery
            ? <span>Attempt {iter.attempt} <span className="font-normal text-muted-foreground">— "{iter.refinedQuery.slice(0, 40)}{iter.refinedQuery.length > 40 ? '…' : ''}"</span></span>
            : `Attempt ${iter.attempt}`
          }
        </span>

        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${qualityColor}`}>
          {qualityLabel}
        </span>

        {isActive && <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />}
        {!isActive && (open
          ? <ChevronDown className="h-3 w-3 text-muted-foreground/40 shrink-0" />
          : <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
        )}
      </button>

      {/* Iteration steps */}
      {open && iter.steps.length > 0 && (
        <div className="px-3 pb-3 pt-1 border-t border-border/40 bg-muted/10 space-y-1.5">
          {iter.steps.map((step, i) => (
            <StepNode
              key={i}
              step={step}
              isLast={i === iter.steps.length - 1}
              isActive={isActive && i === iter.steps.length - 1}
              compact
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
  const [ogImage, setOgImage] = useState<string | null>(null);
  const [ogTitle, setOgTitle] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
          { signal: controller.signal }
        );
        if (!res.ok || cancelled) return;
        const { contents } = await res.json();
        if (cancelled) return;
        const doc = new DOMParser().parseFromString(contents, 'text/html');
        const getMeta = (sels: string[]) => {
          for (const s of sels) {
            const v = doc.querySelector(s)?.getAttribute('content');
            if (v) return v;
          }
          return null;
        };
        if (!cancelled) {
          setOgImage(getMeta(['meta[property="og:image"]', 'meta[name="twitter:image"]']));
          setOgTitle(getMeta(['meta[property="og:title"]', 'meta[name="twitter:title"]']) ?? doc.querySelector('title')?.textContent ?? null);
          setLoading(false);
        }
      } catch { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; controller.abort(); };
  }, [url]);

  const showThumb = ogImage && !imgError;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="group block rounded-lg border border-border overflow-hidden hover:bg-muted/30 transition-all">
      {(showThumb || loading) && (
        <div className="relative w-full bg-muted/40 overflow-hidden"
          style={{ height: showThumb ? '80px' : '36px', transition: 'height 0.2s' }}>
          {loading && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-3.5 w-3.5 text-muted-foreground/30 animate-spin" /></div>}
          {showThumb && <img src={ogImage!} alt="" onError={() => setImgError(true)} className="w-full h-full object-cover object-top" />}
        </div>
      )}
      <div className="flex items-start gap-2 px-3 py-2">
        <div className="shrink-0 w-4 h-4 rounded-sm overflow-hidden bg-muted/50 flex items-center justify-center mt-0.5">
          {favicon ? <img src={favicon} alt="" width={16} height={16} className="w-4 h-4 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
            : <Globe className="h-3 w-3 text-muted-foreground/40" />}
        </div>
        <div className="flex-1 min-w-0">
          {ogTitle && !loading && <p className="text-[12px] font-medium text-foreground line-clamp-1 mb-0.5">{ogTitle}</p>}
          <p className="text-[11px] text-muted-foreground truncate">{domain}</p>
        </div>
        <Link className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
      </div>
    </a>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

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
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* Confirmation pending */}
        {isConfirm && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="text-[13px] font-medium text-foreground">Awaiting confirmation</span>
            </div>
            <p className="text-[12px] text-muted-foreground pl-6">Outside Zoho Desk context — waiting for user response.</p>
          </div>
        )}

        {/* Pre-loop steps (intent, memory, filters) */}
        {preSteps.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-3">Pipeline</p>
            <div className="space-y-2">
              {preSteps.map((step, i) => (
                <StepNode key={i} step={step} isLast={i === preSteps.length - 1}
                  isActive={isStreaming && iterations.length === 0 && i === preSteps.length - 1} />
              ))}
            </div>
          </div>
        )}

        {/* Reasoning loop iterations */}
        {hasReasoningLoop && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/60">
                Reasoning loop
              </p>
              <div className="flex items-center gap-2">
                {successAttempt && (
                  <span className="text-[10px] text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full font-mono border border-green-500/20">
                    resolved in {successAttempt.attempt} attempt{successAttempt.attempt > 1 ? 's' : ''}
                  </span>
                )}
                {isStreaming && !successAttempt && (
                  <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-mono border border-primary/20">
                    attempt {totalAttempts} / 3
                  </span>
                )}
              </div>
            </div>

            {/* Progress bar across attempts */}
            <div className="w-full bg-muted rounded-full h-1 overflow-hidden mb-3">
              <div className={`h-full rounded-full transition-all duration-500 ${
                successAttempt ? 'bg-green-500' : 'bg-primary'
              }`}
                style={{ width: successAttempt ? '100%' : `${(totalAttempts / 3) * 100}%` }}
              />
            </div>

            <div className="space-y-2">
              {iterations.map((iter, i) => (
                <IterationBlock
                  key={i}
                  iter={iter}
                  isStreaming={isStreaming}
                  isLast={i === iterations.length - 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Post-loop steps (streaming final answer) */}
        {postSteps.length > 0 && (
          <div className="space-y-2">
            {postSteps.map((step, i) => (
              <StepNode key={i} step={step} isLast={i === postSteps.length - 1}
                isActive={isStreaming && i === postSteps.length - 1} />
            ))}
          </div>
        )}

        {/* Web fetch section */}
        {fetchSteps.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/60">Web fetches</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                  {successFetches.length} / {fetchSteps.length}
                </span>
                {isStreaming && <Loader2 className="h-3 w-3 text-primary animate-spin" />}
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-1 overflow-hidden mb-3">
              <div className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${Math.min((successFetches.length / Math.max(fetchSteps.length, 1)) * 100, 100)}%` }}
              />
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2 space-y-0.5">
              {visibleFetches.map((step, i) => (
                <StepNode key={i} step={step} isLast={i === visibleFetches.length - 1}
                  isActive={isStreaming && i === fetchSteps.length - 1} compact />
              ))}
              {fetchSteps.length > FETCH_PREVIEW && (
                <button onClick={() => setFetchesExpanded(p => !p)}
                  className="w-full text-[11px] text-muted-foreground hover:text-foreground py-1.5 transition-colors text-center">
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
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/60 w-full hover:text-muted-foreground transition-colors mb-3">
              {metaOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Metadata
            </button>
            {metaOpen && (
              <div className="rounded-lg border border-border bg-card/50 divide-y divide-border/50">
                {[
                  ['Intent',    <Badge key="i" variant="secondary" className="text-[10px] font-mono uppercase bg-primary/10 text-primary border-0">{lastAssistant.meta.intent}</Badge>],
                  lastAssistant.meta.type  && ['Type',  <span key="t" className="text-[12px] font-mono text-foreground">{lastAssistant.meta.type}</span>],
                  lastAssistant.meta.limit && ['Limit', <span key="l" className="text-[12px] font-mono text-foreground">{lastAssistant.meta.limit}</span>],
                  ['Steps',    <span key="s" className="text-[12px] font-mono text-foreground">{lastAssistant.steps?.length ?? 0}</span>],
                  hasReasoningLoop && ['Attempts', <span key="a" className="text-[12px] font-mono text-foreground">{totalAttempts}</span>],
                  successFetches.length > 0 && ['Pages read', <span key="p" className="text-[12px] font-mono text-green-500">{successFetches.length}</span>],
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
              <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/60">Sources</p>
              <span className="text-[10px] font-mono text-muted-foreground/40 bg-muted/40 px-2 py-0.5 rounded-full">{urls.length}</span>
            </div>
            <div className="space-y-2">
              {visibleUrls.map((url, i) => <SourceCard key={url} url={url} index={i} />)}
            </div>
            {urls.length > SOURCES_PREVIEW && (
              <button onClick={() => setSourcesExpanded(p => !p)}
                className="mt-2 w-full flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors py-2 rounded-lg hover:bg-muted/30">
                {sourcesExpanded
                  ? <><ChevronDown className="h-3 w-3 rotate-180" />Show fewer</>
                  : <><ChevronDown className="h-3 w-3" />{urls.length - SOURCES_PREVIEW} more source{urls.length - SOURCES_PREVIEW !== 1 ? 's' : ''}</>
                }
              </button>
            )}
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