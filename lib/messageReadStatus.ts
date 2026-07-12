import { CHAT_READ_STATUS_KEY } from '@/constants/storage';
import { messageIsOutgoingWave } from '@/lib/waveChat';
import type { Message } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ChatMessage = Message & { read_at?: string | null };

type ReadStore = Record<string, Record<string, string>>;

async function loadStore(): Promise<ReadStore> {
  try {
    const raw = await AsyncStorage.getItem(CHAT_READ_STATUS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ReadStore;
  } catch {
    return {};
  }
}

async function saveStore(store: ReadStore): Promise<void> {
  await AsyncStorage.setItem(CHAT_READ_STATUS_KEY, JSON.stringify(store));
}

export async function loadConnectionReadMap(connectionId: string): Promise<Record<string, string>> {
  const store = await loadStore();
  return store[connectionId] ?? {};
}

export async function markMessagesRead(
  connectionId: string,
  messageIds: string[],
): Promise<Record<string, string>> {
  if (!messageIds.length) return loadConnectionReadMap(connectionId);

  const store = await loadStore();
  const conn = { ...(store[connectionId] ?? {}) };
  const now = new Date().toISOString();

  for (const id of messageIds) {
    if (!conn[id]) conn[id] = now;
  }

  store[connectionId] = conn;
  await saveStore(store);
  return conn;
}

/** Outgoing messages the peer has likely seen (peer replied after send). */
export function autoReadMessageIds(
  messages: Message[],
  viewerId: string,
  peerId: string,
  readMap: Record<string, string>,
): string[] {
  const peerTimes = messages
    .filter((m) => m.sender_id === peerId)
    .map((m) => new Date(m.created_at).getTime());

  if (!peerTimes.length) return [];

  return messages
    .filter((m) => m.sender_id === viewerId && !readMap[m.id])
    .filter((m) => {
      const sentAt = new Date(m.created_at).getTime();
      return peerTimes.some((t) => t >= sentAt);
    })
    .map((m) => m.id);
}

export function attachReadStatus(
  messages: Message[],
  readMap: Record<string, string>,
): ChatMessage[] {
  return messages.map((m) => ({
    ...m,
    read_at: readMap[m.id] ?? null,
  }));
}

export function canEditOwnMessage(message: ChatMessage, viewerId: string): boolean {
  if (messageIsOutgoingWave(message, viewerId)) return false;
  return message.sender_id === viewerId && !message.read_at;
}
