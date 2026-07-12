import { AppHeader } from '@/components/AppHeader';
import { FilterPills } from '@/components/FilterPills';
import { InboxThreadRow } from '@/components/InboxThreadRow';
import { SwipeableRow } from '@/components/SwipeableRow';
import { Card, ErrorBanner, LoadingState } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCheckInGate } from '@/hooks/useCheckInGate';
import { useScreenBackgroundStyle } from '@/contexts/ThemeContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { filterInboxThreads, loadInboxThreads } from '@/lib/inbox';
import { openInboxThread } from '@/lib/inboxNavigation';
import {
    archiveInboxThreadByPeer,
    deleteInboxThread,
} from '@/lib/socialLocal';
import type { InboxThread } from '@/lib/socialMock';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type InboxFilter = 'all' | 'unread' | 'requests' | 'archived';

export default function InboxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, devBypassActive } = useAuth();
  const { ensureCheckedIn } = useCheckInGate();
  const tabBarInset = useTabBarInset();
  const screenStyle = useScreenBackgroundStyle();
  const userId = user?.id ?? (devBypassActive ? 'dev-bypass-user' : null);

  const [filter, setFilter] = useState<InboxFilter>('all');
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setThreads([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await loadInboxThreads(userId);
      setThreads(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inbox');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const visible = useMemo(() => filterInboxThreads(threads, filter), [threads, filter]);

  const openThread = (thread: InboxThread) => {
    if (!ensureCheckedIn()) return;
    openInboxThread(router, thread);
  };

  const handleFilterChange = (next: InboxFilter) => {
    if (next === 'archived') {
      router.push('/main/archived');
      return;
    }
    setFilter(next);
  };

  const handleDelete = async (thread: InboxThread) => {
    await deleteInboxThread(thread.peerUserId);
    await load();
  };

  const handleArchive = async (thread: InboxThread) => {
    await archiveInboxThreadByPeer(thread.peerUserId, thread);
    await load();
  };

  const handleReport = (thread: InboxThread) => {
    router.push({
      pathname: '/main/report',
      params: {
        reportedId: thread.peerUserId,
        reportedLabel: thread.displayName,
        connectionId: thread.connectionId ?? '',
      },
    });
  };

  return (
    <View style={[screenStyle, { paddingTop: insets.top }]}>
      <View style={styles.headerPad}>
        <AppHeader title="Inbox" onBack={() => router.back()} variant="primary" />
        <FilterPills
          fit
          options={['all', 'unread', 'requests', 'archived'] as const}
          value={filter}
          onChange={handleFilterChange}
          labels={{ all: 'All', unread: 'Unread', requests: 'Requests', archived: 'Archived' }}
        />
      </View>

      {error ? <ErrorBanner message={error} /> : null}

      {loading ? (
        <LoadingState message="Loading messages…" />
      ) : visible.length === 0 ? (
        <Card style={styles.empty}>
          <Text style={styles.emptyTitle}>No Messages Yet</Text>
          <Text style={styles.emptyText}>
            Wave at someone in Discovery or connect in the Room to start chatting.
          </Text>
        </Card>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarInset }]}
          renderItem={({ item }) => (
            <SwipeableRow
              actions={[
                {
                  key: 'delete',
                  label: 'Delete',
                  color: colors.swipeDelete,
                  onPress: () => handleDelete(item),
                },
                {
                  key: 'archive',
                  label: 'Archive',
                  color: colors.swipeArchive,
                  onPress: () => handleArchive(item),
                },
                {
                  key: 'report',
                  label: 'Report',
                  color: colors.swipeReport,
                  onPress: () => handleReport(item),
                },
              ]}
            >
              <InboxThreadRow thread={item} onPress={() => openThread(item)} />
            </SwipeableRow>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerPad: { paddingHorizontal: spacing.md },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  empty: { marginHorizontal: spacing.md, gap: spacing.sm },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
});
