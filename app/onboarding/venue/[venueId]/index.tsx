import { AppHeader } from '@/components/AppHeader';
import { VibeMeter } from '@/components/VibeMeter';
import { Button, Card, ErrorBanner, LoadingState, ScreenSubtitle, ScreenTitle, TagRow } from '@/components/ui';
import { isDevTestVenue, isDevTestVenueCheckInEnabled } from '@/constants/devVenues';
import { SELECTED_MODE_KEY, SELECTED_VENUE_KEY } from '@/constants/storage';
import { colors, radius, shadows, spacing, VENUE_MAX_DISTANCE_KM } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleVenueSignals } from '@/hooks/useGoogleVenueSignals';
import { useLocation } from '@/hooks/useLocation';
import { canCheckInAtVenue, formatDistanceKm } from '@/lib/geo';
import { getHeatTier, tierLabel } from '@/lib/mapHeat';
import { mapHomeRoute, venueRoomRoute } from '@/lib/venueNavigation';
import { countVenuePresence, presenceInMyModeLabel } from '@/lib/venuePresence';
import { realDistanceToVenueKm } from '@/lib/venueRadar';
import { fetchVenueById } from '@/lib/venues';
import type { IntentMode, Venue } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TIER_COLORS: Record<string, string> = {
  cool: colors.purpleLight,
  warm: colors.coral,
  hot: '#EA580C',
  fire: colors.danger,
};

const VENUE_VIBE_TAGS: Record<string, string[]> = {
  'The Ivy': ['Rooftop bar', 'Live music', 'Trending', 'Sydney CBD'],
  'Oxford Art Factory': ['Live music', 'Arts', 'Nightlife'],
  'The Beresford': ['Pub', 'Dining', 'Surry Hills'],
};

export default function VenueProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { checkIn, user } = useAuth();
  const { venueId, mode: modeParam } = useLocalSearchParams<{
    venueId: string;
    mode?: string;
    count?: string;
    totalCount?: string;
    sameModeOnly?: string;
  }>();
  const { coords, loading: locLoading, error: locError, permissionGranted } = useLocation();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [viewerMode, setViewerMode] = useState<IntentMode>('friends');
  const [inMyModeCount, setInMyModeCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const tier = getHeatTier(inMyModeCount);
  const ivyDevCheckIn = !!(venue && isDevTestVenueCheckInEnabled() && isDevTestVenue(venue));

  const refreshPresence = useCallback(
    async (venueData: Venue, mode: IntentMode) => {
      const selfName =
        (user?.user_metadata?.full_name as string | undefined) ??
        (user?.user_metadata?.name as string | undefined) ??
        null;
      const presence = await countVenuePresence(venueData, mode, {
        selfCheckIn: checkIn?.venue_id === venueData.id ? checkIn : null,
        selfDisplayName: selfName,
      });
      setInMyModeCount(presence.inMyMode);
      setTotalCount(presence.total);
    },
    [checkIn, user],
  );

  useEffect(() => {
    if (!venueId) {
      router.replace('/onboarding/venue');
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const v = await fetchVenueById(venueId);
        if (!v) {
          setError('Venue not found');
          return;
        }
        setVenue(v);

        let mode: IntentMode = 'friends';
        if (checkIn?.venue_id === v.id && checkIn.mode) {
          mode = checkIn.mode;
        } else if (modeParam === 'friends' || modeParam === 'dating' || modeParam === 'networking') {
          mode = modeParam;
        } else if (checkIn?.mode) {
          mode = checkIn.mode;
        } else {
          const stored = await AsyncStorage.getItem(SELECTED_MODE_KEY);
          if (stored === 'friends' || stored === 'dating' || stored === 'networking') {
            mode = stored;
          }
        }
        setViewerMode(mode);
        await refreshPresence(v, mode);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load venue');
      } finally {
        setLoading(false);
      }
    })();
  }, [venueId, router, modeParam, checkIn?.mode, refreshPresence]);

  const distanceKm = venue ? realDistanceToVenueKm(coords, venue) : null;
  const googleSignals = useGoogleVenueSignals(venue ? [venue] : []);
  const googleSignal = venue ? googleSignals[venue.id] : undefined;
  const withinRange = !!(venue && canCheckInAtVenue(coords, venue));
  const canCheckIn = withinRange && (ivyDevCheckIn || !!coords);
  const vibeTags = venue ? (VENUE_VIBE_TAGS[venue.name] ?? ['Social', 'Nightlife']) : [];

  const checkedInHere = checkIn?.venue_id === venue?.id;
  const presenceLabel = presenceInMyModeLabel(inMyModeCount, totalCount, viewerMode, {
    checkedInAtVenue: checkedInHere,
  });

  const proceedToCheckIn = async () => {
    if (!venue) return;
    setDistanceError(null);

    if (!ivyDevCheckIn && !coords) {
      setDistanceError('Enable location to verify you are at the venue.');
      return;
    }
    if (!withinRange) {
      setDistanceError(`You must be within ${VENUE_MAX_DISTANCE_KM}km of this venue to check in.`);
      return;
    }

    await AsyncStorage.setItem(SELECTED_VENUE_KEY, venue.id);
    await AsyncStorage.setItem(SELECTED_MODE_KEY, viewerMode);
    router.push({ pathname: '/onboarding/mode', params: { venueId: venue.id } });
  };

  const openLocationSettings = () => {
    Linking.openSettings().catch(() => {
      setDistanceError('Could not open settings. Enable location in your device settings.');
    });
  };

  if (loading || locLoading) {
    return <LoadingState message="Loading venue…" />;
  }

  if (!venue) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader title="Venue" onBack={() => router.back()} />
        <ErrorBanner message={error ?? 'Venue not found'} />
        <Button title="Back to map" onPress={() => router.replace(mapHomeRoute(!!checkIn))} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Venue" onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.heroImage}>
          <Text style={styles.heroEmoji}>🏙️</Text>
          <View style={[styles.heatBadge, { backgroundColor: `${TIER_COLORS[tier]}33` }]}>
            <Text style={[styles.heatBadgeText, { color: TIER_COLORS[tier] }]}>{tierLabel(tier)}</Text>
          </View>
        </View>

        <View style={styles.whosHereBlock}>
          <View style={styles.whosHereCopy}>
            <Text style={styles.whosHereTitle}>Who&apos;s Here</Text>
            <Text style={styles.whosHereMeta}>{presenceLabel}</Text>
          </View>
          <Button
            title={`View Room (${inMyModeCount})`}
            variant="outline"
            onPress={() =>
              router.push(
                venueRoomRoute(!!checkIn, { venueId: venue.id, mode: viewerMode }),
              )
            }
          />
        </View>

        <Card style={styles.hero}>
          <ScreenTitle>{venue.name}</ScreenTitle>
          <ScreenSubtitle>
            {ivyDevCheckIn && distanceKm !== null && distanceKm > VENUE_MAX_DISTANCE_KM
              ? 'Sydney test venue · check in anywhere in dev'
              : distanceKm !== null
                ? `${formatDistanceKm(distanceKm)} away`
                : 'Distance unknown'}
            {withinRange ? ' · In range' : coords ? ' · Out of range' : ''}
          </ScreenSubtitle>
          <Text style={styles.desc}>A popular spot on the Side Quest radar.</Text>
          <VibeMeter count={inMyModeCount} />
          {googleSignal ? (
            <Text style={styles.googleMeta}>
              Google · {googleSignal.activityLabel}
              {googleSignal.openNow === true ? ' · Open now' : ''}
            </Text>
          ) : null}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Venue Vibe Tags</Text>
          <TagRow tags={vibeTags} />
        </Card>

        {locError ? <ErrorBanner message={locError} /> : null}
        {error ? <ErrorBanner message={error} /> : null}
        {distanceError ? <ErrorBanner message={distanceError} /> : null}

        {!permissionGranted && locError && !ivyDevCheckIn ? (
          <Button title="Open location settings" variant="ghost" onPress={openLocationSettings} />
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title="Check In"
          onPress={proceedToCheckIn}
          disabled={!canCheckIn}
          accessibilityLabel="Check in at this venue"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  scroll: { flex: 1 },
  scrollContent: { gap: spacing.md, paddingTop: spacing.sm },
  heroImage: {
    height: 180,
    borderRadius: radius.lg,
    backgroundColor: colors.purpleMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroEmoji: { fontSize: 56 },
  whosHereBlock: {
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.soft,
  },
  whosHereCopy: { gap: spacing.xs },
  whosHereTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  whosHereMeta: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  heatBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  heatBadgeText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  hero: { gap: spacing.sm },
  desc: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  googleMeta: { color: colors.purple, fontSize: 13, fontWeight: '700' },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
