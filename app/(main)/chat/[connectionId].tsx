import { ReportReasonModal } from '@/components/ReportReasonModal';
import { Button, ErrorBanner, LoadingState, Screen } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import {
  appendMessageDeduped,
  ChatAccessError,
  loadChat,
  MessageBlockedError,
  sendChatMessage,
} from '@/lib/chat';
import { performCheckout } from '@/lib/checkout';
import { formatUserError } from '@/lib/errors';
import { submitSafetyReport, type ReportReasonId } from '@/lib/safety';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Connection, Message } from '@/types/database';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function ChatScreen() {
  const { connectionId: connectionIdParam } = useLocalSearchParams<{ connectionId?: string }>();
  const connectionId =
    typeof connectionIdParam === 'string' ? connectionIdParam : undefined;
  const router = useRouter();
  const { user, checkIn, refreshCheckIn } = useAuth();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportVisible, setReportVisible] = useState(false);

  const load = useCallback(async () => {
    if (!connectionId || !user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await loadChat(connectionId, user.id);
      setConnection(result.connection);
      setMessages(result.messages);
    } catch (e) {
      if (e instanceof ChatAccessError) {
        setError(e.message);
        setConnection(null);
        setMessages([]);
      } else {
        setError(formatUserError(e, 'Failed to load chat'));
      }
    } finally {
      setLoading(false);
    }
  }, [connectionId, user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!connectionId || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`chat:${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          setMessages((prev) => appendMessageDeduped(prev, payload.new as Message));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionId]);

  const send = async () => {
    if (!user || !connectionId || !body.trim() || !isSupabaseConfigured) return;

    setSending(true);
    setError(null);
    try {
      await sendChatMessage({
        connectionId,
        userId: user.id,
        body,
      });
      setBody('');
    } catch (e) {
      if (e instanceof MessageBlockedError) {
        setError(e.message);
      } else {
        setError(formatUserError(e, 'Send failed'));
      }
    } finally {
      setSending(false);
    }
  };

  const reportedId =
    connection && user
      ? connection.user_one === user.id
        ? connection.user_two
        : connection.user_one
      : null;

  const handleReportSubmit = async (reason: ReportReasonId, details?: string) => {
    if (!reportedId || !connectionId) return;
    await submitSafetyReport({
      reportedId,
      connectionId,
      reason,
      details,
    });
    Alert.alert('Reported', 'Thank you. Our moderation pipeline will review this.');
  };

  const handleCheckout = () => {
    Alert.alert('Check out?', 'You will go invisible and leave the chat.', [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Check out',
        style: 'destructive',
        onPress: async () => {
          try {
            await performCheckout(refreshCheckIn);
            router.replace('/(onboarding)/venue');
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Checkout failed');
          }
        },
      },
    ]);
  };

  if (!connectionId) {
    return (
      <Screen>
        <ErrorBanner message="No connection selected." />
        <Button
          title="Back to room"
          onPress={() => router.replace('/(main)/room')}
          accessibilityLabel="Back to room"
        />
      </Screen>
    );
  }

  if (!checkIn) {
    return (
      <Screen>
        <ErrorBanner message="You are not checked in. Chat is unavailable." />
        <Button
          title="Back to venue picker"
          onPress={() => router.replace('/(onboarding)/venue')}
          accessibilityLabel="Back to venue picker"
        />
      </Screen>
    );
  }

  if (loading) return <LoadingState message="Opening chat..." />;

  const canSend = isSupabaseConfigured && !!connection && !!body.trim() && !sending;

  return (
    <Screen>
      {!isSupabaseConfigured ? (
        <ErrorBanner message="Add Supabase keys to .env — see .env.example and docs/PHASE7_CHAT.md." />
      ) : null}
      {error ? (
        <>
          <ErrorBanner message={error} />
          {!connection ? (
            <Button
              title="Try again"
              variant="ghost"
              onPress={load}
              accessibilityLabel="Try again to load chat"
              style={styles.retry}
            />
          ) : null}
        </>
      ) : null}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => {
          const mine = item.sender_id === user?.id;
          return (
            <View
              style={[styles.bubble, mine ? styles.mine : styles.theirs]}
              accessibilityLabel={mine ? `You: ${item.body}` : `Them: ${item.body}`}
            >
              <Text style={styles.bubbleText}>{item.body}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>Say hi — this chat ends when you check out.</Text>
        }
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor={colors.textMuted}
            value={body}
            onChangeText={setBody}
            multiline
            editable={!!connection && isSupabaseConfigured}
            accessibilityLabel="Message input"
          />
          <Button
            title={sending ? '...' : 'Send'}
            onPress={send}
            disabled={!canSend}
            accessibilityLabel="Send message"
          />
        </View>
      </KeyboardAvoidingView>
      <Button
        title="Report user"
        variant="ghost"
        onPress={() => setReportVisible(true)}
        disabled={!connection || !isSupabaseConfigured}
        accessibilityLabel="Report user"
        style={styles.report}
      />
      <Button
        title="Check out & go invisible"
        variant="danger"
        onPress={handleCheckout}
        accessibilityLabel="Check out and go invisible"
        style={styles.checkout}
      />
      <ReportReasonModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        onSubmit={handleReportSubmit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, marginBottom: spacing.md },
  bubble: {
    maxWidth: '80%',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accentMuted,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceElevated,
  },
  bubbleText: { color: colors.text, fontSize: 15 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  composer: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    padding: spacing.md,
    maxHeight: 100,
  },
  retry: { marginBottom: spacing.sm },
  report: { marginTop: spacing.md },
  checkout: { marginTop: spacing.sm },
});
