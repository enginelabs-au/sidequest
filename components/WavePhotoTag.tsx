import { AppIcon } from '@/components/AppIcon';
import { colors, radius, spacing } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  size?: 'large' | 'medium';
};

export function WavePhotoTag({ size = 'medium' }: Props) {
  const large = size === 'large';
  return (
    <View style={[styles.tag, large ? styles.tagLarge : styles.tagMedium]} pointerEvents="none">
      <View style={styles.row}>
        <AppIcon name="wave" size={large ? 12 : 10} color={colors.onPurple} />
        <Text style={[styles.text, large ? styles.textLarge : styles.textMedium]}>Waved</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.coral,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.onPurple,
  },
  tagLarge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  tagMedium: { paddingHorizontal: spacing.sm, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  text: { color: colors.onPurple, fontWeight: '900' },
  textLarge: { fontSize: 13 },
  textMedium: { fontSize: 10 },
});
