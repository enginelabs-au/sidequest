import { AppHeader } from '@/components/AppHeader';
import { FilterPills } from '@/components/FilterPills';
import { RoomPeerCard } from '@/components/RoomPeerCard';
import { WaveAnimation } from '@/components/WaveAnimation';
import { Card, ErrorBanner, LoadingState } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCheckInGate } from '@/hooks/useCheckInGate';
import { useWaveAction } from '@/hooks/useWaveAction';
import { formatUserError } from '@/lib/errors';
import { navigateToPublicProfile } from '@/lib/profileNavigation';
import { loadRoomData } from '@/lib/room';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { RoomPeer } from '@/types/database';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ConnectionFilter = 'friends' | 'nearby' | 'requests';

function filterPeers(peers: RoomPeer[], filter: ConnectionFilter): RoomPeer[] {
  if (filter === 'friends') {
    return peers.filter((p) => p.connection_status === 'connected');
  }
  if (filter === 'requests') {
    return peers.filter(
      (p) =>
        p.connection_status === 'pending' ||
        (p.they_want && !p.i_want) ||
        (p.i_want && !p.they_want),
    );
  }
  return peers;
}

export default function ConnectionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { checkIn, user } = useAuth();
  const { ensureCheckedIn } = useCheckInGate();
  const { waveAt, waveAnimVisible, onWaveAnimComplete, wavedIds, loading: waveLoading } =
    useWaveAction();

  const [filter, setFilter] = useState<ConnectionFilter>('nearby');
  const [peers, setPeers] = useState<RoomPeer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!checkIn || !isSupabaseConfigured) {
      setPeers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const selfName =
        (user?.user_metadata?.full_name as string | undefined) ??
        (user?.user_metadata?.name as string | undefined) ??
        null;
      const { peers: peerList } = await loadRoomData(checkIn.venue_id, checkIn.mode, {
        selfCheckIn: checkIn,
        selfDisplayName: selfName,
      });
      setPeers(peerList);
    } catch (e) {
      setError(formatUserError(e, 'Failed to load connections'));
    } finally {
      setLoading(false);
    }
  }, [checkIn]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => filterPeers(peers, filter), [peers, filter]);

  const openProfile = (userId: string) => {
    navigateToPublicProfile(router, userId, { checkedIn: true });
  };

  const openChat = (peer: RoomPeer) => {
    if (!ensureCheckedIn()) return;
    if (peer.connection_id) {
      router.push({
        pathname: '/main/chat/[connectionId]',
        params: { connectionId: peer.connection_id },
      });
      return;
    }
    Alert.alert('Not connected yet', 'Wave or connect first to start messaging.');
  };

  const handleWave = async (peer: RoomPeer) => {
    if (!user || !ensureCheckedIn()) return;
    await waveAt(
      {
        user_id: peer.user_id,
        display_name: peer.display_name ?? 'Someone here',
      },
      { goToInbox: true },
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.headerPad}>
        <AppHeader title="My Connections" />
        <FilterPills
          options={['friends', 'nearby', 'requests'] as const}
          value={filter}
          onChange={setFilter}
          labels={{ friends: 'Friends', nearby: 'Nearby', requests: 'Requests' }}
        />
      </View>

      {error ? <ErrorBanner message={error} /> : null}

      {loading ? (
        <LoadingState message="Loading connections…" />
      ) : visible.length === 0 ? (
        <Card style={styles.empty}>
          <Text style={styles.emptyTitle}>No Connections Here Yet</Text>
          <Text style={styles.emptyText}>
            Check in at a venue and explore Discovery to meet people nearby.
          </Text>
        </Card>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.user_id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <RoomPeerCard
              userId={item.user_id}
              displayName={item.display_name ?? 'Someone here'}
              mode={item.mode}
              waved={wavedIds.has(item.user_id)}
              onPress={() => openProfile(item.user_id)}
              onWave={() => handleWave(item)}
              onMessage={() => openChat(item)}
              onProfile={() => openProfile(item.user_id)}
            />
          )}
        />
      )}

      <WaveAnimation visible={waveAnimVisible} onComplete={onWaveAnimComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  headerPad: { paddingHorizontal: spacing.md },
  list: { paddingHorizontal: spacing.sm, paddingBottom: spacing.xl },
  row: { gap: spacing.xs },
  empty: { marginHorizontal: spacing.md, gap: spacing.sm },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
});
