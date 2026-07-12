import { fetchGoogleVenueSignals } from '@/lib/googlePlaces';
import type { GoogleVenueSignal } from '@/lib/googleVenueSignals';
import type { Venue } from '@/types/database';
import { useEffect, useMemo, useState } from 'react';

export function useGoogleVenueSignals(venues: Venue[]): Record<string, GoogleVenueSignal> {
  const [signals, setSignals] = useState<Record<string, GoogleVenueSignal>>({});

  const venueKey = useMemo(
    () =>
      venues
        .map((v) => `${v.id}:${v.latitude}:${v.longitude}:${v.name}`)
        .sort()
        .join('|'),
    [venues],
  );

  const venueInputs = useMemo(
    () =>
      venues.map((v) => ({
        id: v.id,
        name: v.name,
        latitude: v.latitude,
        longitude: v.longitude,
      })),
    [venueKey],
  );

  useEffect(() => {
    if (!venueInputs.length) {
      setSignals((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }

    let cancelled = false;

    fetchGoogleVenueSignals(venueInputs)
      .then((next) => {
        if (!cancelled) setSignals(next);
      })
      .catch(() => {
        if (!cancelled) setSignals((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      });

    return () => {
      cancelled = true;
    };
  }, [venueInputs]);

  return signals;
}
