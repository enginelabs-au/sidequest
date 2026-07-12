import { DEV_FAKE_PEER_ID } from '@/lib/devFakePeer';
import { messageIsOutgoingWave } from '@/lib/waveChat';
import type { Connection, Message } from '@/types/database';

export const DEV_JORDAN_CONNECTION_ID = 'dev-local-jordan';

const NOW = new Date().toISOString();
const MIN_AGO = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

const SEED_MESSAGES: Message[] = [
  {
    id: 'dev-jordan-msg-1',
    connection_id: DEV_JORDAN_CONNECTION_ID,
    sender_id: DEV_FAKE_PEER_ID,
    body: 'Still on for rooftop drinks after 9?',
    created_at: MIN_AGO(45),
  },
  {
    id: 'dev-jordan-msg-2',
    connection_id: DEV_JORDAN_CONNECTION_ID,
    sender_id: DEV_FAKE_PEER_ID,
    body: 'The Ivy crowd is picking up — you still checked in?',
    created_at: MIN_AGO(20),
  },
  {
    id: 'dev-jordan-msg-3',
    connection_id: DEV_JORDAN_CONNECTION_ID,
    sender_id: DEV_FAKE_PEER_ID,
    body: 'Also waved you from the bar — come say hi when you are free 👋',
    created_at: MIN_AGO(6),
  },
];

let localMessages = [...SEED_MESSAGES];

export function isDevJordanConnection(connectionId: string | undefined): boolean {
  return connectionId === DEV_JORDAN_CONNECTION_ID;
}

export function loadDevJordanChat(userId: string): {
  connection: Connection;
  messages: Message[];
} {
  const connection: Connection = {
    id: DEV_JORDAN_CONNECTION_ID,
    user_one: userId,
    user_two: DEV_FAKE_PEER_ID,
    status: 'connected',
    created_at: NOW,
    venue_id: 'dev-venue',
    user_one_wants: true,
    user_two_wants: true,
  };
  return { connection, messages: [...localMessages] };
}

export function sendDevJordanMessage(userId: string, body: string): Message {
  const msg: Message = {
    id: `dev-jordan-msg-${Date.now()}`,
    connection_id: DEV_JORDAN_CONNECTION_ID,
    sender_id: userId,
    body: body.trim(),
    created_at: new Date().toISOString(),
  };
  localMessages = [...localMessages, msg];
  return msg;
}

/** Record an outgoing wave in the Jordan dev chat thread. */
export function appendDevJordanWave(userId: string, peerDisplayName: string): Message {
  const msg: Message = {
    id: `dev-jordan-wave-${Date.now()}`,
    connection_id: DEV_JORDAN_CONNECTION_ID,
    sender_id: userId,
    body: `👋 You waved at ${peerDisplayName}`,
    created_at: new Date().toISOString(),
  };
  localMessages = [...localMessages, msg];
  return msg;
}

export function removeDevJordanOutgoingWave(userId: string): boolean {
  const wave = localMessages.find((m) => messageIsOutgoingWave(m, userId));
  if (!wave) return false;
  localMessages = localMessages.filter((m) => m.id !== wave.id);
  return true;
}

export function editDevJordanMessage(messageId: string, body: string): Message | null {
  const idx = localMessages.findIndex((m) => m.id === messageId);
  if (idx < 0) return null;
  if (messageIsOutgoingWave(localMessages[idx], localMessages[idx].sender_id)) return null;
  const updated: Message = { ...localMessages[idx], body: body.trim() };
  localMessages = localMessages.map((m) => (m.id === messageId ? updated : m));
  return updated;
}

export function resetDevJordanChat(): void {
  localMessages = [...SEED_MESSAGES];
}
