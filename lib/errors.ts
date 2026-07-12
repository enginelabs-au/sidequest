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

type PostgrestLike = { code?: string; message?: string; details?: string };

function supabaseErrorMessage(error: PostgrestLike): string | null {
  const code = error.code ?? '';
  const msg = error.message ?? '';

  if (code === '42501' || /row-level security/i.test(msg)) {
    return 'Check-in was blocked — sign in with Apple, Google, or phone, then try again.';
  }
  if (code === '23503') {
    return 'Could not save your profile. Sign out, sign in again, then retry check-in.';
  }
  if (code === 'PGRST301' || /jwt/i.test(msg)) {
    return 'Your session expired. Sign in again, then retry check-in.';
  }
  return null;
}

/** Appends a connection hint when the error looks like a network failure. */
export function formatUserError(error: unknown, fallback = 'Something went wrong'): string {
  if (error && typeof error === 'object') {
    const mapped = supabaseErrorMessage(error as PostgrestLike);
    if (mapped) return mapped;
  }

  const base = error instanceof Error ? error.message : fallback;
  if (isNetworkError(error)) {
    return `${base} Check your connection and try again.`;
  }
  return base;
}
