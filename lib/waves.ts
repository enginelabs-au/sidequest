import { requestConnection } from '@/lib/connections';
import { DEV_FAKE_PEER_ID } from '@/lib/devFakePeer';
import {
    appendDevJordanWave,
    DEV_JORDAN_CONNECTION_ID,
    loadDevJordanChat,
    removeDevJordanOutgoingWave,
} from '@/lib/devJordanChat';
import {
    appendPendingPeerWave,
    loadPendingPeerChat,
    removePendingOutgoingWave,
} from '@/lib/devPendingChat';
import { isGuestSimulationActive } from '@/lib/guestSimulation';
import { loadConnectionReadMap } from '@/lib/messageReadStatus';
import {
    formatTimeLabelNow,
    loadWavedUserIds,
    markUserWaved,
    prependLocalActivityItem,
    unmarkUserWaved,
    upsertLocalInboxThread,
} from '@/lib/socialLocal';
import type { InboxThread } from '@/lib/socialMock';
import { canUnwaveOutgoingWave } from '@/lib/waveChat';

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

  if (isGuestSimulationActive()) {
    if (params.toUserId === DEV_FAKE_PEER_ID) {
      appendDevJordanWave(params.fromUserId, params.toDisplayName);
    } else {
      appendPendingPeerWave(params.fromUserId, params.toUserId, params.toDisplayName);
    }
  }

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

/** True when viewer waved peer and the peer has not yet seen that wave message. */
export async function canUnwavePeer(viewerId: string, peerUserId: string): Promise<boolean> {
  const waved = await hasWavedUser(peerUserId);
  if (!waved) return false;
  if (!isGuestSimulationActive()) return true;

  const connectionId =
    peerUserId === DEV_FAKE_PEER_ID ? DEV_JORDAN_CONNECTION_ID : `pending-${peerUserId}`;
  const [readMap, messages] = await Promise.all([
    loadConnectionReadMap(connectionId),
    Promise.resolve(
      peerUserId === DEV_FAKE_PEER_ID
        ? loadDevJordanChat(viewerId).messages
        : loadPendingPeerChat(viewerId, peerUserId, '').messages,
    ),
  ]);

  return canUnwaveOutgoingWave(messages, viewerId, readMap);
}

export async function unwaveUser(peerUserId: string, fromUserId?: string): Promise<void> {
  await unmarkUserWaved(peerUserId);
  if (!fromUserId || !isGuestSimulationActive()) return;
  if (peerUserId === DEV_FAKE_PEER_ID) {
    removeDevJordanOutgoingWave(fromUserId);
  } else {
    removePendingOutgoingWave(fromUserId, peerUserId);
  }
}
