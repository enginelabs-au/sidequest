import {
    appendDevFakePeersIfNeeded,
    createDevFakePeerForMode,
    createDevFakePeersAtVenue,
    shouldShowDevFakePeerAtVenue,
} from '@/lib/devFakePeer';
import { filterBySameMode } from '@/lib/peerMode';
import { getSameModeOnlyPreference } from '@/lib/preferences';
import { supabase } from '@/lib/supabase';
import type { CheckIn, GroupSize, IntentMode, Venue } from '@/types/database';

export type VenueAttendee = {
  user_id: string;
  display_name: string | null;
  mode: IntentMode;
  group_size: GroupSize;
  is_dev_fake?: boolean;
};

export type ResolveVenueAttendeesOptions = {
  viewerMode: IntentMode;
  sameModeOnly?: boolean;
  /** Include the signed-in user's active check-in at this venue when not yet in RPC results. */
  selfCheckIn?: CheckIn | null;
  selfDisplayName?: string | null;
};

export async function fetchVenueAttendees(venueId: string): Promise<VenueAttendee[]> {
  const { data, error } = await supabase.rpc('get_venue_attendees', {
    p_venue_id: venueId,
  });
  if (error) throw error;
  return ((data as VenueAttendee[]) ?? []).map((row) => ({
    user_id: row.user_id,
    display_name: row.display_name,
    mode: row.mode as IntentMode,
    group_size: row.group_size as GroupSize,
  }));
}

function appendSelfIfNeeded(
  attendees: VenueAttendee[],
  venueId: string,
  opts: ResolveVenueAttendeesOptions,
): VenueAttendee[] {
  const self = opts.selfCheckIn;
  if (!self || self.venue_id !== venueId) return attendees;
  if (attendees.some((a) => a.user_id === self.user_id)) return attendees;

  // Solo check-in is always valid — include the signed-in user in the venue roster.
  return [
    {
      user_id: self.user_id,
      display_name: opts.selfDisplayName?.trim() || 'You',
      mode: self.mode,
      group_size: self.group_size,
    },
    ...attendees,
  ];
}

function appendDevFakeIfNeeded(
  attendees: VenueAttendee[],
  venue: Venue,
): VenueAttendee[] {
  if (!shouldShowDevFakePeerAtVenue(venue)) return attendees;
  return appendDevFakePeersIfNeeded(attendees, venue, () =>
    createDevFakePeersAtVenue().map((fake) => ({
      user_id: fake.user_id,
      display_name: fake.display_name,
      mode: fake.mode,
      group_size: fake.group_size,
      is_dev_fake: true,
    })),
  );
}

/** Single source of truth for venue roster counts and room lists. */
export async function resolveVenueAttendees(
  venue: Venue,
  opts: ResolveVenueAttendeesOptions,
): Promise<{ all: VenueAttendee[]; inMyMode: VenueAttendee[]; sameModeOnly: boolean }> {
  const sameModeOnly = opts.sameModeOnly ?? (await getSameModeOnlyPreference());

  let all: VenueAttendee[] = [];
  try {
    all = await fetchVenueAttendees(venue.id);
  } catch {
    all = [];
  }

  all = appendSelfIfNeeded(all, venue.id, { ...opts, sameModeOnly });
  all = appendDevFakeIfNeeded(all, venue);

  const inMyMode = sameModeOnly ? filterBySameMode(all, opts.viewerMode) : all;
  return { all, inMyMode, sameModeOnly };
}

export async function loadVenueRoomAttendees(
  venue: Venue,
  viewerMode?: IntentMode,
  selfCheckIn?: CheckIn | null,
  selfDisplayName?: string | null,
): Promise<VenueAttendee[]> {
  const mode = viewerMode ?? 'friends';
  const { inMyMode } = await resolveVenueAttendees(venue, {
    viewerMode: mode,
    selfCheckIn,
    selfDisplayName,
  });
  return inMyMode;
}

export function mergeDevFakeRoomPeer(
  peers: import('@/types/database').RoomPeer[],
  venue: Venue | null,
  viewerMode?: IntentMode,
): import('@/types/database').RoomPeer[] {
  if (!venue || !viewerMode) return peers;
  if (!shouldShowDevFakePeerAtVenue(venue)) return peers;
  const fake = createDevFakePeerForMode(viewerMode);
  return appendDevFakePeersIfNeeded(peers, venue, () => [fake]);
}
