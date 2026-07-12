import { MODE_DISPLAY_LABEL } from '@/lib/peerMode';
import { resolveVenueAttendees, type VenueAttendee } from '@/lib/venueRoom';
import type { CheckIn, IntentMode, Venue } from '@/types/database';

export type ModePresenceCounts = Record<IntentMode, number>;

const EMPTY_MODE_COUNTS: ModePresenceCounts = { friends: 0, networking: 0, dating: 0 };

/** When the viewer is checked in at this venue, their id is excluded from counts. */
export function viewerExclusionUserId(
  venueId: string,
  selfCheckIn?: CheckIn | null,
): string | null {
  if (!selfCheckIn || selfCheckIn.venue_id !== venueId) return null;
  return selfCheckIn.user_id;
}

export function excludeViewerFromAttendees<T extends { user_id: string }>(
  attendees: T[],
  excludeUserId?: string | null,
): T[] {
  if (!excludeUserId) return attendees;
  return attendees.filter((a) => a.user_id !== excludeUserId);
}

export function countAttendeesByMode(
  attendees: Pick<VenueAttendee, 'mode' | 'user_id'>[],
  excludeUserId?: string | null,
): ModePresenceCounts {
  const counts = { ...EMPTY_MODE_COUNTS };
  for (const attendee of attendees) {
    if (excludeUserId && attendee.user_id === excludeUserId) continue;
    counts[attendee.mode] += 1;
  }
  return counts;
}

export async function countVenuePresenceByMode(
  venue: Venue,
  opts?: { selfCheckIn?: CheckIn | null; selfDisplayName?: string | null },
): Promise<ModePresenceCounts> {
  const { all } = await resolveVenueAttendees(venue, {
    viewerMode: 'friends',
    sameModeOnly: false,
    selfCheckIn: opts?.selfCheckIn,
    selfDisplayName: opts?.selfDisplayName,
  });
  const excludeUserId = viewerExclusionUserId(venue.id, opts?.selfCheckIn);
  return countAttendeesByMode(all, excludeUserId);
}

export type PresenceLabelOptions = {
  /** Signed-in user has an active check-in at this venue. */
  checkedInAtVenue?: boolean;
};

export type VenuePresenceCounts = {
  /** Other attendees at the venue (viewer excluded when checked in here). */
  total: number;
  /** Other attendees in the viewer's mode (viewer excluded when checked in here). */
  inMyMode: number;
  sameModeOnly: boolean;
};

export async function countVenuePresence(
  venue: Venue,
  viewerMode: IntentMode,
  opts?: { selfCheckIn?: CheckIn | null; selfDisplayName?: string | null },
): Promise<VenuePresenceCounts> {
  const { all, inMyMode, sameModeOnly } = await resolveVenueAttendees(venue, {
    viewerMode,
    selfCheckIn: opts?.selfCheckIn,
    selfDisplayName: opts?.selfDisplayName,
  });
  const excludeUserId = viewerExclusionUserId(venue.id, opts?.selfCheckIn);
  const others = excludeViewerFromAttendees(all, excludeUserId);
  const othersInMode = excludeViewerFromAttendees(inMyMode, excludeUserId);
  return { total: others.length, inMyMode: othersInMode.length, sameModeOnly };
}

export function presenceInMyModeLabel(
  inMyMode: number,
  total: number,
  mode: IntentMode,
  opts?: PresenceLabelOptions,
): string {
  const modeLabel = MODE_DISPLAY_LABEL[mode];

  if (opts?.checkedInAtVenue) {
    if (inMyMode === 0 && total > 0) {
      return `You're checked in — ${total} ${total === 1 ? 'person' : 'people'} here in other modes`;
    }
    if (inMyMode === 0) return `You're here — room is open (${modeLabel})`;
    return `${inMyMode} ${inMyMode === 1 ? 'person' : 'people'} in ${modeLabel} mode`;
  }

  if (total === 0) return `Be the first — check in anytime to open the room`;
  if (inMyMode === 0) {
    return `${total} ${total === 1 ? 'person' : 'people'} here — not in ${modeLabel} mode. You can still check in.`;
  }
  if (inMyMode === 1) return `1 person in ${modeLabel} mode`;
  return `${inMyMode} people in ${modeLabel} mode`;
}

/** Copy for the discovery deck when checked in but no same-mode profiles to show. */
export function roomFeedEmptyMessage(
  counts: Pick<VenuePresenceCounts, 'total' | 'inMyMode'>,
  viewerMode: IntentMode,
): { title: string; text: string } {
  const modeLabel = MODE_DISPLAY_LABEL[viewerMode];

  if (counts.inMyMode === 0 && counts.total > 0) {
    return {
      title: 'Room is open',
      text: `${counts.total} ${counts.total === 1 ? 'person is' : 'people are'} checked in here, but not in ${modeLabel} mode.`,
    };
  }

  return {
    title: 'Room is open',
    text: `You're the only one in ${modeLabel} mode so far. Others will appear here when they check in.`,
  };
}
