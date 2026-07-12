import type { Venue, VenueCount } from '@/types/database';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

function getSupabaseUrl(): string {
  return (
    (extra.supabaseUrl as string | undefined) ??
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    ''
  );
}

function getSupabaseAnonKey(): string {
  return (
    (extra.supabaseAnonKey as string | undefined) ??
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    ''
  );
}

export function isRestSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return !!url && !!key && url !== 'https://placeholder.supabase.co' && key !== 'placeholder-anon-key';
}

/** Direct anon REST — avoids Supabase JS client session quirks on RN. */
export async function restGet<T>(path: string): Promise<T> {
  const res = await fetch(`${getSupabaseUrl()}${path}`, {
    headers: {
      apikey: getSupabaseAnonKey(),
      Authorization: `Bearer ${getSupabaseAnonKey()}`,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `REST GET failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function restRpc<T>(fn: string, body: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`${getSupabaseUrl()}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: getSupabaseAnonKey(),
      Authorization: `Bearer ${getSupabaseAnonKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `RPC ${fn} failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function fetchVenuesRest(): Promise<Venue[]> {
  return restGet<Venue[]>('/rest/v1/venues?select=*&order=name');
}

export async function fetchVenueCountsRest(): Promise<Record<string, number>> {
  const rows = await restRpc<VenueCount[]>('venue_active_check_in_counts');
  const counts: Record<string, number> = {};
  for (const row of rows ?? []) {
    counts[row.venue_id] = Number(row.active_count);
  }
  return counts;
}
