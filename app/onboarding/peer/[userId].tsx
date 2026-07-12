import { AppHeader } from '@/components/AppHeader';
import { ModePhotoTag } from '@/components/ModePhotoTag';
import { Button, Card, ScreenSubtitle, ScreenTitle, TagRow } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCheckInGate } from '@/hooks/useCheckInGate';
import { useScreenBackgroundStyle, useTheme } from '@/contexts/ThemeContext';
import { loadMergedActivityItems } from '@/lib/activityFeed';
import type { PublicPeerProfile } from '@/lib/devPeerProfile';
import { loadInboxThreads } from '@/lib/inbox';
import {
    findInboxThreadForPeer,
    inboxActionLabelForPeer,
    shouldShowProfileInboxAction,
} from '@/lib/inboxAction';
import { openChatForPeer } from '@/lib/inboxNavigation';
import { getPublicPeerProfile } from '@/lib/publicProfile';
import type { ActivityItem, InboxThread } from '@/lib/socialMock';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MODE_LABEL = {
  friends: 'Open to friends',
  dating: 'Open to dating',
  networking: 'Open to networking',
} as const;

function PeerProfileBody({
  profile,
  inboxThread,
  activity,
  showInboxAction,
  onInboxAction,
}: {
  profile: PublicPeerProfile;
  inboxThread?: InboxThread;
  activity: ActivityItem[];
  showInboxAction: boolean;
  onInboxAction: () => void;
}) {
  const { colors } = useTheme();
  const inboxLabel = inboxActionLabelForPeer(profile.user_id, inboxThread, activity);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        hero: { alignItems: 'center', gap: spacing.sm },
        avatar: {
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: colors.purpleMuted,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          marginBottom: spacing.sm,
        },
        avatarText: { fontSize: 32, fontWeight: '800', color: colors.text },
        mode: {
          fontSize: 13,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        },
        checkedIn: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
        section: { gap: spacing.sm },
        sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
        body: { color: colors.textMuted, fontSize: 14, lineHeight: 22 },
        inboxBtn: {
          backgroundColor: colors.success,
          marginTop: spacing.sm,
        },
      }),
    [colors],
  );

  return (
    <>
      <Card style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile.display_name
              .split(' ')
              .map((p) => p[0])
              .join('')
              .slice(0, 2)}
          </Text>
          <ModePhotoTag mode={profile.mode} />
        </View>
        <ScreenTitle>{profile.display_name}</ScreenTitle>
        <ScreenSubtitle>{profile.tagline}</ScreenSubtitle>
        <Text style={[styles.mode, { color: colors.textSecondary }]}>{MODE_LABEL[profile.mode]}</Text>
        {profile.checked_in_venue ? (
          <Text style={styles.checkedIn}>Checked in at {profile.checked_in_venue}</Text>
        ) : null}
        {showInboxAction ? (
          <Button
            title={inboxLabel}
            onPress={onInboxAction}
            style={styles.inboxBtn}
            accessibilityLabel={`${inboxLabel} ${profile.display_name}`}
          />
        ) : null}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.body}>{profile.bio}</Text>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Vibe tags</Text>
        <TagRow tags={profile.vibe_tags} />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <TagRow tags={profile.friends_interests} />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Music</Text>
        <TagRow tags={profile.friends_music} />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Fun fact</Text>
        <Text style={styles.body}>{profile.friends_fun_facts}</Text>
      </Card>
    </>
  );
}

export default function PeerProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const screenStyle = useScreenBackgroundStyle();
  const { colors } = useTheme();
  const { user, devBypassActive } = useAuth();
  const { ensureCheckedIn } = useCheckInGate();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [inboxThreads, setInboxThreads] = useState<InboxThread[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);

  const profile = userId ? getPublicPeerProfile(userId) : null;
  const inboxThread = userId ? findInboxThreadForPeer(inboxThreads, userId) : undefined;
  const showInboxAction =
    !!userId && shouldShowProfileInboxAction(userId, inboxThreads, activityItems);

  const loadSocialContext = useCallback(async () => {
    const uid = user?.id ?? (devBypassActive ? 'dev-bypass-user' : null);
    if (!uid) return;
    try {
      const [threads, activity] = await Promise.all([
        loadInboxThreads(uid),
        loadMergedActivityItems(),
      ]);
      setInboxThreads(threads);
      setActivityItems(activity);
    } catch {
      setInboxThreads([]);
      setActivityItems([]);
    }
  }, [user?.id, devBypassActive]);

  useEffect(() => {
    loadSocialContext();
  }, [loadSocialContext]);

  const handleInboxAction = () => {
    if (!userId || !ensureCheckedIn()) return;
    openChatForPeer(router, userId, inboxThread);
  };

  return (
    <View
      style={[
        screenStyle,
        { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.md },
      ]}
    >
      <AppHeader title="Profile" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        {profile ? (
          <PeerProfileBody
            profile={profile}
            inboxThread={inboxThread}
            activity={activityItems}
            showInboxAction={showInboxAction}
            onInboxAction={handleInboxAction}
          />
        ) : (
          <Card>
            <Text style={{ color: colors.textMuted }}>Profile not available.</Text>
          </Card>
        )}
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </View>
  );
}
