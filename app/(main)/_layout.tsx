import { LoadingState } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useAutoCheckout } from '@/hooks/useAutoCheckout';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchVenueById } from '@/lib/venues';
import type { Coordinates } from '@/lib/geo';
import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';

function MainStack() {
  const { checkIn, refreshCheckIn } = useAuth();
  const [venueCoords, setVenueCoords] = useState<Coordinates | null>(null);

  useEffect(() => {
    if (!checkIn || !isSupabaseConfigured) {
      setVenueCoords(null);
      return;
    }

    let cancelled = false;

    fetchVenueById(checkIn.venue_id)
      .then((venue) => {
        if (cancelled) return;
        setVenueCoords(
          venue ? { latitude: venue.latitude, longitude: venue.longitude } : null,
        );
      })
      .catch(() => {
        if (!cancelled) setVenueCoords(null);
      });

    return () => {
      cancelled = true;
    };
  }, [checkIn?.venue_id]);

  useAutoCheckout({
    venueCoords,
    expiresAt: checkIn?.expires_at ?? null,
    enabled: !!checkIn && !!venueCoords,
    refreshCheckIn,
  });

  return (
    <Stack>
      <Stack.Screen name="room" options={{ title: 'The Room' }} />
      <Stack.Screen name="chat/[connectionId]" options={{ title: 'Chat' }} />
    </Stack>
  );
}

export default function MainLayout() {
  const { session, checkIn, loading } = useAuth();

  if (loading) return <LoadingState />;
  if (!session) return <Redirect href="/(auth)" />;
  if (!checkIn) return <Redirect href="/(onboarding)/venue" />;

  return <MainStack />;
}
