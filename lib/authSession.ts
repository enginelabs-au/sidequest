import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

/** True when the stored access token is expired (30s skew). */
export function isStoredSessionExpired(session: Session): boolean {
  if (!session.expires_at) return false;
  return session.expires_at * 1000 <= Date.now() + 30_000;
}

/** Drop persisted auth tokens without a server round-trip. */
export async function clearLocalAuthSession(): Promise<void> {
  await supabase.auth.signOut({ scope: 'local' });
}

export function isJwtAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const msg = 'message' in error ? String((error as { message: string }).message) : '';
  const code = 'code' in error ? String((error as { code: string }).code) : '';
  return (
    code === 'PGRST301' ||
    /jwt|suitable key|token is expired|invalid token/i.test(msg)
  );
}

/** Returns a stored session only when it is still valid; clears stale tokens. */
export async function resolveStoredSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return null;
  if (isStoredSessionExpired(session)) {
    await clearLocalAuthSession();
    return null;
  }
  return session;
}
