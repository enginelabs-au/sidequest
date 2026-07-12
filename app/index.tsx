import { LoadingState } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';

export default function Index() {
  const { session, checkIn, loading, devBypassActive } = useAuth();

  if (loading) return <LoadingState message="Starting Side Quest..." />;

  if (!session && !devBypassActive) return <Redirect href="/auth" />;
  if (!checkIn) return <Redirect href="/main/tabs/map" />;
  return <Redirect href="/main/tabs/home" />;
}
