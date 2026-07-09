import { LoadingState } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const { session, checkIn, loading } = useAuth();

  if (loading) return <LoadingState />;

  if (session && checkIn) return <Redirect href="/(main)/room" />;
  if (session) return <Redirect href="/(onboarding)/venue" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="phone" options={{ title: 'Phone sign in', headerShown: true }} />
    </Stack>
  );
}
