
// ── lib/session.ts ────────────────────────────────────────────────────────────
// Generates a stable session_id for this browser tab.
// Uses sessionStorage so it resets on tab close (session-based memory).

export function getSessionId(): string {
  const key = 'zdesk_session_id';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

export function clearSession(): void {
  sessionStorage.removeItem('zdesk_session_id');
}