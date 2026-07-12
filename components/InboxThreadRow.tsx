import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { InboxThread } from '@/lib/socialMock';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  thread: InboxThread;
  onPress: () => void;
};

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function InboxThreadRow({ thread, onPress }: Props) {
  const { colors } = useTheme();
  const isRequest = !!thread.isRequest;
  const accent = isRequest ? colors.inboxRequest : colors.inboxMessage;
  const accentBg = isRequest ? colors.inboxRequestBg : colors.purpleMuted;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: spacing.md,
          borderRadius: radius.md,
        },
        rowRequest: {
          backgroundColor: colors.inboxRowRequestBg,
          paddingHorizontal: spacing.sm,
          marginHorizontal: -spacing.sm,
        },
        avatar: {
          width: 52,
          height: 52,
          borderRadius: 26,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
        },
        avatarText: { fontWeight: '800', fontSize: 16 },
        body: { flex: 1, gap: 4 },
        topLine: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
        },
        name: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '800' },
        time: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
        requestPill: {
          alignSelf: 'flex-start',
          fontSize: 10,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: radius.full,
          overflow: 'hidden',
        },
        preview: { color: colors.textSecondary, fontSize: 14 },
        badge: {
          minWidth: 22,
          height: 22,
          borderRadius: 11,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 6,
        },
        badgeText: { color: colors.onPurple, fontSize: 11, fontWeight: '800' },
      }),
    [colors],
  );

  return (
    <Pressable
      style={[styles.row, isRequest && styles.rowRequest]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Message from ${thread.displayName}`}
    >
      <View style={[styles.avatar, { backgroundColor: accentBg, borderColor: accent }]}>
        <Text style={[styles.avatarText, { color: accent }]}>{initials(thread.displayName)}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text style={styles.name} numberOfLines={1}>
            {thread.displayName}
          </Text>
          <Text style={styles.time}>{thread.timeLabel}</Text>
        </View>
        {isRequest ? (
          <Text style={[styles.requestPill, { color: accent, backgroundColor: accentBg }]}>
            Request
          </Text>
        ) : null}
        <Text style={styles.preview} numberOfLines={1}>
          {thread.preview}
        </Text>
      </View>
      {thread.unreadCount > 0 ? (
        <View style={[styles.badge, { backgroundColor: accent }]}>
          <Text style={styles.badgeText}>{thread.unreadCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
