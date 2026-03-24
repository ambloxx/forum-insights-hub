import { useEffect, useRef } from 'react';
import { checkNotifications } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export function useNotifications() {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const check = async () => {
      try {
        const lastChecked = localStorage.getItem('zdesk-last-checked') || new Date(Date.now() - 86400000).toISOString();
        const data = await checkNotifications(lastChecked);
        if (data.total_new > 0) {
          toast({ title: `${data.total_new} new posts since your last visit` });
        }
        if (data.total_updated > 0) {
          toast({ title: `${data.total_updated} posts updated` });
        }
        localStorage.setItem('zdesk-last-checked', new Date().toISOString());
      } catch {
        // silent fail
      }
    };

    check();
    intervalRef.current = setInterval(check, 60000);
    return () => clearInterval(intervalRef.current);
  }, []);
}
