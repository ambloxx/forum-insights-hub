import { useEffect, useRef, useCallback, useState } from 'react';
import { checkNotifications } from '@/lib/api';

const POLL_INTERVAL = 30_000;
const STORAGE_KEY = 'zdesk_notif_last_check';

export interface NotifItem {
  id: number;
  type: 'new' | 'reply';
  subject: string;
  postType?: string;
  author?: string;
  time?: string;
  url?: string;
}

export interface NotifResult {
  synced: boolean;
  newCount: number;
  updatedCount: number;
  time: string;
}

export function useNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState<NotifItem[]>([]);
  const [checking, setChecking] = useState(false);
  const [lastCheckResult, setLastCheckResult] = useState<NotifResult | null>(null);
  const lastCheckRef = useRef(localStorage.getItem(STORAGE_KEY) || new Date().toISOString());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') { setPermission('granted'); return; }
    if (Notification.permission !== 'denied') {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  }, []);

  const sendNotification = useCallback((title: string, body: string, url?: string) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    try {
      const notif = new Notification(title, { body, icon: '/favicon.ico', tag: title, requireInteraction: false });
      if (url) notif.onclick = () => { window.focus(); window.open(url, '_blank'); notif.close(); };
      setTimeout(() => notif.close(), 8000);
    } catch (e) { console.warn('Notification failed:', e); }
  }, []);

  const poll = useCallback(async () => {
    if (checking) return;
    setChecking(true);
    try {
      const since = lastCheckRef.current;
      const data = await checkNotifications(since);

      setLastCheckResult({
        synced: data.synced,
        newCount: data.total_new || 0,
        updatedCount: data.total_updated || 0,
        time: new Date().toLocaleTimeString(),
      });

      const newItems: NotifItem[] = [];

      if (data.new_posts?.length) {
        for (const p of data.new_posts) {
          sendNotification(`New ${p.type?.toLowerCase() || 'post'}`, p.subject, p.topic_url);
          newItems.push({
            id: p.id, type: 'new', subject: p.subject,
            postType: p.type, author: p.creator_name,
            time: p.created_time, url: p.topic_url,
          });
        }
      }

      if (data.updated_posts?.length) {
        for (const p of data.updated_posts) {
          sendNotification(
            `Reply on ${p.type?.toLowerCase() || 'post'}`,
            `${p.last_commenter_name || 'Someone'} replied to: ${p.subject}`,
            p.topic_url
          );
          newItems.push({
            id: p.id, type: 'reply', subject: p.subject,
            postType: p.type, author: p.last_commenter_name,
            time: p.latest_comment_time, url: p.topic_url,
          });
        }
      }

      if (newItems.length > 0) {
        setUnreadCount(c => c + newItems.length);
        setRecentNotifs(prev => [...newItems, ...prev].slice(0, 30));
      }

      const now = new Date().toISOString();
      lastCheckRef.current = now;
      localStorage.setItem(STORAGE_KEY, now);
    } catch (e) {
      console.warn('Notification poll failed:', e);
    }
    setChecking(false);
  }, [checking, sendNotification]);

  useEffect(() => {
    const timeout = setTimeout(poll, 5000);
    intervalRef.current = setInterval(poll, POLL_INTERVAL);
    return () => { clearTimeout(timeout); if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [poll]);

  const clearUnread = useCallback(() => setUnreadCount(0), []);

  return {
    permission, requestPermission,
    unreadCount, clearUnread,
    recentNotifs, setRecentNotifs,
    checking, lastCheckResult,
  };
}
