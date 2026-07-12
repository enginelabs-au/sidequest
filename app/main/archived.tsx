import { AppHeader } from '@/components/AppHeader';
import { InboxThreadRow } from '@/components/InboxThreadRow';
import { SwipeableRow } from '@/components/SwipeableRow';
import { Card, ErrorBanner, LoadingState } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenBackgroundStyle } from '@/contexts/ThemeContext';
import { filterInboxThreads, loadInboxThreads } from '@/lib/inbox';
import { openInboxThread } from '@/lib/inboxNavigation';
import {
    deleteInboxThread,
    upsertLocalInboxThread,
} from '@/lib/socialLocal';
import type { InboxThread } from '@/lib/socialMock';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ArchivedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, devBypassActive } = useAuth();
  const screenStyle = useScreenBackgroundStyle();
  const userId = user?.id ?? (devBypassActive ? 'dev-bypass-user' : null);

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
      setThreads(filterInboxThreads(data, 'archived'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load archived messages');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const visible = useMemo(() => threads, [threads]);

  const openThread = (thread: InboxThread) => {
    openInboxThread(router, thread);
  };

  const handleDelete = async (thread: InboxThread) => {
    await deleteInboxThread(thread.peerUserId);
    await load();
  };

  const handleUnarchive = async (thread: InboxThread) => {
    await upsertLocalInboxThread({ ...thread, archived: false });
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
        <AppHeader title="Archived" onBack={() => router.back()} variant="primary" />
      </View>

      {error ? <ErrorBanner message={error} /> : null}

      {loading ? (
        <LoadingState message="Loading archived…" />
      ) : visible.length === 0 ? (
        <Card style={styles.empty}>
          <Text style={styles.emptyTitle}>No Archived Messages</Text>
          <Text style={styles.emptyText}>
            Swipe left on a message and tap Archive to move it here.
          </Text>
        </Card>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
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
                  label: 'Restore',
                  color: colors.swipeArchive,
                  onPress: () => handleUnarchive(item),
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
