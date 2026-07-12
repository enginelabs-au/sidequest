import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props<T extends string> = {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Partial<Record<T, string>>;
  /** Fit all pills in one row without horizontal scroll. */
  fit?: boolean;
};

export function FilterPills<T extends string>({ options, value, onChange, labels, fit }: Props<T>) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          backgroundColor: colors.card,
          borderRadius: radius.full,
          padding: spacing.xs,
          marginBottom: spacing.md,
          ...{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.12,
            shadowRadius: 4,
          },
        },
        row: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.xs },
        rowFit: { justifyContent: 'space-between' },
        pill: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.full,
          minWidth: 72,
          alignItems: 'center',
        },
        pillFit: {
          flex: 1,
          minWidth: 0,
          paddingHorizontal: spacing.xs,
          paddingVertical: spacing.sm,
        },
        pillActive: {
          backgroundColor: colors.brand,
        },
        pillText: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '600',
        },
        pillTextFit: {
          fontSize: 11,
          textAlign: 'center',
        },
        pillTextActive: {
          color: colors.onPurple,
          fontWeight: '700',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <View style={[styles.row, fit && styles.rowFit]}>
        {options.map((opt) => {
          const active = value === opt;
          const label = labels?.[opt] ?? opt;
          return (
            <Pressable
              key={opt}
              style={[styles.pill, fit && styles.pillFit, active && styles.pillActive]}
              onPress={() => onChange(opt)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={String(label)}
            >
              <Text
                style={[styles.pillText, fit && styles.pillTextFit, active && styles.pillTextActive]}
                numberOfLines={1}
                adjustsFontSizeToFit={fit}
                minimumFontScale={0.75}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
