import { colors, radius, spacing } from '@/constants/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
      <View style={styles.topRow}>
        <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
          {label}
        </Text>
        <Text style={styles.countdown}>{countdown}</Text>
      </View>
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

const styles = StyleSheet.create({
  bar: {
    alignSelf: 'stretch',
    width: '100%',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.wavePending,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  label: {
    color: colors.onPurple,
    fontSize: 11,
    fontWeight: '800',
    flex: 1,
  },
  countdown: {
    color: colors.onPurple,
    fontSize: 14,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    minWidth: 36,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  actionPrimary: {
    color: colors.onPurple,
    fontSize: 11,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  actionStop: {
    color: colors.onPurple,
    fontSize: 11,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
