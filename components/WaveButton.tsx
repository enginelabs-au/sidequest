import { AppIcon } from '@/components/AppIcon';
import { NotifyTimerBar } from '@/components/NotifyTimerBar';
import { UnWaveIcon } from '@/components/UnWaveIcon';
import { NOTIFY_DELAY_SECONDS, NOTIFY_TIMER_LABEL } from '@/constants/notify';
import { colors, radius, spacing } from '@/constants/theme';
import { useNotifyTimer } from '@/hooks/useNotifyTimer';
import { waveNotifyTimerId } from '@/lib/notifyTimerService';
import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  peerUserId: string;
  waved: boolean;
  onSendWave: () => void;
  onUnWave: () => void;
  onAttemptWave?: () => boolean;
  disabled?: boolean;
};

export function WaveButton({ peerUserId, waved, onSendWave, onUnWave, onAttemptWave, disabled }: Props) {
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
    return (
      <Pressable
        onPress={handleUnWavePress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Un-Wave"
      >
        <View style={[styles.btn, styles.btnCancel, disabled && styles.btnDisabled]}>
          <UnWaveIcon size={36} color={colors.onPurple} />
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
    >
      <Animated.View
        style={[
          styles.btn,
          styles.btnReady,
          disabled && styles.btnDisabled,
          { transform: [{ translateY: floatY }] },
        ]}
      >
        <AppIcon name="wave" size={24} color={colors.onPurple} />
        <Text style={styles.readyLabel}>Wave</Text>
      </Animated.View>
    </Pressable>
  );
}

const raisedGreen = Platform.select({
  ios: {
    shadowColor: '#22543D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  android: { elevation: 10 },
  default: {},
});

const raisedRed = Platform.select({
  ios: {
    shadowColor: '#742A2A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  android: { elevation: 8 },
  default: {},
});

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minWidth: 160,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
  },
  btnReady: {
    backgroundColor: colors.waveReady,
    borderBottomWidth: 5,
    borderBottomColor: colors.waveReadyShadow,
    ...raisedGreen,
  },
  btnCancel: {
    backgroundColor: colors.waveCancel,
    borderBottomWidth: 5,
    borderBottomColor: colors.waveCancelShadow,
    ...raisedRed,
  },
  btnDisabled: { opacity: 0.55 },
  readyLabel: {
    color: colors.onPurple,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  cancelLabel: {
    color: colors.onPurple,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
