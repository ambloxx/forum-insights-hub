import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSyncStatus, fetchSyncProgress, triggerSync } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Play, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { SyncStatus, SyncProgress } from '@/types';

export default function SyncPage() {
  const queryClient = useQueryClient();

  const { data: status } = useQuery<SyncStatus>({
    queryKey: ['syncStatus'],
    queryFn: fetchSyncStatus,
  });

  const { data: progress } = useQuery<SyncProgress>({
    queryKey: ['syncProgress'],
    queryFn: fetchSyncProgress,
    refetchInterval: (query) => query.state.data?.running ? 2000 : 10000,
  });

  const syncMutation = useMutation({
    mutationFn: (type: 'full' | 'delta') => triggerSync(type),
    onSuccess: () => {
      toast({ title: 'Sync started' });
      queryClient.invalidateQueries({ queryKey: ['syncProgress'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Sync failed', description: err.message, variant: 'destructive' });
    },
  });

  const isRunning = progress?.running ?? false;
  const progressPct = progress?.categories_total
    ? (progress.categories_done / progress.categories_total) * 100
    : 0;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-foreground">Data Sync</h1>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={() => syncMutation.mutate('delta')}
          disabled={isRunning}
          className="gap-2"
        >
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run Delta Sync
        </Button>
        <Button
          variant="outline"
          onClick={() => syncMutation.mutate('full')}
          disabled={isRunning}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Run Full Sync
        </Button>
      </div>

      {/* Progress */}
      {isRunning && progress && (
        <Card className="bg-card border-border border-primary/30">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Sync in Progress — {progress.type}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Categories: {progress.categories_done} / {progress.categories_total}</span>
                <span>{progressPct.toFixed(0)}%</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">{progress.pages_fetched}</div>
                <div className="text-xs text-muted-foreground">Pages Fetched</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">{progress.posts_found}</div>
                <div className="text-xs text-muted-foreground">Posts Found</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-success">{progress.inserted}</div>
                <div className="text-xs text-muted-foreground">Inserted</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-info">{progress.updated}</div>
                <div className="text-xs text-muted-foreground">Updated</div>
              </div>
            </div>
            {progress.message && (
              <p className="text-xs font-mono text-muted-foreground">{progress.message}</p>
            )}
            {progress.error && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                {progress.error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Last sync status */}
      {status && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Sync</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs font-mono uppercase">{status.last_sync_type}</Badge>
              {status.success ? (
                <Badge className="gap-1 bg-success/15 text-success border-success/30" variant="outline">
                  <CheckCircle2 className="h-3 w-3" /> Success
                </Badge>
              ) : (
                <Badge className="gap-1 bg-destructive/15 text-destructive border-destructive/30" variant="outline">
                  <XCircle className="h-3 w-3" /> Failed
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Time</div>
                <div className="text-foreground">{status.last_sync_time ? new Date(status.last_sync_time).toLocaleString() : 'Never'}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Inserted</div>
                <div className="text-foreground">{status.posts_inserted}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Updated</div>
                <div className="text-foreground">{status.posts_updated}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Total in DB</div>
                <div className="text-foreground">{status.total_posts_in_db?.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
