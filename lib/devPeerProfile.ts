import {
    createDevFakePeer,
    createDevFakePeerForMode,
    DEV_IVY_PEER_IDS,
    isDevIvyPeerId
} from '@/lib/devFakePeer';
import type { IntentMode, RoomPeer } from '@/types/database';

export type PublicPeerProfile = {
  user_id: string;
  display_name: string;
  mode: IntentMode;
  tagline: string;
  bio: string;
  vibe_tags: string[];
  friends_interests: string[];
  friends_music: string[];
  friends_hobbies: string[];
  friends_fun_facts: string;
  checked_in_venue?: string;
};

const DEV_IVY_PROFILES: Record<string, PublicPeerProfile> = {
  [DEV_IVY_PEER_IDS.friends]: {
    user_id: DEV_IVY_PEER_IDS.friends,
    display_name: 'Jordan',
    mode: 'friends',
    tagline: 'Rooftop regular · always finds the vibe',
    bio: 'Sydney local who lives for live music and golden-hour rooftops. Usually shooting street photography between sets. Happy to share spot recommendations or join a group for the next round.',
    vibe_tags: ['Live music', 'Rooftop bars', 'Photography', 'House & R&B'],
    friends_interests: ['Live music', 'Rooftop bars', 'Late-night food'],
    friends_music: ['House', 'R&B', 'UK Garage'],
    friends_hobbies: ['Photography', 'Film cameras', 'Neighbourhood walks'],
    friends_fun_facts: 'Once talked the DJ into playing my request at The Ivy.',
    checked_in_venue: 'The Ivy',
  },
  [DEV_IVY_PEER_IDS.networking]: {
    user_id: DEV_IVY_PEER_IDS.networking,
    display_name: 'Alex',
    mode: 'networking',
    tagline: 'Product lead · open to founder chats',
    bio: 'Building in SaaS and happy to swap notes on product, GTM, and fundraising. Checked in at The Ivy for a casual networking session — say hi if you are in networking mode.',
    vibe_tags: ['Startups', 'SaaS', 'Product', 'Founders'],
    friends_interests: [],
    friends_music: [],
    friends_hobbies: [],
    friends_fun_facts: '',
    checked_in_venue: 'The Ivy',
  },
  [DEV_IVY_PEER_IDS.dating]: {
    user_id: DEV_IVY_PEER_IDS.dating,
    display_name: 'Sania',
    mode: 'dating',
    tagline: 'Cocktail bars · live jazz · city walks',
    bio: 'Warm and curious — here for good conversation and spontaneous nights out. Usually scouting rooftops and live music spots around the CBD.',
    vibe_tags: ['Cocktails', 'Live jazz', 'Rooftops', 'Dating'],
    friends_interests: [],
    friends_music: [],
    friends_hobbies: [],
    friends_fun_facts: '',
    checked_in_venue: 'The Ivy',
  },
};

export function isDevFakePeer(userId: string): boolean {
  return isDevIvyPeerId(userId);
}

export function getDevPeerProfile(userId: string): PublicPeerProfile | null {
  const profile = DEV_IVY_PROFILES[userId];
  return profile ? { ...profile } : null;
}

export function roomPeerToProfile(peer: RoomPeer): PublicPeerProfile {
  if (isDevFakePeer(peer.user_id)) {
    return getDevPeerProfile(peer.user_id)!;
  }
  return {
    user_id: peer.user_id,
    display_name: peer.display_name ?? 'Guest',
    mode: peer.mode,
    tagline: `${peer.mode} · ${peer.group_size}`,
    bio: peer.friends_fun_facts ?? peer.dating_chemistry_notes ?? 'Checked in at this venue.',
    vibe_tags: [
      ...(peer.friends_interests ?? []),
      ...(peer.friends_music ?? []),
      ...(peer.networking_skills ?? []),
    ].slice(0, 4),
    friends_interests: peer.friends_interests ?? [],
    friends_music: peer.friends_music ?? [],
    friends_hobbies: peer.friends_hobbies ?? [],
    friends_fun_facts: peer.friends_fun_facts ?? '',
    checked_in_venue: 'The Ivy',
  };
}

export function getJordanRoomPeer(): RoomPeer {
  return createDevFakePeer();
}

export function getDevIvyRoomPeerForMode(mode: IntentMode): RoomPeer {
  return createDevFakePeerForMode(mode);
}
