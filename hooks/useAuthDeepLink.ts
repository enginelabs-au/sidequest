import { createSessionFromUrl, isAuthCallbackUrl } from '@/lib/auth';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';

async function handleAuthCallbackUrl(url: string) {
  if (!isAuthCallbackUrl(url)) return false;
  const session = await createSessionFromUrl(url);
  return session !== null;
}

/** Handles OAuth return URLs on cold start and while the app is open. */
export function useAuthDeepLink() {
  useEffect(() => {
    const processUrl = async (url: string) => {
      try {
        await handleAuthCallbackUrl(url);
      } catch (e) {
        console.warn('[auth] deep link session failed:', e);
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) processUrl(url);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      processUrl(url);
    });

    return () => subscription.remove();
  }, []);
}
