import { VENUE_MAX_DISTANCE_KM } from '@/constants/theme';

const EARTH_RADIUS_KM = 6371;

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export function haversineDistanceKm(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function isWithinVenueRange(
  user: Coordinates,
  venue: Coordinates,
  maxKm = VENUE_MAX_DISTANCE_KM,
): boolean {
  return haversineDistanceKm(user, venue) <= maxKm;
}

export function formatDistanceKm(km: number): string {
  if (km < 0.1) return '< 100m';
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}
