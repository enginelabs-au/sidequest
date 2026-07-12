import { AppIcon } from '@/components/AppIcon';
import { colors } from '@/constants/theme';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

type Props = {
  visible: boolean;
  onComplete?: () => void;
};

export function WaveAnimation({ visible, onComplete }: Props) {
  const scale = useRef(new Animated.Value(0.4)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    scale.setValue(0.4);
    rotate.setValue(0);
    opacity.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1.2, friction: 4, useNativeDriver: true }),
      ]),
      Animated.timing(rotate, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => onComplete?.());
  }, [visible, scale, rotate, opacity, onComplete]);

  if (!visible) return null;

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-18deg', '18deg'],
  });

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View
        style={{
          opacity,
          transform: [{ scale }, { rotate: spin }],
        }}
      >
        <AppIcon name="wave" size={72} color={colors.iconMuted} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
});
