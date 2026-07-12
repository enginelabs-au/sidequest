import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { RoomPeer } from '@/types/database';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = {
  peers: RoomPeer[];
  totalCount: number;
};

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 1)
    .toUpperCase();
}

export function CheckedInStrip({ peers, totalCount }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { marginBottom: spacing.md },
        label: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: spacing.sm,
        },
        row: { gap: spacing.sm, paddingRight: spacing.lg },
        totalBadge: {
          backgroundColor: colors.accent,
          borderRadius: radius.full,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          justifyContent: 'center',
        },
        totalText: { color: colors.accentOnButton, fontWeight: '700', fontSize: 12 },
        chip: {
          backgroundColor: colors.card,
          borderRadius: radius.md,
          padding: spacing.sm,
          alignItems: 'center',
          minWidth: 72,
          borderWidth: 1,
          borderColor: colors.border,
        },
        chipAvatar: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.accentMuted,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xs,
        },
        chipInitial: { color: colors.accentDark, fontWeight: '800', fontSize: 13 },
        chipName: { color: colors.textSecondary, fontSize: 10, fontWeight: '600', maxWidth: 64 },
      }),
    [colors],
  );

  const preview = peers.slice(0, 5);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Checked-in nearby</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <View style={styles.totalBadge}>
          <Text style={styles.totalText}>{totalCount} active</Text>
        </View>
        {preview.map((peer) => (
          <View key={peer.user_id} style={styles.chip}>
            <View style={styles.chipAvatar}>
              <Text style={styles.chipInitial}>{initials(peer.display_name ?? '?')}</Text>
            </View>
            <Text style={styles.chipName} numberOfLines={1}>
              {peer.display_name ?? 'Guest'}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
