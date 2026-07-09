import { BlockedUsersModal } from '@/components/BlockedUsersModal';
import { PeerCard } from '@/components/PeerCard';
import { ReportReasonModal } from '@/components/ReportReasonModal';
import { TooltipOverlay } from '@/components/TooltipOverlay';
import {
  Button,
  ErrorBanner,
  LoadingState,
  Screen,
  ScreenSubtitle,
  ScreenTitle,
} from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTooltipFlag } from '@/hooks/useTooltipFlag';
import { performCheckout } from '@/lib/checkout';
import { blockUser, requestConnection } from '@/lib/connections';
import { formatUserError } from '@/lib/errors';
import { loadRoomData } from '@/lib/room';
import { submitSafetyReport, type ReportReasonId } from '@/lib/safety';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { RoomPeer, Venue } from '@/types/database';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';

export default function RoomScreen() {
  const router = useRouter();
  const { checkIn, refreshCheckIn, signOut } = useAuth();
  const { visible: tooltipVisible, dismiss: dismissTooltip } = useTooltipFlag('room');
  const [peers, setPeers] = useState<RoomPeer[]>([]);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportPeer, setReportPeer] = useState<RoomPeer | null>(null);
  const [blockedModalVisible, setBlockedModalVisible] = useState(false);

  const load = useCallback(async () => {
    if (!checkIn || !isSupabaseConfigured) {
      setPeers([]);
      setVenue(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { peers: peerList, venue: venueData } = await loadRoomData(checkIn.venue_id);
      setPeers(peerList);
      setVenue(venueData);
    } catch (e) {
      setError(formatUserError(e, 'Failed to load room'));
    } finally {
      setLoading(false);
    }
  }, [checkIn]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!checkIn || !isSupabaseConfigured) return;
    const channel = supabase
      .channel(`room:${checkIn.venue_id}:${checkIn.mode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'check_ins',
          filter: `venue_id=eq.${checkIn.venue_id}`,
        },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [checkIn, load]);

  const handleConnect = async (peer: RoomPeer) => {
    setActionLoading(peer.user_id);
    try {
      const connection = await requestConnection(peer.user_id);
      await load();
      if (connection.status === 'connected') {
        router.push(`/(main)/chat/${connection.id}`);
      }
    } catch (e) {
      Alert.alert('Connect failed', formatUserError(e, 'Try again'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlock = (peer: RoomPeer) => {
    Alert.alert('Block instantly?', 'They will disappear from your room.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await blockUser(peer.user_id);
            await load();
          } catch (e) {
            Alert.alert('Block failed', formatUserError(e, 'Try again'));
          }
        },
      },
    ]);
  };

  const handleReportSubmit = async (reason: ReportReasonId, details?: string) => {
    if (!reportPeer) return;
    await submitSafetyReport({
      reportedId: reportPeer.user_id,
      connectionId: reportPeer.connection_id,
      reason,
      details,
    });
    Alert.alert('Reported', 'Thank you. Our moderation pipeline will review this.');
  };

  const handleCheckout = () => {
    Alert.alert('Check out?', 'You will go invisible and leave the room.', [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Check out',
        style: 'destructive',
        onPress: async () => {
          try {
            await performCheckout(refreshCheckIn);
            router.replace('/(onboarding)/venue');
          } catch (e) {
            Alert.alert('Checkout failed', formatUserError(e, 'Try again'));
          }
        },
      },
    ]);
  };

  const content = (
    <Screen>
      <ScreenTitle>The Room</ScreenTitle>
      <ScreenSubtitle>
        {checkIn
          ? `${checkIn.mode} mode · group ${checkIn.group_size} · ${venue?.name ?? 'venue'}`
          : 'Not checked in'}
      </ScreenSubtitle>

      {!isSupabaseConfigured ? (
        <ErrorBanner message="Add Supabase keys to .env — see .env.example and docs/PHASE6_ROOM.md." />
      ) : null}
      {error ? (
        <>
          <ErrorBanner message={error} />
          <Button
            title="Try again"
            variant="ghost"
            onPress={load}
            accessibilityLabel="Try again to load room"
            style={styles.retry}
          />
        </>
      ) : null}

      {loading ? (
        <LoadingState message="Scanning the room..." />
      ) : peers.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Quiet in here</Text>
          <Text style={styles.emptyText}>
            No one else in your mode right now. Refresh when someone checks in — connect state
            updates on pull-to-refresh until connections Realtime is added.
          </Text>
          <Button
            title="Refresh room"
            variant="ghost"
            onPress={load}
            disabled={!isSupabaseConfigured}
            accessibilityLabel="Refresh room"
            style={styles.emptyRefresh}
          />
        </View>
      ) : (
        <FlatList
          data={peers}
          keyExtractor={(item) => item.user_id}
          refreshing={loading}
          onRefresh={isSupabaseConfigured ? load : undefined}
          renderItem={({ item }) => (
            <PeerCard
              peer={item}
              mode={checkIn!.mode}
              onConnect={() => handleConnect(item)}
              onBlock={() => handleBlock(item)}
              onChat={
                item.connection_status === 'connected' && item.connection_id
                  ? () => router.push(`/(main)/chat/${item.connection_id}`)
                  : undefined
              }
              onReport={() => setReportPeer(item)}
              loading={actionLoading === item.user_id}
            />
          )}
        />
      )}

      <View style={styles.footer}>
        <Button
          title="Blocked users"
          variant="ghost"
          onPress={() => setBlockedModalVisible(true)}
          disabled={!isSupabaseConfigured}
          accessibilityLabel="View blocked users"
        />
        <Button
          title="Check out (go invisible)"
          variant="danger"
          onPress={handleCheckout}
          accessibilityLabel="Check out and go invisible"
        />
        <Button
          title="Sign out"
          variant="ghost"
          onPress={signOut}
          accessibilityLabel="Sign out"
          style={styles.signOut}
        />
      </View>

      <ReportReasonModal
        visible={!!reportPeer}
        reportedLabel={reportPeer?.display_name ?? undefined}
        onClose={() => setReportPeer(null)}
        onSubmit={handleReportSubmit}
      />
      <BlockedUsersModal
        visible={blockedModalVisible}
        onClose={() => setBlockedModalVisible(false)}
      />
    </Screen>
  );

  if (tooltipVisible) {
    return (
      <TooltipOverlay
        title="This is The Room"
        message="Only people checked into this venue in your mode appear here. Connect is mutual — chat opens when you both tap Connect."
        onDismiss={dismissTooltip}
      >
        {content}
      </TooltipOverlay>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: spacing.sm },
  emptyText: { color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: spacing.md },
  emptyRefresh: { marginTop: spacing.sm },
  retry: { marginBottom: spacing.sm },
  footer: { marginTop: spacing.md, gap: spacing.sm },
  signOut: { marginTop: spacing.xs },
});
