import { DEV_LOCAL_CHECKIN_KEY } from '@/constants/storage';
import { CHECK_IN_DURATION_HOURS } from '@/constants/theme';
import type { CheckIn, GroupSize, IntentMode } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loadDevLocalCheckIn(userId: string): Promise<CheckIn | null> {
  const raw = await AsyncStorage.getItem(DEV_LOCAL_CHECKIN_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CheckIn;
    if (parsed.user_id !== userId) return null;
    if (new Date(parsed.expires_at) <= new Date()) {
      await clearDevLocalCheckIn();
      return null;
    }
    return parsed;
  } catch {
    await clearDevLocalCheckIn();
    return null;
  }
}

export async function saveDevLocalCheckIn(params: {
  userId: string;
  venueId: string;
  mode: IntentMode;
  groupSize: GroupSize;
}): Promise<CheckIn> {
  const now = new Date();
  const checkIn: CheckIn = {
    id: 'dev-local-check-in',
    user_id: params.userId,
    venue_id: params.venueId,
    mode: params.mode,
    group_size: params.groupSize,
    created_at: now.toISOString(),
    expires_at: new Date(
      now.getTime() + CHECK_IN_DURATION_HOURS * 60 * 60 * 1000,
    ).toISOString(),
  };
  await AsyncStorage.setItem(DEV_LOCAL_CHECKIN_KEY, JSON.stringify(checkIn));
  return checkIn;
}

export async function clearDevLocalCheckIn(): Promise<void> {
  await AsyncStorage.removeItem(DEV_LOCAL_CHECKIN_KEY);
}

export async function updateDevLocalCheckInMode(
  userId: string,
  mode: IntentMode,
): Promise<CheckIn | null> {
  const existing = await loadDevLocalCheckIn(userId);
  if (!existing) return null;
  const updated: CheckIn = { ...existing, mode };
  await AsyncStorage.setItem(DEV_LOCAL_CHECKIN_KEY, JSON.stringify(updated));
  return updated;
}
