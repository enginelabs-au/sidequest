import { requestConnection } from '@/lib/connections';
import {
    formatTimeLabelNow,
    loadWavedUserIds,
    markUserWaved,
    prependLocalActivityItem,
    unmarkUserWaved,
    upsertLocalInboxThread,
} from '@/lib/socialLocal';
import type { InboxThread } from '@/lib/socialMock';

export type SendWaveResult = {
  threadId: string;
  preview: string;
};

export async function sendWave(params: {
  fromUserId: string;
  fromDisplayName: string;
  toUserId: string;
  toDisplayName: string;
}): Promise<SendWaveResult> {
  const preview = `You waved at ${params.toDisplayName}`;
  const threadId = `wave-${params.fromUserId}-${params.toUserId}`;

  const thread: InboxThread = {
    id: threadId,
    connectionId: null,
    peerUserId: params.toUserId,
    displayName: params.toDisplayName,
    preview,
    timeLabel: formatTimeLabelNow(),
    unreadCount: 0,
    archived: false,
  };

  await upsertLocalInboxThread(thread);
  await markUserWaved(params.toUserId);
  await prependLocalActivityItem({
    id: `act-wave-out-${params.toUserId}-${Date.now()}`,
    type: 'wave',
    title: preview,
    timeLabel: 'Just now',
    peerUserId: params.toUserId,
  });

  try {
    await requestConnection(params.toUserId);
  } catch {
    // Wave still recorded locally when connection RPC is unavailable.
  }

  return { threadId, preview };
}

export async function hasWavedUser(userId: string): Promise<boolean> {
  const ids = await loadWavedUserIds();
  return ids.includes(userId);
}

export async function loadWavedUserIdSet(): Promise<Set<string>> {
  return new Set(await loadWavedUserIds());
}

export async function unwaveUser(userId: string): Promise<void> {
  await unmarkUserWaved(userId);
}
