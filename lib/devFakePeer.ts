import { isDevTestVenue, isDevTestVenueCheckInEnabled } from '@/constants/devVenues';
import { isGuestSimulationActive } from '@/lib/guestSimulation';
import type { IntentMode, RoomPeer } from '@/types/database';

/** Friends-mode Ivy test peer (Jordan) — also used for dev inbox/chat. */
export const DEV_FAKE_PEER_ID = '00000000-0000-4000-8000-00000000ivy';

export const DEV_IVY_PEER_IDS = {
  friends: DEV_FAKE_PEER_ID,
  networking: '00000000-0000-4000-8000-00000000net',
  dating: '00000000-0000-4000-8000-00000000dat',
} as const satisfies Record<IntentMode, string>;

const IVY_MODES: IntentMode[] = ['friends', 'networking', 'dating'];

const DEV_IVY_PEERS: Record<IntentMode, RoomPeer> = {
  friends: {
    user_id: DEV_IVY_PEER_IDS.friends,
    display_name: 'Jordan',
    avatar_url: null,
    mode: 'friends',
    group_size: '1:1',
    friends_interests: ['Live music', 'Rooftop bars'],
    friends_music: ['House', 'R&B'],
    friends_hobbies: ['Photography'],
    friends_fun_facts: 'Once talked the DJ into playing my request at The Ivy.',
    networking_role: null,
    networking_industry: null,
    networking_skills: null,
    dating_aesthetic: null,
    dating_chemistry_notes: null,
    connection_id: null,
    connection_status: null,
    i_want: null,
    they_want: null,
  },
  networking: {
    user_id: DEV_IVY_PEER_IDS.networking,
    display_name: 'Alex',
    avatar_url: null,
    mode: 'networking',
    group_size: '1:1',
    friends_interests: null,
    friends_music: null,
    friends_hobbies: null,
    friends_fun_facts: null,
    networking_role: 'Product Lead',
    networking_industry: 'SaaS / Startups',
    networking_skills: ['Product', 'GTM', 'Fundraising'],
    dating_aesthetic: null,
    dating_chemistry_notes: null,
    connection_id: null,
    connection_status: null,
    i_want: null,
    they_want: null,
  },
  dating: {
    user_id: DEV_IVY_PEER_IDS.dating,
    display_name: 'Sania',
    avatar_url: null,
    mode: 'dating',
    group_size: '1:1',
    friends_interests: null,
    friends_music: null,
    friends_hobbies: null,
    friends_fun_facts: null,
    networking_role: null,
    networking_industry: null,
    networking_skills: null,
    dating_aesthetic: 'Cocktail bars & live jazz',
    dating_chemistry_notes: 'Warm, curious, loves spontaneous city walks.',
    connection_id: null,
    connection_status: null,
    i_want: null,
    they_want: null,
  },
};

export function isDevIvyPeerId(userId: string): boolean {
  return IVY_MODES.some((mode) => DEV_IVY_PEER_IDS[mode] === userId);
}

/** @deprecated Use isDevIvyPeerId */
export function isDevFakePeerId(userId: string): boolean {
  return isDevIvyPeerId(userId);
}

export function createDevFakePeerForMode(mode: IntentMode): RoomPeer {
  return { ...DEV_IVY_PEERS[mode] };
}

/** All Ivy test peers — one per Open To mode. */
export function createDevFakePeersAtVenue(): RoomPeer[] {
  return IVY_MODES.map((mode) => createDevFakePeerForMode(mode));
}

/** @deprecated Use createDevFakePeerForMode('friends') */
export function createDevFakePeer(): RoomPeer {
  return createDevFakePeerForMode('friends');
}

export function shouldShowDevFakePeerAtVenue(venue: { name: string } | null | undefined): boolean {
  return (
    isGuestSimulationActive() &&
    !!venue &&
    isDevTestVenueCheckInEnabled() &&
    isDevTestVenue(venue)
  );
}

export function appendDevFakePeersIfNeeded<T extends { user_id: string }>(
  peers: T[],
  venue: { name: string } | null | undefined,
  createFakes: () => T[],
): T[] {
  if (!shouldShowDevFakePeerAtVenue(venue)) return peers;
  const existing = new Set(peers.map((p) => p.user_id));
  const toAdd = createFakes().filter((fake) => !existing.has(fake.user_id));
  if (toAdd.length === 0) return peers;
  return [...toAdd, ...peers];
}

/** @deprecated Use appendDevFakePeersIfNeeded */
export function appendDevFakePeerIfNeeded<T extends { user_id: string }>(
  peers: T[],
  venue: { name: string } | null | undefined,
  createFake: () => T,
): T[] {
  return appendDevFakePeersIfNeeded(peers, venue, () => [createFake()]);
}

/** Map pin / rail — DB count + Ivy test peer in the viewer's mode. */
export function mapVenuePinCount(
  venue: { name: string },
  dbCount: number,
  viewerMode: IntentMode = 'friends',
): number {
  if (!shouldShowDevFakePeerAtVenue(venue)) return dbCount;
  return dbCount + 1;
}

/** How many Ivy test peers are injected at a dev venue (one per mode). */
export function devIvyPeerCount(): number {
  return IVY_MODES.length;
}
