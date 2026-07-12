import { useAuth } from '@/contexts/AuthContext';
import { promptCheckInRequired } from '@/lib/checkInGate';
import { mapTabRoute } from '@/lib/mapNavigation';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

export function useCheckInGate() {
  const { checkIn } = useAuth();
  const router = useRouter();

  const ensureCheckedIn = useCallback((): boolean => {
    if (checkIn) return true;
    promptCheckInRequired(() => router.push(mapTabRoute()));
    return false;
  }, [checkIn, router]);

  return { ensureCheckedIn, isCheckedIn: !!checkIn };
}
