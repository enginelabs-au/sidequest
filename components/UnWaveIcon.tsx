import { AppIcon } from '@/components/AppIcon';
import { colors } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';

type Props = {
  size?: number;
  color?: string;
};

/**
 * Waving hand inside a circle with a diagonal slash — used for Un-Wave.
 * Custom composite so it renders consistently (SF `hand.wave.slash` often missing).
 */
export function UnWaveIcon({ size = 36, color = colors.onPurple }: Props) {
  const waveSize = Math.round(size * 0.52);
  const slashWidth = size * 0.88;
  const slashHeight = Math.max(2.5, size * 0.07);

  return (
    <View style={[styles.wrap, { width: size, height: size }]} accessibilityElementsHidden>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
          },
        ]}
      />
      <AppIcon name="wave" size={waveSize} color={color} />
      <View
        style={[
          styles.slash,
          {
            width: slashWidth,
            height: slashHeight,
            backgroundColor: color,
            borderRadius: slashHeight / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    borderWidth: 2.5,
  },
  slash: {
    position: 'absolute',
    transform: [{ rotate: '-42deg' }],
  },
});
