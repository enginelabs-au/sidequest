import { radius, shadows, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export type MapFilterId = 'trending' | 'quiet' | 'friends' | 'nearby';

const FILTERS: { id: MapFilterId; label: string }[] = [
  { id: 'trending', label: 'Trending' },
  { id: 'quiet', label: 'Quiet' },
  { id: 'friends', label: 'Friends' },
  { id: 'nearby', label: 'Nearby' },
];

type Props = {
  active: MapFilterId;
  onChange: (id: MapFilterId) => void;
  style?: object;
  variant?: 'sheet' | 'inline';
};

export function MapFilterSheet({ active, onChange, style, variant = 'inline' }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        sheet: {
          backgroundColor: colors.mapSheet,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
          ...shadows.card,
        },
        inlineWrap: {
          overflow: 'visible',
        },
        inlineBubble: {
          backgroundColor: colors.card,
          borderRadius: radius.full,
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.xs,
          ...shadows.soft,
          overflow: 'visible',
        },
        clearHint: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '600',
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.sm,
        },
        chips: {
          paddingHorizontal: spacing.md,
          gap: spacing.sm,
          paddingBottom: spacing.xs,
          alignItems: 'center',
        },
        chipsInline: {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          paddingRight: spacing.md,
          flexGrow: 0,
        },
        chip: {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          borderRadius: radius.full,
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.borderLight,
        },
        chipSelected: {
          backgroundColor: colors.brand,
          borderColor: colors.brand,
        },
        chipText: {
          color: colors.textSecondary,
          fontSize: 13,
          fontWeight: '700',
        },
        chipTextSelected: {
          color: colors.onPurple,
        },
      }),
    [colors],
  );

  const chips = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.chips,
        variant === 'inline' ? styles.chipsInline : null,
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {FILTERS.map((f) => {
        const selected = active === f.id;
        return (
          <Pressable
            key={f.id}
            onPress={() => onChange(f.id)}
            style={[styles.chip, selected && styles.chipSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{f.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  if (variant === 'inline') {
    return (
      <View style={[styles.inlineWrap, style]} pointerEvents="box-none">
        <View style={styles.inlineBubble}>{chips}</View>
      </View>
    );
  }

  return (
    <View style={[styles.sheet, style]} pointerEvents="box-none">
      <Text style={styles.clearHint}>Tap a venue pin or card to open its profile</Text>
      {chips}
    </View>
  );
}
