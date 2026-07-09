import { ensureProfile } from '@/lib/auth';
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
    useState,
    type ReactNode,
} from 'react';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  checkIn: CheckIn | null;
  loading: boolean;
  refreshCheckIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCheckIn = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setCheckIn(null);
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
  }, [session?.user?.id]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, next) => {
      setSession(next);

      if (event === 'SIGNED_IN' && next) {
        try {
          await ensureProfile();
        } catch (e) {
          console.warn('ensureProfile failed:', e);
        }
      }

      if (event === 'SIGNED_OUT') {
        setCheckIn(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) {
      refreshCheckIn();
    }
  }, [loading, refreshCheckIn, session?.user?.id]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setCheckIn(null);
    router.replace('/(auth)');
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      checkIn,
      loading,
      refreshCheckIn,
      signOut,
    }),
    [session, checkIn, loading, refreshCheckIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
