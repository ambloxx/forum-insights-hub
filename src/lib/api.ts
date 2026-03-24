const API_BASE = 'http://issath-3653-ait.tsi.zohocorpin.com:8001';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchPosts(params: {
  limit?: number;
  offset?: number;
  order_by?: string;
  post_type?: string;
  label?: string;
  unreplied?: boolean;
  days?: number;
}) {
  const searchParams = new URLSearchParams();
  searchParams.set('limit', String(params.limit ?? 20));
  searchParams.set('offset', String(params.offset ?? 0));
  if (params.order_by) searchParams.set('order_by', params.order_by);
  if (params.post_type) searchParams.set('post_type', params.post_type);
  if (params.label) searchParams.set('label', params.label);
  if (params.unreplied) searchParams.set('unreplied', 'true');
  if (params.days) searchParams.set('days', String(params.days));

  const res = await fetch(`${API_BASE}/posts?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export async function fetchSyncStatus() {
  const res = await fetch(`${API_BASE}/sync/status`);
  if (!res.ok) throw new Error('Failed to fetch sync status');
  return res.json();
}

export async function fetchSyncProgress() {
  const res = await fetch(`${API_BASE}/sync/progress`);
  if (!res.ok) throw new Error('Failed to fetch sync progress');
  return res.json();
}

export async function triggerSync(type: 'full' | 'delta') {
  const res = await fetch(`${API_BASE}/sync/${type}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to trigger ${type} sync`);
  return res.json();
}

export async function checkNotifications(since: string) {
  const res = await fetch(`${API_BASE}/notifications/check?since=${encodeURIComponent(since)}`);
  if (!res.ok) throw new Error('Failed to check notifications');
  return res.json();
}

export function streamChat(question: string) {
  return fetch(`${API_BASE}/ask/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
}
