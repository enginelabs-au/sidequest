import { LoadingState } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect, Stack } from 'expo-router';

export default function OnboardingLayout() {
  const { session, checkIn, loading } = useAuth();

  if (loading) return <LoadingState />;
  if (!session) return <Redirect href="/(auth)" />;
  if (checkIn) return <Redirect href="/(main)/room" />;

  return (
    <Stack>
      <Stack.Screen name="venue" options={{ title: 'Pick a venue' }} />
      <Stack.Screen name="check-in" options={{ title: 'Check in' }} />
    </Stack>
  );
}
