import { radius, spacing } from '@/constants/theme';
import { MODE_DISPLAY_LABEL } from '@/lib/peerMode';
import { modePalette } from '@/lib/semanticColors';
import type { IntentMode } from '@/types/database';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  mode: IntentMode;
  size?: 'large' | 'medium';
};

export function ModePhotoTag({ mode, size = 'large' }: Props) {
  const large = size === 'large';
  const palette = modePalette(mode);

  return (
    <View
      style={[
        styles.tag,
        large ? styles.tagLarge : styles.tagMedium,
        { backgroundColor: palette.accent, borderColor: palette.onAccent },
      ]}
      pointerEvents="none"
    >
      <Text
        style={[
          styles.tagText,
          large ? styles.tagTextLarge : styles.tagTextMedium,
          { color: palette.onAccent },
        ]}
      >
        {MODE_DISPLAY_LABEL[mode].toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: radius.full,
    borderWidth: 2,
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
  },
  tagLarge: {
    bottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minWidth: 140,
    alignItems: 'center',
  },
  tagMedium: {
    bottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    minWidth: 96,
    alignItems: 'center',
  },
  tagText: {
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  tagTextLarge: { fontSize: 15 },
  tagTextMedium: { fontSize: 11 },
});
