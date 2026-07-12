import { loadMergedActivityItems } from '@/lib/activityFeed';
import { ensureInboundPeerWave } from '@/lib/devPendingChat';
import { loadInboxThreads } from '@/lib/inbox';
import { findInboxThreadForPeer } from '@/lib/inboxAction';
import { getPublicPeerProfile } from '@/lib/publicProfile';
import type { ActivityItem } from '@/lib/socialMock';
import { activityHasIncomingWave } from '@/lib/waveChat';
import { hasWavedUser } from '@/lib/waves';

export type ChatWaveContext = {
  inboxPreview?: string;
  activity: ActivityItem[];
  hasWavedPeer: boolean;
};

export async function loadChatWaveContext(
  userId: string,
  peerUserId: string,
): Promise<ChatWaveContext> {
  const [threads, activity, waved] = await Promise.all([
    loadInboxThreads(userId),
    loadMergedActivityItems(),
    hasWavedUser(peerUserId),
  ]);
  const thread = findInboxThreadForPeer(threads, peerUserId);
  return {
    inboxPreview: thread?.preview,
    activity,
    hasWavedPeer: waved,
  };
}

/** Ensure pending dev chats contain an inbound wave bubble when alerts/inbox say so. */
export function hydratePendingInboundWave(
  peerUserId: string,
  ctx: ChatWaveContext,
): void {
  const profile = getPublicPeerProfile(peerUserId);
  const waveAlert = ctx.activity.find(
    (item) => item.peerUserId === peerUserId && item.type === 'wave',
  );

  ensureInboundPeerWave(peerUserId, profile?.display_name ?? 'Someone', {
    inboxPreview: ctx.inboxPreview,
    hasWaveActivity: activityHasIncomingWave(ctx.activity, peerUserId),
    venueName: waveAlert?.venueName,
  });
}
