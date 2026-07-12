import Constants from 'expo-constants';

/**
 * Dev-only direct Places API (bypasses `places-search` Edge Function).
 *
 * Key is read from `DEV_PLACES_API_KEY` in `.env` → injected via `app.config.ts` `extra`
 * (not EXPO_PUBLIC_). Omit `DEV_PLACES_API_KEY` in production/EAS env.
 *
 * Set `DEV_PLACES_FALLBACK=false` to test the Edge Function in __DEV__.
 */
const extra = Constants.expoConfig?.extra ?? {};

export function getDevPlacesApiKey(): string | null {
  const key = (extra.devPlacesApiKey as string | undefined)?.trim();
  return key || null;
}

export const DEV_PLACES_FALLBACK_ENABLED =
  extra.devPlacesFallback !== false &&
  __DEV__ &&
  !!getDevPlacesApiKey();
