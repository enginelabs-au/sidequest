import { SwipeNavEdges } from '@/components/SwipeNavEdges';
import { LoadingState } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAutoCheckout } from '@/hooks/useAutoCheckout';
import { useNavHistoryTracker } from '@/hooks/useNavHistoryTracker';
import type { Coordinates } from '@/lib/geo';
import { modeStackHeaderOptions } from '@/lib/modeTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchVenueById } from '@/lib/venues';
import { Redirect, Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

function MainStack() {
  useNavHistoryTracker();
  const { checkIn, refreshCheckIn } = useAuth();
  const { colors } = useTheme();
  const [venueCoords, setVenueCoords] = useState<Coordinates | null>(null);
  const [venueName, setVenueName] = useState<string | null>(null);

  const chatHeaderOptions = useMemo(
    () => modeStackHeaderOptions(colors, 'Chat', 'Inbox'),
    [colors],
  );

  useEffect(() => {
    if (!checkIn || !isSupabaseConfigured) {
      setVenueCoords(null);
      setVenueName(null);
      return;
    }

    let cancelled = false;

    fetchVenueById(checkIn.venue_id)
      .then((venue) => {
        if (cancelled) return;
        setVenueCoords(
          venue ? { latitude: venue.latitude, longitude: venue.longitude } : null,
        );
        setVenueName(venue?.name ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setVenueCoords(null);
          setVenueName(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [checkIn?.venue_id]);

  useAutoCheckout({
    venueCoords,
    venueName,
    venueId: checkIn?.venue_id ?? null,
    mode: checkIn?.mode ?? null,
    expiresAt: checkIn?.expires_at ?? null,
    enabled: !!checkIn && !!venueCoords,
    refreshCheckIn,
  });

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="tabs" options={{ headerShown: false, title: 'Home' }} />
        <Stack.Screen name="venue" options={{ headerShown: false }} />
        <Stack.Screen name="room" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: 'My profile', headerShown: false }} />
        <Stack.Screen
          name="chat/[connectionId]"
          options={chatHeaderOptions}
        />
        <Stack.Screen name="archived" options={{ headerShown: false }} />
        <Stack.Screen name="report" options={{ headerShown: false }} />
        <Stack.Screen name="peer/[userId]" options={{ title: 'Profile', headerShown: false }} />
      </Stack>
      <SwipeNavEdges />
    </View>
  );
}

export default function MainLayout() {
  const { session, checkIn, loading, devBypassActive } = useAuth();

  if (loading) return <LoadingState />;
  if (!session && !devBypassActive) return <Redirect href="/auth" />;

  return <MainStack />;
}
