import { Bell, BellOff, Check, ExternalLink, MessageSquare, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { NotifItem } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  open: boolean;
  onClose: () => void;
  unreadCount: number;
  clearUnread: () => void;
  recentNotifs: NotifItem[];
  setRecentNotifs: React.Dispatch<React.SetStateAction<NotifItem[]>>;
  permission: string;
  requestPermission: () => void;
}

export function NotificationPanel({
  open, onClose, unreadCount, clearUnread,
  recentNotifs, setRecentNotifs,
  permission, requestPermission,
}: Props) {
  if (!open) return null;

  const clearAll = () => {
    setRecentNotifs([]);
    clearUnread();
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-96 z-50 animate-fade-in">
      <div className="rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-foreground" />
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {recentNotifs.length > 0 && (
              <Button variant="ghost" size="icon" onClick={clearAll} className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Permission banner */}
        {permission !== 'granted' && (
          <button
            onClick={requestPermission}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-primary/5 border-b border-border text-left hover:bg-primary/10 transition-colors"
          >
            <BellOff className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-[12px] text-foreground">Enable browser notifications</span>
          </button>
        )}

        {/* List */}
        <ScrollArea className="max-h-80">
          {recentNotifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <Check className="h-4 w-4 text-muted-foreground/40" />
              </div>
              <p className="text-[13px] text-muted-foreground">All caught up</p>
              <p className="text-[11px] text-muted-foreground/50 mt-1">No new notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {recentNotifs.map((n, i) => (
                <div
                  key={`${n.id}-${i}`}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer group"
                  onClick={() => n.url && window.open(n.url, '_blank')}
                >
                  <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
                    n.type === 'new' ? 'bg-success/10' : 'bg-primary/10'
                  }`}>
                    {n.type === 'new'
                      ? <Plus className="h-3 w-3 text-success" />
                      : <MessageSquare className="h-3 w-3 text-primary" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-foreground leading-snug line-clamp-2">
                      {n.subject}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {n.author && (
                        <span className="text-[11px] text-muted-foreground">{n.author}</span>
                      )}
                      {n.time && (
                        <span className="text-[10px] text-muted-foreground/50">
                          {formatDistanceToNow(new Date(n.time), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                  {n.url && (
                    <ExternalLink className="h-3 w-3 text-muted-foreground/30 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
