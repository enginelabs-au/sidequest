import type { Coordinates } from '@/lib/geo';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

type LocationState = {
  coords: Coordinates | null;
  loading: boolean;
  error: string | null;
  permissionGranted: boolean;
  refresh: () => Promise<void>;
};

export function useLocation(): LocationState {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionGranted(false);
        setError('Location permission is required to find nearby venues.');
        setCoords(null);
        return;
      }

      setPermissionGranted(true);
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to get location');
      setCoords(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { coords, loading, error, permissionGranted, refresh };
}
