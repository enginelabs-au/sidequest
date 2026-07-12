import { routes } from '@/lib/routes';

/** Canonical map tab — same Social Radar UI for checked-in and checked-out users. */
export function mapTabRoute(): typeof routes.mainMap {
  return routes.mainMap;
}
