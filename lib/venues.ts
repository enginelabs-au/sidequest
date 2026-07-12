import {
  DEV_TEST_VENUE_COORDS,
  DEV_TEST_VENUE_NAME,
  isDevRadarTestEnabled,
} from '@/constants/devVenues';
import { withTimeout } from '@/lib/asyncTimeout';
import {
  fetchVenueCountsRest,
  fetchVenuesRest,
  isRestSupabaseConfigured,
} from '@/lib/supabaseRest';
import { isAnonSupabaseConfigured, supabaseAnon } from '@/lib/supabaseAnon';
import { supabase } from '@/lib/supabase';
import type { Venue, VenueCount } from '@/types/database';

const VENUE_FETCH_TIMEOUT_MS = 8_000;
const COUNT_FETCH_TIMEOUT_MS = 5_000;
const LOAD_RETRY_MS = 400;

/** Seed id for The Ivy — matches supabase/seed.sql */
const DEV_TEST_VENUE_ID = 'b8ad08a5-ec05-4447-b72e-775b1654a450';

function isTransientFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('cancelled') ||
    msg.includes('canceled') ||
    msg.includes('aborted') ||
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('timed out')
  );
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (!isTransientFetchError(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, LOAD_RETRY_MS));
    return fn();
  }
}

function devFallbackVenues(): Venue[] {
  if (!isDevRadarTestEnabled()) return [];
  return [
    {
      id: DEV_TEST_VENUE_ID,
      name: DEV_TEST_VENUE_NAME,
      latitude: DEV_TEST_VENUE_COORDS.latitude,
      longitude: DEV_TEST_VENUE_COORDS.longitude,
    },
  ];
}

async function loadVenuesFromClient(): Promise<Venue[]> {
  if (isAnonSupabaseConfigured()) {
    const { data, error } = await supabaseAnon.from('venues').select('*').order('name');
    if (error) throw error;
    return (data as Venue[]) ?? [];
  }
  const { data, error } = await supabase.from('venues').select('*').order('name');
  if (error) throw error;
  return (data as Venue[]) ?? [];
}

export async function fetchVenues(): Promise<Venue[]> {
  const load = async (): Promise<Venue[]> => {
    if (isRestSupabaseConfigured()) {
      return fetchVenuesRest();
    }
    return loadVenuesFromClient();
  };

  try {
    return await withTimeout(withRetry(load), VENUE_FETCH_TIMEOUT_MS, 'Venue scan');
  } catch (error) {
    try {
      return await withTimeout(loadVenuesFromClient(), VENUE_FETCH_TIMEOUT_MS, 'Venue scan fallback');
    } catch {
      const fallback = devFallbackVenues();
      if (fallback.length) {
        console.warn('venue fetch failed — using dev Ivy fallback', error);
        return fallback;
      }
      throw error;
    }
  }
}

export async function fetchVenueName(venueId: string): Promise<string | null> {
  const client = isAnonSupabaseConfigured() ? supabaseAnon : supabase;
  const { data, error } = await client
    .from('venues')
    .select('name')
    .eq('id', venueId)
    .maybeSingle();
  if (error) throw error;
  return data?.name ?? null;
}

export async function fetchVenueById(venueId: string): Promise<Venue | null> {
  if (isRestSupabaseConfigured()) {
    try {
      const venues = await fetchVenuesRest();
      return venues.find((v) => v.id === venueId) ?? null;
    } catch {
      // fall through
    }
  }
  const client = isAnonSupabaseConfigured() ? supabaseAnon : supabase;
  const { data, error } = await client
    .from('venues')
    .select('*')
    .eq('id', venueId)
    .maybeSingle();
  if (error) throw error;
  return (data as Venue) ?? null;
}

async function fetchVenueCounts(): Promise<Record<string, number>> {
  const load = async (): Promise<Record<string, number>> => {
    if (isRestSupabaseConfigured()) {
      return fetchVenueCountsRest();
    }
    if (isAnonSupabaseConfigured()) {
      const { data, error } = await supabaseAnon.rpc('venue_active_check_in_counts');
      if (error) throw error;
      const rows = (data as VenueCount[]) ?? [];
      const counts: Record<string, number> = {};
      for (const row of rows) {
        counts[row.venue_id] = Number(row.active_count);
      }
      return counts;
    }
    const { fetchVenueCounts: legacy } = await import('@/lib/connections');
    return legacy();
  };
  return withTimeout(withRetry(load), COUNT_FETCH_TIMEOUT_MS, 'Venue counts');
}

export async function loadVenuePickerData(): Promise<{
  venues: Venue[];
  counts: Record<string, number>;
}> {
  const venues = await fetchVenues();

  try {
    const counts = await fetchVenueCounts();
    return { venues, counts };
  } catch (error) {
    console.warn('venue counts unavailable', error);
    return { venues, counts: {} };
  }
}
