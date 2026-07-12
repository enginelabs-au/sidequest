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
    editChatMessage,
    loadChat,
    MessageBlockedError,
    sendChatMessage,
} from '@/lib/chat';
import { hydratePendingInboundWave, loadChatWaveContext } from '@/lib/chatWaveContext';
import { performCheckout } from '@/lib/checkout';
import { DEV_FAKE_PEER_ID } from '@/lib/devFakePeer';
import {
    editDevJordanMessage,
    isDevJordanConnection,
    loadDevJordanChat,
    sendDevJordanMessage,
} from '@/lib/devJordanChat';
import {
    editPendingPeerMessage,
    loadPendingPeerChat,
    sendPendingPeerMessage,
} from '@/lib/devPendingChat';
import { formatUserError } from '@/lib/errors';
import {
    isPendingConnectionId,
    peerIdFromPendingConnection,
} from '@/lib/inboxNavigation';
import { mapTabRoute } from '@/lib/mapNavigation';
import {
    attachReadStatus,
    autoReadMessageIds,
    canEditOwnMessage,
    loadConnectionReadMap,
    markMessagesRead,
    type ChatMessage,
} from '@/lib/messageReadStatus';
import { chatNotifyTimerId } from '@/lib/notifyTimerService';
import { getPublicPeerProfile } from '@/lib/publicProfile';
import { submitSafetyReport, type ReportReasonId } from '@/lib/safety';
import type { ActivityItem } from '@/lib/socialMock';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { fetchVenueName } from '@/lib/venues';
import { canUnwaveOutgoingWave, CHAT_SEEN_LABEL, messageIsOutgoingWave, shouldShowWaveBack } from '@/lib/waveChat';
import { sendWave, unwaveUser } from '@/lib/waves';
import type { Connection, Message } from '@/types/database';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const MESSAGE_READ_SIM_DELAY_MS = 8000;

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
  const [inboxPreview, setInboxPreview] = useState<string | undefined>();
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [hasWavedPeer, setHasWavedPeer] = useState(false);
  const [wavingBack, setWavingBack] = useState(false);
  const [unwaving, setUnwaving] = useState(false);
  const [readMap, setReadMap] = useState<Record<string, string>>({});
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const readTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
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
          borderRadius: radius.lg,
          padding: spacing.md,
        },
        mine: {
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
        waveBack: {
          marginTop: spacing.sm,
          backgroundColor: colors.waveReady,
        },
        unWave: {
          marginTop: spacing.sm,
          backgroundColor: colors.waveCancel,
        },
        mineWrap: {
          alignSelf: 'flex-end',
          maxWidth: '82%',
          marginBottom: spacing.sm,
        },
        bubblePressable: {
          borderRadius: radius.lg,
        },
        bubbleEditable: {
          borderWidth: 1,
          borderColor: colors.border,
          borderStyle: 'dashed',
        },
        readLabel: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '600',
          textAlign: 'right',
          marginTop: 2,
          marginRight: spacing.xs,
        },
        bubbleWaveSelectable: {
          borderWidth: 1,
          borderColor: colors.waveCancel,
        },
        editPanel: {
          marginTop: spacing.sm,
          gap: spacing.sm,
          padding: spacing.sm,
          borderRadius: radius.md,
          backgroundColor: colors.borderLight,
        },
        editInput: {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          color: colors.text,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          fontSize: 15,
          minHeight: 44,
        },
        editActions: {
          flexDirection: 'row',
          gap: spacing.sm,
        },
        editHint: {
          color: colors.textMuted,
          fontSize: 12,
          marginBottom: spacing.xs,
        },
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
      const waveCtx = await loadChatWaveContext(user.id, DEV_FAKE_PEER_ID);
      setInboxPreview(waveCtx.inboxPreview);
      setActivityItems(waveCtx.activity);
      setHasWavedPeer(waveCtx.hasWavedPeer);
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
      const waveCtx = await loadChatWaveContext(user.id, peerId);
      setInboxPreview(waveCtx.inboxPreview);
      setActivityItems(waveCtx.activity);
      setHasWavedPeer(waveCtx.hasWavedPeer);
      hydratePendingInboundWave(peerId, waveCtx);
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

  const refreshReadMap = useCallback(async () => {
    if (!connectionId) return;
    const map = await loadConnectionReadMap(connectionId);
    setReadMap(map);
  }, [connectionId]);

  useEffect(() => {
    void refreshReadMap();
  }, [refreshReadMap, messages.length]);

  const chatMessages = useMemo(
    () => attachReadStatus(messages, readMap),
    [messages, readMap],
  );

  const peerUserId =
    connection && user
      ? connection.user_one === user.id
        ? connection.user_two
        : connection.user_one
      : null;

  const showWaveBack = useMemo(() => {
    if (!peerUserId || !user?.id) return false;
    return shouldShowWaveBack({
      peerUserId,
      userId: user.id,
      messages,
      viewerWavedPeer: hasWavedPeer,
      inboxPreview,
      activity: activityItems,
    });
  }, [peerUserId, user?.id, messages, hasWavedPeer, inboxPreview, activityItems]);

  const canUnwavePeerWave = useMemo(() => {
    if (!user?.id || !hasWavedPeer) return false;
    return canUnwaveOutgoingWave(messages, user.id, readMap);
  }, [user?.id, hasWavedPeer, messages, readMap]);

  useEffect(() => {
    if (!connectionId || !user?.id || !peerUserId) return;

    const autoIds = autoReadMessageIds(messages, user.id, peerUserId, readMap);
    if (!autoIds.length) return;

    void markMessagesRead(connectionId, autoIds).then(setReadMap);
  }, [connectionId, user?.id, peerUserId, messages, readMap]);

  useEffect(() => {
    readTimersRef.current.forEach(clearTimeout);
    readTimersRef.current = [];

    if (!connectionId || !user?.id) return;

    for (const message of messages) {
      if (message.sender_id !== user.id || readMap[message.id]) continue;
      const timer = setTimeout(() => {
        void markMessagesRead(connectionId, [message.id]).then(setReadMap);
      }, MESSAGE_READ_SIM_DELAY_MS);
      readTimersRef.current.push(timer);
    }

    return () => {
      readTimersRef.current.forEach(clearTimeout);
      readTimersRef.current = [];
    };
  }, [connectionId, user?.id, messages, readMap]);

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

  const startEditMessage = (message: ChatMessage) => {
    if (!user?.id || !canEditOwnMessage(message, user.id)) return;
    setEditingMessageId(message.id);
    setEditBody(message.body);
    setError(null);
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditBody('');
  };

  const saveEditMessage = async () => {
    if (!user || !connectionId || !editingMessageId || !editBody.trim() || savingEdit) return;

    const original = chatMessages.find((m) => m.id === editingMessageId);
    if (!original || !canEditOwnMessage(original, user.id)) {
      setError('This message can no longer be edited.');
      cancelEditMessage();
      return;
    }

    setSavingEdit(true);
    setError(null);
    try {
      if (isDevJordanConnection(connectionId)) {
        const updated = editDevJordanMessage(editingMessageId, editBody);
        if (!updated) throw new Error('Message not found');
        setMessages((prev) => prev.map((m) => (m.id === editingMessageId ? updated : m)));
      } else if (isPendingConnectionId(connectionId)) {
        const peerId = peerIdFromPendingConnection(connectionId);
        const updated = editPendingPeerMessage(peerId, editingMessageId, editBody);
        if (!updated) throw new Error('Message not found');
        setMessages((prev) => prev.map((m) => (m.id === editingMessageId ? updated : m)));
      } else if (isSupabaseConfigured) {
        await editChatMessage({
          messageId: editingMessageId,
          userId: user.id,
          body: editBody,
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === editingMessageId ? { ...m, body: editBody.trim() } : m,
          ),
        );
      } else {
        throw new Error('Chat editing is unavailable.');
      }
      cancelEditMessage();
    } catch (e) {
      if (e instanceof MessageBlockedError) {
        setError(e.message);
      } else {
        setError(formatUserError(e, 'Could not save edit'));
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const performUnwave = async () => {
    if (!user || !peerUserId || unwaving) return;
    setUnwaving(true);
    setError(null);
    try {
      await unwaveUser(peerUserId, user.id);
      setHasWavedPeer(false);
      await load();
    } catch (e) {
      setError(formatUserError(e, 'Could not un-wave'));
    } finally {
      setUnwaving(false);
    }
  };

  const confirmUnwave = () => {
    if (!canUnwavePeerWave) {
      Alert.alert('Cannot un-wave', 'They have already seen your wave.');
      return;
    }
    Alert.alert('Un-wave?', 'Remove your wave before they see it.', [
      { text: 'Keep wave', style: 'cancel' },
      { text: 'Un-wave', style: 'destructive', onPress: () => void performUnwave() },
    ]);
  };

  const handleWaveBack = async () => {
    if (!user || !peerUserId || wavingBack) return;

    const peerProfile = getPublicPeerProfile(peerUserId);
    const toDisplayName = peerProfile?.display_name ?? venueName.replace(/ · Dev chat$/, '');
    const fromDisplayName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      'You';

    setWavingBack(true);
    setError(null);
    try {
      await sendWave({
        fromUserId: user.id,
        fromDisplayName,
        toUserId: peerUserId,
        toDisplayName,
      });
      setHasWavedPeer(true);
      await load();
    } catch (e) {
      setError(formatUserError(e, 'Could not wave back'));
    } finally {
      setWavingBack(false);
    }
  };

  const reportedId = peerUserId;

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
            await performCheckout(
              refreshCheckIn,
              {
                venueId: checkIn.venue_id,
                venueName: venueName === 'Jordan · Dev chat' ? 'Venue' : venueName,
                mode: checkIn.mode,
              },
              () => router.replace(mapTabRoute()),
            );
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
          data={chatMessages}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const mine = item.sender_id === user?.id;
            const isOutgoingWave =
              mine && user?.id ? messageIsOutgoingWave(item, user.id) : false;
            const editable =
              mine && user?.id ? canEditOwnMessage(item, user.id) && !isOutgoingWave : false;
            const waveUnwaveable = isOutgoingWave && canUnwavePeerWave;

            if (!mine) {
              return (
                <View
                  style={[styles.bubble, styles.theirs, { alignSelf: 'flex-start', maxWidth: '82%', marginBottom: spacing.sm }]}
                  accessibilityLabel={`Them: ${item.body}`}
                >
                  <Text style={styles.bubbleText}>{item.body}</Text>
                </View>
              );
            }

            return (
              <View style={styles.mineWrap}>
                <Pressable
                  onPress={() => {
                    if (isOutgoingWave) {
                      confirmUnwave();
                      return;
                    }
                    startEditMessage(item);
                  }}
                  disabled={
                    isOutgoingWave ? !waveUnwaveable || unwaving : !editable || !!editingMessageId
                  }
                  style={[
                    styles.bubblePressable,
                    editable && styles.bubbleEditable,
                    waveUnwaveable && styles.bubbleWaveSelectable,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isOutgoingWave
                      ? waveUnwaveable
                        ? `Un-wave: ${item.body}`
                        : `You: ${item.body}${item.read_at ? `, ${CHAT_SEEN_LABEL.toLowerCase()}` : ''}`
                      : editable
                        ? `Edit your message: ${item.body}`
                        : `You: ${item.body}${item.read_at ? `, ${CHAT_SEEN_LABEL.toLowerCase()}` : ''}`
                  }
                >
                  <View style={[styles.bubble, styles.mine]}>
                    <Text style={[styles.bubbleText, styles.bubbleTextMine]}>
                      {item.body}
                    </Text>
                  </View>
                </Pressable>
                {item.read_at ? (
                  <Text style={styles.readLabel}>{CHAT_SEEN_LABEL}</Text>
                ) : null}
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>Say hi — this chat ends when you check out.</Text>
          }
        />

        <NoticeBar message="Chat logs will delete automatically upon checkout." />

        {showWaveBack ? (
          <Button
            title="Wave Back"
            onPress={handleWaveBack}
            disabled={wavingBack}
            style={styles.waveBack}
            accessibilityLabel="Wave back at this person"
          />
        ) : null}

        {canUnwavePeerWave ? (
          <Button
            title="Un-Wave"
            onPress={confirmUnwave}
            disabled={unwaving}
            style={styles.unWave}
            accessibilityLabel="Remove your wave"
          />
        ) : null}

        {editingMessageId ? (
          <View style={styles.editPanel}>
            <Text style={styles.editHint}>Editing message — only unseen messages can be changed.</Text>
            <TextInput
              style={styles.editInput}
              value={editBody}
              onChangeText={setEditBody}
              multiline
              autoFocus
              accessibilityLabel="Edit message text"
            />
            <View style={styles.editActions}>
              <Button
                title="Save"
                onPress={saveEditMessage}
                disabled={!editBody.trim() || savingEdit}
                style={{ flex: 1 }}
              />
              <Button
                title="Cancel"
                variant="ghost"
                onPress={cancelEditMessage}
                disabled={savingEdit}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : null}

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
