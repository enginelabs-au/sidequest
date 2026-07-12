import { AppIcon, type AppIconName } from '@/components/AppIcon';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onSettings?: () => void;
  onMenu?: () => void;
  onAction?: () => void;
  actionIcon?: AppIconName;
  variant?: 'default' | 'map' | 'primary';
  style?: object;
};

export function AppHeader({
  title,
  subtitle,
  onBack,
  onSettings,
  onMenu,
  onAction,
  actionIcon = 'edit',
  variant = 'default',
  style,
}: Props) {
  const { colors } = useTheme();
  const isMapTitle = variant === 'map';
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { marginBottom: spacing.md },
        wrapPrimary: {
          backgroundColor: colors.accent,
          borderRadius: radius.lg,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.xs,
        },
        bar: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
        },
        titleBlock: { flex: 1, alignItems: 'center' },
        title: {
          color: colors.accentOnButton,
          fontSize: 17,
          fontWeight: '800',
          letterSpacing: 0.3,
          textAlign: 'center',
        },
        titleMap: {
          fontSize: 18,
          letterSpacing: 0.5,
          textTransform: 'none',
        },
        subtitle: {
          color: colors.accentOnButton,
          opacity: 0.9,
          fontSize: 12,
          marginTop: 2,
          textAlign: 'center',
        },
        iconBtn: {
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 22,
          backgroundColor: 'transparent',
        },
        iconSpacer: { width: 44 },
      }),
    [colors],
  );

  const iconColor = colors.accentOnButton;

  const leftPress = onBack ?? onMenu;
  const leftIcon: AppIconName | null = onBack ? 'back' : onMenu ? 'menu' : null;
  const rightPress = onSettings ?? onAction;
  const rightIcon: AppIconName | null = onSettings ? 'settings' : onAction ? actionIcon : null;

  return (
    <View style={[styles.wrap, styles.wrapPrimary, style]}>
      <View style={styles.bar}>
        {leftPress && leftIcon ? (
          <Pressable
            onPress={leftPress}
            style={styles.iconBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={onBack ? 'Go back' : 'Open menu'}
          >
            <AppIcon name={leftIcon} size={18} color={iconColor} />
          </Pressable>
        ) : (
          <View style={styles.iconSpacer} />
        )}
        <View style={styles.titleBlock}>
          <Text style={[styles.title, isMapTitle && styles.titleMap]}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightPress && rightIcon ? (
          <Pressable
            onPress={rightPress}
            style={styles.iconBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={onSettings ? 'Open settings' : 'Header action'}
          >
            <AppIcon name={rightIcon} size={18} color={iconColor} />
          </Pressable>
        ) : (
          <View style={styles.iconSpacer} />
        )}
      </View>
    </View>
  );
}
