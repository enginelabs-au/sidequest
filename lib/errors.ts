const NETWORK_PATTERNS = [
  'network request failed',
  'failed to fetch',
  'network error',
  'load failed',
];

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase();
    return NETWORK_PATTERNS.some((p) => msg.includes(p));
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return NETWORK_PATTERNS.some((p) => msg.includes(p));
  }
  return false;
}

/** Appends a connection hint when the error looks like a network failure. */
export function formatUserError(error: unknown, fallback = 'Something went wrong'): string {
  const base = error instanceof Error ? error.message : fallback;
  if (isNetworkError(error)) {
    return `${base} Check your connection and try again.`;
  }
  return base;
}
