import { Card } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { modePalette } from '@/lib/semanticColors';
import type { IntentMode } from '@/types/database';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const MODE_META: Record<
  IntentMode,
  { icon: string; title: string; subtitle: string }
> = {
  friends: { icon: '🔥', title: 'Friends', subtitle: 'Interests, music, hobbies, fun facts' },
  networking: { icon: '🔗', title: 'Networking', subtitle: 'Role, industry, skills' },
  dating: { icon: '♥', title: 'Dating', subtitle: 'Aesthetic & chemistry' },
};

type Props = {
  mode: IntentMode;
  selected: boolean;
  onPress: () => void;
  layout?: 'horizontal' | 'vertical';
};

export function ModeCard({ mode, selected, onPress, layout = 'horizontal' }: Props) {
  const meta = MODE_META[mode];
  const vertical = layout === 'vertical';
  const palette = modePalette(mode);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${meta.title} mode`}
      accessibilityState={{ selected }}
      style={vertical ? styles.pressVertical : undefined}
    >
      <Card
        style={[
          vertical ? styles.cardVertical : styles.cardHorizontal,
          selected && {
            borderColor: palette.accent,
            backgroundColor: palette.background,
          },
        ]}
        padded
      >
        <View style={vertical ? styles.verticalInner : styles.horizontalInner}>
          <Text style={[styles.icon, vertical && styles.iconVertical]}>{meta.icon}</Text>
          <View style={vertical ? styles.verticalCopy : undefined}>
            <Text style={[styles.title, selected && { color: palette.accent }]}>{meta.title}</Text>
            <Text style={styles.subtitle}>{meta.subtitle}</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressVertical: { width: '100%' },
  cardHorizontal: {
    width: 118,
    alignItems: 'center',
    marginBottom: 0,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardVertical: {
    width: '100%',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  horizontalInner: { alignItems: 'center' },
  verticalInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  verticalCopy: { flex: 1 },
  icon: { fontSize: 28 },
  iconVertical: { fontSize: 32 },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
});
