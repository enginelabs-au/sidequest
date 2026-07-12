import type { ActivityItem, InboxThread } from '@/lib/socialMock';

const WAVE_PREVIEW_RE = /^(you waved|waved at you)/i;

const OUTREACH_ACTIVITY_TYPES: ActivityItem['type'][] = ['request', 'reply', 'wave'];

/** Whether the thread has real messages beyond waves / placeholders. */
export function threadHasPeerConversation(thread: InboxThread | undefined): boolean {
  if (!thread?.connectionId) return false;
  const preview = thread.preview.trim();
  if (!preview || preview === 'Say hello') return false;
  if (WAVE_PREVIEW_RE.test(preview)) return false;
  return true;
}

export function findInboxThreadForPeer(
  threads: InboxThread[],
  peerUserId: string,
): InboxThread | undefined {
  return threads.find((t) => t.peerUserId === peerUserId);
}

/** Peer has an inbox row or alerts outreach (message, request, or wave). */
export function shouldShowProfileInboxAction(
  peerUserId: string,
  threads: InboxThread[],
  activity: ActivityItem[],
): boolean {
  if (findInboxThreadForPeer(threads, peerUserId)) return true;
  return activity.some(
    (item) => item.peerUserId === peerUserId && OUTREACH_ACTIVITY_TYPES.includes(item.type),
  );
}

/** Green inbox CTA label on a peer profile. */
export function inboxActionLabelForPeer(
  peerUserId: string,
  thread: InboxThread | undefined,
  activity: ActivityItem[],
): 'Message' | 'Reply' {
  if (thread) return inboxActionLabelForThread(thread);

  const outreach = activity.find((item) => item.peerUserId === peerUserId);
  if (outreach?.type === 'reply') return 'Reply';
  return 'Message';
}

export function inboxActionLabelForThread(thread: InboxThread | undefined): 'Message' | 'Reply' {
  if (!thread) return 'Message';

  if (threadHasPeerConversation(thread)) {
    if (thread.unreadCount > 0) return 'Reply';
    if (!thread.preview.startsWith('You ')) return 'Reply';
  }

  // Request / outreach row with a message preview (story reply, etc.) — not wave-only.
  if (
    thread.preview &&
    !WAVE_PREVIEW_RE.test(thread.preview) &&
    !thread.preview.startsWith('Wants to connect')
  ) {
    return 'Reply';
  }

  return 'Message';
}
