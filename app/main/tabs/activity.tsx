import { ActivityFeedRow } from '@/components/ActivityFeedRow';
import { AppHeader } from '@/components/AppHeader';
import { FilterPills } from '@/components/FilterPills';
import { SwipeableRow } from '@/components/SwipeableRow';
import { Card } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useScreenBackgroundStyle } from '@/contexts/ThemeContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { navigateToPublicProfile } from '@/lib/profileNavigation';
import {
    deleteActivityItem,
    loadDeletedActivityIds,
    loadLocalActivityItems,
} from '@/lib/socialLocal';
import { MOCK_ACTIVITY_ITEMS, type ActivityItem } from '@/lib/socialMock';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ActivityFilter = 'all' | 'requests' | 'checkins';

function filterActivity(items: ActivityItem[], filter: ActivityFilter): ActivityItem[] {
  if (filter === 'requests') return items.filter((i) => i.type === 'request' || i.type === 'wave');
  if (filter === 'checkins') return items.filter((i) => i.type === 'checkin');
  return items.filter((i) => i.type !== 'reply');
}

function mergeActivity(local: ActivityItem[], mock: ActivityItem[]): ActivityItem[] {
  const seen = new Set<string>();
  const merged: ActivityItem[] = [];
  for (const item of [...local, ...mock]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
  return merged;
}

export default function ActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const screenStyle = useScreenBackgroundStyle();
  const tabBarInset = useTabBarInset();
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [items, setItems] = useState<ActivityItem[]>(MOCK_ACTIVITY_ITEMS);

  const load = useCallback(async () => {
    const [local, deletedIds] = await Promise.all([
      loadLocalActivityItems(),
      loadDeletedActivityIds(),
    ]);
    const deleted = new Set(deletedIds);
    setItems(mergeActivity(local, MOCK_ACTIVITY_ITEMS).filter((i) => !deleted.has(i.id)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => filterActivity(items, filter), [items, filter]);

  const openItem = (item: ActivityItem) => {
    if (!item.peerUserId) return;
    if (item.type === 'request') {
      router.push({
        pathname: '/main/peer/[userId]',
        params: { userId: item.peerUserId, fromAlert: 'request' },
      });
      return;
    }
    navigateToPublicProfile(router, item.peerUserId, { checkedIn: true });
  };

  const handleDelete = async (item: ActivityItem) => {
    await deleteActivityItem(item.id);
    await load();
  };

  const handleArchive = async (item: ActivityItem) => {
    await deleteActivityItem(item.id);
    await load();
  };

  const handleReport = (item: ActivityItem) => {
    router.push({
      pathname: '/main/report',
      params: {
        reportedId: item.peerUserId ?? '',
        reportedLabel: item.title,
      },
    });
  };

  return (
    <View style={[screenStyle, { paddingTop: insets.top }]}>
      <View style={styles.headerPad}>
        <AppHeader
          title="Alerts"
          onAction={() => router.push('/main/tabs/inbox')}
          actionIcon="inbox"
        />
        <FilterPills
          fit
          options={['all', 'requests', 'checkins'] as const}
          value={filter}
          onChange={setFilter}
          labels={{
            all: 'All',
            requests: 'Requests',
            checkins: 'Check-ins',
          }}
        />
      </View>

      {visible.length === 0 ? (
        <Card style={styles.empty}>
          <Text style={styles.emptyTitle}>All Caught Up</Text>
          <Text style={styles.emptyText}>New waves, check-ins, and requests will show up here.</Text>
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
              <ActivityFeedRow item={item} onPress={() => openItem(item)} />
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
