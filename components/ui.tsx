import { radius, shadows, spacing, typography, type AppColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { forwardRef, useMemo } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    type StyleProp,
    type TextInputProps,
    type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function useUiStyles() {
  const { colors } = useTheme();
  return useMemo(() => createUiStyles(colors), [colors]);
}

function createUiStyles(colors: AppColors) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  screenScroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  screenTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  screenSubtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.capsLabel,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardPadded: {
    padding: spacing.lg,
  },
  buttonBase: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button_primary: { backgroundColor: colors.accent },
  button_secondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button_danger: { backgroundColor: colors.danger },
  button_ghost: { backgroundColor: 'transparent' },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  buttonText: { fontWeight: '700', fontSize: 15 },
  buttonText_primary: { color: colors.accentOnButton },
  buttonText_secondary: { color: colors.text },
  buttonText_danger: { color: colors.accentOnButton },
  buttonText_ghost: { color: colors.textMuted },
  buttonText_outline: { color: colors.text },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.88 },
  errorBanner: {
    backgroundColor: colors.errorBannerBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.errorBannerBorder,
  },
  errorText: { color: colors.dangerDark, fontSize: 14, lineHeight: 20 },
  noticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.notice,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  noticeIcon: { fontSize: 16 },
  noticeText: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  loadingSpinner: { marginBottom: spacing.md },
  loadingText: { color: colors.textMuted, fontSize: 16, textAlign: 'center' },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.borderLight,
    borderRadius: radius.md,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  segmentActive: {
    backgroundColor: colors.accent,
    ...shadows.soft,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  segmentTextActive: {
    color: colors.accentOnSegment,
  },
  tag: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
  tagText: {
    color: colors.accentOnButton,
    fontSize: 13,
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    padding: spacing.md,
    fontSize: 16,
  },
  fieldBlock: { marginBottom: spacing.md },
  fieldLabel: {
    ...typography.capsLabel,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  requiredMark: { color: colors.danger, fontWeight: '800' },
  fieldHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: spacing.xs,
  },
  underlineInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: spacing.sm,
    backgroundColor: 'transparent',
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  toggleCopy: { flex: 1 },
  toggleLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleSublabel: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  toggleTrack: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.border,
    padding: 3,
    justifyContent: 'center',
  },
  toggleTrackOn: { backgroundColor: colors.accent },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.card,
    ...shadows.soft,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  timerWrap: { alignItems: 'flex-end' },
  timerValue: {
    color: colors.accentDark,
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  });
}

type ButtonProps = {
  title: string;
  onPress?: () => void;
  onDisabledPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export function Button({
  title,
  onPress,
  onDisabledPress,
  variant = 'primary',
  disabled,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const styles = useUiStyles();
  const blocked = disabled && !onDisabledPress;

  return (
    <Pressable
      onPress={blocked ? undefined : disabled ? onDisabledPress : onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.buttonBase,
        styles[`button_${variant}`],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.buttonText, styles[`buttonText_${variant}`]]}>{title}</Text>
    </Pressable>
  );
}

export function Screen({
  children,
  scroll,
  safeTop = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  /** Apply top safe-area inset (disable when parent already pads for notch). */
  safeTop?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const styles = useUiStyles();
  const topPad = safeTop ? insets.top : 0;

  if (scroll) {
    return (
      <ScrollView
        style={styles.screenScroll}
        contentContainerStyle={[styles.screenContent, { paddingTop: spacing.lg + topPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.screen, safeTop && { paddingTop: spacing.lg + topPad }]}>{children}</View>;
}

export function Card({
  children,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const styles = useUiStyles();
  return (
    <View style={[styles.card, padded && styles.cardPadded, style]}>
      {children}
    </View>
  );
}

export function ScreenTitle({ children }: { children: React.ReactNode }) {
  const styles = useUiStyles();
  return <Text style={styles.screenTitle}>{children}</Text>;
}

export function ScreenSubtitle({ children }: { children: React.ReactNode }) {
  const styles = useUiStyles();
  return <Text style={styles.screenSubtitle}>{children}</Text>;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  const styles = useUiStyles();
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function ErrorBanner({ message }: { message: string }) {
  const styles = useUiStyles();
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export function NoticeBar({ message, icon }: { message: string; icon?: string }) {
  const styles = useUiStyles();
  return (
    <View style={styles.noticeBar}>
      <Text style={styles.noticeIcon}>{icon ?? '⏱'}</Text>
      <Text style={styles.noticeText}>{message}</Text>
    </View>
  );
}

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  const { colors } = useTheme();
  const styles = useUiStyles();
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.accentDark} style={styles.loadingSpinner} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Partial<Record<T, string>>;
}) {
  const styles = useUiStyles();
  return (
    <View style={styles.segmented}>
      {options.map((opt) => {
        const active = value === opt;
        const label = labels?.[opt] ?? opt;
        return (
          <Pressable
            key={opt}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onChange(opt)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={String(label)}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {String(label).toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Tag({ label }: { label: string }) {
  const styles = useUiStyles();
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

export function TagRow({ tags }: { tags: string[] }) {
  const styles = useUiStyles();
  if (!tags.length) return null;
  return (
    <View style={styles.tagRow}>
      {tags.map((t) => (
        <Tag key={t} label={t} />
      ))}
    </View>
  );
}

export const AppTextInput = forwardRef<TextInput, TextInputProps>(function AppTextInput(
  { style, ...props },
  ref,
) {
  const { colors } = useTheme();
  const styles = useUiStyles();
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={colors.textMuted}
      style={[styles.input, style]}
      {...props}
    />
  );
});

export function ToggleRow({
  label,
  sublabel,
  value,
  onValueChange,
}: {
  label: string;
  sublabel?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  const styles = useUiStyles();
  return (
    <Pressable
      style={styles.toggleRow}
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
    >
      <View style={styles.toggleCopy}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {sublabel ? <Text style={styles.toggleSublabel}>{sublabel}</Text> : null}
      </View>
      <View style={[styles.toggleTrack, value && styles.toggleTrackOn]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
      </View>
    </Pressable>
  );
}

export function SessionTimerDisplay({ formatted }: { formatted: string }) {
  const styles = useUiStyles();
  return (
    <View style={styles.timerWrap}>
      <Text style={styles.timerValue}>{formatted}</Text>
      <Text style={styles.timerLabel}>minutes:seconds</Text>
    </View>
  );
}

export function UnderlineField({
  label,
  value,
  onChangeText,
  multiline,
  placeholder,
  required,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  required?: boolean;
  hint?: string;
}) {
  const styles = useUiStyles();
  return (
    <View style={styles.fieldBlock}>
      <FieldLabel label={label} required={required} />
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      <AppTextInput
        style={[styles.underlineInput, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        placeholder={placeholder}
      />
    </View>
  );
}

export function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  const styles = useUiStyles();
  return (
    <Text style={styles.fieldLabel}>
      {label}
      {required ? <Text style={styles.requiredMark}> *</Text> : null}
    </Text>
  );
}

