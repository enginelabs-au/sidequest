import { Button } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { fetchMyBlocks, type BlockedUserRow } from '@/lib/safety';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
};

function formatBlockedDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function BlockedUsersModal({ visible, onClose }: Props) {
  const [blocks, setBlocks] = useState<BlockedUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchMyBlocks();
      setBlocks(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load blocked users');
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Blocked users</Text>
          <Text style={styles.subtitle}>
            People you blocked won't appear in your room. Unblock is not available in this MVP.
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : error ? (
            <>
              <Text style={styles.error}>{error}</Text>
              <Button
                title="Try again"
                variant="ghost"
                onPress={load}
                accessibilityLabel="Try again to load blocked users"
              />
            </>
          ) : blocks.length === 0 ? (
            <Text style={styles.empty}>No blocked users</Text>
          ) : (
            <FlatList
              data={blocks}
              keyExtractor={(item) => item.blocked_id}
              style={styles.list}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <Text style={styles.rowTitle}>Blocked user</Text>
                  <Text style={styles.rowDate}>{formatBlockedDate(item.created_at)}</Text>
                </View>
              )}
            />
          )}

          <Button
            title="Close"
            variant="ghost"
            onPress={onClose}
            accessibilityLabel="Close blocked users list"
            style={styles.close}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '80%',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  loader: { marginVertical: spacing.lg },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginVertical: spacing.lg,
    fontSize: 15,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  list: { maxHeight: 240, marginBottom: spacing.md },
  row: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  rowDate: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  close: { marginTop: spacing.sm },
});
