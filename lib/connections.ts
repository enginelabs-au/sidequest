import { supabase } from '@/lib/supabase';
import type { Connection, RoomPeer, VenueCount } from '@/types/database';

export async function fetchVenueCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc('venue_active_check_in_counts');
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of (data as VenueCount[]) ?? []) {
    counts[row.venue_id] = Number(row.active_count);
  }
  return counts;
}

export async function fetchRoomPeers(): Promise<RoomPeer[]> {
  const { data, error } = await supabase.rpc('get_room_peers');
  if (error) throw error;
  return (data as RoomPeer[]) ?? [];
}

export async function requestConnection(targetUserId: string): Promise<Connection> {
  const { data, error } = await supabase.rpc('request_connection', {
    target_user_id: targetUserId,
  });
  if (error) throw error;
  return data as Connection;
}

export async function blockUser(targetUserId: string): Promise<void> {
  const { error } = await supabase.rpc('block_user', {
    target_user_id: targetUserId,
  });
  if (error) throw error;
}

export async function checkoutUser(): Promise<void> {
  const { error } = await supabase.rpc('checkout_user');
  if (error) throw error;
}

/** @deprecated Use submitSafetyReport from lib/safety.ts */
export { submitSafetyReport as submitReport } from '@/lib/safety';
