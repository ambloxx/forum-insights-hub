import { Brain, Sun, Moon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useHealth } from '@/hooks/useHealth';
import { useQuery } from '@tanstack/react-query';
import { fetchSyncProgress } from '@/lib/api';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function Header({ theme, onToggleTheme }: HeaderProps) {
  const { data: health, isError } = useHealth();
  const { data: syncProgress } = useQuery({
    queryKey: ['syncProgress'],
    queryFn: fetchSyncProgress,
    refetchInterval: 5000,
  });

  const isHealthy = !isError && health && health.total_posts_vec > 0;
  const isSyncing = syncProgress?.running;

  return (
    <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-background/80 backdrop-blur-lg">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-foreground text-sm tracking-tight">ZDesk Intelligence</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isSyncing && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground px-2.5 py-1 rounded-lg bg-muted">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            Syncing
          </span>
        )}

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg">
          <div className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-success' : 'bg-destructive'}`} />
          <span className="text-xs text-muted-foreground font-medium">
            {isError ? 'Offline' : 'Online'}
          </span>
        </div>

        <div className="h-5 w-px bg-border" />

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
