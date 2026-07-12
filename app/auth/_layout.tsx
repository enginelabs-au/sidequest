import { LoadingState } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { routes } from '@/lib/routes';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const { session, checkIn, loading, devBypassActive } = useAuth();

  if (loading) return <LoadingState />;

  if ((session || devBypassActive) && checkIn) return <Redirect href={routes.mainHome} />;
  if (session || devBypassActive) return <Redirect href={routes.onboardingVenue} />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Sign in' }} />
      <Stack.Screen name="phone" options={{ title: 'Phone sign in', headerShown: true }} />
      <Stack.Screen name="callback" options={{ headerShown: false, title: 'Signing in' }} />
    </Stack>
  );
}
