import { DEV_FAKE_PEER_ID, DEV_IVY_PEER_IDS } from '@/lib/devFakePeer';
import { DEV_JORDAN_CONNECTION_ID } from '@/lib/devJordanChat';
import type { IntentMode } from '@/types/database';

export type InboxThread = {
  id: string;
  connectionId: string | null;
  peerUserId: string;
  displayName: string;
  preview: string;
  timeLabel: string;
  unreadCount: number;
  archived: boolean;
  isRequest?: boolean;
};

export type ActivityItem = {
  id: string;
  type: 'wave' | 'checkin' | 'reply' | 'request';
  title: string;
  subtitle?: string;
  timeLabel: string;
  peerUserId?: string;
  venueName?: string;
};

export const MOCK_INBOX_THREADS: InboxThread[] = [
  {
    id: 'thread-jordan',
    connectionId: DEV_JORDAN_CONNECTION_ID,
    peerUserId: DEV_FAKE_PEER_ID,
    displayName: 'Jordan',
    preview: 'Also waved you from the bar — come say hi when you are free 👋',
    timeLabel: '6m ago',
    unreadCount: 3,
    archived: false,
  },
  {
    id: 'thread-alex',
    connectionId: `pending-${DEV_IVY_PEER_IDS.networking}`,
    peerUserId: DEV_IVY_PEER_IDS.networking,
    displayName: 'Alex',
    preview: 'Happy to swap intros if you are free later.',
    timeLabel: '12m ago',
    unreadCount: 2,
    archived: false,
  },
  {
    id: 'thread-sania',
    connectionId: `pending-${DEV_IVY_PEER_IDS.dating}`,
    peerUserId: DEV_IVY_PEER_IDS.dating,
    displayName: 'Sania',
    preview: 'Love that you are at The Ivy tonight — fancy a drink on the rooftop?',
    timeLabel: '25m ago',
    unreadCount: 1,
    archived: false,
  },
  {
    id: 'thread-mia',
    connectionId: 'pending-mock-mia',
    peerUserId: 'mock-mia',
    displayName: 'Mia Chen',
    preview: 'The Ivy crowd is great tonight 🎶',
    timeLabel: '3m ago',
    unreadCount: 2,
    archived: false,
  },
  {
    id: 'thread-wave-liam',
    connectionId: null,
    peerUserId: 'mock-liam',
    displayName: 'Liam Chen',
    preview: 'Waved at you at The Ivy',
    timeLabel: '14m ago',
    unreadCount: 1,
    archived: false,
    isRequest: true,
  },
  {
    id: 'thread-reply-kal',
    connectionId: 'pending-mock-kal',
    peerUserId: 'mock-kal',
    displayName: 'Kal',
    preview: 'That rooftop view is unreal',
    timeLabel: '1h ago',
    unreadCount: 1,
    archived: false,
  },
];

export const MOCK_ACTIVITY_ITEMS: ActivityItem[] = [
  {
    id: 'act-wave-mia',
    type: 'wave',
    title: 'Mia Chen waved at you!',
    subtitle: 'Friends · The Ivy',
    timeLabel: '3m ago',
    peerUserId: 'mock-mia',
    venueName: 'The Ivy',
  },
  {
    id: 'act-wave-jordan',
    type: 'wave',
    title: 'Jordan waved at you!',
    subtitle: 'Friends · The Ivy',
    timeLabel: '6m ago',
    peerUserId: DEV_FAKE_PEER_ID,
    venueName: 'The Ivy',
  },
  {
    id: 'act-wave-alex',
    type: 'wave',
    title: 'Alex waved at you!',
    subtitle: 'Networking · The Ivy',
    timeLabel: '12m ago',
    peerUserId: DEV_IVY_PEER_IDS.networking,
    venueName: 'The Ivy',
  },
  {
    id: 'act-wave-sania',
    type: 'wave',
    title: 'Sania waved at you!',
    subtitle: 'Dating · The Ivy',
    timeLabel: '18m ago',
    peerUserId: DEV_IVY_PEER_IDS.dating,
    venueName: 'The Ivy',
  },
  {
    id: 'act-wave-liam',
    type: 'wave',
    title: 'Liam Chen waved at you!',
    subtitle: 'Friends · The Ivy',
    timeLabel: '14m ago',
    peerUserId: 'mock-liam',
    venueName: 'The Ivy',
  },
  {
    id: 'act-reply-kal',
    type: 'reply',
    title: 'Reply from Kal',
    subtitle: '"That rooftop view is unreal"',
    timeLabel: '1h ago',
    peerUserId: 'mock-kal',
  },
  {
    id: 'act-checkin-chloe',
    type: 'checkin',
    title: 'Your friend Chloe is at The Daily Grind!',
    subtitle: 'Friends · 0.4 km away',
    timeLabel: '18m ago',
    peerUserId: 'mock-chloe',
    venueName: 'The Daily Grind',
  },
  {
    id: 'act-request-tom',
    type: 'request',
    title: 'Tom wants to connect',
    subtitle: 'Networking · Climate tech',
    timeLabel: '2h ago',
    peerUserId: 'mock-tom',
  },
];

export type DiscoveryProfile = {
  user_id: string;
  display_name: string;
  age?: number;
  bio: string;
  tags: string[];
  mode: IntentMode;
};

export const MOCK_DISCOVERY_PROFILES: DiscoveryProfile[] = [
  {
    user_id: DEV_IVY_PEER_IDS.dating,
    display_name: 'Sania',
    age: 38,
    bio: 'Cocktail bars, live jazz, and spontaneous city walks. Always up for meeting new people nearby.',
    tags: ['Cocktails', 'Live jazz', 'The Ivy'],
    mode: 'dating',
  },
  {
    user_id: DEV_FAKE_PEER_ID,
    display_name: 'Jordan',
    age: 29,
    bio: 'Sydney local who lives for live music and golden-hour rooftops.',
    tags: ['Live music', 'Rooftop bars', 'The Ivy'],
    mode: 'friends',
  },
  {
    user_id: DEV_IVY_PEER_IDS.networking,
    display_name: 'Alex',
    age: 34,
    bio: 'Product lead looking to meet founders and operators nearby.',
    tags: ['Startups', 'SaaS', 'The Ivy'],
    mode: 'networking',
  },
  {
    user_id: 'mock-mia',
    display_name: 'Mia Chen',
    age: 27,
    bio: 'Art galleries by day, cocktail bars by night. Always scouting the best rooftops in the city.',
    tags: ['Cocktails', 'Art', 'The Ivy'],
    mode: 'friends',
  },
  {
    user_id: 'mock-chloe',
    display_name: 'Chloe',
    age: 31,
    bio: 'Coffee snob, brunch enthusiast, and serial venue recommender.',
    tags: ['Brunch', 'Coffee', '0.3 km'],
    mode: 'friends',
  },
  {
    user_id: 'mock-liam',
    display_name: 'Liam Chen',
    age: 33,
    bio: 'Live music and late-night food runs. Here for good vibes and better playlists.',
    tags: ['Live music', 'Late night', 'The Ivy'],
    mode: 'friends',
  },
  {
    user_id: 'mock-priya',
    display_name: 'Priya',
    age: 29,
    bio: 'Dating mode: looking for someone who laughs at bad puns and loves rooftop sunsets.',
    tags: ['Sunsets', 'Wine bars', 'Dating'],
    mode: 'dating',
  },
  {
    user_id: 'mock-tom',
    display_name: 'Tom',
    age: 36,
    bio: 'Founder building in climate tech. Happy to chat shop or swap venue tips.',
    tags: ['Climate', 'Founders', 'Networking'],
    mode: 'networking',
  },
];
