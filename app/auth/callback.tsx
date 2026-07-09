import { Button, ErrorBanner, LoadingState, Screen } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { createSessionFromUrl, ensureProfile, isAuthCallbackUrl } from '@/lib/auth';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { session, loading: authLoading, refreshCheckIn } = useAuth();
  const url = Linking.useURL();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (authLoading || done) return;

    if (session) {
      router.replace('/');
      setDone(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const callbackUrl = url ?? (await Linking.getInitialURL());
        if (!callbackUrl || !isAuthCallbackUrl(callbackUrl)) {
          if (!cancelled) setError('No authentication response found.');
          return;
        }

        const newSession = await createSessionFromUrl(callbackUrl);
        if (!newSession) {
          if (!cancelled) setError('Sign in was not completed.');
          return;
        }

        await ensureProfile();
        await refreshCheckIn();
        if (!cancelled) {
          setDone(true);
          router.replace('/');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Sign in failed');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, session, url, done, refreshCheckIn, router]);

  if (authLoading || (!error && !done)) {
    return <LoadingState message="Completing sign in..." />;
  }

  return (
    <Screen>
      {error ? <ErrorBanner message={error} /> : null}
      <Button title="Back to sign in" onPress={() => router.replace('/(auth)')} />
    </Screen>
  );
}
