import { LoadingState } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  const { session, checkIn, loading } = useAuth();

  useEffect(() => {
    // Root redirect only — guards live in group layouts too
  }, []);

  if (loading) return <LoadingState message="Starting Side Quest..." />;

  if (!session) return <Redirect href="/(auth)" />;
  if (!checkIn) return <Redirect href="/(onboarding)/venue" />;
  return <Redirect href="/(main)/room" />;
}
