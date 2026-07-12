import { PAST_CHECKINS_KEY } from '@/constants/storage';
import { isGuestSimulationActive } from '@/lib/guestSimulation';
import type { IntentMode } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PastCheckIn = {
  venueId: string;
  venueName: string;
  mode: IntentMode;
  checkedOutAt: string;
};

const MOCK_PAST: PastCheckIn[] = [
  {
    venueId: 'mock-beresford',
    venueName: 'The Beresford',
    mode: 'friends',
    checkedOutAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    venueId: 'mock-oxford',
    venueName: 'Oxford Art Factory',
    mode: 'dating',
    checkedOutAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

async function loadStoredPastCheckIns(): Promise<PastCheckIn[]> {
  try {
    const raw = await AsyncStorage.getItem(PAST_CHECKINS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PastCheckIn[];
  } catch {
    return [];
  }
}

export async function loadPastCheckIns(): Promise<PastCheckIn[]> {
  const stored = await loadStoredPastCheckIns();
  if (stored.length) return stored;
  return isGuestSimulationActive() ? MOCK_PAST : [];
}

export async function recordPastCheckIn(entry: PastCheckIn): Promise<void> {
  const existing = await loadStoredPastCheckIns();
  const withoutDup = existing.filter(
    (item) => !(item.venueId === entry.venueId && item.mode === entry.mode),
  );
  const next = [entry, ...withoutDup].slice(0, 12);
  await AsyncStorage.setItem(PAST_CHECKINS_KEY, JSON.stringify(next));
}

export function formatPastCheckInDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
