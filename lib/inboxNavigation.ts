import { DEV_FAKE_PEER_ID } from '@/lib/devFakePeer';
import { DEV_JORDAN_CONNECTION_ID } from '@/lib/devJordanChat';
import type { InboxThread } from '@/lib/socialMock';

type InboxRouter = {
  push: (href: {
    pathname: '/main/chat/[connectionId]';
    params: { connectionId: string };
  }) => void;
};

/** Pending dev chat for request threads without a Supabase connection yet. */
export function pendingConnectionId(peerUserId: string): string {
  return `pending-${peerUserId}`;
}

export function isPendingConnectionId(connectionId: string): boolean {
  return connectionId.startsWith('pending-');
}

export function peerIdFromPendingConnection(connectionId: string): string {
  return connectionId.slice('pending-'.length);
}

/** Inbox rows always open chat — never the public profile screen. */
export function openInboxThread(router: InboxRouter, thread: InboxThread): void {
  const connectionId = thread.connectionId ?? pendingConnectionId(thread.peerUserId);
  router.push({
    pathname: '/main/chat/[connectionId]',
    params: { connectionId },
  });
}

/** Open chat from a peer profile Message / Reply button. */
export function openChatForPeer(
  router: InboxRouter,
  peerUserId: string,
  thread?: InboxThread,
): void {
  const connectionId =
    thread?.connectionId ??
    (peerUserId === DEV_FAKE_PEER_ID ? DEV_JORDAN_CONNECTION_ID : pendingConnectionId(peerUserId));
  router.push({
    pathname: '/main/chat/[connectionId]',
    params: { connectionId },
  });
}
