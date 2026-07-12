import {
    DELETED_ACTIVITY_IDS_KEY,
    DELETED_INBOX_PEER_IDS_KEY,
    LOCAL_ACTIVITY_KEY,
    LOCAL_INBOX_KEY,
    WAVED_USER_IDS_KEY,
} from '@/constants/storage';
import type { ActivityItem, InboxThread } from '@/lib/socialMock';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loadDeletedInboxPeerIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(DELETED_INBOX_PEER_IDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export async function markInboxPeerDeleted(peerUserId: string): Promise<void> {
  const existing = await loadDeletedInboxPeerIds();
  if (existing.includes(peerUserId)) return;
  await AsyncStorage.setItem(
    DELETED_INBOX_PEER_IDS_KEY,
    JSON.stringify([...existing, peerUserId]),
  );
}

export async function loadDeletedActivityIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(DELETED_ACTIVITY_IDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export async function markActivityDeleted(activityId: string): Promise<void> {
  const existing = await loadDeletedActivityIds();
  if (existing.includes(activityId)) return;
  await AsyncStorage.setItem(
    DELETED_ACTIVITY_IDS_KEY,
    JSON.stringify([...existing, activityId]),
  );
}

export async function loadLocalInboxThreads(): Promise<InboxThread[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_INBOX_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as InboxThread[];
  } catch {
    return [];
  }
}

export async function saveLocalInboxThreads(threads: InboxThread[]): Promise<void> {
  await AsyncStorage.setItem(LOCAL_INBOX_KEY, JSON.stringify(threads));
}

export async function upsertLocalInboxThread(thread: InboxThread): Promise<void> {
  const existing = await loadLocalInboxThreads();
  const next = [thread, ...existing.filter((t) => t.id !== thread.id)];
  await saveLocalInboxThreads(next);
}

export async function archiveInboxThreadByPeer(peerUserId: string, seed: InboxThread): Promise<void> {
  await upsertLocalInboxThread({ ...seed, archived: true, unreadCount: 0 });
}

export async function deleteInboxThread(peerUserId: string): Promise<void> {
  const existing = await loadLocalInboxThreads();
  await saveLocalInboxThreads(existing.filter((t) => t.peerUserId !== peerUserId));
  await markInboxPeerDeleted(peerUserId);
}

export async function loadLocalActivityItems(): Promise<ActivityItem[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_ACTIVITY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ActivityItem[];
  } catch {
    return [];
  }
}

export async function prependLocalActivityItem(item: ActivityItem): Promise<void> {
  const existing = await loadLocalActivityItems();
  const next = [item, ...existing.filter((i) => i.id !== item.id)];
  await AsyncStorage.setItem(LOCAL_ACTIVITY_KEY, JSON.stringify(next));
}

export async function deleteActivityItem(activityId: string): Promise<void> {
  const existing = await loadLocalActivityItems();
  await AsyncStorage.setItem(
    LOCAL_ACTIVITY_KEY,
    JSON.stringify(existing.filter((i) => i.id !== activityId)),
  );
  await markActivityDeleted(activityId);
}

export async function loadWavedUserIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(WAVED_USER_IDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export async function markUserWaved(userId: string): Promise<void> {
  const existing = await loadWavedUserIds();
  if (existing.includes(userId)) return;
  await AsyncStorage.setItem(WAVED_USER_IDS_KEY, JSON.stringify([...existing, userId]));
}

export async function unmarkUserWaved(userId: string): Promise<void> {
  const existing = await loadWavedUserIds();
  await AsyncStorage.setItem(
    WAVED_USER_IDS_KEY,
    JSON.stringify(existing.filter((id) => id !== userId)),
  );
}

export function formatTimeLabelNow(): string {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Wipe guest-era local inbox/activity/wave state after a real sign-in. */
export async function clearLocalSocialData(): Promise<void> {
  await AsyncStorage.multiRemove([
    LOCAL_INBOX_KEY,
    LOCAL_ACTIVITY_KEY,
    DELETED_INBOX_PEER_IDS_KEY,
    DELETED_ACTIVITY_IDS_KEY,
    WAVED_USER_IDS_KEY,
  ]);
}
