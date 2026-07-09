import { TooltipOverlay } from '@/components/TooltipOverlay';
import {
    Button,
    ErrorBanner,
    LoadingState,
    Screen,
    ScreenSubtitle,
    ScreenTitle,
} from '@/components/ui';
import { VENUE_MAX_DISTANCE_KM, colors, radius, spacing } from '@/constants/theme';
import { useLocation } from '@/hooks/useLocation';
import { useTooltipFlag } from '@/hooks/useTooltipFlag';
import { formatDistanceKm, haversineDistanceKm, isWithinVenueRange } from '@/lib/geo';
import { isSupabaseConfigured } from '@/lib/supabase';
import { loadVenuePickerData } from '@/lib/venues';
import type { Venue } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    Linking,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const SELECTED_VENUE_KEY = 'sidequest:selectedVenueId';

type VenueWithDistance = Venue & { distanceKm: number | null };

function venueAccessibilityLabel(
  item: VenueWithDistance,
  active: number,
  tooFar: boolean,
  hasCoords: boolean,
): string {
  let label = `${item.name}, ${active} people here`;
  if (item.distanceKm !== null) {
    label += `, ${formatDistanceKm(item.distanceKm)} away`;
  }
  if (tooFar) label += ', too far to check in';
  if (!hasCoords) label += ', location required';
  return label;
}

export default function VenueScreen() {
  const router = useRouter();
  const {
    coords,
    loading: locLoading,
    error: locError,
    permissionGranted,
    refresh,
  } = useLocation();
  const { visible: tooltipVisible, dismiss: dismissTooltip } = useTooltipFlag('venue');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distanceError, setDistanceError] = useState<string | null>(null);

  const dataDisabled = !isSupabaseConfigured;

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setVenues([]);
      setCounts({});
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { venues: venueData, counts: countMap } = await loadVenuePickerData();
      setVenues(venueData);
      setCounts(countMap);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load venues');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const venuesWithDistance = useMemo((): VenueWithDistance[] => {
    if (!coords) return venues.map((v) => ({ ...v, distanceKm: null }));
    return venues
      .map((v) => ({
        ...v,
        distanceKm: haversineDistanceKm(coords, {
          latitude: v.latitude,
          longitude: v.longitude,
        }),
      }))
      .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
  }, [venues, coords]);

  const selectVenue = async (venue: Venue) => {
    setDistanceError(null);
    if (!coords) {
      setDistanceError('Enable location to verify you are at the venue.');
      return;
    }
    const venueCoords = { latitude: venue.latitude, longitude: venue.longitude };
    if (!isWithinVenueRange(coords, venueCoords)) {
      setDistanceError(`You must be within ${VENUE_MAX_DISTANCE_KM}km of this venue to check in.`);
      return;
    }
    await AsyncStorage.setItem(SELECTED_VENUE_KEY, venue.id);
    router.push({ pathname: '/(onboarding)/check-in', params: { venueId: venue.id } });
  };

  const openLocationSettings = () => {
    Linking.openSettings().catch(() => {
      setDistanceError('Could not open settings. Enable location in your device settings.');
    });
  };

  const content = (
    <Screen>
      <ScreenTitle>Where are you?</ScreenTitle>
      <ScreenSubtitle>
        Pick a venue within {VENUE_MAX_DISTANCE_KM}km. Active check-in counts show the room vibe — no
        names, just energy.
      </ScreenSubtitle>

      {!isSupabaseConfigured ? (
        <ErrorBanner message="Add Supabase keys to .env — see .env.example and docs/PHASE4_VENUE.md." />
      ) : null}
      {locError ? <ErrorBanner message={locError} /> : null}
      {error ? <ErrorBanner message={error} /> : null}
      {distanceError ? <ErrorBanner message={distanceError} /> : null}

      {!permissionGranted && locError && !locLoading ? (
        <Button
          title="Open location settings"
          variant="ghost"
          onPress={openLocationSettings}
          accessibilityLabel="Open location settings"
          style={styles.settingsBtn}
        />
      ) : null}

      {locLoading || loading ? (
        <LoadingState message="Finding venues near you..." />
      ) : (
        <FlatList
          data={venuesWithDistance}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={dataDisabled ? undefined : load}
          renderItem={({ item }) => {
            const active = counts[item.id] ?? 0;
            const venueCoords = { latitude: item.latitude, longitude: item.longitude };
            const tooFar = coords !== null && !isWithinVenueRange(coords, venueCoords);
            const disabled = dataDisabled || !coords || tooFar;
            return (
              <Pressable
                style={[styles.venueCard, tooFar && styles.venueCardFar]}
                onPress={() => selectVenue(item)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={venueAccessibilityLabel(item, active, tooFar, !!coords)}
                accessibilityState={{ disabled }}
              >
                <View style={styles.venueHeader}>
                  <Text style={styles.venueName}>{item.name}</Text>
                  <Text style={styles.count}>{active} here</Text>
                </View>
                {item.distanceKm !== null ? (
                  <Text style={styles.distance}>
                    {tooFar ? 'Too far — ' : ''}
                    {formatDistanceKm(item.distanceKm)} away
                  </Text>
                ) : null}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            !error ? (
              <Text style={styles.empty}>
                No venues found — run seed after db push. See docs/PHASE4_VENUE.md.
              </Text>
            ) : null
          }
          ListFooterComponent={
            <Button
              title="Refresh location"
              variant="ghost"
              onPress={refresh}
              accessibilityLabel="Refresh location"
              style={styles.refresh}
            />
          }
        />
      )}
    </Screen>
  );

  if (tooltipVisible) {
    return (
      <TooltipOverlay
        title="You're invisible until you check in"
        message={`Choose a venue within ${VENUE_MAX_DISTANCE_KM}km. Counts show how many people are active — your profile stays hidden until you join the room.`}
        onDismiss={dismissTooltip}
      >
        {content}
      </TooltipOverlay>
    );
  }

  return content;
}

export { SELECTED_VENUE_KEY };

const styles = StyleSheet.create({
  venueCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  venueCardFar: { opacity: 0.55 },
  venueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  venueName: { color: colors.text, fontSize: 17, fontWeight: '600', flex: 1 },
  count: { color: colors.accent, fontWeight: '700' },
  distance: { color: colors.textMuted, marginTop: spacing.xs, fontSize: 13 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg, lineHeight: 22 },
  settingsBtn: { marginBottom: spacing.sm },
  refresh: { marginTop: spacing.md },
});
