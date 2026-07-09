import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type SupabaseHealthResult = {
  configured: boolean;
  sessionOk: boolean;
  error: string | null;
};

/** Lightweight startup check — logs only; does not block UI. */
export async function checkSupabaseHealth(): Promise<SupabaseHealthResult> {
  if (!isSupabaseConfigured) {
    return {
      configured: false,
      sessionOk: false,
      error: null,
    };
  }

  try {
    const { error } = await supabase.auth.getSession();
    if (error) {
      console.warn('[healthcheck] Supabase session check failed:', error.message);
      return { configured: true, sessionOk: false, error: error.message };
    }
    return { configured: true, sessionOk: true, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.warn('[healthcheck] Supabase unreachable:', message);
    return { configured: true, sessionOk: false, error: message };
  }
}
