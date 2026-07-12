import { isDevIvyPeerId } from '@/lib/devFakePeer';
import { isGuestSimulationActive } from '@/lib/guestSimulation';
import {
    loadDeletedInboxPeerIds,
    loadLocalInboxThreads,
} from '@/lib/socialLocal';
import { MOCK_INBOX_THREADS, type InboxThread } from '@/lib/socialMock';
import { supabase } from '@/lib/supabase';
import type { Connection, Message, Profile } from '@/types/database';

function formatTimeLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const hours = (now.getTime() - date.getTime()) / 3_600_000;
  if (hours < 24) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  if (hours < 48) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'short' });
}

function otherUserId(conn: Connection, userId: string): string {
  return conn.user_one === userId ? conn.user_two : conn.user_one;
}

function applyLocalOverrides(threads: InboxThread[], local: InboxThread[]): InboxThread[] {
  const localByPeer = new Map(local.map((t) => [t.peerUserId, t]));
  return threads.map((t) => {
    const override = localByPeer.get(t.peerUserId);
    if (!override) return t;
    return { ...t, ...override, id: t.id };
  });
}

function isStubPeerId(peerUserId: string): boolean {
  return peerUserId.startsWith('mock-') || isDevIvyPeerId(peerUserId);
}

function withoutStubSocialData(threads: InboxThread[]): InboxThread[] {
  if (isGuestSimulationActive()) return threads;
  return threads.filter((t) => !isStubPeerId(t.peerUserId));
}

function mergeInboxSources(remote: InboxThread[], local: InboxThread[]): InboxThread[] {
  const stub = isGuestSimulationActive() ? MOCK_INBOX_THREADS : [];
  const byPeer = new Map<string, InboxThread>();
  for (const t of [...local, ...remote, ...stub]) {
    const prev = byPeer.get(t.peerUserId);
    if (!prev) {
      byPeer.set(t.peerUserId, t);
      continue;
    }
    const preferNew =
      t.preview.startsWith('You waved') ||
      t.timeLabel === 'Just now' ||
      (!prev.preview.startsWith('You waved') && t.unreadCount > prev.unreadCount);
    if (preferNew) byPeer.set(t.peerUserId, t);
  }
  return Array.from(byPeer.values());
}

export async function loadInboxThreads(userId: string): Promise<InboxThread[]> {
  const [localRaw, deletedPeerIds] = await Promise.all([
    loadLocalInboxThreads(),
    loadDeletedInboxPeerIds(),
  ]);
  const local = withoutStubSocialData(localRaw);
  const deleted = new Set(deletedPeerIds);

  try {
    const { data: connections, error } = await supabase
      .from('connections')
      .select('*')
      .eq('status', 'connected')
      .or(`user_one.eq.${userId},user_two.eq.${userId}`);

    if (error) throw error;
    if (!connections?.length) {
      return applyLocalOverrides(mergeInboxSources([], local), local).filter(
        (t) => !deleted.has(t.peerUserId),
      );
    }

    const connIds = connections.map((c) => c.id);
    const peerIds = connections.map((c) => otherUserId(c as Connection, userId));

    const [{ data: profiles }, { data: messages }] = await Promise.all([
      supabase.from('profiles').select('id, display_name').in('id', peerIds),
      supabase
        .from('messages')
        .select('*')
        .in('connection_id', connIds)
        .order('created_at', { ascending: false }),
    ]);

    const profileById = new Map(
      ((profiles as Pick<Profile, 'id' | 'display_name'>[]) ?? []).map((p) => [p.id, p]),
    );

    const latestByConn = new Map<string, Message>();
    for (const msg of (messages as Message[]) ?? []) {
      if (!latestByConn.has(msg.connection_id)) {
        latestByConn.set(msg.connection_id, msg);
      }
    }

    const remote: InboxThread[] = (connections as Connection[]).map((conn) => {
      const peerId = otherUserId(conn, userId);
      const profile = profileById.get(peerId);
      const latest = latestByConn.get(conn.id);
      const unread = latest && latest.sender_id !== userId ? 1 : 0;

      return {
        id: `thread-${conn.id}`,
        connectionId: conn.id,
        peerUserId: peerId,
        displayName: profile?.display_name ?? 'Someone',
        preview: latest?.body ?? 'Say hello',
        timeLabel: latest ? formatTimeLabel(latest.created_at) : formatTimeLabel(conn.created_at),
        unreadCount: unread,
        archived: false,
      };
    });

    return applyLocalOverrides(mergeInboxSources(remote, local), local).filter(
      (t) => !deleted.has(t.peerUserId),
    );
  } catch {
    return applyLocalOverrides(mergeInboxSources([], local), local).filter(
      (t) => !deleted.has(t.peerUserId),
    );
  }
}

export function filterInboxThreads(
  threads: InboxThread[],
  filter: 'all' | 'unread' | 'requests' | 'archived',
): InboxThread[] {
  if (filter === 'unread') return threads.filter((t) => t.unreadCount > 0 && !t.archived);
  if (filter === 'requests') return threads.filter((t) => t.isRequest && !t.archived);
  if (filter === 'archived') return threads.filter((t) => t.archived);
  return threads.filter((t) => !t.archived);
}
