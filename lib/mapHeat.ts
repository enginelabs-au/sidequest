/** Snapchat-style hotzone tiers from check-in density. */

export type HeatTier = 'cool' | 'warm' | 'hot' | 'fire';

export type HeatLayer = {
  radius: number;
  fillColor: string;
};

export function getHeatTier(count: number): HeatTier {
  if (count >= 20) return 'fire';
  if (count >= 10) return 'hot';
  if (count >= 5) return 'warm';
  return 'cool';
}

const TIER_COLORS: Record<HeatTier, string[]> = {
  cool: ['rgba(91, 33, 182, 0.12)', 'rgba(124, 58, 237, 0.2)', 'rgba(124, 58, 237, 0.32)'],
  warm: ['rgba(124, 58, 237, 0.14)', 'rgba(249, 115, 22, 0.24)', 'rgba(249, 115, 22, 0.36)'],
  hot: ['rgba(249, 115, 22, 0.18)', 'rgba(234, 88, 12, 0.28)', 'rgba(234, 88, 12, 0.4)'],
  fire: ['rgba(234, 88, 12, 0.22)', 'rgba(225, 29, 72, 0.32)', 'rgba(190, 24, 93, 0.44)'],
};

const TIER_RADII = [150, 95, 52];

export function buildHeatLayers(count: number): HeatLayer[] {
  const tier = getHeatTier(count);
  const colors = TIER_COLORS[tier];
  const boost = Math.min(count, 30) * 4;

  return TIER_RADII.map((base, i) => ({
    radius: base + boost * (i + 1) * 0.35,
    fillColor: colors[i] ?? colors[colors.length - 1],
  }));
}

export function tierLabel(tier: HeatTier): string {
  switch (tier) {
    case 'fire':
      return 'On fire';
    case 'hot':
      return 'Buzzing';
    case 'warm':
      return 'Warming up';
    default:
      return 'Chill';
  }
}
