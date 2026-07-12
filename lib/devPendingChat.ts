import type { Connection, Message } from '@/types/database';
import { DEV_FAKE_PEER_ID, DEV_IVY_PEER_IDS } from '@/lib/devFakePeer';

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
};

function seedForPeer(peerId: string): Message[] {
  return INBOUND_SEEDS[peerId] ? [...INBOUND_SEEDS[peerId]] : [];
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
  const prev = stores.get(peerId) ?? [];
  stores.set(peerId, [...prev, msg]);
  return msg;
}

export function resetPendingPeerChats(): void {
  stores.clear();
}
