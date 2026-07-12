import { AppHeader } from '@/components/AppHeader';
import { CheckInStatusTag } from '@/components/CheckInStatusTag';
import { DiscoveryProfileCard } from '@/components/DiscoveryProfileCard';
import { WaveAnimation } from '@/components/WaveAnimation';
import { Button, LoadingState } from '@/components/ui';
import { SELECTED_MODE_KEY } from '@/constants/storage';
import { spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenBackgroundStyle, useTheme } from '@/contexts/ThemeContext';
import { useCheckInGate } from '@/hooks/useCheckInGate';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useWaveAction } from '@/hooks/useWaveAction';
import { loadMergedActivityItems } from '@/lib/activityFeed';
import { changeActiveCheckInMode } from '@/lib/checkin';
import { performCheckout } from '@/lib/checkout';
import { roomPeerToProfile } from '@/lib/devPeerProfile';
import { formatUserError } from '@/lib/errors';
import { loadInboxThreads } from '@/lib/inbox';
import {
    findInboxThreadForPeer,
    peerHasInitiatedInteraction,
} from '@/lib/inboxAction';
import { openChatForPeer } from '@/lib/inboxNavigation';
import { mapTabRoute } from '@/lib/mapNavigation';
import {
    cancelNotifyTimer,
    isNotifyTimerPending,
    waveNotifyTimerId,
} from '@/lib/notifyTimerService';
import { getSameModeOnlyPreference } from '@/lib/preferences';
import { navigateToPublicProfile } from '@/lib/profileNavigation';
import { loadRoomData } from '@/lib/room';
import { MOCK_DISCOVERY_PROFILES, type ActivityItem, type DiscoveryProfile, type InboxThread } from '@/lib/socialMock';
import { isSupabaseConfigured } from '@/lib/supabase';
import { roomFeedEmptyMessage, type ModePresenceCounts, type VenuePresenceCounts } from '@/lib/venuePresence';
import { fetchVenueName } from '@/lib/venues';
import { canUnwavePeer, loadWavedUserIdSet } from '@/lib/waves';
import type { IntentMode, RoomPeer } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function peerToDiscovery(peer: RoomPeer): DiscoveryProfile {
  const profile = roomPeerToProfile(peer);
  return {
    user_id: peer.user_id,
    display_name: profile.display_name,
    bio: profile.bio,
    tags: profile.vibe_tags.length ? profile.vibe_tags : [profile.mode],
    mode: peer.mode,
  };
}

function mockProfilesForMode(viewerMode: string, sameModeOnly: boolean): DiscoveryProfile[] {
  return MOCK_DISCOVERY_PROFILES.filter((p) => !sameModeOnly || p.mode === viewerMode);
}

type Props = {
  title?: string;
  onBack?: () => void;
};

/** Shared home / room discovery deck — same UI from Home tab and venue View Room. */
export function RoomFeedScreen({ title = 'Home', onBack }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const screenStyle = useScreenBackgroundStyle();
  const { colors, setActiveMode } = useTheme();
  const { checkIn, user, refreshCheckIn, devBypassActive } = useAuth();
  const { ensureCheckedIn } = useCheckInGate();
  const tabBarInset = useTabBarInset();
  const { waveAt, unwaveAt, waveAnimVisible, onWaveAnimComplete, wavedIds, setWavedIds, loading: waveLoading } =
    useWaveAction();

  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [inboxThreads, setInboxThreads] = useState<InboxThread[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [presence, setPresence] = useState<VenuePresenceCounts | null>(null);
  const [modeCounts, setModeCounts] = useState<ModePresenceCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingMode, setChangingMode] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [unwaveAllowedByPeer, setUnwaveAllowedByPeer] = useState<Record<string, boolean>>({});

  const cardHeight = Dimensions.get('window').height - insets.top - insets.bottom - 160;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        headerPad: { paddingHorizontal: spacing.md, marginBottom: spacing.xs },
        list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl + tabBarInset, gap: spacing.md },
        cardWrap: { marginBottom: spacing.md },
        empty: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.lg,
          gap: spacing.md,
        },
        emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800', textAlign: 'center' },
        emptyText: { color: colors.textSecondary, textAlign: 'center', lineHeight: 22, fontSize: 15 },
        checkInBtn: { marginTop: spacing.sm, minWidth: 200 },
        checkoutTop: { marginBottom: spacing.md },
      }),
    [colors, tabBarInset],
  );

  const handleModeChange = useCallback(
    async (mode: IntentMode) => {
      if (!user || !checkIn) return;
      setChangingMode(true);
      try {
        await changeActiveCheckInMode(user.id, mode, { devBypassActive });
        await AsyncStorage.setItem(SELECTED_MODE_KEY, mode);
        setActiveMode(mode);
        await refreshCheckIn();
      } catch (e) {
        Alert.alert('Could not change mode', formatUserError(e, 'Try again in a moment.'));
      } finally {
        setChangingMode(false);
      }
    },
    [user, checkIn, devBypassActive, refreshCheckIn, setActiveMode],
  );

  const refreshUnwaveEligibility = useCallback(
    async (waved: Set<string>) => {
      if (!user?.id || !waved.size) {
        setUnwaveAllowedByPeer({});
        return;
      }
      const entries = await Promise.all(
        [...waved].map(async (peerId) => [peerId, await canUnwavePeer(user.id, peerId)] as const),
      );
      setUnwaveAllowedByPeer(Object.fromEntries(entries));
    },
    [user?.id],
  );

  const loadSocialContext = useCallback(async () => {
    const [threads, activity] = await Promise.all([
      user?.id ? loadInboxThreads(user.id) : Promise.resolve([] as InboxThread[]),
      loadMergedActivityItems(),
    ]);
    setInboxThreads(threads);
    setActivityItems(activity);
  }, [user?.id]);

  const load = useCallback(async () => {
    await loadSocialContext();

    if (!checkIn) {
      setProfiles([]);
      setPresence(null);
      setModeCounts(null);
      setLoading(false);
      return;
    }

    const waved = await loadWavedUserIdSet();
    setWavedIds(waved);
    await refreshUnwaveEligibility(waved);

    const sameModeOnly = await getSameModeOnlyPreference();
    const viewerMode = checkIn.mode;
    const selfName =
      (user?.user_metadata?.full_name as string | undefined) ??
      (user?.user_metadata?.name as string | undefined) ??
      null;
    const fallback = mockProfilesForMode(viewerMode, sameModeOnly);

    if (!isSupabaseConfigured) {
      const stub = devBypassActive ? fallback : [];
      setProfiles(stub);
      setPresence({ total: stub.length, inMyMode: stub.length, sameModeOnly });
      setModeCounts({ friends: stub.length ? 1 : 0, networking: stub.length ? 1 : 0, dating: stub.length ? 1 : 0 });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { peers, presence: counts, modeCounts: countsByMode } = await loadRoomData(checkIn.venue_id, viewerMode, {
        selfCheckIn: checkIn,
        selfDisplayName: selfName,
      });
      setPresence(counts);
      setModeCounts(countsByMode);
      setProfiles(peers.map(peerToDiscovery));
    } catch {
      setPresence({ total: 0, inMyMode: 0, sameModeOnly });
      setModeCounts({ friends: 1, networking: 0, dating: 0 });
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [checkIn, user, setWavedIds, loadSocialContext, refreshUnwaveEligibility]);

  useEffect(() => {
    load();
  }, [load]);

  const handleWave = async (profile: DiscoveryProfile) => {
    if (!user || !ensureCheckedIn()) return;
    await waveAt(
      { user_id: profile.user_id, display_name: profile.display_name },
      { goToInbox: false },
    );
    await loadSocialContext();
    if (user) {
      const waved = await loadWavedUserIdSet();
      await refreshUnwaveEligibility(waved);
    }
  };

  const handleUnWave = async (profile: DiscoveryProfile) => {
    if (!user) return;
    await unwaveAt({
      user_id: profile.user_id,
      display_name: profile.display_name,
    });
    const waved = await loadWavedUserIdSet();
    await refreshUnwaveEligibility(waved);
  };

  const openInbox = async (profile: DiscoveryProfile) => {
    if (!ensureCheckedIn()) return;

    const timerId = waveNotifyTimerId(profile.user_id);
    if (isNotifyTimerPending(timerId)) {
      cancelNotifyTimer(timerId);
      await handleWave(profile);
    }

    const [threads] = await Promise.all([
      user?.id ? loadInboxThreads(user.id) : Promise.resolve([] as InboxThread[]),
      loadSocialContext(),
    ]);
    const thread = findInboxThreadForPeer(threads, profile.user_id);
    openChatForPeer(router, profile.user_id, thread);
  };

  const openProfile = (profile: DiscoveryProfile) => {
    navigateToPublicProfile(router, profile.user_id, { checkedIn: true });
  };

  const goToMap = () => {
    router.push(mapTabRoute());
  };

  const handleCheckout = () => {
    if (!checkIn) return;
    Alert.alert('Leave venue?', 'You will check out and leave the room.', [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Check out',
        style: 'destructive',
        onPress: async () => {
          try {
            const venueName = (await fetchVenueName(checkIn.venue_id)) ?? 'Venue';
            await performCheckout(
              refreshCheckIn,
              {
                venueId: checkIn.venue_id,
                venueName,
                mode: checkIn.mode,
              },
              () => router.replace(mapTabRoute()),
            );
          } catch (e) {
            Alert.alert('Checkout failed', formatUserError(e, 'Try again in a moment.'));
          }
        },
      },
    ]);
  };

  const showCheckout = !!checkIn && !onBack;

  const emptyRoomCopy =
    checkIn && presence
      ? roomFeedEmptyMessage(presence, checkIn.mode)
      : { title: 'Room is open', text: 'Others in your mode will appear here when they arrive.' };

  return (
    <View style={[screenStyle, { paddingTop: insets.top }]}>
      <View style={styles.headerPad}>
        <AppHeader title={title} onBack={onBack} />
        <CheckInStatusTag
          checkedIn={!!checkIn}
          mode={checkIn?.mode}
          modeCounts={modeCounts ?? undefined}
          onModeChange={checkIn ? handleModeChange : undefined}
          changingMode={changingMode}
          menuOpen={modeMenuOpen}
          onMenuOpenChange={setModeMenuOpen}
        />
        {showCheckout ? (
          <Button
            title="LEAVE VENUE / CHECK OUT"
            variant="danger"
            onPress={handleCheckout}
            accessibilityLabel="Leave venue and check out"
            style={styles.checkoutTop}
          />
        ) : null}
      </View>

      {!checkIn ? (
        <View style={[styles.empty, { paddingBottom: tabBarInset }]}>
          <Text style={styles.emptyTitle}>You&apos;re not checked in</Text>
          <Text style={styles.emptyText}>
            Check in at a venue on the map to see other people in the room and start connecting.
          </Text>
          <Button
            title="Check in now"
            onPress={goToMap}
            style={styles.checkInBtn}
            accessibilityLabel="Open map to check in at a venue"
          />
        </View>
      ) : loading ? (
        <LoadingState message="Finding people nearby…" />
      ) : profiles.length === 0 ? (
        <View style={[styles.empty, { paddingBottom: tabBarInset }]}>
          <Text style={styles.emptyTitle}>{emptyRoomCopy.title}</Text>
          <Text style={styles.emptyText}>{emptyRoomCopy.text}</Text>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.user_id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          onScrollBeginDrag={() => setModeMenuOpen(false)}
          renderItem={({ item }) => (
            <View style={[styles.cardWrap, { minHeight: cardHeight }]}>
              <DiscoveryProfileCard
                profile={item}
                onAttemptWave={ensureCheckedIn}
                onWave={() => handleWave(item)}
                onUnWave={() => handleUnWave(item)}
                onOpenProfile={() => openProfile(item)}
                showInbox={peerHasInitiatedInteraction(item.user_id, inboxThreads, activityItems, {
                  viewerWaved: wavedIds.has(item.user_id),
                })}
                onOpenInbox={() => openInbox(item)}
                loading={waveLoading}
                waved={wavedIds.has(item.user_id)}
                canUnwave={unwaveAllowedByPeer[item.user_id] ?? false}
              />
            </View>
          )}
        />
      )}

      <WaveAnimation visible={waveAnimVisible} onComplete={onWaveAnimComplete} />
    </View>
  );
}
