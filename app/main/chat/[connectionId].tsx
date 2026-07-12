import { NotifyTimerBar } from '@/components/NotifyTimerBar';
import { ReportReasonModal } from '@/components/ReportReasonModal';
import {
    Button,
    Card,
    ErrorBanner,
    LoadingState,
    NoticeBar,
    Screen,
    ScreenTitle,
} from '@/components/ui';
import { NOTIFY_TIMER_LABEL } from '@/constants/notify';
import { radius, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifyTimer } from '@/hooks/useNotifyTimer';
import {
    appendMessageDeduped,
    ChatAccessError,
    loadChat,
    MessageBlockedError,
    sendChatMessage,
} from '@/lib/chat';
import { chatNotifyTimerId } from '@/lib/notifyTimerService';
import { performCheckout } from '@/lib/checkout';
import {
    isDevJordanConnection,
    loadDevJordanChat,
    sendDevJordanMessage,
} from '@/lib/devJordanChat';
import {
    loadPendingPeerChat,
    sendPendingPeerMessage,
} from '@/lib/devPendingChat';
import { formatUserError } from '@/lib/errors';
import {
    isPendingConnectionId,
    peerIdFromPendingConnection,
} from '@/lib/inboxNavigation';
import { mapTabRoute } from '@/lib/mapNavigation';
import { getPublicPeerProfile } from '@/lib/publicProfile';
import { submitSafetyReport, type ReportReasonId } from '@/lib/safety';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { fetchVenueName } from '@/lib/venues';
import type { Connection, Message } from '@/types/database';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function ChatScreen() {
  const { connectionId: connectionIdParam, draft: draftParam } = useLocalSearchParams<{
    connectionId?: string;
    draft?: string;
  }>();
  const connectionId =
    typeof connectionIdParam === 'string' ? connectionIdParam : undefined;
  const router = useRouter();
  const { user, checkIn, refreshCheckIn } = useAuth();
  const { colors } = useTheme();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportVisible, setReportVisible] = useState(false);
  const [venueName, setVenueName] = useState('Ephemeral Chat Room');
  const notifyTimer = useNotifyTimer(
    connectionId ? chatNotifyTimerId(connectionId) : 'chat:unknown',
  );

  const hasOutgoingMessage = useMemo(
    () => messages.some((m) => m.sender_id === user?.id),
    [messages, user?.id],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        checkoutTop: { marginBottom: spacing.md },
        chatCard: { flex: 1, minHeight: 360, marginBottom: spacing.sm },
        list: { flex: 1 },
        listContent: { paddingBottom: spacing.sm },
        bubble: {
          maxWidth: '82%',
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
        mine: {
          alignSelf: 'flex-end',
          backgroundColor: colors.bubbleOutgoing,
        },
        theirs: {
          alignSelf: 'flex-start',
          backgroundColor: colors.bubbleIncoming,
        },
        bubbleText: { color: colors.text, fontSize: 15, lineHeight: 21 },
        bubbleTextMine: { color: colors.bubbleOutgoingText },
        empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, fontSize: 14 },
        composer: {
          flexDirection: 'row',
          gap: spacing.sm,
          alignItems: 'flex-end',
          marginTop: spacing.sm,
        },
        input: {
          flex: 1,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.full,
          color: colors.text,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          maxHeight: 100,
          fontSize: 15,
        },
        sendBtn: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
        },
        sendDisabled: { opacity: 0.45 },
        sendIcon: { color: colors.accentOnButton, fontSize: 20, fontWeight: '700' },
      }),
    [colors],
  );

  useEffect(() => {
    if (typeof draftParam === 'string' && draftParam.trim()) {
      setBody(draftParam);
    }
  }, [draftParam]);

  useEffect(() => {
    if (!checkIn?.venue_id || !isSupabaseConfigured) return;
    fetchVenueName(checkIn.venue_id)
      .then((name) => setVenueName(name ?? 'Ephemeral Chat Room'))
      .catch(() => setVenueName('Ephemeral Chat Room'));
  }, [checkIn?.venue_id]);

  const load = useCallback(async () => {
    if (!connectionId || !user) {
      setLoading(false);
      return;
    }

    if (isDevJordanConnection(connectionId)) {
      setLoading(true);
      setError(null);
      const result = loadDevJordanChat(user.id);
      setConnection(result.connection);
      setMessages(result.messages);
      setVenueName('Jordan · Dev chat');
      setLoading(false);
      return;
    }

    if (isPendingConnectionId(connectionId)) {
      setLoading(true);
      setError(null);
      const peerId = peerIdFromPendingConnection(connectionId);
      const peerProfile = getPublicPeerProfile(peerId);
      const result = loadPendingPeerChat(user.id, peerId, peerProfile?.display_name ?? 'Someone');
      setConnection(result.connection);
      setMessages(result.messages);
      setVenueName(peerProfile?.display_name ?? 'New chat');
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
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
    if (!connectionId || !isSupabaseConfigured || isDevJordanConnection(connectionId) || isPendingConnectionId(connectionId)) return;

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
    if (!user || !connectionId || !body.trim()) return;

    if (isDevJordanConnection(connectionId)) {
      setSending(true);
      setError(null);
      try {
        const msg = sendDevJordanMessage(user.id, body);
        setMessages((prev) => appendMessageDeduped(prev, msg));
        setBody('');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Send failed');
      } finally {
        setSending(false);
      }
      return;
    }

    if (isPendingConnectionId(connectionId)) {
      setSending(true);
      setError(null);
      try {
        const peerId = peerIdFromPendingConnection(connectionId);
        const msg = sendPendingPeerMessage(user.id, peerId, body);
        setMessages((prev) => appendMessageDeduped(prev, msg));
        setBody('');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Send failed');
      } finally {
        setSending(false);
      }
      return;
    }

    if (!isSupabaseConfigured) return;

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

  const handleSendPress = () => {
    if (!body.trim() || sending || !connection) return;

    if (hasOutgoingMessage) {
      void send();
      return;
    }

    if (notifyTimer.state === 'pending') return;

    notifyTimer.start(() => {
      void send();
    });
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
    Alert.alert('Leave venue?', 'You will check out and this chat will end.', [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Check out',
        style: 'destructive',
        onPress: async () => {
          if (!checkIn) return;
          try {
            await performCheckout(refreshCheckIn, {
              venueId: checkIn.venue_id,
              venueName: venueName === 'Jordan · Dev chat' ? 'Venue' : venueName,
              mode: checkIn.mode,
            });
            router.replace(mapTabRoute());
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
        <Card>
          <ErrorBanner message="No connection selected." />
          <Button
            title="Back to room"
            onPress={() => router.replace('/main/room')}
            accessibilityLabel="Back to room"
          />
        </Card>
      </Screen>
    );
  }

  if (!checkIn) {
    return (
      <Screen>
        <Card>
          <ErrorBanner message="You are not checked in. Chat is unavailable." />
          <Button
            title="Back to venue picker"
            onPress={() => router.replace(mapTabRoute())}
            accessibilityLabel="Back to venue picker"
          />
        </Card>
      </Screen>
    );
  }

  if (loading) return <LoadingState message="Opening chat..." />;

  const canSend =
    !!connection &&
    !!body.trim() &&
    !sending &&
    notifyTimer.state !== 'pending' &&
    (isDevJordanConnection(connectionId) || isSupabaseConfigured);

  return (
    <Screen>
      <ScreenTitle>{venueName}</ScreenTitle>

      <Button
        title="LEAVE VENUE / CHECK OUT"
        variant="danger"
        onPress={handleCheckout}
        accessibilityLabel="Leave venue and check out"
        style={styles.checkoutTop}
      />

      {!isSupabaseConfigured && !isDevJordanConnection(connectionId) ? (
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
            />
          ) : null}
        </>
      ) : null}

      <Card style={styles.chatCard}>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const mine = item.sender_id === user?.id;
            return (
              <View
                style={[styles.bubble, mine ? styles.mine : styles.theirs]}
                accessibilityLabel={mine ? `You: ${item.body}` : `Them: ${item.body}`}
              >
                <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
                  {item.body}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>Say hi — this chat ends when you check out.</Text>
          }
        />

        <NoticeBar message="Chat logs will delete automatically upon checkout." />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {notifyTimer.state === 'pending' && !hasOutgoingMessage ? (
            <NotifyTimerBar
              label={NOTIFY_TIMER_LABEL}
              countdown={notifyTimer.formatted}
              onStop={notifyTimer.cancel}
              onSendNow={notifyTimer.sendNow}
            />
          ) : (
            <View style={styles.composer}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor={colors.textMuted}
                value={body}
                onChangeText={setBody}
                multiline
                editable={!!connection && (isDevJordanConnection(connectionId) || isSupabaseConfigured)}
                accessibilityLabel="Message input"
              />
              <Pressable
                onPress={handleSendPress}
                disabled={!canSend}
                style={[styles.sendBtn, !canSend && styles.sendDisabled]}
                accessibilityRole="button"
                accessibilityLabel={hasOutgoingMessage ? 'Send message' : 'Start notify timer and send first message'}
              >
                <Text style={styles.sendIcon}>→</Text>
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
      </Card>

      <Button
        title="Report user"
        variant="ghost"
        onPress={() => setReportVisible(true)}
        disabled={!connection || (!isSupabaseConfigured && !isDevJordanConnection(connectionId))}
        accessibilityLabel="Report user"
      />
      <ReportReasonModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        onSubmit={handleReportSubmit}
      />
    </Screen>
  );
}
