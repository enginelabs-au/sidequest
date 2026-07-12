import type { AppColors } from '@/constants/theme';
import { modePalette, type ModePalette } from '@/lib/semanticColors';
import type { IntentMode } from '@/types/database';

const MODE_DARK_SHADE: Record<IntentMode, string> = {
  friends: '#2A0D43',
  networking: '#1D4ED8',
  dating: '#BE185D',
};

const MODE_LIGHT_SHADE: Record<IntentMode, string> = {
  friends: '#6B2D9E',
  networking: '#3B82F6',
  dating: '#F472B6',
};

const MODE_MUTED_DARK: Record<IntentMode, string> = {
  friends: '#1F1630',
  networking: '#141F33',
  dating: '#2A1520',
};

const MODE_MUTED_LIGHT: Record<IntentMode, string> = {
  friends: '#EDE9F5',
  networking: '#DBEAFE',
  dating: '#FCE7F3',
};

const MODE_NOTICE_DARK: Record<IntentMode, string> = {
  friends: '#241C33',
  networking: '#1A2238',
  dating: '#2A1828',
};

const MODE_NOTICE_LIGHT: Record<IntentMode, string> = {
  friends: '#EDE9F5',
  networking: '#E8F0FE',
  dating: '#FCE7F3',
};

const MODE_INBOX_MESSAGE_DARK: Record<IntentMode, string> = {
  friends: '#D4C4F0',
  networking: '#93C5FD',
  dating: '#F9A8D4',
};

/** Apply the active Open To mode as the app-wide primary (not only tab bar). */
export function applyModePrimaryColors(
  base: AppColors,
  mode: IntentMode,
  isDark: boolean,
): AppColors {
  const palette: ModePalette = modePalette(mode);
  const muted = isDark ? MODE_MUTED_DARK[mode] : MODE_MUTED_LIGHT[mode];

  return {
    ...base,
    accent: palette.accent,
    brand: palette.accent,
    purple: palette.accent,
    purpleDark: MODE_DARK_SHADE[mode],
    purpleLight: MODE_LIGHT_SHADE[mode],
    accentDark: MODE_DARK_SHADE[mode],
    tabBar: palette.accent,
    bubbleOutgoing: palette.accent,
    accentMuted: muted,
    purpleMuted: muted,
    notice: isDark ? MODE_NOTICE_DARK[mode] : MODE_NOTICE_LIGHT[mode],
    inboxMessage: isDark ? MODE_INBOX_MESSAGE_DARK[mode] : palette.accent,
  };
}

/** Native stack header tinted with the active Open To mode primary. */
export function modeStackHeaderOptions(
  colors: Pick<AppColors, 'accent' | 'accentOnButton'>,
  title: string,
  backTitle = 'Back',
) {
  return {
    title,
    headerShown: true as const,
    headerStyle: { backgroundColor: colors.accent },
    headerTintColor: colors.accentOnButton,
    headerTitleStyle: { fontWeight: '700' as const, color: colors.accentOnButton },
    headerShadowVisible: false,
    headerBackTitle: backTitle,
  };
}
