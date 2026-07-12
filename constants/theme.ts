import { Platform } from 'react-native';

/** Native app icon purple — canonical primary (see design/ui + scripts/generate-app-icons.py) */
export const BRAND_PRIMARY = '#371259';

export type ColorScheme = 'dark' | 'light';

export type AppColors = {
  background: string;
  card: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  brand: string;
  purple: string;
  purpleDark: string;
  purpleLight: string;
  purpleMuted: string;
  accent: string;
  accentMuted: string;
  accentDark: string;
  accentOnButton: string;
  accentOnSegment: string;
  coral: string;
  coralDark: string;
  danger: string;
  dangerDark: string;
  success: string;
  warning: string;
  notice: string;
  bubbleIncoming: string;
  bubbleOutgoing: string;
  bubbleOutgoingText: string;
  friends: string;
  dating: string;
  networking: string;
  overlay: string;
  mapSheet: string;
  onPurple: string;
  tabBar: string;
  tabBarInactive: string;
  swipeDelete: string;
  swipeArchive: string;
  swipeReport: string;
  waveReady: string;
  waveReadyShadow: string;
  wavePending: string;
  wavePendingShadow: string;
  waveCancel: string;
  waveCancelShadow: string;
  alertWave: string;
  alertRequest: string;
  alertCheckin: string;
  alertReply: string;
  venueActive: string;
  venueActiveBg: string;
  venueActiveBorder: string;
  venuePast: string;
  venuePastBg: string;
  venuePastBorder: string;
  inboxRequest: string;
  inboxMessage: string;
  iconMuted: string;
  iconOnPurple: string;
  iconOnPurpleActive: string;
  errorBannerBg: string;
  errorBannerBorder: string;
  inboxRequestBg: string;
  inboxRowRequestBg: string;
};

const SEMANTIC: Omit<
  AppColors,
  | 'background'
  | 'card'
  | 'surface'
  | 'surfaceElevated'
  | 'border'
  | 'borderLight'
  | 'text'
  | 'textSecondary'
  | 'textMuted'
  | 'purpleMuted'
  | 'accentMuted'
  | 'notice'
  | 'bubbleIncoming'
  | 'mapSheet'
  | 'overlay'
  | 'iconMuted'
  | 'errorBannerBg'
  | 'errorBannerBorder'
  | 'inboxRequestBg'
  | 'inboxRowRequestBg'
> = {
  brand: BRAND_PRIMARY,
  purple: BRAND_PRIMARY,
  purpleDark: '#2A0D43',
  purpleLight: '#4E1A7A',
  accent: BRAND_PRIMARY,
  accentDark: '#2A0D43',
  accentOnButton: '#FFFFFF',
  accentOnSegment: '#FFFFFF',
  coral: '#F97316',
  coralDark: '#EA580C',
  danger: '#E53E3E',
  dangerDark: '#C53030',
  success: '#38A169',
  warning: '#D69E2E',
  bubbleOutgoing: BRAND_PRIMARY,
  bubbleOutgoingText: '#FFFFFF',
  friends: '#4E1A7A',
  dating: '#EC4899',
  networking: '#2563EB',
  onPurple: '#FFFFFF',
  tabBar: BRAND_PRIMARY,
  tabBarInactive: 'rgba(255, 255, 255, 0.55)',
  swipeDelete: '#E53E3E',
  swipeArchive: '#3182CE',
  swipeReport: '#D69E2E',
  waveReady: '#38A169',
  waveReadyShadow: '#2F855A',
  wavePending: '#D69E2E',
  wavePendingShadow: '#B7791F',
  waveCancel: '#E53E3E',
  waveCancelShadow: '#C53030',
  alertWave: '#7C3AED',
  alertRequest: '#EC4899',
  alertCheckin: '#38A169',
  alertReply: '#3182CE',
  venueActive: '#38A169',
  venueActiveBg: '#D1FAE5',
  venueActiveBorder: '#6EE7B7',
  venuePast: '#6B5B7B',
  venuePastBg: '#EDE9F5',
  venuePastBorder: '#C4B5D8',
  inboxRequest: '#EC4899',
  inboxMessage: '#4E1A7A',
  iconOnPurple: 'rgba(255, 255, 255, 0.72)',
  iconOnPurpleActive: 'rgba(255, 255, 255, 0.95)',
};

export const lightColors: AppColors = {
  ...SEMANTIC,
  background: '#F3F0FA',
  card: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E4DFF0',
  borderLight: '#EDE9F5',
  text: '#1A1028',
  textSecondary: '#3D2E5C',
  textMuted: '#6B5B7B',
  purpleMuted: '#E8DFF5',
  accentMuted: '#E8DFF5',
  notice: '#EDE9F5',
  bubbleIncoming: '#EDE9F5',
  mapSheet: '#FAF8FF',
  overlay: 'rgba(55, 18, 89, 0.55)',
  iconMuted: 'rgba(107, 91, 123, 0.55)',
  errorBannerBg: '#FFF5F5',
  errorBannerBorder: '#FEB2B2',
  inboxRequestBg: '#FCE7F3',
  inboxRowRequestBg: '#FFF5FA',
};

export const darkColors: AppColors = {
  ...SEMANTIC,
  background: '#0C0812',
  card: '#171220',
  surface: '#171220',
  surfaceElevated: '#1F1829',
  border: '#2E2640',
  borderLight: '#241C33',
  text: '#FFFFFF',
  textSecondary: '#E8E4F0',
  textMuted: '#A89BBF',
  purpleMuted: '#2A1F3D',
  accentMuted: '#2A1F3D',
  notice: '#241C33',
  bubbleIncoming: '#2A1F3D',
  mapSheet: '#14101C',
  overlay: 'rgba(0, 0, 0, 0.65)',
  iconMuted: 'rgba(232, 228, 240, 0.65)',
  accentDark: '#FFFFFF',
  purpleLight: '#E8DFF5',
  inboxMessage: '#D4C4F0',
  inboxRequest: '#F9A8D4',
  venueActiveBg: '#0F2A1F',
  venueActiveBorder: '#1F4D35',
  venuePastBg: '#1F1829',
  venuePastBorder: '#3D3255',
  errorBannerBg: '#2A1518',
  errorBannerBorder: '#5C2028',
  inboxRequestBg: '#2A1528',
  inboxRowRequestBg: '#1F1829',
};

/** Default export for legacy imports — updated by ThemeProvider. */
export const colors: AppColors = { ...darkColors };

export function paletteForScheme(scheme: ColorScheme): AppColors {
  return scheme === 'dark' ? darkColors : lightColors;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 28,
  full: 999,
};

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
    default: {},
  }),
  soft: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
    default: {},
  }),
};

export const typography = {
  capsLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
};

export const CHECK_IN_DURATION_HOURS = 4;
export const VENUE_MAX_DISTANCE_KM = 1;
