/** Derive Google Sign-In iOS URL scheme from an iOS OAuth client ID. */
export function googleIosUrlScheme(iosClientId: string | undefined): string | undefined {
  if (!iosClientId?.trim()) return undefined;
  const match = iosClientId.trim().match(/^([\w-]+)\.apps\.googleusercontent\.com$/);
  return match ? `com.googleusercontent.apps.${match[1]}` : undefined;
}

/** Comma-separated IDs for Supabase → Google → Authorized Client IDs. */
export function buildGoogleAuthorizedClientIds(
  webClientId: string | undefined,
  iosClientId: string | undefined,
  androidClientId: string | undefined,
): string {
  const ids = [webClientId, iosClientId, androidClientId]
    .map((id) => id?.trim())
    .filter((id): id is string => !!id);
  return [...new Set(ids)].join(',');
}
