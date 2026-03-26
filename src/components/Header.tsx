import { Brain, Sun, Moon, Loader2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useHealth } from '@/hooks/useHealth';
import { useQuery } from '@tanstack/react-query';
import { fetchSyncProgress } from '@/lib/api';
import { NotificationPanel } from '@/components/NotificationPanel';
import { useNotifications } from '@/hooks/useNotifications';
import { useState, useRef, useEffect } from 'react';

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
  const notif = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const isHealthy = !isError && health && health.total_posts_vec > 0;
  const isSyncing = syncProgress?.running;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

        {/* Notification bell */}
        <div ref={notifRef} className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setNotifOpen(o => !o); if (!notifOpen) notif.clearUnread(); }}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground transition-colors relative"
          >
            <Bell className="h-4 w-4" />
            {notif.unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                {notif.unreadCount > 9 ? '9+' : notif.unreadCount}
              </span>
            )}
          </Button>
          <NotificationPanel
            open={notifOpen}
            onClose={() => setNotifOpen(false)}
            unreadCount={notif.unreadCount}
            clearUnread={notif.clearUnread}
            recentNotifs={notif.recentNotifs}
            setRecentNotifs={notif.setRecentNotifs}
            permission={notif.permission}
            requestPermission={notif.requestPermission}
          />
        </div>

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
