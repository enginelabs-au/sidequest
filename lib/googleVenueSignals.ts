/** Google Places public signals — no user PII, venue coordinates only. */

export type GoogleActivityLevel = 'closed' | 'quiet' | 'moderate' | 'popular' | 'very_popular';

export type GoogleVenueSignal = {
  placeId: string;
  openNow: boolean | null;
  businessStatus: string | null;
  userRatingCount: number | null;
  rating: number | null;
  priceLevel: string | null;
  activityLevel: GoogleActivityLevel;
  activityLabel: string;
};

export function deriveGoogleActivity(signal: {
  openNow?: boolean | null;
  userRatingCount?: number | null;
}): { level: GoogleActivityLevel; label: string } {
  if (signal.openNow === false) {
    return { level: 'closed', label: 'Closed on Google' };
  }

  const reviews = signal.userRatingCount ?? 0;
  if (reviews >= 3000) return { level: 'very_popular', label: 'Very popular' };
  if (reviews >= 1000) return { level: 'popular', label: 'Popular' };
  if (reviews >= 300) return { level: 'moderate', label: 'Moderate' };
  return { level: 'quiet', label: 'Quieter' };
}

export function googleActivityColor(level: GoogleActivityLevel): string {
  switch (level) {
    case 'very_popular':
      return '#E53E3E';
    case 'popular':
      return '#ED8936';
    case 'moderate':
      return '#D69E2E';
    case 'quiet':
      return '#38A169';
    default:
      return '#718096';
  }
}
