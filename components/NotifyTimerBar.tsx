import { colors, radius, spacing } from '@/constants/theme';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  countdown: string;
  onStop: () => void;
  onSendNow: () => void;
};

export function NotifyTimerBar({ label, countdown, onStop, onSendNow }: Props) {
  return (
    <View
      style={styles.bar}
      accessibilityRole="summary"
      accessibilityLabel={`${label} ${countdown}`}
    >
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.countdown}>{countdown}</Text>
      <View style={styles.actions}>
        <Pressable
          onPress={onSendNow}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Send now"
        >
          <Text style={styles.actionPrimary}>Send Now</Text>
        </Pressable>
        <Pressable
          onPress={onStop}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Stop notify timer"
        >
          <Text style={styles.actionStop}>Stop</Text>
        </Pressable>
      </View>
    </View>
  );
}

const raised = Platform.select({
  ios: {
    shadowColor: '#744210',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
  },
  android: { elevation: 6 },
  default: {},
});

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 52,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.wavePending,
    borderBottomWidth: 4,
    borderBottomColor: colors.wavePendingShadow,
    ...raised,
  },
  label: {
    color: colors.onPurple,
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  countdown: {
    color: colors.onPurple,
    fontSize: 18,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    minWidth: 48,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionPrimary: {
    color: colors.onPurple,
    fontSize: 13,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  actionStop: {
    color: colors.onPurple,
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
