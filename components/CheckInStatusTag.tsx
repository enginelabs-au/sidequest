import { colors, radius, spacing } from '@/constants/theme';
import { MODE_DISPLAY_LABEL } from '@/lib/peerMode';
import { modePalette } from '@/lib/semanticColors';
import type { ModePresenceCounts } from '@/lib/venuePresence';
import type { IntentMode } from '@/types/database';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

const MODES: IntentMode[] = ['friends', 'networking', 'dating'];

type Props = {
  checkedIn: boolean;
  mode?: IntentMode | null;
  modeCounts?: ModePresenceCounts;
  onModeChange?: (mode: IntentMode) => void | Promise<void>;
  changingMode?: boolean;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
};

export function CheckInStatusTag({
  checkedIn,
  mode,
  modeCounts,
  onModeChange,
  changingMode,
  menuOpen: menuOpenProp,
  onMenuOpenChange,
}: Props) {
  const currentMode = mode ?? 'friends';
  const palette = modePalette(currentMode);
  const canChange = !!onModeChange;

  const formatModeWithCount = (item: IntentMode) => {
    const label = MODE_DISPLAY_LABEL[item];
    if (modeCounts == null) return label;
    return `${label} (${modeCounts[item]})`;
  };

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = menuOpenProp !== undefined;
  const open = isControlled ? menuOpenProp : internalOpen;
  const setOpen = (next: boolean | ((v: boolean) => boolean)) => {
    const value = typeof next === 'function' ? next(open) : next;
    if (isControlled) {
      onMenuOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  };

  if (!checkedIn) {
    return (
      <View style={[styles.tag, styles.notCheckedIn]} accessibilityRole="text">
        <Text style={styles.notCheckedInText}>Not checked in — open Map to join a room</Text>
      </View>
    );
  }

  const selectMode = async (next: IntentMode) => {
    if (!onModeChange || next === currentMode || changingMode) {
      setOpen(false);
      return;
    }
    await onModeChange(next);
    setOpen(false);
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        style={[styles.tag, { backgroundColor: palette.accent }]}
        onPress={() => canChange && setOpen((v) => !v)}
        disabled={!canChange || changingMode}
        accessibilityRole="button"
        accessibilityLabel={`Checked in as ${formatModeWithCount(currentMode)}. Tap to change mode.`}
        accessibilityState={{ expanded: open }}
      >
        <Text style={[styles.checkedInPrefix, { color: palette.onAccent }]}>Checked in as</Text>
        <View style={[styles.modeChip, { backgroundColor: palette.chipBg }]}>
          {changingMode ? (
            <ActivityIndicator size="small" color={palette.onAccent} />
          ) : (
            <>
              <Text style={[styles.modeChipText, { color: palette.onAccent }]}>
                {formatModeWithCount(currentMode)}
              </Text>
              {canChange ? (
                <Text style={[styles.chevron, { color: palette.onAccent }]}>{open ? '▲' : '▼'}</Text>
              ) : null}
            </>
          )}
        </View>
      </Pressable>

      {open && canChange ? (
        <View style={styles.menu}>
          {MODES.map((item) => {
            const selected = item === currentMode;
            const rowPalette = modePalette(item);
            return (
              <Pressable
                key={item}
                style={[
                  styles.menuRow,
                  selected && {
                    backgroundColor: rowPalette.background,
                    borderLeftWidth: 3,
                    borderLeftColor: rowPalette.accent,
                  },
                ]}
                onPress={() => selectMode(item)}
                accessibilityRole="button"
                accessibilityLabel={`Switch to ${formatModeWithCount(item)}`}
                accessibilityState={{ selected }}
              >
                <View style={[styles.menuDot, { backgroundColor: rowPalette.accent }]} />
                <Text
                  style={[
                    styles.menuLabel,
                    selected && { color: rowPalette.accent, fontWeight: '900' },
                  ]}
                >
                  {MODE_DISPLAY_LABEL[item]}
                  {modeCounts != null ? (
                    <Text
                      style={[
                        styles.menuCount,
                        selected && { color: rowPalette.accent, fontWeight: '900' },
                      ]}
                    >
                      {' '}
                      ({modeCounts[item]})
                    </Text>
                  ) : null}
                </Text>
                {selected ? (
                  <Text style={[styles.menuCheck, { color: rowPalette.accent }]}>✓</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  tag: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  notCheckedIn: {
    backgroundColor: colors.coral,
  },
  checkedInPrefix: {
    fontSize: 14,
    fontWeight: '700',
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  modeChipText: {
    fontSize: 14,
    fontWeight: '900',
  },
  chevron: {
    fontSize: 11,
    fontWeight: '800',
  },
  notCheckedInText: {
    color: colors.onPurple,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  menu: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  menuDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  menuLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  menuCount: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '800',
  },
  menuCheck: {
    fontSize: 16,
    fontWeight: '900',
  },
});
