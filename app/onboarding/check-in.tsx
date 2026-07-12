import { TooltipOverlay } from '@/components/TooltipOverlay';
import {
    Button,
    Card,
    ErrorBanner,
    FieldLabel,
    LoadingState,
    Screen,
    ScreenSubtitle,
    ScreenTitle,
    SegmentedControl,
    TagRow,
    UnderlineField,
} from '@/components/ui';
import { SELECTED_MODE_KEY, SELECTED_VENUE_KEY } from '@/constants/storage';
import { CHECK_IN_DURATION_HOURS, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTooltipFlag } from '@/hooks/useTooltipFlag';
import {
    checkInDisabledHint,
    loadProfileFormFields,
    profileToFormFields,
    submitCheckIn,
    validateCheckInForm,
    type CheckInFormFields,
} from '@/lib/checkin';
import { formatUserError } from '@/lib/errors';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchVenueName } from '@/lib/venues';
import type { GroupSize, IntentMode } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const MODES: IntentMode[] = ['friends', 'networking', 'dating'];
const GROUP_SIZES: GroupSize[] = ['1:1', '1:2', '2:2', '4:4'];

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

function parseTags(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function CheckInScreen() {
  const router = useRouter();
  const { venueId: venueIdParam, mode: modeParam } = useLocalSearchParams<{
    venueId?: string;
    mode?: string;
  }>();
  const { user, session, refreshCheckIn, devBypassActive } = useAuth();
  const { setActiveMode } = useTheme();
  const { visible: tooltipVisible, dismiss: dismissTooltip } = useTooltipFlag('checkin');

  const [resolvedVenueId, setResolvedVenueId] = useState<string | null>(
    typeof venueIdParam === 'string' ? venueIdParam : null,
  );
  const [venueName, setVenueName] = useState<string | null>(null);
  const [venueResolving, setVenueResolving] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [mode, setMode] = useState<IntentMode>('friends');
  const [groupSize, setGroupSize] = useState<GroupSize>('1:1');
  const [fields, setFields] = useState<CheckInFormFields>(EMPTY_FIELDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldHint, setFieldHint] = useState<string | null>(null);

  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        modeLabel: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          marginBottom: spacing.sm,
          marginTop: spacing.sm,
        },
        row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
        chip: {
          borderRadius: 999,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          backgroundColor: colors.borderLight,
          borderWidth: 1,
          borderColor: colors.border,
        },
        chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
        chipText: { color: colors.textMuted, fontWeight: '600' },
        chipTextActive: { color: colors.accentOnButton, fontWeight: '700' },
        fieldHintBanner: {
          color: colors.danger,
          fontSize: 13,
          lineHeight: 18,
          marginBottom: spacing.sm,
          textAlign: 'center',
        },
        submit: { marginBottom: spacing.xl },
        backVenue: { marginTop: spacing.md },
      }),
    [colors],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setVenueResolving(true);
      let venueId = typeof venueIdParam === 'string' ? venueIdParam : null;
      if (!venueId) {
        venueId = await AsyncStorage.getItem(SELECTED_VENUE_KEY);
      }
      if (cancelled) return;

      setResolvedVenueId(venueId);

      const storedMode = await AsyncStorage.getItem(SELECTED_MODE_KEY);
      const resolvedMode =
        typeof modeParam === 'string' && MODES.includes(modeParam as IntentMode)
          ? (modeParam as IntentMode)
          : storedMode && MODES.includes(storedMode as IntentMode)
            ? (storedMode as IntentMode)
            : null;
      if (resolvedMode && !cancelled) {
        setMode(resolvedMode);
        setActiveMode(resolvedMode);
      }

      if (venueId && isSupabaseConfigured) {
        try {
          const name = await fetchVenueName(venueId);
          if (!cancelled) setVenueName(name);
        } catch {
          if (!cancelled) setVenueName(null);
        }
      }

      if (!cancelled) setVenueResolving(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [venueIdParam, modeParam, setActiveMode]);

  const loadProfileData = useCallback(async () => {
    if (!user) {
      setProfileLoading(false);
      return;
    }

    const fallbackName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      'Guest';

    setProfileLoading(true);
    setProfileError(null);
    try {
      if (!isSupabaseConfigured || (devBypassActive && !session)) {
        setFields(profileToFormFields(null, fallbackName));
      } else {
        setFields(await loadProfileFormFields(user.id, fallbackName));
      }
    } catch (e) {
      setFields(profileToFormFields(null, fallbackName));
      setProfileError(null);
    } finally {
      setProfileLoading(false);
    }
  }, [user, devBypassActive, session]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const validationError = useMemo(() => validateCheckInForm(mode, fields), [mode, fields]);

  const updateField = <K extends keyof CheckInFormFields>(key: K, value: CheckInFormFields[K]) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setFieldHint(null);
    setError(null);
  };

  const submit = async () => {
    if (!user || !resolvedVenueId) return;

    const formError = validateCheckInForm(mode, fields);
    if (formError) {
      setError(formError);
      setFieldHint(formError);
      return;
    }

    if (!isSupabaseConfigured) {
      setError('Add Supabase keys to .env — see .env.example and docs/PHASE5_CHECKIN.md.');
      return;
    }

    setLoading(true);
    setError(null);
    setFieldHint(null);

    try {
      await submitCheckIn({
        userId: user.id,
        venueId: resolvedVenueId,
        mode,
        groupSize,
        fields,
        session,
        devBypassActive,
      });
      await refreshCheckIn();
      router.replace('/main/tabs/home');
    } catch (e) {
      const message = formatUserError(e, 'Check-in failed');
      setError(message);
      setFieldHint(message);
    } finally {
      setLoading(false);
    }
  };

  const submitDisabled =
    loading ||
    !resolvedVenueId ||
    !isSupabaseConfigured ||
    profileLoading ||
    venueResolving ||
    !!validationError;

  const onDisabledCheckInPress = () => {
    setFieldHint(
      checkInDisabledHint(mode, fields, {
        needsAuth: devBypassActive && !session && !validationError,
      }),
    );
  };

  const skillTags = useMemo(() => {
    if (mode === 'networking') return parseTags(fields.networkingSkills);
    if (mode === 'friends') return parseTags(fields.friendsInterests);
    return [];
  }, [mode, fields.networkingSkills, fields.friendsInterests]);

  if (venueResolving || profileLoading) {
    return <LoadingState message="Loading check-in..." />;
  }

  if (profileError) {
    return (
      <Screen>
        <Card>
          <ScreenTitle>My Quest Profile</ScreenTitle>
          <ErrorBanner message={profileError} />
          <Button
            title="Try again"
            variant="ghost"
            onPress={loadProfileData}
            accessibilityLabel="Try again to load profile"
          />
          <Button
            title="Back to venue picker"
            onPress={() => router.replace('/onboarding/venue')}
            accessibilityLabel="Back to venue picker"
            style={styles.backVenue}
          />
        </Card>
      </Screen>
    );
  }

  if (!resolvedVenueId) {
    return (
      <Screen>
        <Card>
          <ScreenTitle>My Quest Profile</ScreenTitle>
          <ErrorBanner message="No venue selected. Pick a venue within 1km first." />
          <Button
            title="Back to venue picker"
            onPress={() => router.replace('/onboarding/venue')}
            accessibilityLabel="Back to venue picker"
          />
        </Card>
      </Screen>
    );
  }

  const formContent = (
    <Screen scroll safeTop>
      <ScreenTitle>My Quest Profile</ScreenTitle>
      <ScreenSubtitle>
        {venueName ? `Open to ${mode} at ${venueName}. ` : `Open to ${mode}. `}
        Pick group size. Session lasts {CHECK_IN_DURATION_HOURS} hours or until you check out.
      </ScreenSubtitle>

      {devBypassActive && !session ? (
        <ErrorBanner message="Simulator mode — check-in saves locally. Add DEV_AUTH_EMAIL and DEV_AUTH_PASSWORD to .env for live Supabase check-in." />
      ) : null}
      {!isSupabaseConfigured ? (
        <ErrorBanner message="Add Supabase keys to .env — see .env.example and docs/PHASE5_CHECKIN.md." />
      ) : null}
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <UnderlineField
          label="Display name"
          value={fields.displayName}
          onChangeText={(v) => updateField('displayName', v)}
          placeholder="How should people see you?"
          required
        />

        <Text style={styles.modeLabel}>Mode · {mode}</Text>
        <SegmentedControl
          options={MODES}
          value={mode}
          onChange={setMode}
          labels={MODE_LABELS}
        />

        {mode === 'friends' ? (
          <>
            <FieldLabel label="Friends details (fill at least one)" required />
            <UnderlineField
              label="Interests (comma-separated)"
              value={fields.friendsInterests}
              onChangeText={(v) => updateField('friendsInterests', v)}
            />
            <TagRow tags={skillTags} />
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
              label="Fun fact"
              value={fields.friendsFunFacts}
              onChangeText={(v) => updateField('friendsFunFacts', v)}
              multiline
            />
          </>
        ) : null}

        {mode === 'networking' ? (
          <>
            <FieldLabel label="Networking details (fill at least one)" required />
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
              label="Skills & interests (comma-separated)"
              value={fields.networkingSkills}
              onChangeText={(v) => updateField('networkingSkills', v)}
              hint="Optional"
            />
            <TagRow tags={skillTags} />
          </>
        ) : null}

        {mode === 'dating' ? (
          <>
            <FieldLabel label="Dating details (fill at least one)" required />
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
      </Card>

      <Card>
        <Text style={styles.modeLabel}>Group size</Text>
        <View style={styles.row}>
          {GROUP_SIZES.map((g) => (
            <Pressable
              key={g}
              style={[styles.chip, groupSize === g && styles.chipActive]}
              onPress={() => setGroupSize(g)}
              accessibilityRole="button"
              accessibilityLabel={`Group size ${g}`}
              accessibilityState={{ selected: groupSize === g }}
            >
              <Text style={[styles.chipText, groupSize === g && styles.chipTextActive]}>{g}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {fieldHint ? <Text style={styles.fieldHintBanner}>{fieldHint}</Text> : null}

      <Button
        title={loading ? 'Checking in...' : 'Check in & enter the room'}
        onPress={submit}
        onDisabledPress={onDisabledCheckInPress}
        disabled={submitDisabled}
        accessibilityLabel="Check in and enter the room"
        style={styles.submit}
      />
    </Screen>
  );

  if (tooltipVisible) {
    return (
      <TooltipOverlay
        title="Brief profile + check in"
        message="Set your display name and mode-specific details (friends, networking, or dating). Choose group size (1:1, 1:2, 2:2, 4:4). Your session auto-expires or checks you out when you leave the venue."
        onDismiss={dismissTooltip}
      >
        {formContent}
      </TooltipOverlay>
    );
  }

  return formContent;
}
