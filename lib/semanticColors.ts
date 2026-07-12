import { colors } from '@/constants/theme';
import type { ActivityItem } from '@/lib/socialMock';
import type { IntentMode } from '@/types/database';

export type ModePalette = {
  accent: string;
  background: string;
  border: string;
  onAccent: string;
  chipBg: string;
};

/** Canonical mode colours — use everywhere a mode is shown. */
export const MODE_PALETTE: Record<IntentMode, ModePalette> = {
  friends: {
    accent: colors.friends,
    background: '#EDE9F5',
    border: '#C4B5D8',
    onAccent: colors.onPurple,
    chipBg: 'rgba(255,255,255,0.28)',
  },
  dating: {
    accent: colors.dating,
    background: '#FCE7F3',
    border: '#F9A8D4',
    onAccent: colors.onPurple,
    chipBg: 'rgba(255,255,255,0.28)',
  },
  networking: {
    accent: colors.networking,
    background: '#DBEAFE',
    border: '#93C5FD',
    onAccent: colors.onPurple,
    chipBg: 'rgba(255,255,255,0.28)',
  },
};

export function modePalette(mode: IntentMode): ModePalette {
  return MODE_PALETTE[mode];
}

/** @deprecated Use MODE_PALETTE[mode].accent */
export const modeAccent: Record<IntentMode, string> = {
  friends: MODE_PALETTE.friends.accent,
  dating: MODE_PALETTE.dating.accent,
  networking: MODE_PALETTE.networking.accent,
};

const ACTIVITY_ACCENT: Record<ActivityItem['type'], string> = {
  wave: colors.alertWave,
  checkin: colors.alertCheckin,
  reply: colors.alertReply,
  request: colors.alertRequest,
};

const ACTIVITY_ACCENT_BG: Record<ActivityItem['type'], string> = {
  wave: '#EDE9F5',
  checkin: '#D1FAE5',
  reply: '#DBEAFE',
  request: '#FCE7F3',
};

export function activityAccentFor(type: ActivityItem['type']): string {
  return ACTIVITY_ACCENT[type];
}

export function activityAccentBgFor(type: ActivityItem['type']): string {
  return ACTIVITY_ACCENT_BG[type];
}

export const venueStatusColors = {
  active: {
    accent: colors.venueActive,
    background: colors.venueActiveBg,
    border: colors.venueActiveBorder,
    label: 'Active',
  },
  past: {
    accent: colors.venuePast,
    background: colors.venuePastBg,
    border: colors.venuePastBorder,
    label: 'Past',
  },
} as const;
