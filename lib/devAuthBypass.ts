import { DEV_AUTH_BYPASS_ENABLED, getDevAuthCredentials } from '@/constants/devAuthBypass';
import { ensureProfile } from '@/lib/auth';
import { clearLocalAuthSession } from '@/lib/authSession';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export type DevBypassState = {
  active: boolean;
  mockUser: User | null;
};

const DEV_MOCK_USER_ID = '00000000-0000-0000-0000-dev00000001';

function buildMockUser(): User {
  return {
    id: DEV_MOCK_USER_ID,
    app_metadata: { provider: 'dev-bypass' },
    user_metadata: { full_name: 'Simulator Guest' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'simulator@dev.local',
    phone: '',
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  } as User;
}

/** Real Supabase session via email/password (recommended for check-in E2E). */
export async function signInWithDevCredentials(): Promise<Session | null> {
  const creds = getDevAuthCredentials();
  if (!creds) return null;
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: creds.email,
    password: creds.password,
  });
  if (error) {
    console.warn('[devAuthBypass] signInWithPassword failed:', error.message);
    return null;
  }
  if (data.session) {
    try {
      await ensureProfile();
    } catch (e) {
      console.warn('[devAuthBypass] ensureProfile failed:', e);
    }
  }
  return data.session;
}

/** UI-only bypass when dev credentials are not configured. */
export function createMockBypassState(): DevBypassState {
  return { active: true, mockUser: buildMockUser() };
}

export async function activateDevAuthBypass(): Promise<{
  session: Session | null;
  bypass: DevBypassState | null;
}> {
  if (!DEV_AUTH_BYPASS_ENABLED) {
    return { session: null, bypass: null };
  }

  const session = await signInWithDevCredentials();
  if (session) {
    return { session, bypass: null };
  }

  console.warn(
    '[devAuthBypass] No dev session — using UI-only mock user. ' +
      'Add DEV_AUTH_EMAIL and DEV_AUTH_PASSWORD to .env for full Supabase E2E.',
  );
  await clearLocalAuthSession();
  return { session: null, bypass: createMockBypassState() };
}

export function isDevBypassActive(bypass: DevBypassState | null): boolean {
  return DEV_AUTH_BYPASS_ENABLED && !!bypass?.active;
}
