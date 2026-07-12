import { AppHeader } from '@/components/AppHeader';
import { Button, Card, ErrorBanner, LoadingState } from '@/components/ui';
import { radius, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenBackgroundStyle, useTheme } from '@/contexts/ThemeContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import {
    formatPastCheckInDate,
    loadPastCheckIns,
    type PastCheckIn,
} from '@/lib/checkinHistory';
import { modeAccent, venueStatusColors } from '@/lib/semanticColors';
import { venueDetailRoute } from '@/lib/venueNavigation';
import { fetchVenueById } from '@/lib/venues';
import type { Venue } from '@/types/database';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function VenueCheckInCard({
  title,
  venueName,
  mode,
  meta,
  status,
  onOpenVenue,
  onViewRoom,
}: {
  title: string;
  venueName: string;
  mode: string;
  meta: string;
  status: 'active' | 'past';
  onOpenVenue?: () => void;
  onViewRoom?: () => void;
}) {
  const { colors } = useTheme();
  const palette = venueStatusColors[status];
  const modeColor = modeAccent[mode as keyof typeof modeAccent] ?? colors.brand;

  const cardStyles = useMemo(
    () =>
      StyleSheet.create({
        venueCard: {
          gap: spacing.sm,
          borderWidth: 2,
          borderRadius: radius.lg,
        },
        venueCardHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
        },
        statusBadge: {
          color: colors.onPurple,
          fontSize: 11,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: radius.full,
          overflow: 'hidden',
        },
        modeBadge: {
          fontSize: 12,
          fontWeight: '800',
          textTransform: 'capitalize',
          borderWidth: 1.5,
          paddingHorizontal: spacing.sm,
          paddingVertical: 3,
          borderRadius: radius.full,
        },
        venueName: { color: colors.text, fontSize: 22, fontWeight: '800' },
        meta: { color: colors.textMuted, fontSize: 14 },
        actions: { gap: spacing.sm, marginTop: spacing.xs },
      }),
    [colors],
  );

  return (
    <Card
      style={[
        cardStyles.venueCard,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
        },
      ]}
    >
      <View style={cardStyles.venueCardHeader}>
        <Text style={[cardStyles.statusBadge, { backgroundColor: palette.accent }]}>{title}</Text>
        <Text style={[cardStyles.modeBadge, { color: modeColor, borderColor: modeColor }]}>{mode}</Text>
      </View>
      <Text style={cardStyles.venueName}>{venueName}</Text>
      <Text style={cardStyles.meta}>{meta}</Text>
      {status === 'active' && onOpenVenue && onViewRoom ? (
        <View style={cardStyles.actions}>
          <Button title="Open Venue Page" onPress={onOpenVenue} accessibilityLabel="Open venue page" />
          <Button
            title="View Room"
            variant="outline"
            onPress={onViewRoom}
            accessibilityLabel="View room"
          />
        </View>
      ) : null}
    </Card>
  );
}

/** Check-ins tab — active venue + previous check-in history. */
export default function CheckInsTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const screenStyle = useScreenBackgroundStyle();
  const tabBarInset = useTabBarInset();
  const { colors } = useTheme();
  const { checkIn } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [pastCheckIns, setPastCheckIns] = useState<PastCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1 },
        headerPad: { paddingHorizontal: spacing.md },
        scroll: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
        empty: { gap: spacing.sm },
        emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
        emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
        section: { gap: spacing.sm, marginTop: spacing.sm },
        sectionTitle: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '800',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        },
      }),
    [colors],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [past, activeVenue] = await Promise.all([
        loadPastCheckIns(),
        checkIn?.venue_id ? fetchVenueById(checkIn.venue_id) : Promise.resolve(null),
      ]);
      setPastCheckIns(past);
      setVenue(activeVenue);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load check-ins');
    } finally {
      setLoading(false);
    }
  }, [checkIn?.venue_id]);

  useEffect(() => {
    load();
  }, [load]);

  const pastOnly = useMemo(
    () =>
      pastCheckIns.filter(
        (item) => !(checkIn && item.venueId === checkIn.venue_id && item.mode === checkIn.mode),
      ),
    [pastCheckIns, checkIn],
  );

  const openVenue = () => {
    if (!checkIn?.venue_id || !venue) return;
    router.push(
      venueDetailRoute(
        {
          venueId: checkIn.venue_id,
          mode: checkIn.mode,
        },
        true,
      ),
    );
  };

  return (
    <View style={[screenStyle, styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.headerPad}>
        <AppHeader title="Check-ins" />
      </View>

      {loading ? (
        <LoadingState message="Loading your check-ins…" />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: tabBarInset }]}
          showsVerticalScrollIndicator={false}
        >
          {error ? <ErrorBanner message={error} /> : null}

          {!checkIn || !venue ? (
            <Card style={styles.empty}>
              <Text style={styles.emptyTitle}>Not Checked In</Text>
              <Text style={styles.emptyText}>
                Open the map and check in at a venue to see your active check-in here.
              </Text>
              <Button
                title="Open Map"
                onPress={() => router.push('/main/tabs/map')}
                accessibilityLabel="Open map"
              />
            </Card>
          ) : (
            <VenueCheckInCard
              title={venueStatusColors.active.label}
              venueName={venue.name}
              mode={checkIn.mode}
              meta={`Session ends ${new Date(checkIn.expires_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
              status="active"
              onOpenVenue={openVenue}
              onViewRoom={() => router.push('/main/tabs/home')}
            />
          )}

          {pastOnly.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Previous check-ins</Text>
              {pastOnly.map((item) => (
                <VenueCheckInCard
                  key={`${item.venueId}-${item.checkedOutAt}`}
                  title={venueStatusColors.past.label}
                  venueName={item.venueName}
                  mode={item.mode}
                  meta={`Checked out · ${formatPastCheckInDate(item.checkedOutAt)}`}
                  status="past"
                />
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
