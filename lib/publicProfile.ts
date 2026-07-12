import { getDevPeerProfile, isDevFakePeer, type PublicPeerProfile } from '@/lib/devPeerProfile';
import type { DiscoveryProfile } from '@/lib/socialMock';
import { MOCK_DISCOVERY_PROFILES } from '@/lib/socialMock';

const EXTRA_MOCK_PROFILES: Record<string, Omit<PublicPeerProfile, 'user_id'>> = {
  'mock-kal': {
    display_name: 'Kal',
    mode: 'friends',
    tagline: 'Story replies & rooftop views',
    bio: 'Always has a camera roll full of skyline shots and a playlist for every mood.',
    vibe_tags: ['Photography', 'Rooftops', 'Stories'],
    friends_interests: ['Photography', 'City walks'],
    friends_music: ['Indie', 'Electronic'],
    friends_hobbies: ['Film', 'Coffee'],
    friends_fun_facts: 'Shot a viral timelapse from a Sydney rooftop last summer.',
    checked_in_venue: 'The Daily Grind',
  },
};

function discoveryToPublicProfile(profile: DiscoveryProfile): PublicPeerProfile {
  const tagline =
    profile.age != null
      ? `${profile.mode} · ${profile.display_name}, ${profile.age}`
      : `${profile.mode} · ${profile.display_name}`;

  return {
    user_id: profile.user_id,
    display_name: profile.display_name,
    mode: profile.mode,
    tagline,
    bio: profile.bio,
    vibe_tags: profile.tags,
    friends_interests: profile.tags.filter((t) => !t.includes('km')),
    friends_music: [],
    friends_hobbies: profile.tags,
    friends_fun_facts: profile.bio,
    checked_in_venue: profile.tags.find((t) => t.includes('Ivy') || t.includes('CBD'))
      ? 'The Ivy'
      : undefined,
  };
}

/** Resolves demo + dev public profiles for the peer profile screen. */
export function getPublicPeerProfile(userId: string): PublicPeerProfile | null {
  if (isDevFakePeer(userId)) {
    return getDevPeerProfile(userId);
  }

  const discovery = MOCK_DISCOVERY_PROFILES.find((p) => p.user_id === userId);
  if (discovery) {
    return discoveryToPublicProfile(discovery);
  }

  const extra = EXTRA_MOCK_PROFILES[userId];
  if (extra) {
    return { user_id: userId, ...extra };
  }

  return null;
}

export function hasPublicPeerProfile(userId: string): boolean {
  return getPublicPeerProfile(userId) != null;
}
