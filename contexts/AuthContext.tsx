import { DEV_AUTH_BYPASS_ENABLED, getDevAuthCredentials } from '@/constants/devAuthBypass';
import { ensureProfile } from '@/lib/auth';
import { clearLocalAuthSession, resolveStoredSession } from '@/lib/authSession';
import {
    activateDevAuthBypass,
    createMockBypassState,
    isDevBypassActive,
    type DevBypassState,
} from '@/lib/devAuthBypass';
import { clearDevLocalCheckIn, loadDevLocalCheckIn } from '@/lib/devLocalCheckIn';
import { supabase } from '@/lib/supabase';
import type { CheckIn } from '@/types/database';
import type { Session, User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  checkIn: CheckIn | null;
  loading: boolean;
  devBypassActive: boolean;
  refreshCheckIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AUTH_INIT_TIMEOUT_MS = 4_000;
const SESSION_CLEAR_TIMEOUT_MS = 2_500;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [devBypass, setDevBypass] = useState<DevBypassState | null>(() =>
    DEV_AUTH_BYPASS_ENABLED ? createMockBypassState() : null,
  );
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);
  const initDoneRef = useRef(false);
  const userSignedOutRef = useRef(false);

  const userId = session?.user?.id ?? devBypass?.mockUser?.id;
  const devBypassActive = isDevBypassActive(devBypass);

  const refreshCheckIn = useCallback(async () => {
    if (!userId) {
      setCheckIn(null);
      return;
    }

    if (devBypassActive && !session) {
      const local = await loadDevLocalCheckIn(userId);
      setCheckIn(local);
      return;
    }

    const { data, error } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('check-in fetch error', error.message);
      setCheckIn(null);
      return;
    }

    if (data && new Date(data.expires_at) > new Date()) {
      setCheckIn(data as CheckIn);
    } else {
      setCheckIn(null);
    }
  }, [userId, devBypassActive, session]);

  useEffect(() => {
    let cancelled = false;

    const initTimeout = setTimeout(() => {
      if (!initDoneRef.current) {
        console.warn('[auth] init timeout — continuing without stored session');
        initDoneRef.current = true;
        setLoading(false);
      }
    }, AUTH_INIT_TIMEOUT_MS);

    const clearSessionSafely = async () => {
      try {
        await Promise.race([
          clearLocalAuthSession(),
          new Promise<void>((resolve) => setTimeout(resolve, SESSION_CLEAR_TIMEOUT_MS)),
        ]);
      } catch (e) {
        console.warn('[auth] clearLocalAuthSession failed:', e);
      }
    };

    (async () => {
      if (DEV_AUTH_BYPASS_ENABLED) {
        console.log('[devAuthBypass] Dev bypass active — skipping login');
        if (!getDevAuthCredentials()) {
          await clearSessionSafely();
        }
      }

      let storedSession: Session | null = null;
      try {
        storedSession = await Promise.race([
          resolveStoredSession(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), SESSION_CLEAR_TIMEOUT_MS)),
        ]);
      } catch (e) {
        console.warn('[auth] resolveStoredSession failed:', e);
      }
      if (cancelled) return;

      if (storedSession) {
        setSession(storedSession);
        setDevBypass(null);
        initDoneRef.current = true;
        setLoading(false);
        return;
      }

      if (DEV_AUTH_BYPASS_ENABLED) {
        const result = await activateDevAuthBypass();
        if (cancelled) return;
        if (result.session) {
          setSession(result.session);
          setDevBypass(null);
        } else if (result.bypass) {
          await clearSessionSafely();
          setDevBypass(result.bypass);
        } else if (!devBypass) {
          await clearSessionSafely();
          setDevBypass(createMockBypassState());
        }
      }

      initDoneRef.current = true;
      setLoading(false);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, next) => {
      if (!initDoneRef.current) return;

      if (next) {
        setSession(next);
        setDevBypass(null);
        if (event === 'SIGNED_IN') {
          try {
            await ensureProfile();
          } catch (e) {
            console.warn('ensureProfile failed:', e);
          }
        }
        return;
      }

      // Null session — only clear mock bypass after explicit sign-out
      setSession(null);
      if (event === 'SIGNED_OUT' && userSignedOutRef.current) {
        setCheckIn(null);
        setDevBypass(null);
        userSignedOutRef.current = false;
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(initTimeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      refreshCheckIn();
    }
  }, [loading, refreshCheckIn, userId]);

  const signOut = useCallback(async () => {
    userSignedOutRef.current = true;
    if (devBypassActive) {
      await clearDevLocalCheckIn();
      setDevBypass(null);
      setCheckIn(null);
      router.replace('/auth');
      return;
    }
    await supabase.auth.signOut();
    setCheckIn(null);
    router.replace('/auth');
  }, [devBypassActive]);

  const user = session?.user ?? devBypass?.mockUser ?? null;

  const value = useMemo(
    () => ({
      session,
      user,
      checkIn,
      loading,
      devBypassActive,
      refreshCheckIn,
      signOut,
    }),
    [session, user, checkIn, loading, devBypassActive, refreshCheckIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** True when the user may access post-auth routes (real session or simulator bypass). */
export function useIsAuthenticated(): boolean {
  const { session, devBypassActive, loading } = useAuth();
  return !loading && (!!session || devBypassActive);
}
