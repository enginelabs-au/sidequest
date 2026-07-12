import { containsBlockedContent, sanitizeMessage } from '@/lib/moderation';
import { supabase } from '@/lib/supabase';
import type { Connection, Message } from '@/types/database';

export class ChatAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatAccessError';
  }
}

export class MessageBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MessageBlockedError';
  }
}

function assertConnectionAccess(conn: Connection | null, userId: string): Connection {
  if (!conn || conn.status !== 'connected') {
    throw new ChatAccessError('Chat is only available for connected matches.');
  }
  if (![conn.user_one, conn.user_two].includes(userId)) {
    throw new ChatAccessError('You are not part of this connection.');
  }
  return conn;
}

export async function loadChat(
  connectionId: string,
  userId: string,
): Promise<{ connection: Connection; messages: Message[] }> {
  const [{ data: conn, error: connError }, { data: msgs, error: msgError }] =
    await Promise.all([
      supabase.from('connections').select('*').eq('id', connectionId).maybeSingle(),
      supabase
        .from('messages')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: true }),
    ]);

  if (connError) throw connError;
  if (msgError) throw msgError;

  const connection = assertConnectionAccess(conn as Connection | null, userId);

  return {
    connection,
    messages: (msgs as Message[]) ?? [],
  };
}

export async function sendChatMessage(params: {
  connectionId: string;
  userId: string;
  body: string;
}): Promise<void> {
  const text = sanitizeMessage(params.body);
  if (!text) return;

  if (containsBlockedContent(text)) {
    throw new MessageBlockedError('Message blocked by safety filter. Please revise.');
  }

  const { error } = await supabase.from('messages').insert({
    connection_id: params.connectionId,
    sender_id: params.userId,
    body: text,
  });

  if (error) throw error;
}

export async function editChatMessage(params: {
  messageId: string;
  userId: string;
  body: string;
}): Promise<void> {
  const text = sanitizeMessage(params.body);
  if (!text) return;

  if (containsBlockedContent(text)) {
    throw new MessageBlockedError('Message blocked by safety filter. Please revise.');
  }

  const { error } = await supabase
    .from('messages')
    .update({ body: text })
    .eq('id', params.messageId)
    .eq('sender_id', params.userId);

  if (error) throw error;
}

export function appendMessageDeduped(prev: Message[], incoming: Message): Message[] {
  if (prev.some((m) => m.id === incoming.id)) return prev;
  return [...prev, incoming];
}
