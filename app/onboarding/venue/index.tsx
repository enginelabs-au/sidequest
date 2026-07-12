import { AppHeader } from '@/components/AppHeader';
import { AppIcon } from '@/components/AppIcon';
import { MapFilterSheet, type MapFilterId } from '@/components/MapFilterSheet';
import { MapSearchBar } from '@/components/MapSearchBar';
import { SocialRadarMap, type SocialRadarMapHandle } from '@/components/SocialRadarMap';
import { TooltipOverlay } from '@/components/TooltipOverlay';
import { VenueMarkerCard } from '@/components/VenueMarkerCard';
import { Button, Card, ErrorBanner, LoadingState } from '@/components/ui';
import { DEV_TEST_VENUE_COORDS, isDevTestVenueCheckInEnabled } from '@/constants/devVenues';
import { SELECTED_MODE_KEY } from '@/constants/storage';
import { colors, radius, shadows, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleVenueSignals } from '@/hooks/useGoogleVenueSignals';
import { useLocation } from '@/hooks/useLocation';
import { useTooltipFlag } from '@/hooks/useTooltipFlag';
import { mapVenuePinCount } from '@/lib/devFakePeer';
import { formatUserError } from '@/lib/errors';
import type { Coordinates } from '@/lib/geo';
import { fetchPlaceLocation } from '@/lib/googlePlaces';
import { googleActivityColor, type GoogleActivityLevel } from '@/lib/googleVenueSignals';
import { routes } from '@/lib/routes';
import { isSupabaseConfigured } from '@/lib/supabase';
import { venueDetailRoute } from '@/lib/venueNavigation';
import { countVenuePresence } from '@/lib/venuePresence';
import {
    applyMapFilter,
    filterVenuesForRadar,
    isWithinCheckInRange,
    mapVenueForDisplay,
    realDistanceToVenueKm,
    sortVenuesForRadar,
} from '@/lib/venueRadar';
import { loadVenuePickerData } from '@/lib/venues';
import type { IntentMode, Venue } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    FlatList,
    Keyboard,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type VenueWithMeta = Venue & {
  distanceKm: number | null;
  count: number;
  checkInEligible: boolean;
  googleActivityLabel?: string;
  googleActivityLevel?: string;
};

const RADAR_AUTO_REFRESH_MS = 30_000;
const SCAN_TIMEOUT_MS = 5_000;

export default function VenueScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const isMainMapTab = pathname === routes.mainMap;
  const insets = useSafeAreaInsets();
  const { checkIn, user } = useAuth();
  const mapRef = useRef<SocialRadarMapHandle>(null);
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
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [searchCenter, setSearchCenter] = useState<Coordinates | null>(null);
  const [searchLabel, setSearchLabel] = useState<string | null>(null);
  const [mapFilter, setMapFilter] = useState<MapFilterId>('trending');
  const initialMapCenterRef = useRef<Coordinates | null>(null);

  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [viewerMode, setViewerMode] = useState<IntentMode>(checkIn?.mode ?? 'friends');

  useEffect(() => {
    (async () => {
      if (checkIn?.mode) {
        setViewerMode(checkIn.mode);
        return;
      }
      const stored = await AsyncStorage.getItem(SELECTED_MODE_KEY);
      if (stored === 'friends' || stored === 'dating' || stored === 'networking') {
        setViewerMode(stored);
      }
    })();
  }, [checkIn?.mode]);

  const loadGenerationRef = useRef(0);
  const loadRetriedRef = useRef(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    const generation = ++loadGenerationRef.current;
    if (!silent) loadRetriedRef.current = false;
    if (!isSupabaseConfigured) {
      if (!silent) setLoading(false);
      setVenues([]);
      setCounts({});
      return;
    }

    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const { venues: venueData, counts: countMap } = await loadVenuePickerData();
      if (generation !== loadGenerationRef.current) return;
      setVenues(venueData);
      setCounts(countMap);
      if (silent) setError(null);
    } catch (e) {
      if (generation !== loadGenerationRef.current) return;
      if (!silent) {
        const message = formatUserError(e, 'Failed to load venues');
        const transient =
          e instanceof Error &&
          /cancelled|canceled|aborted/i.test(e.message);
        if (transient && !loadRetriedRef.current) {
          loadRetriedRef.current = true;
          setTimeout(() => load({ silent: false }), 600);
          return;
        }
        setError(message);
      }
    } finally {
      if (generation === loadGenerationRef.current && !silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!loading) {
      setLoadTimedOut(false);
      return;
    }
    const id = setTimeout(() => {
      setLoadTimedOut(true);
      setLoading(false);
    }, SCAN_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [loading]);

  useEffect(() => {
    const tick = () => {
      load({ silent: true });
      refresh({ silent: true });
    };
    const id = setInterval(tick, RADAR_AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [load, refresh]);

  if (coords && !initialMapCenterRef.current) {
    initialMapCenterRef.current = coords;
  }
  const initialMapCenter: Coordinates =
    initialMapCenterRef.current ?? searchCenter ?? DEV_TEST_VENUE_COORDS;

  const overlayPadH = Math.max(insets.left, insets.right, spacing.lg);
  const overlayPadTop = insets.top + spacing.lg;
  const overlayPadBottom = insets.bottom + spacing.lg;

  const devCheckInAllowed = isDevTestVenueCheckInEnabled();
  const checkedInVenueId = checkIn?.venue_id ?? null;

  const venueDisplayCount = useCallback(
    (venue: Venue, rawCount: number) => {
      let adjusted = rawCount;
      if (checkedInVenueId === venue.id) {
        adjusted = Math.max(0, adjusted - 1);
      }
      return mapVenuePinCount(venue, adjusted, viewerMode);
    },
    [checkedInVenueId, viewerMode],
  );

  const venuesWithMeta = useMemo((): VenueWithMeta[] => {
    const filtered = filterVenuesForRadar(venues, coords);
    const mapped = filtered.map((v) => {
      const displayed = mapVenueForDisplay(v, coords);
      const realCount = counts[v.id] ?? 0;
      const checkInEligible =
        checkedInVenueId !== v.id &&
        isWithinCheckInRange(coords, v, devCheckInAllowed);
      return {
        ...displayed,
        count: venueDisplayCount(v, realCount),
        distanceKm: realDistanceToVenueKm(coords, v),
        checkInEligible,
      };
    });
    return applyMapFilter(sortVenuesForRadar(mapped), mapFilter);
  }, [venues, counts, coords, mapFilter, devCheckInAllowed, checkedInVenueId, venueDisplayCount]);

  const mapVenues = useMemo((): VenueWithMeta[] => {
    return venues.map((v) => {
      const realCount = counts[v.id] ?? 0;
      const checkInEligible =
        checkedInVenueId !== v.id &&
        isWithinCheckInRange(coords, v, devCheckInAllowed);
      return {
        ...v,
        count: venueDisplayCount(v, realCount),
        distanceKm: realDistanceToVenueKm(coords, v),
        checkInEligible,
      };
    });
  }, [venues, counts, coords, devCheckInAllowed, checkedInVenueId, venueDisplayCount]);

  const googleSignals = useGoogleVenueSignals(venues);

  const venuesForDisplay = useMemo(
    (): VenueWithMeta[] =>
      venuesWithMeta.map((v) => {
        const signal = googleSignals[v.id];
        return signal
          ? {
              ...v,
              googleActivityLabel: signal.activityLabel,
              googleActivityLevel: signal.activityLevel,
            }
          : v;
      }),
    [venuesWithMeta, googleSignals],
  );

  const showScanOverlay = loading && venues.length === 0 && !loadTimedOut;

  const openVenueProfile = async (venue: Venue) => {
    let mode: IntentMode = checkIn?.mode ?? viewerMode;
    if (!checkIn) {
      const stored = await AsyncStorage.getItem(SELECTED_MODE_KEY);
      if (stored === 'friends' || stored === 'dating' || stored === 'networking') {
        mode = stored;
      }
    }
    const selfName =
      (user?.user_metadata?.full_name as string | undefined) ??
      (user?.user_metadata?.name as string | undefined) ??
      null;
    const presence = await countVenuePresence(venue, mode, {
      selfCheckIn: checkIn?.venue_id === venue.id ? checkIn : null,
      selfDisplayName: selfName,
    });
    setSelectedVenueId(venue.id);
    router.push(
      venueDetailRoute(
        {
          venueId: venue.id,
          count: String(presence.inMyMode),
          totalCount: String(presence.total),
          sameModeOnly: presence.sameModeOnly ? '1' : '0',
          mode,
        },
        !!checkIn,
      ),
    );
  };

  const handleSearchSelect = async (placeId: string, label: string) => {
    try {
      const place = await fetchPlaceLocation(placeId);
      if (!place) return;
      setSearchCenter({ latitude: place.latitude, longitude: place.longitude });
      setSearchLabel(place.label ?? label);
      mapRef.current?.animateTo({ latitude: place.latitude, longitude: place.longitude }, 0.05);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load that place');
    }
  };

  const openLocationSettings = () => {
    Linking.openSettings().catch(() => {
      setError('Could not open settings. Enable location in your device settings.');
    });
  };

  const listFallback = (
    <FlatList
      data={venuesForDisplay}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 120 }]}
      renderItem={({ item }) => (
        <Pressable onPress={() => openVenueProfile(item)}>
          <Card style={styles.listCard}>
            <Text style={styles.listName}>{item.name}</Text>
            <Text style={styles.listMeta}>
              {item.count} checked-in
              {item.distanceKm !== null ? ` · ${item.distanceKm.toFixed(1)}km` : ''}
            </Text>
          </Card>
        </Pressable>
      )}
    />
  );

  const radarBody = (
    <View style={[styles.root, isMainMapTab && styles.rootMapTab]}>
      <SocialRadarMap
        ref={mapRef}
        initialCenter={initialMapCenter}
        venues={mapVenues}
        selectedVenueId={selectedVenueId}
        onSelectVenue={openVenueProfile}
        onUserInteraction={() => Keyboard.dismiss()}
      />

      {locLoading && !coords ? (
        <View style={styles.locBanner} pointerEvents="none">
          <Card style={styles.locBannerCard} padded={false}>
            <Text style={styles.locBannerText}>Getting your location…</Text>
          </Card>
        </View>
      ) : null}

      <View
        style={[
          styles.topOverlay,
          {
            paddingTop: overlayPadTop,
            paddingLeft: overlayPadH,
            paddingRight: overlayPadH,
          },
        ]}
        pointerEvents="box-none"
      >
        <AppHeader title="Map" subtitle={searchLabel ?? undefined} style={styles.header} variant="map" />
        <MapSearchBar onSelectPlace={handleSearchSelect} style={styles.search} />
        <MapFilterSheet active={mapFilter} onChange={setMapFilter} variant="inline" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.markerRail}
          contentContainerStyle={styles.markerRailContent}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          {venuesForDisplay.map((venue) => (
            <VenueMarkerCard
              key={venue.id}
              venue={venue}
              count={venue.count}
              checkInEligible={venue.checkInEligible}
              googleActivityLabel={venue.googleActivityLabel}
              googleActivityColor={
                venue.googleActivityLevel
                  ? googleActivityColor(venue.googleActivityLevel as GoogleActivityLevel)
                  : undefined
              }
              selected={selectedVenueId === venue.id}
              onPress={() => openVenueProfile(venue)}
            />
          ))}
        </ScrollView>
      </View>

      <Pressable
        style={[
          styles.recenterBtn,
          {
            right: overlayPadH,
            bottom: overlayPadBottom + spacing.lg,
          },
        ]}
        onPress={() => {
          Keyboard.dismiss();
          if (searchCenter) {
            mapRef.current?.animateTo(searchCenter);
          } else if (coords) {
            mapRef.current?.recenter(coords);
          } else {
            mapRef.current?.animateTo(DEV_TEST_VENUE_COORDS);
          }
        }}
        accessibilityRole="button"
        accessibilityLabel="Re-center map"
      >
        <AppIcon name="recenter" size={22} color={colors.iconMuted} />
      </Pressable>

      {(error || locError) && !showScanOverlay ? (
        <View style={[styles.errorFloat, { top: insets.top + 200 }]}>
          {locError ? <ErrorBanner message={locError} /> : null}
          {error ? <ErrorBanner message={error} /> : null}
          {error ? (
            <Button title="Retry scan" variant="outline" onPress={() => load()} />
          ) : null}
          {!permissionGranted && locError ? (
            <Button
              title="Open location settings"
              variant="ghost"
              onPress={openLocationSettings}
              accessibilityLabel="Open location settings"
            />
          ) : null}
        </View>
      ) : null}

      {!isSupabaseConfigured ? (
        <View style={[styles.errorFloat, { top: insets.top + 140 }]}>
          <ErrorBanner message="Add Supabase keys to .env — see .env.example and docs/PHASE4_VENUE.md." />
        </View>
      ) : null}
    </View>
  );

  const mainContent = Platform.OS === 'web' ? listFallback : radarBody;

  const content = (
    <View style={[styles.root, isMainMapTab && styles.rootMapTab]}>
      {mainContent}
      {showScanOverlay ? (
        <View style={styles.scanOverlay}>
          <LoadingState message="Scanning social radar…" />
        </View>
      ) : null}
    </View>
  );

  if (tooltipVisible) {
    return (
      <TooltipOverlay
        title="Geographic heatmap radar"
        message="Venues within 1km are check-in eligible. Each card shows how many people are checked in so you can feel the vibe before joining. Search anywhere, tap a hotspot, then check in when you arrive."
        onDismiss={dismissTooltip}
      >
        {content}
      </TooltipOverlay>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  rootMapTab: { backgroundColor: 'transparent' },
  loadingWrap: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
    zIndex: 10,
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locBanner: {
    position: 'absolute',
    top: '45%',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 2,
    alignItems: 'center',
  },
  locBannerCard: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  locBannerText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  placeholderText: { color: colors.textMuted },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 4,
    gap: spacing.sm,
    overflow: 'visible',
    paddingBottom: spacing.xs,
  },
  header: { marginBottom: 0 },
  search: { marginTop: 0 },
  markerRail: {
    overflow: 'visible',
    flexGrow: 0,
    maxHeight: 130,
  },
  markerRailContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    alignItems: 'flex-start',
    paddingRight: spacing.lg,
  },
  recenterBtn: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    ...shadows.card,
  },
  errorFloat: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 5,
    gap: spacing.sm,
  },
  listContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  listCard: { marginBottom: spacing.sm },
  listName: { color: colors.text, fontSize: 17, fontWeight: '700' },
  listMeta: { color: colors.textMuted, marginTop: spacing.xs, fontSize: 13 },
});
