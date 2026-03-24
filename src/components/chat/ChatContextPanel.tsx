import { Circle, CheckCircle2, Clock, Link, Activity, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

function stepLabel(step: string): string {
  // Clean up common prefixes for display
  return step
    .replace(/^\[STEP\]/i, '')
    .replace(/\.\.\.$/, '')
    .trim();
}

interface StepTreeNode {
  label: string;
  status: 'active' | 'failed' | 'done';
  children: StepTreeNode[];
}

function buildTree(steps: string[], isStreaming: boolean): StepTreeNode[] {
  const nodes: StepTreeNode[] = [];
  let currentParent: StepTreeNode | null = null;

  const childKeywords = [
    'found', 'read', 'fetching', 'searching', 'querying',
    'zoho url', 'web snippet', 'cache', 'keyword', 'broadening',
  ];

  steps.forEach((step, i) => {
    const isActive = isStreaming && i === steps.length - 1;
    const status   = stepStatus(step, isActive);
    const label    = stepLabel(step);
    const sLow     = label.toLowerCase();

    const isChild = childKeywords.some(k => sLow.includes(k));

    const node: StepTreeNode = { label, status, children: [] };

    if (isChild && currentParent) {
      currentParent.children.push(node);
    } else {
      nodes.push(node);
      currentParent = node;
    }
  });

  return nodes;
}

function StatusDot({ status }: { status: 'active' | 'failed' | 'done' }) {
  if (status === 'active')
    return <Circle className="h-2.5 w-2.5 text-primary animate-pulse shrink-0 mt-1" />;
  if (status === 'failed')
    return <XCircle className="h-2.5 w-2.5 text-destructive shrink-0 mt-1" />;
  return <CheckCircle2 className="h-2.5 w-2.5 text-green-500 shrink-0 mt-1" />;
}

function TreeNode({
  node,
  isLast,
  depth = 0,
}: {
  node: StepTreeNode;
  isLast: boolean;
  depth?: number;
}) {
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div className="flex items-start gap-2">
        {/* Tree lines for children */}
        {depth > 0 && (
          <div className="flex shrink-0" style={{ width: depth * 16 }}>
            {Array.from({ length: depth }).map((_, i) => (
              <div
                key={i}
                className={`w-4 shrink-0 ${
                  i === depth - 1
                    ? 'border-l border-b border-border rounded-bl-sm h-3 mt-1 mb-auto'
                    : 'border-l border-border'
                }`}
              />
            ))}
          </div>
        )}

        <StatusDot status={node.status} />

        <span
          className={`text-xs font-mono leading-relaxed ${
            node.status === 'failed'
              ? 'text-destructive'
              : node.status === 'active'
              ? 'text-foreground'
              : depth > 0
              ? 'text-muted-foreground/70'
              : 'text-muted-foreground'
          }`}
        >
          {node.label}
        </span>
      </div>

      {hasChildren && (
        <div className="mt-1 space-y-1.5">
          {node.children.map((child, i) => (
            <TreeNode
              key={i}
              node={child}
              isLast={i === node.children.length - 1}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ChatContextPanel({ messages, currentSteps, isStreaming }: Props) {
  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');

  const urls = lastAssistant?.content
    ? Array.from(lastAssistant.content.matchAll(/https?:\/\/[^\s)>\]]+/g)).map(m => m[0])
    : [];

  const steps  = isStreaming ? currentSteps : (lastAssistant?.steps ?? []);
  const intent = lastAssistant?.meta?.intent ?? '';

  const isUrlRead      = intent === 'url_read';
  const isDeepResearch = intent === 'deep_research';

  const tree = buildTree(steps, isStreaming);

  // Progress for multi-URL fetches
  const urlCount     = parseInt(
    steps.find(s => s.toLowerCase().includes('fetching') && s.includes('page'))
      ?.match(/(\d+)\s+page/)?.[1] ?? '1'
  );
  const readCount    = steps.filter(s => s.toLowerCase().includes('read') && s.includes('word')).length;
  const failCount    = steps.filter(s => s.toLowerCase().includes('could not')).length;
  const totalFetched = readCount + failCount;
  const showProgress = isUrlRead && urlCount > 1;

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto scrollbar-thin space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Context Panel</h3>
      </div>

      {/* Pipeline Steps */}
      {steps.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Pipeline Steps
              </CardTitle>
              {isStreaming && (
                <span className="text-xs text-muted-foreground animate-pulse">Running...</span>
              )}
            </div>

            {/* Mode label */}
            {(isUrlRead || isDeepResearch) && (
              <p className="text-xs text-muted-foreground mt-1">
                {isUrlRead
                  ? `Reading ${urlCount > 1 ? `${urlCount} URLs` : 'URL'}`
                  : 'Deep research'}
              </p>
            )}

            {/* Multi-URL progress */}
            {showProgress && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Pages fetched</span>
                  <span>{totalFetched} / {urlCount}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{
                      width: isStreaming
                        ? `${Math.min((totalFetched / urlCount) * 100, 90)}%`
                        : '100%',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Single URL progress */}
            {isUrlRead && urlCount === 1 && isStreaming && (
              <div className="mt-2 w-full bg-muted rounded-full h-1 overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            )}
          </CardHeader>

          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {tree.map((node, i) => (
                <TreeNode
                  key={i}
                  node={node}
                  isLast={i === tree.length - 1}
                  depth={0}
                />
              ))}
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
                <Badge variant="secondary" className="font-mono text-xs">
                  {lastAssistant.meta.intent}
                </Badge>
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
      {(isDeepResearch || isUrlRead) && urls.length > 0 && (
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