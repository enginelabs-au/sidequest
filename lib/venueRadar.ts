import type { MapFilterId } from '@/components/MapFilterSheet';
import { isDevRadarTestEnabled, isDevTestVenue } from '@/constants/devVenues';
import { VENUE_MAX_DISTANCE_KM } from '@/constants/theme';
import { haversineDistanceKm, type Coordinates } from '@/lib/geo';
import type { Venue } from '@/types/database';

/** How far from GPS to show real venues on the radar map. */
export const VENUE_RADAR_DISPLAY_RADIUS_KM = 15;

export function filterVenuesForRadar(venues: Venue[], coords: Coordinates | null): Venue[] {
  const ivy = venues.find((v) => isDevTestVenue(v));
  const nearby = venues.filter((v) => {
    if (isDevTestVenue(v)) return false;
    if (!coords) return false;
    return (
      haversineDistanceKm(coords, { latitude: v.latitude, longitude: v.longitude }) <=
      VENUE_RADAR_DISPLAY_RADIUS_KM
    );
  });

  if (ivy && isDevRadarTestEnabled()) return [ivy, ...nearby];
  return nearby;
}

/** Keep venues at their real coordinates — map centers on the user's GPS instead. */
export function mapVenueForDisplay(venue: Venue, _coords: Coordinates | null): Venue {
  return venue;
}

export function applyMapFilter<T extends { count: number; distanceKm: number | null; name: string }>(
  venues: T[],
  filter: MapFilterId,
): T[] {
  switch (filter) {
    case 'quiet':
      return venues.filter((v) => v.count < 3);
    case 'nearby':
      return venues.filter((v) => v.distanceKm !== null && v.distanceKm <= VENUE_RADAR_DISPLAY_RADIUS_KM);
    case 'friends':
      return venues.filter((v) => v.count > 0);
    case 'trending':
    default:
      return [...venues].sort((a, b) => b.count - a.count);
  }
}

export function sortVenuesForRadar<T extends { name: string; distanceKm: number | null }>(
  venues: T[],
): T[] {
  return [...venues].sort((a, b) => {
    const aIvy = isDevTestVenue(a) && isDevRadarTestEnabled();
    const bIvy = isDevTestVenue(b) && isDevRadarTestEnabled();
    if (aIvy && !bIvy) return -1;
    if (bIvy && !aIvy) return 1;
    return (a.distanceKm ?? 99) - (b.distanceKm ?? 99);
  });
}

export function realDistanceToVenueKm(
  coords: Coordinates | null,
  venue: Venue,
): number | null {
  if (!coords) return null;
  return haversineDistanceKm(coords, { latitude: venue.latitude, longitude: venue.longitude });
}

export function isWithinCheckInRange(
  coords: Coordinates | null,
  venue: Venue,
  devTestCheckInAllowed: boolean,
): boolean {
  if (devTestCheckInAllowed && isDevTestVenue(venue)) return true;
  if (!coords) return false;
  return (
    haversineDistanceKm(coords, { latitude: venue.latitude, longitude: venue.longitude }) <=
    VENUE_MAX_DISTANCE_KM
  );
}
