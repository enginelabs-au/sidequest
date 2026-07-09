import { fetchVenueCounts } from '@/lib/connections';
import { supabase } from '@/lib/supabase';
import type { Venue } from '@/types/database';

export async function fetchVenues(): Promise<Venue[]> {
  const { data, error } = await supabase.from('venues').select('*').order('name');
  if (error) throw error;
  return (data as Venue[]) ?? [];
}

export async function fetchVenueName(venueId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('venues')
    .select('name')
    .eq('id', venueId)
    .maybeSingle();
  if (error) throw error;
  return data?.name ?? null;
}

export async function fetchVenueById(venueId: string): Promise<Venue | null> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', venueId)
    .maybeSingle();
  if (error) throw error;
  return (data as Venue) ?? null;
}

export async function loadVenuePickerData(): Promise<{
  venues: Venue[];
  counts: Record<string, number>;
}> {
  const [venues, counts] = await Promise.all([fetchVenues(), fetchVenueCounts()]);
  return { venues, counts };
}
