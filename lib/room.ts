import { fetchRoomPeers } from '@/lib/connections';
import { createDevFakePeerForMode, isDevIvyPeerId } from '@/lib/devFakePeer';
import { getSameModeOnlyPreference } from '@/lib/preferences';
import { supabase } from '@/lib/supabase';
import { countAttendeesByMode, excludeViewerFromAttendees, type ModePresenceCounts, type VenuePresenceCounts } from '@/lib/venuePresence';
import { resolveVenueAttendees, type VenueAttendee } from '@/lib/venueRoom';
import type { CheckIn, IntentMode, RoomPeer, Venue } from '@/types/database';

function attendeeToRoomPeer(attendee: VenueAttendee): RoomPeer {
  if (attendee.is_dev_fake || isDevIvyPeerId(attendee.user_id)) {
    const fake = createDevFakePeerForMode(attendee.mode);
    return {
      ...fake,
      display_name: attendee.display_name ?? fake.display_name,
    };
  }

  return {
    user_id: attendee.user_id,
    display_name: attendee.display_name,
    avatar_url: null,
    mode: attendee.mode,
    group_size: attendee.group_size,
    friends_interests: null,
    friends_music: null,
    friends_hobbies: null,
    friends_fun_facts: null,
    networking_role: null,
    networking_industry: null,
    networking_skills: null,
    dating_aesthetic: null,
    dating_chemistry_notes: null,
    connection_id: null,
    connection_status: null,
    i_want: null,
    they_want: null,
  };
}

export type LoadRoomDataOptions = {
  selfCheckIn?: CheckIn | null;
  selfDisplayName?: string | null;
};

export async function loadRoomData(
  venueId: string,
  viewerMode: IntentMode,
  opts?: LoadRoomDataOptions,
): Promise<{
  peers: RoomPeer[];
  venue: Venue | null;
  presence: VenuePresenceCounts;
  modeCounts: ModePresenceCounts;
}> {
  const sameModeOnly = await getSameModeOnlyPreference();
  const selfId = opts?.selfCheckIn?.user_id;

  const venueResult = await supabase.from('venues').select('*').eq('id', venueId).maybeSingle();
  if (venueResult.error) throw venueResult.error;
  const venue = venueResult.data ? (venueResult.data as Venue) : null;

  let presence: VenuePresenceCounts = { total: 0, inMyMode: 0, sameModeOnly };
  let modeCounts: ModePresenceCounts = { friends: 0, networking: 0, dating: 0 };
  let peers: RoomPeer[] = [];

  if (venue) {
    const resolved = await resolveVenueAttendees(venue, {
      viewerMode,
      selfCheckIn: opts?.selfCheckIn,
      selfDisplayName: opts?.selfDisplayName,
      sameModeOnly,
    });
    const excludeUserId = selfId ?? null;
    const othersAll = excludeViewerFromAttendees(resolved.all, excludeUserId);
    const othersInMode = excludeViewerFromAttendees(resolved.inMyMode, excludeUserId);
    presence = {
      total: othersAll.length,
      inMyMode: othersInMode.length,
      sameModeOnly: resolved.sameModeOnly,
    };
    modeCounts = countAttendeesByMode(resolved.all, excludeUserId);

    peers = resolved.inMyMode
      .filter((a) => a.user_id !== selfId)
      .map(attendeeToRoomPeer);

    try {
      const roomPeers = await fetchRoomPeers();
      const byId = new Map(roomPeers.map((p) => [p.user_id, p]));
      peers = peers.map((peer) => {
        const enriched = byId.get(peer.user_id);
        return enriched ? { ...peer, ...enriched } : peer;
      });
    } catch {
      // Offline / dev bypass — roster from resolveVenueAttendees is enough.
    }
  }

  return { peers, venue, presence, modeCounts };
}
