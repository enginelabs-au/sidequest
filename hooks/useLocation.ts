import { DEV_TEST_VENUE_COORDS } from '@/constants/devVenues';
import type { Coordinates } from '@/lib/geo';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

const LOCATION_TIMEOUT_MS = 12_000;
const WATCH_DISTANCE_M = 15;
const WATCH_INTERVAL_MS = 3_000;

const isPhysicalDevice = Constants.isDevice === true;

/** Sydney CBD — simulator dev fallback when no simulated location is set. */
const SIMULATOR_DEV_COORDS: Coordinates = {
  latitude: -33.8688,
  longitude: 151.2093,
};

type LocationState = {
  coords: Coordinates | null;
  loading: boolean;
  error: string | null;
  permissionGranted: boolean;
  usingSimulatorFallback: boolean;
  refresh: (opts?: { silent?: boolean }) => Promise<void>;
};

function toCoords(position: Location.LocationObject): Coordinates {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

function simulatorDevFallback(): Coordinates {
  return __DEV__ ? SIMULATOR_DEV_COORDS : DEV_TEST_VENUE_COORDS;
}

async function readPosition(): Promise<{ coords: Coordinates; simulated: boolean } | null> {
  const primaryAccuracy = isPhysicalDevice
    ? Location.Accuracy.BestForNavigation
    : Location.Accuracy.Low;

  try {
    const position = await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: primaryAccuracy,
        mayShowUserSettingsDialog: isPhysicalDevice,
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Location timed out')), LOCATION_TIMEOUT_MS);
      }),
    ]);
    return { coords: toCoords(position), simulated: false };
  } catch {
    if (isPhysicalDevice) {
      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          mayShowUserSettingsDialog: true,
        });
        return { coords: toCoords(position), simulated: false };
      } catch {
        // fall through
      }
    }

    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: isPhysicalDevice ? 300_000 : 600_000,
    });
    if (lastKnown) return { coords: toCoords(lastKnown), simulated: false };

    if (!isPhysicalDevice && __DEV__) {
      return { coords: simulatorDevFallback(), simulated: true };
    }

    return null;
  }
}

export function useLocation(): LocationState {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [usingSimulatorFallback, setUsingSimulatorFallback] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const stopWatch = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;
  }, []);

  const startWatch = useCallback(async () => {
    if (watchRef.current) return;

    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: isPhysicalDevice
          ? Location.Accuracy.BestForNavigation
          : Location.Accuracy.Low,
        distanceInterval: WATCH_DISTANCE_M,
        timeInterval: WATCH_INTERVAL_MS,
      },
      (position) => {
        setCoords(toCoords(position));
        setUsingSimulatorFallback(false);
        setLoading(false);
        setError(null);
      },
    );
  }, []);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionGranted(false);
        stopWatch();
        if (!silent) {
          setError('Location permission is required to find nearby venues.');
          setCoords(null);
          setUsingSimulatorFallback(false);
        }
        return;
      }

      setPermissionGranted(true);
      const result = await readPosition();
      setCoords(result?.coords ?? null);
      setUsingSimulatorFallback(result?.simulated ?? false);

      if (!result?.coords && !silent) {
        setError(
          isPhysicalDevice
            ? 'Could not get your location. Enable Location Services and try again.'
            : 'Could not get your location. In Simulator: Features → Location → Custom Location.',
        );
      } else if (result?.simulated && !silent) {
        setError(null);
      } else if (silent || result?.coords) {
        setError(null);
      }

      await startWatch();
    } catch (e) {
      if (!silent) {
        setError(e instanceof Error ? e.message : 'Failed to get location');
        if (!isPhysicalDevice && __DEV__) {
          setCoords(simulatorDevFallback());
          setUsingSimulatorFallback(true);
          setError(null);
        } else {
          setCoords(null);
          setUsingSimulatorFallback(false);
        }
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [startWatch, stopWatch]);

  useEffect(() => {
    refresh();
    return () => stopWatch();
  }, [refresh, stopWatch]);

  return { coords, loading, error, permissionGranted, usingSimulatorFallback, refresh };
}
