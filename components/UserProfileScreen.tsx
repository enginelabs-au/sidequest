import { AppHeader } from '@/components/AppHeader';
import { BlockedUsersModal } from '@/components/BlockedUsersModal';
import { DeleteAccountModal } from '@/components/DeleteAccountModal';
import { SettingsMenuRow } from '@/components/SettingsMenuRow';
import {
    Button,
    Card,
    ErrorBanner,
    FieldLabel,
    LoadingState,
    SegmentedControl,
    TagRow,
    ToggleRow,
    UnderlineField,
} from '@/components/ui';
import { hasLegalUrls, privacyPolicyUrl, termsUrl } from '@/constants/legal';
import { INVISIBLE_PREF_KEY, SELECTED_MODE_KEY } from '@/constants/storage';
import { CHECK_IN_DURATION_HOURS, radius, spacing, VENUE_MAX_DISTANCE_KM } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenBackgroundStyle, useTheme } from '@/contexts/ThemeContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import {
    loadProfileFormFields,
    profileToFormFields,
    updateActiveCheckInMode,
    updateFullProfile,
    type CheckInFormFields,
} from '@/lib/checkin';
import { performCheckout } from '@/lib/checkout';
import { deleteOwnAccount } from '@/lib/deleteAccount';
import { formatUserError } from '@/lib/errors';
import { getSameModeOnlyPreference, setSameModeOnlyPreference } from '@/lib/preferences';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchVenueById } from '@/lib/venues';
import type { IntentMode } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MODES: IntentMode[] = ['friends', 'networking', 'dating'];
const MODE_LABELS: Record<IntentMode, string> = {
  friends: 'friends',
  networking: 'networking',
  dating: 'dating',
};

const EMPTY_FIELDS: CheckInFormFields = {
  displayName: '',
  friendsInterests: '',
  friendsMusic: '',
  friendsHobbies: '',
  friendsFunFacts: '',
  networkingRole: '',
  networkingIndustry: '',
  networkingSkills: '',
  datingAesthetic: '',
  datingChemistry: '',
};

type SettingsSection = 'hub' | 'account' | 'privacy' | 'notifications' | 'vibe-tags' | 'saved-locations';

const SECTION_TITLES: Record<Exclude<SettingsSection, 'hub'>, string> = {
  account: 'Account',
  privacy: 'Privacy & Security',
  notifications: 'Notifications',
  'vibe-tags': 'Vibe Tags',
  'saved-locations': 'Saved Locations',
};

function parseTags(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

type Props = {
  onBack?: () => void;
  /** When rendered as a main tab root, hide back on the settings hub. */
  isTabRoot?: boolean;
};

export function UserProfileScreen({ onBack, isTabRoot }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const screenStyle = useScreenBackgroundStyle();
  const { colors, scheme, setScheme, setActiveMode } = useTheme();
  const { user, checkIn, refreshCheckIn, devBypassActive, signOut } = useAuth();
  const [section, setSection] = useState<SettingsSection>('hub');
  const [mode, setMode] = useState<IntentMode>('friends');
  const [fields, setFields] = useState<CheckInFormFields>(EMPTY_FIELDS);
  const [visible, setVisible] = useState(true);
  const [sameModeOnly, setSameModeOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const canSave = !!user && isSupabaseConfigured && !devBypassActive;

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured && !devBypassActive) {
        const fallbackName =
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          'Guest';
        const formFields = await loadProfileFormFields(user.id, fallbackName);
        setFields(formFields);
      } else {
        setFields(
          profileToFormFields(null, (user.user_metadata?.full_name as string) ?? 'Guest'),
        );
      }
      const inv = await AsyncStorage.getItem(INVISIBLE_PREF_KEY);
      if (inv !== null) setVisible(inv !== 'true');
      setSameModeOnly(await getSameModeOnlyPreference());

      if (checkIn?.mode) {
        setMode(checkIn.mode);
      } else {
        const storedMode = await AsyncStorage.getItem(SELECTED_MODE_KEY);
        if (storedMode && MODES.includes(storedMode as IntentMode)) {
          setMode(storedMode as IntentMode);
        }
      }
    } catch (e) {
      setError(formatUserError(e, 'Failed to load profile'));
    } finally {
      setLoading(false);
    }
  }, [user, devBypassActive, checkIn?.mode]);

  useEffect(() => {
    load();
  }, [load]);

  const updateField = <K extends keyof CheckInFormFields>(key: K, value: CheckInFormFields[K]) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const persistVisible = async (value: boolean) => {
    setVisible(value);
    await AsyncStorage.setItem(INVISIBLE_PREF_KEY, value ? 'false' : 'true');
    if (!value && checkIn) {
      try {
        const venue = await fetchVenueById(checkIn.venue_id);
        await performCheckout(refreshCheckIn, {
          venueId: checkIn.venue_id,
          venueName: venue?.name ?? 'Venue',
          mode: checkIn.mode,
        });
      } catch (e) {
        setError(formatUserError(e, 'Failed to go invisible'));
      }
    }
  };

  const persistSameModeOnly = async (value: boolean) => {
    setSameModeOnly(value);
    await setSameModeOnlyPreference(value);
    setSaved(false);
  };

  const changeMode = async (value: IntentMode) => {
    setMode(value);
    setSaved(false);
    setActiveMode(value);
    await AsyncStorage.setItem(SELECTED_MODE_KEY, value);
    if (checkIn && user && isSupabaseConfigured && !devBypassActive) {
      try {
        await updateActiveCheckInMode(user.id, value);
        await refreshCheckIn();
      } catch (e) {
        setError(formatUserError(e, 'Failed to update mode'));
      }
    }
  };

  const save = async () => {
    if (!user || !canSave) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateFullProfile(user.id, fields);
      await AsyncStorage.setItem(SELECTED_MODE_KEY, mode);
      if (checkIn) {
        await updateActiveCheckInMode(user.id, mode);
        await refreshCheckIn();
      }
      setSaved(true);
    } catch (e) {
      setError(formatUserError(e, 'Failed to save profile'));
    } finally {
      setSaving(false);
    }
  };

  const vibeTags = useMemo(() => {
    if (mode === 'networking') return parseTags(fields.networkingSkills);
    if (mode === 'friends') return parseTags(fields.friendsInterests);
    if (mode === 'dating' && fields.datingAesthetic) return [fields.datingAesthetic];
    return [];
  }, [mode, fields.networkingSkills, fields.friendsInterests, fields.datingAesthetic]);

  const tagline = useMemo(() => {
    if (fields.friendsFunFacts.trim()) return fields.friendsFunFacts.trim();
    if (vibeTags.length) return vibeTags.slice(0, 2).join(' · ');
    return `Open to ${MODE_LABELS[mode]} nearby`;
  }, [fields.friendsFunFacts, vibeTags, mode]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.background },
        scroll: {
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.lg,
          gap: spacing.md,
        },
        heroCard: {
          alignItems: 'center',
          paddingVertical: spacing.lg,
          gap: spacing.sm,
        },
        avatar: {
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: colors.purpleMuted,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xs,
        },
        avatarText: {
          color: colors.text,
          fontWeight: '800',
          fontSize: 28,
        },
        statusDot: {
          position: 'absolute',
          right: 2,
          bottom: 2,
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: colors.textMuted,
          borderWidth: 3,
          borderColor: colors.card,
        },
        statusDotActive: {
          backgroundColor: colors.coral,
        },
        avatarWrap: {
          position: 'relative',
        },
        heroName: {
          color: colors.text,
          fontSize: 20,
          fontWeight: '800',
          textAlign: 'center',
        },
        heroTagline: {
          color: colors.textMuted,
          fontSize: 14,
          textAlign: 'center',
          lineHeight: 20,
        },
        menuCard: {
          paddingTop: spacing.xs,
          paddingBottom: spacing.xs,
        },
        actionBtn: {
          backgroundColor: colors.border,
          borderRadius: radius.full,
          paddingVertical: spacing.md + 2,
          alignItems: 'center',
          marginBottom: spacing.sm,
          borderWidth: 1,
          borderColor: colors.borderLight,
        },
        actionBtnLight: {
          backgroundColor: colors.card,
        },
        actionBtnText: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '700',
        },
        statusFooter: {
          alignItems: 'center',
          marginTop: spacing.sm,
          gap: 4,
        },
        statusLine: {
          color: colors.textMuted,
          fontSize: 13,
        },
        modeLabel: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          marginBottom: spacing.sm,
          marginTop: spacing.sm,
        },
        modeHint: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.sm },
        sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: spacing.sm },
        safetyCopy: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: spacing.sm },
        legalRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.sm },
        legalLink: { color: colors.text, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
        legalSep: { color: colors.textMuted },
        saved: { color: colors.success, fontWeight: '700', marginBottom: spacing.sm },
        saveBtn: { marginTop: spacing.md },
      }),
    [colors],
  );

  const openUrl = async (url: string | null) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      setError('Could not open link.');
    }
  };

  const handleBack = () => {
    if (section !== 'hub') {
      setSection('hub');
      return;
    }
    onBack?.();
  };

  const handleDeleteAccount = () => {
    if (devBypassActive) {
      setDeleteOpen(true);
      return;
    }
    if (!isSupabaseConfigured || !user) {
      setError('Sign in with a real account to use in-app deletion.');
      return;
    }
    setDeleteOpen(true);
  };

  const performAccountDeletion = async () => {
    setDeletingAccount(true);
    setError(null);
    try {
      if (checkIn) {
        try {
          const venue = await fetchVenueById(checkIn.venue_id);
          await performCheckout(refreshCheckIn, {
            venueId: checkIn.venue_id,
            venueName: venue?.name ?? 'Venue',
            mode: checkIn.mode,
          });
        } catch (e) {
          console.warn('checkout before delete failed:', e);
        }
      }
      await deleteOwnAccount({ devBypassOnly: devBypassActive });
      setDeleteOpen(false);
      if (devBypassActive) {
        await signOut();
      } else {
        router.replace('/auth');
      }
    } catch (e) {
      setError(formatUserError(e, 'Could not delete account'));
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading settings…" />;
  }

  const headerTitle = section === 'hub' ? 'Settings' : SECTION_TITLES[section];

  return (
    <View style={[styles.root, screenStyle, { paddingTop: insets.top }]}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <AppHeader
          title={headerTitle}
          onBack={isTabRoot && section === 'hub' ? undefined : handleBack}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: (isTabRoot ? tabBarInset : insets.bottom) + spacing.md },
        ]}
      >
        {section === 'hub' ? (
          <>
            <Card style={styles.heroCard} padded>
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(fields.displayName || 'Guest')}</Text>
                </View>
                <View style={[styles.statusDot, visible && styles.statusDotActive]} />
              </View>
              <Text style={styles.heroName}>{fields.displayName || 'Guest'}</Text>
              <Text style={styles.heroTagline}>{tagline}</Text>
            </Card>

            <Card style={styles.menuCard} padded>
              <SettingsMenuRow
                icon="profile"
                label="Account"
                onPress={() => setSection('account')}
              />
              <SettingsMenuRow
                icon="lock"
                label="Privacy & Security"
                onPress={() => setSection('privacy')}
              />
              <SettingsMenuRow
                icon="bell"
                label="Notifications"
                onPress={() => setSection('notifications')}
              />
              <SettingsMenuRow
                icon="tag"
                label="Vibe Tags"
                onPress={() => setSection('vibe-tags')}
              />
              <SettingsMenuRow
                icon="bookmark"
                label="Saved Locations"
                onPress={() => setSection('saved-locations')}
              />
            </Card>

            <Card style={styles.menuCard} padded>
              <ToggleRow
                label="Light mode"
                sublabel={scheme === 'light' ? 'Using light appearance' : 'Using dark appearance (default)'}
                value={scheme === 'light'}
                onValueChange={(on) => setScheme(on ? 'light' : 'dark')}
              />
            </Card>

            <Pressable
              style={styles.actionBtn}
              onPress={signOut}
              accessibilityRole="button"
              accessibilityLabel="Log out"
            >
              <Text style={styles.actionBtnText}>Log Out</Text>
            </Pressable>

            <Pressable
              style={[styles.actionBtn, styles.actionBtnLight]}
              onPress={handleDeleteAccount}
              accessibilityRole="button"
              accessibilityLabel="Delete account"
            >
              <Text style={styles.actionBtnText}>Delete Account</Text>
            </Pressable>

            <View style={styles.statusFooter}>
              <Text style={styles.statusLine}>Account status: Active</Text>
              <Text style={styles.statusLine}>Last online: Just now</Text>
            </View>
          </>
        ) : null}

        {section === 'account' ? (
          <Card>
            {devBypassActive ? (
              <ErrorBanner message="Simulator mode — connect DEV_AUTH_EMAIL/PASSWORD in .env to save profile to Supabase." />
            ) : null}
            {!isSupabaseConfigured ? (
              <ErrorBanner message="Add Supabase keys to .env to sync your profile." />
            ) : null}
            {error ? <ErrorBanner message={error} /> : null}
            {saved ? <Text style={styles.saved}>Profile saved.</Text> : null}

            <UnderlineField
              label="Display name"
              value={fields.displayName}
              onChangeText={(v) => updateField('displayName', v)}
              placeholder="How should people see you?"
              required
            />

            <Text style={styles.modeLabel}>Open To Mode</Text>
            <SegmentedControl options={MODES} value={mode} onChange={changeMode} labels={MODE_LABELS} />
            {checkIn ? (
              <Text style={styles.modeHint}>Active check-in uses this mode for discovery.</Text>
            ) : (
              <Text style={styles.modeHint}>Saved for your next check-in.</Text>
            )}

            {mode === 'friends' ? (
              <>
                <FieldLabel label="Friends details (fill at least one for check-in)" required />
                <UnderlineField
                  label="Interests (comma-separated)"
                  value={fields.friendsInterests}
                  onChangeText={(v) => updateField('friendsInterests', v)}
                />
                <UnderlineField
                  label="Music taste"
                  value={fields.friendsMusic}
                  onChangeText={(v) => updateField('friendsMusic', v)}
                />
                <UnderlineField
                  label="Hobbies"
                  value={fields.friendsHobbies}
                  onChangeText={(v) => updateField('friendsHobbies', v)}
                />
                <UnderlineField
                  label="Fun facts / tagline"
                  value={fields.friendsFunFacts}
                  onChangeText={(v) => updateField('friendsFunFacts', v)}
                  multiline
                />
              </>
            ) : null}

            {mode === 'networking' ? (
              <>
                <FieldLabel label="Networking details (fill at least one for check-in)" required />
                <UnderlineField
                  label="Current role"
                  value={fields.networkingRole}
                  onChangeText={(v) => updateField('networkingRole', v)}
                />
                <UnderlineField
                  label="Industry"
                  value={fields.networkingIndustry}
                  onChangeText={(v) => updateField('networkingIndustry', v)}
                />
                <UnderlineField
                  label="Skills (comma-separated)"
                  value={fields.networkingSkills}
                  onChangeText={(v) => updateField('networkingSkills', v)}
                />
              </>
            ) : null}

            {mode === 'dating' ? (
              <>
                <FieldLabel label="Dating details (fill at least one for check-in)" required />
                <UnderlineField
                  label="Profile aesthetic"
                  value={fields.datingAesthetic}
                  onChangeText={(v) => updateField('datingAesthetic', v)}
                />
                <UnderlineField
                  label="Chemistry / vibe"
                  value={fields.datingChemistry}
                  onChangeText={(v) => updateField('datingChemistry', v)}
                  multiline
                />
              </>
            ) : null}

            <Button
              title={saving ? 'Saving…' : 'Save Profile'}
              onPress={save}
              disabled={saving || !canSave || !fields.displayName.trim()}
              accessibilityLabel="Save profile"
              style={styles.saveBtn}
            />
          </Card>
        ) : null}

        {section === 'privacy' ? (
          <Card>
            {error ? <ErrorBanner message={error} /> : null}
            <Text style={styles.sectionTitle}>Discovery</Text>
            <ToggleRow
              label="Same Mode Only"
              sublabel={
                sameModeOnly
                  ? 'Only see people in your Open To mode'
                  : 'See everyone checked in at the venue'
              }
              value={sameModeOnly}
              onValueChange={persistSameModeOnly}
            />

            <Text style={styles.sectionTitle}>Visibility</Text>
            <ToggleRow
              label="Visible to others"
              sublabel={
                checkIn
                  ? 'Turn off to check out and go invisible immediately'
                  : 'On by default — turn off to browse without checking in'
              }
              value={visible}
              onValueChange={persistVisible}
            />
            <Text style={styles.safetyCopy}>
              Block instantly removes someone from your room. Report from chat or the activity feed.
              Messages are filtered for spam and abuse before sending.
            </Text>
            <Text style={styles.safetyCopy}>
              Check-ins last {CHECK_IN_DURATION_HOURS} hours or until you leave the venue area (
              {VENUE_MAX_DISTANCE_KM}km) — then you go invisible again.
            </Text>
            <Button
              title="Blocked users"
              variant="ghost"
              onPress={() => setBlockedOpen(true)}
              accessibilityLabel="View blocked users"
            />
            {hasLegalUrls() ? (
              <View style={styles.legalRow}>
                {privacyPolicyUrl ? (
                  <Pressable onPress={() => openUrl(privacyPolicyUrl)} accessibilityRole="link">
                    <Text style={styles.legalLink}>Privacy policy</Text>
                  </Pressable>
                ) : null}
                {privacyPolicyUrl && termsUrl ? <Text style={styles.legalSep}> · </Text> : null}
                {termsUrl ? (
                  <Pressable onPress={() => openUrl(termsUrl)} accessibilityRole="link">
                    <Text style={styles.legalLink}>Terms</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </Card>
        ) : null}

        {section === 'notifications' ? (
          <Card>
            <Text style={styles.sectionTitle}>Push notifications</Text>
            <Text style={styles.safetyCopy}>
              In-app alerts for waves, check-ins, and replies appear in Activity and Inbox. Push
              notification preferences will be available in a future update.
            </Text>
          </Card>
        ) : null}

        {section === 'vibe-tags' ? (
          <Card>
            <Text style={styles.sectionTitle}>Your vibe tags</Text>
            <Text style={styles.safetyCopy}>
              Tags come from your profile fields for the active Open To mode. Edit them in Account.
            </Text>
            {vibeTags.length ? <TagRow tags={vibeTags} /> : (
              <Text style={styles.safetyCopy}>No tags yet — add interests in Account.</Text>
            )}
            <Button
              title="Edit in Account"
              variant="outline"
              onPress={() => setSection('account')}
              accessibilityLabel="Edit vibe tags in account settings"
            />
          </Card>
        ) : null}

        {section === 'saved-locations' ? (
          <Card>
            <Text style={styles.sectionTitle}>Saved locations</Text>
            {checkIn ? (
              <Text style={styles.safetyCopy}>
                Currently checked in — your active venue is saved for this session.
              </Text>
            ) : (
              <Text style={styles.safetyCopy}>
                Check in at a venue on the map to save it for quick access. Favourites list coming
                soon.
              </Text>
            )}
          </Card>
        ) : null}
      </ScrollView>

      <BlockedUsersModal visible={blockedOpen} onClose={() => setBlockedOpen(false)} />
      <DeleteAccountModal
        visible={deleteOpen}
        deleting={deletingAccount}
        onClose={() => setDeleteOpen(false)}
        onConfirmDelete={performAccountDeletion}
      />
    </View>
  );
}

