import { DEV_IVY_PEER_IDS } from '@/lib/devFakePeer';
import { inboxPreviewIsIncomingWave, messageIsOutgoingWave } from '@/lib/waveChat';
import type { Connection, Message } from '@/types/database';

const stores = new Map<string, Message[]>();

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

/** Inbound test messages — peer sent to the signed-in user. */
const INBOUND_SEEDS: Record<string, Message[]> = {
  [DEV_IVY_PEER_IDS.networking]: [
    {
      id: 'seed-alex-1',
      connection_id: `pending-${DEV_IVY_PEER_IDS.networking}`,
      sender_id: DEV_IVY_PEER_IDS.networking,
      body: 'Saw you checked in at The Ivy — building in SaaS too?',
      created_at: minutesAgo(18),
    },
    {
      id: 'seed-alex-2',
      connection_id: `pending-${DEV_IVY_PEER_IDS.networking}`,
      sender_id: DEV_IVY_PEER_IDS.networking,
      body: 'Happy to swap intros if you are free later.',
      created_at: minutesAgo(12),
    },
  ],
  [DEV_IVY_PEER_IDS.dating]: [
    {
      id: 'seed-sania-1',
      connection_id: `pending-${DEV_IVY_PEER_IDS.dating}`,
      sender_id: DEV_IVY_PEER_IDS.dating,
      body: 'Love that you are at The Ivy tonight — fancy a drink on the rooftop?',
      created_at: minutesAgo(25),
    },
  ],
  'mock-mia': [
    {
      id: 'seed-mia-1',
      connection_id: 'pending-mock-mia',
      sender_id: 'mock-mia',
      body: 'Hey! I waved from the rooftop — want to meet up?',
      created_at: minutesAgo(8),
    },
    {
      id: 'seed-mia-2',
      connection_id: 'pending-mock-mia',
      sender_id: 'mock-mia',
      body: 'The Ivy crowd is great tonight 🎶',
      created_at: minutesAgo(3),
    },
  ],
  'mock-kal': [
    {
      id: 'seed-kal-1',
      connection_id: 'pending-mock-kal',
      sender_id: 'mock-kal',
      body: 'That rooftop view is unreal',
      created_at: minutesAgo(60),
    },
  ],
  'mock-liam': [
    {
      id: 'seed-liam-wave',
      connection_id: 'pending-mock-liam',
      sender_id: 'mock-liam',
      body: '👋 Liam Chen waved at you at The Ivy',
      created_at: minutesAgo(14),
    },
  ],
};

function seedForPeer(peerId: string): Message[] {
  return INBOUND_SEEDS[peerId] ? [...INBOUND_SEEDS[peerId]] : [];
}

function peerAlreadySentWave(messages: Message[], peerId: string): boolean {
  return messages.some(
    (m) => m.sender_id === peerId && /\bwaved\b/i.test(m.body),
  );
}

/** Insert an inbound wave chat bubble when alerts/inbox say they waved but chat is empty. */
export function ensureInboundPeerWave(
  peerId: string,
  peerDisplayName: string,
  opts?: {
    inboxPreview?: string;
    hasWaveActivity?: boolean;
    venueName?: string;
  },
): void {
  const prev = stores.has(peerId) ? [...(stores.get(peerId) ?? [])] : seedForPeer(peerId);
  if (peerAlreadySentWave(prev, peerId)) {
    stores.set(peerId, prev);
    return;
  }

  const previewWave = inboxPreviewIsIncomingWave(opts?.inboxPreview);
  if (!previewWave && !opts?.hasWaveActivity) {
    stores.set(peerId, prev);
    return;
  }

  const body =
    previewWave && opts?.inboxPreview
      ? `👋 ${opts.inboxPreview}`
      : `👋 ${peerDisplayName} waved at you${opts?.venueName ? ` at ${opts.venueName}` : ''}`;

  const msg: Message = {
    id: `pending-inbound-wave-${peerId}`,
    connection_id: `pending-${peerId}`,
    sender_id: peerId,
    body,
    created_at: minutesAgo(1),
  };

  stores.set(peerId, [msg, ...prev]);
}

export function loadPendingPeerChat(
  userId: string,
  peerId: string,
  _displayName: string,
): { connection: Connection; messages: Message[] } {
  const connectionId = `pending-${peerId}`;
  const connection: Connection = {
    id: connectionId,
    user_one: userId,
    user_two: peerId,
    status: 'connected',
    created_at: new Date().toISOString(),
    venue_id: 'dev-venue',
    user_one_wants: true,
    user_two_wants: true,
  };

  if (!stores.has(peerId)) {
    stores.set(peerId, seedForPeer(peerId));
  }

  return { connection, messages: [...(stores.get(peerId) ?? [])] };
}

export function sendPendingPeerMessage(userId: string, peerId: string, body: string): Message {
  const msg: Message = {
    id: `pending-msg-${Date.now()}`,
    connection_id: `pending-${peerId}`,
    sender_id: userId,
    body: body.trim(),
    created_at: new Date().toISOString(),
  };
  const prev = stores.get(peerId) ?? seedForPeer(peerId);
  stores.set(peerId, [...prev, msg]);
  return msg;
}

/** Record an outgoing wave in a pending peer chat thread. */
export function appendPendingPeerWave(
  userId: string,
  peerId: string,
  peerDisplayName: string,
): Message {
  const msg: Message = {
    id: `pending-wave-${Date.now()}`,
    connection_id: `pending-${peerId}`,
    sender_id: userId,
    body: `👋 You waved at ${peerDisplayName}`,
    created_at: new Date().toISOString(),
  };
  const prev = stores.get(peerId) ?? seedForPeer(peerId);
  stores.set(peerId, [...prev, msg]);
  return msg;
}

export function removePendingOutgoingWave(userId: string, peerId: string): boolean {
  const prev = stores.get(peerId);
  if (!prev) return false;
  const wave = prev.find((m) => messageIsOutgoingWave(m, userId));
  if (!wave) return false;
  stores.set(
    peerId,
    prev.filter((m) => m.id !== wave.id),
  );
  return true;
}

export function editPendingPeerMessage(peerId: string, messageId: string, body: string): Message | null {
  const prev = stores.get(peerId);
  if (!prev) return null;
  const idx = prev.findIndex((m) => m.id === messageId);
  if (idx < 0) return null;
  if (messageIsOutgoingWave(prev[idx], prev[idx].sender_id)) return null;
  const updated: Message = { ...prev[idx], body: body.trim() };
  const next = [...prev];
  next[idx] = updated;
  stores.set(peerId, next);
  return updated;
}

export function resetPendingPeerChats(): void {
  stores.clear();
}
