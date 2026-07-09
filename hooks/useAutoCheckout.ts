import { VENUE_MAX_DISTANCE_KM } from '@/constants/theme';
import { performCheckout } from '@/lib/checkout';
import { haversineDistanceKm, type Coordinates } from '@/lib/geo';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';

type AutoCheckoutOptions = {
  venueCoords: Coordinates | null;
  expiresAt: string | null;
  enabled?: boolean;
  refreshCheckIn: () => Promise<void>;
};

/**
 * Auto check-out when session expires or user leaves venue area (>1km).
 * Geo watch requires foreground location permission; skipped silently if denied.
 */
export function useAutoCheckout({
  venueCoords,
  expiresAt,
  enabled = true,
  refreshCheckIn,
}: AutoCheckoutOptions) {
  const router = useRouter();
  const checkingOut = useRef(false);

  const runAutoCheckout = useCallback(
    async (reason: 'expired' | 'left_venue_area') => {
      if (checkingOut.current) return;
      checkingOut.current = true;
      try {
        await performCheckout(refreshCheckIn);
        console.info('Auto checkout:', reason);
        if (reason === 'expired') {
          Alert.alert(
            'Session ended',
            "Your check-in expired. You're invisible again.",
            [{ text: 'OK', onPress: () => router.replace('/(onboarding)/venue') }],
          );
        } else {
          router.replace('/(onboarding)/venue');
        }
      } catch (e) {
        console.warn('Auto checkout failed', e);
      } finally {
        checkingOut.current = false;
      }
    },
    [refreshCheckIn, router],
  );

  useEffect(() => {
    if (!enabled || !expiresAt) return;

    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) {
      runAutoCheckout('expired');
      return;
    }

    const timer = setTimeout(() => runAutoCheckout('expired'), ms);
    return () => clearTimeout(timer);
  }, [enabled, expiresAt, runAutoCheckout]);

  useEffect(() => {
    if (!enabled || !venueCoords) return;

    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 50,
          timeInterval: 30000,
        },
        (position) => {
          const userCoords: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          const km = haversineDistanceKm(userCoords, venueCoords);
          if (km > VENUE_MAX_DISTANCE_KM) {
            runAutoCheckout('left_venue_area');
          }
        },
      );
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled, venueCoords, runAutoCheckout]);
}
