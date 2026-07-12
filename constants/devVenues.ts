import Constants from 'expo-constants';

/** Seed venue used for remote check-in testing in __DEV__. */
export const DEV_TEST_VENUE_NAME = 'The Ivy';

/** Real-world coordinates for The Ivy, Sydney (seed data). */
export const DEV_TEST_VENUE_COORDS = {
  latitude: -33.8655,
  longitude: 151.2099,
} as const;

const extra = Constants.expoConfig?.extra ?? {};

export function isDevTestVenue(venue: { name: string }): boolean {
  return venue.name === DEV_TEST_VENUE_NAME;
}

/** Ivy + fake peer always on radar during local testing. */
export function isDevRadarTestEnabled(): boolean {
  return __DEV__ && (extra.devCheckInBypass === true || extra.devAuthBypass === true);
}

/** Ivy-only check-in anywhere — enabled via DEV_AUTH_BYPASS or DEV_CHECKIN_BYPASS in .env */
export function isDevTestVenueCheckInEnabled(): boolean {
  return isDevRadarTestEnabled();
}
