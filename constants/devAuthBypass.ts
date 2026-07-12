import Constants from 'expo-constants';

/**
 * Dev auth bypass — TEMPORARY for local UI testing on simulator or physical device.
 * Set DEV_AUTH_BYPASS=true in .env (injected via app.config.ts extra, not EXPO_PUBLIC_).
 * Omit DEV_AUTH_* in production/EAS env.
 */
const extra = Constants.expoConfig?.extra ?? {};

/** Explicit opt-in only — never default-on in release builds. */
export const DEV_AUTH_BYPASS_ENABLED = extra.devAuthBypass === true && __DEV__;

export function getDevAuthCredentials(): { email: string; password: string } | null {
  const email = (extra.devAuthEmail as string | undefined)?.trim();
  const password = extra.devAuthPassword as string | undefined;
  if (!email || !password) return null;
  return { email, password };
}
