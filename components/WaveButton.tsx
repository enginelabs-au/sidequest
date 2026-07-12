import { AppIcon } from '@/components/AppIcon';
import { NotifyTimerBar } from '@/components/NotifyTimerBar';
import { UnWaveIcon } from '@/components/UnWaveIcon';
import { NOTIFY_DELAY_SECONDS, NOTIFY_TIMER_LABEL } from '@/constants/notify';
import { colors, radius, spacing } from '@/constants/theme';
import { useNotifyTimer } from '@/hooks/useNotifyTimer';
import { waveNotifyTimerId } from '@/lib/notifyTimerService';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  peerUserId: string;
  waved: boolean;
  canUnwave?: boolean;
  onSendWave: () => void;
  onUnWave: () => void;
  onAttemptWave?: () => boolean;
  disabled?: boolean;
};

export function WaveButton({ peerUserId, waved, canUnwave = true, onSendWave, onUnWave, onAttemptWave, disabled }: Props) {
  const { state, formatted, start, cancel, sendNow } = useNotifyTimer(
    waveNotifyTimerId(peerUserId),
    NOTIFY_DELAY_SECONDS,
  );
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (waved) cancel();
  }, [waved, cancel]);

  useEffect(() => {
    if (waved || state === 'pending') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [waved, state, floatAnim]);

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const handleIdlePress = () => {
    if (disabled || waved) return;
    if (onAttemptWave && !onAttemptWave()) return;
    start(() => {
      onSendWave();
    });
  };

  const handleUnWavePress = () => {
    if (disabled) return;
    onUnWave();
  };

  if (state === 'pending') {
    return (
      <NotifyTimerBar
        label={NOTIFY_TIMER_LABEL}
        countdown={formatted}
        onStop={cancel}
        onSendNow={sendNow}
      />
    );
  }

  if (waved) {
    if (!canUnwave) {
      return (
        <View style={styles.fill} accessibilityLabel="Wave sent">
          <View style={[styles.btn, styles.btnSent, disabled && styles.btnDisabled]}>
            <AppIcon name="wave" size={18} color={colors.onPurple} />
            <Text style={styles.sentLabel}>Waved</Text>
          </View>
        </View>
      );
    }

    return (
      <Pressable
        onPress={handleUnWavePress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Un-Wave"
        style={styles.fill}
      >
        <View style={[styles.btn, styles.btnCancel, disabled && styles.btnDisabled]}>
          <UnWaveIcon size={26} color={colors.onPurple} />
          <Text style={styles.cancelLabel}>Un-Wave</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handleIdlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Wave"
      style={styles.fill}
    >
      <Animated.View
        style={[
          styles.btn,
          styles.btnReady,
          disabled && styles.btnDisabled,
          { transform: [{ translateY: floatY }] },
        ]}
      >
        <AppIcon name="wave" size={18} color={colors.onPurple} />
        <Text style={styles.readyLabel}>Wave</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    alignSelf: 'stretch',
    width: '100%',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minWidth: 120,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  btnReady: {
    backgroundColor: colors.waveReady,
  },
  btnCancel: {
    backgroundColor: colors.waveCancel,
  },
  btnSent: {
    backgroundColor: colors.waveReady,
    opacity: 0.85,
  },
  btnDisabled: { opacity: 0.55 },
  readyLabel: {
    color: colors.onPurple,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  cancelLabel: {
    color: colors.onPurple,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.15,
  },
  sentLabel: {
    color: colors.onPurple,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
