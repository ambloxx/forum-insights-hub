import { Brain, Sun, Moon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useHealth } from '@/hooks/useHealth';
import { useQuery } from '@tanstack/react-query';
import { fetchSyncProgress } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

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
    <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">ZDesk Intelligence</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isSyncing && (
          <Badge variant="secondary" className="gap-1.5 text-xs">
            <Loader2 className="h-3 w-3 animate-spin" />
            Syncing...
          </Badge>
        )}

        <div className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-success' : 'bg-destructive'} animate-pulse-dot`} />
          <span className="text-xs text-muted-foreground">
            {isError ? 'Offline' : 'Online'}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
