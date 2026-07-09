import { fetchRoomPeers } from '@/lib/connections';
import { supabase } from '@/lib/supabase';
import type { RoomPeer, Venue } from '@/types/database';

export async function loadRoomData(venueId: string): Promise<{
  peers: RoomPeer[];
  venue: Venue | null;
}> {
  const [peers, venueResult] = await Promise.all([
    fetchRoomPeers(),
    supabase.from('venues').select('*').eq('id', venueId).maybeSingle(),
  ]);

  if (venueResult.error) throw venueResult.error;

  return {
    peers,
    venue: venueResult.data ? (venueResult.data as Venue) : null,
  };
}
