import { AppIcon, type AppIconName } from '@/components/AppIcon';
import { colors, radius, spacing } from '@/constants/theme';
import { activityAccentBgFor, activityAccentFor } from '@/lib/semanticColors';
import type { ActivityItem } from '@/lib/socialMock';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  item: ActivityItem;
  onPress?: () => void;
};

const ICON: Record<ActivityItem['type'], AppIconName> = {
  wave: 'wave',
  checkin: 'location',
  reply: 'reply',
  request: 'request',
};

function initialsFromTitle(title: string): string {
  const match = title.match(/^([A-Za-z]+)/);
  return (match?.[1] ?? 'SQ').slice(0, 2).toUpperCase();
}

export function ActivityFeedRow({ item, onPress }: Props) {
  const accent = activityAccentFor(item.type);
  const accentBg = activityAccentBgFor(item.type);

  return (
    <Pressable
      style={[styles.row, { borderLeftColor: accent }]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View style={[styles.typePill, { backgroundColor: accentBg }]}>
        <AppIcon name={ICON[item.type]} size={14} color={accent} />
        <Text style={[styles.typeLabel, { color: accent }]}>
          {item.type === 'checkin' ? 'Check-in' : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
        </Text>
      </View>

      <View style={[styles.avatar, { borderColor: accent }]}>
        <Text style={[styles.avatarText, { color: accent }]}>{initialsFromTitle(item.title)}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{item.title}</Text>
        {item.subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {item.subtitle}
          </Text>
        ) : null}
        <Text style={styles.time}>{item.timeLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingLeft: spacing.sm,
    borderLeftWidth: 4,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginTop: 10,
  },
  typeLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.purpleMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginTop: 4,
  },
  avatarText: { fontWeight: '800', fontSize: 14 },
  body: { flex: 1, gap: 2, paddingTop: 4 },
  title: { color: colors.text, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  time: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
