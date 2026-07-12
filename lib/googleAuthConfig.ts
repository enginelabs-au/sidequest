/** Derive Google Sign-In iOS URL scheme from an iOS OAuth client ID. */
export function googleIosUrlScheme(iosClientId: string | undefined): string | undefined {
  if (!iosClientId?.trim()) return undefined;
  const match = iosClientId.trim().match(/^([\w-]+)\.apps\.googleusercontent\.com$/);
  return match ? `com.googleusercontent.apps.${match[1]}` : undefined;
}
