import type { Message } from '@/types/database';

const INCOMING_WAVE_RE = /\bwaved\b/i;
const OUTGOING_WAVE_RE = /^👋 You waved at /i;

/** Outgoing message seen-by-peer label (replaces legacy "Read"). */
export const CHAT_SEEN_LABEL = 'Seen';

export function messageIsIncomingWave(message: Message, peerUserId: string): boolean {
  return message.sender_id === peerUserId && INCOMING_WAVE_RE.test(message.body);
}

export function messageIsOutgoingWave(message: Message, userId: string): boolean {
  return message.sender_id === userId && OUTGOING_WAVE_RE.test(message.body);
}

export function getFirstOutgoingWaveMessage(
  messages: Message[],
  userId: string,
): Message | undefined {
  return messages.find((m) => messageIsOutgoingWave(m, userId));
}

/** Un-wave only while the peer has not seen the first outgoing wave. */
export function canUnwaveOutgoingWave(
  messages: Message[],
  userId: string,
  readMap: Record<string, string>,
): boolean {
  const wave = getFirstOutgoingWaveMessage(messages, userId);
  if (!wave) return false;
  return !readMap[wave.id];
}

export function inboxPreviewIsIncomingWave(preview: string | undefined): boolean {
  const text = preview?.trim();
  if (!text) return false;
  if (text.startsWith('You ')) return false;
  return INCOMING_WAVE_RE.test(text);
}

export function activityHasIncomingWave(
  activity: { peerUserId?: string; type: string }[],
  peerUserId: string,
): boolean {
  return activity.some((item) => item.peerUserId === peerUserId && item.type === 'wave');
}

/** Show Wave Back when peer waved and viewer has not waved back yet. */
export function shouldShowWaveBack(params: {
  peerUserId: string;
  userId: string;
  messages: Message[];
  viewerWavedPeer: boolean;
  inboxPreview?: string;
  activity?: { peerUserId?: string; type: string }[];
}): boolean {
  if (params.viewerWavedPeer) return false;
  if (params.messages.some((m) => messageIsOutgoingWave(m, params.userId))) return false;
  if (params.messages.some((m) => messageIsIncomingWave(m, params.peerUserId))) return true;
  if (inboxPreviewIsIncomingWave(params.inboxPreview)) return true;
  return activityHasIncomingWave(params.activity ?? [], params.peerUserId);
}
