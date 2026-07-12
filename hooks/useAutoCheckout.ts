import { isDevTestVenue, isDevTestVenueCheckInEnabled } from '@/constants/devVenues';
import { VENUE_MAX_DISTANCE_KM } from '@/constants/theme';
import { mapTabRoute } from '@/lib/mapNavigation';
import { performCheckout, type CheckoutMeta } from '@/lib/checkout';
import { haversineDistanceKm, type Coordinates } from '@/lib/geo';
import type { IntentMode } from '@/types/database';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';

type AutoCheckoutOptions = {
  venueCoords: Coordinates | null;
  venueName?: string | null;
  venueId?: string | null;
  mode?: IntentMode | null;
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
  venueName,
  venueId,
  mode,
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
        const meta: CheckoutMeta | undefined =
          venueId && venueName && mode
            ? { venueId, venueName, mode }
            : undefined;
        await performCheckout(refreshCheckIn, meta);
        console.info('Auto checkout:', reason);
        if (reason === 'expired') {
          Alert.alert(
            'Session ended',
            "Your check-in expired. You're invisible again.",
            [{ text: 'OK', onPress: () => router.replace(mapTabRoute()) }],
          );
        } else {
          router.replace(mapTabRoute());
        }
      } catch (e) {
        console.warn('Auto checkout failed', e);
      } finally {
        checkingOut.current = false;
      }
    },
    [refreshCheckIn, router, venueId, venueName, mode],
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

  const skipGeoCheckout =
    isDevTestVenueCheckInEnabled() && !!venueName && isDevTestVenue({ name: venueName });

  useEffect(() => {
    if (!enabled || !venueCoords || skipGeoCheckout) return;

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
  }, [enabled, venueCoords, skipGeoCheckout, runAutoCheckout]);
}
