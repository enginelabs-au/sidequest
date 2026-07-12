import Constants from 'expo-constants';

/**
 * Dev check-in proximity bypass — skip the 1 km gate while testing.
 * Enabled when DEV_CHECKIN_BYPASS=true or DEV_AUTH_BYPASS=true in .env
 * (injected via app.config.ts extra, not EXPO_PUBLIC_).
 * Omit both in production/EAS builds.
 */
const extra = Constants.expoConfig?.extra ?? {};

export const DEV_CHECKIN_BYPASS_ENABLED =
  __DEV__ && (extra.devCheckInBypass === true || extra.devAuthBypass === true);
