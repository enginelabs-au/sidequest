import { Button, Screen } from '@/components/ui';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

/** Legacy route — native sign-in no longer uses browser OAuth callbacks. */
export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth');
  }, [router]);

  return (
    <Screen>
      <Button title="Back to sign in" onPress={() => router.replace('/auth')} />
    </Screen>
  );
}
