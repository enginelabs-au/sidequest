import { colors, spacing } from '@/constants/theme';
import { useRef } from 'react';
import {
    Animated,
    PanResponder,
    Pressable,
    StyleSheet,
    Text,
    View,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

const ACTION_WIDTH = 72;
const REVEAL_WIDTH = ACTION_WIDTH * 3;

type SwipeAction = {
  key: string;
  label: string;
  color: string;
  onPress: () => void;
};

type Props = {
  children: React.ReactNode;
  actions: [SwipeAction, SwipeAction, SwipeAction];
  style?: StyleProp<ViewStyle>;
};

export function SwipeableRow({ children, actions, style }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const openRef = useRef(false);

  const snapTo = (open: boolean) => {
    openRef.current = open;
    Animated.spring(translateX, {
      toValue: open ? -REVEAL_WIDTH : 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 8,
      onPanResponderMove: (_, g) => {
        const next = Math.min(0, Math.max(-REVEAL_WIDTH, g.dx + (openRef.current ? -REVEAL_WIDTH : 0)));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const current = (openRef.current ? -REVEAL_WIDTH : 0) + g.dx;
        snapTo(current < -REVEAL_WIDTH / 2);
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.actions}>
        {actions.map((action) => (
          <Pressable
            key={action.key}
            style={[styles.actionBtn, { backgroundColor: action.color }]}
            onPress={() => {
              snapTo(false);
              action.onPress();
            }}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Text style={styles.actionText}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
      <Animated.View
        style={[styles.content, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  actions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    width: REVEAL_WIDTH,
  },
  actionBtn: {
    width: ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  actionText: {
    color: colors.onPurple,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  content: {
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
});
