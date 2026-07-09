import { SELECTED_VENUE_KEY } from '@/app/(onboarding)/venue';
import { TooltipOverlay } from '@/components/TooltipOverlay';
import {
  Button,
  ErrorBanner,
  LoadingState,
  Screen,
  ScreenSubtitle,
  ScreenTitle,
} from '@/components/ui';
import { CHECK_IN_DURATION_HOURS, colors, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTooltipFlag } from '@/hooks/useTooltipFlag';
import {
  loadProfile,
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
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const MODES: IntentMode[] = ['friends', 'dating', 'networking'];
const GROUP_SIZES: GroupSize[] = ['1:1', '1:2', '2:2', '4:4'];

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

export default function CheckInScreen() {
  const router = useRouter();
  const { venueId: venueIdParam } = useLocalSearchParams<{ venueId?: string }>();
  const { user, refreshCheckIn } = useAuth();
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
  }, [venueIdParam]);

  const loadProfileData = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    setProfileError(null);
    try {
      const profile = await loadProfile(user.id);
      const fallbackName =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        'Guest';
      setFields(profileToFormFields(profile, fallbackName));
    } catch (e) {
      setProfileError(formatUserError(e, 'Failed to load profile'));
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const validationError = useMemo(() => validateCheckInForm(mode, fields), [mode, fields]);

  const updateField = <K extends keyof CheckInFormFields>(key: K, value: CheckInFormFields[K]) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    if (!user || !resolvedVenueId || !isSupabaseConfigured) return;

    const formError = validateCheckInForm(mode, fields);
    if (formError) {
      setError(formError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await submitCheckIn({
        userId: user.id,
        venueId: resolvedVenueId,
        mode,
        groupSize,
        fields,
      });
      await refreshCheckIn();
      router.replace('/(main)/room');
    } catch (e) {
      setError(formatUserError(e, 'Check-in failed'));
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

  if (venueResolving || profileLoading) {
    return <LoadingState message="Loading check-in..." />;
  }

  if (profileError) {
    return (
      <Screen>
        <ScreenTitle>Open to...</ScreenTitle>
        <ErrorBanner message={profileError} />
        <Button
          title="Try again"
          variant="ghost"
          onPress={loadProfileData}
          accessibilityLabel="Try again to load profile"
        />
        <Button
          title="Back to venue picker"
          onPress={() => router.replace('/(onboarding)/venue')}
          accessibilityLabel="Back to venue picker"
          style={styles.backVenue}
        />
      </Screen>
    );
  }

  if (!resolvedVenueId) {
    return (
      <Screen>
        <ScreenTitle>Open to...</ScreenTitle>
        <ErrorBanner message="No venue selected. Pick a venue within 1km first." />
        <Button
          title="Back to venue picker"
          onPress={() => router.replace('/(onboarding)/venue')}
          accessibilityLabel="Back to venue picker"
        />
      </Screen>
    );
  }

  const formContent = (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenTitle>Open to...</ScreenTitle>
        <ScreenSubtitle>
          {venueName
            ? `Checking in at ${venueName}. `
            : ''}
          Your profile fields match your mode. Session lasts {CHECK_IN_DURATION_HOURS} hours or until
          you check out.
        </ScreenSubtitle>

        {!isSupabaseConfigured ? (
          <ErrorBanner message="Add Supabase keys to .env — see .env.example and docs/PHASE5_CHECKIN.md." />
        ) : null}
        {error ? <ErrorBanner message={error} /> : null}

        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={styles.input}
          placeholder="How should people see you?"
          placeholderTextColor={colors.textMuted}
          value={fields.displayName}
          onChangeText={(v) => updateField('displayName', v)}
          accessibilityLabel="Display name"
        />

        <Text style={styles.label}>Mode</Text>
        <View style={styles.row}>
          {MODES.map((m) => (
            <Pressable
              key={m}
              style={[styles.chip, mode === m && styles.chipActive]}
              onPress={() => setMode(m)}
              accessibilityRole="button"
              accessibilityLabel={`${m} mode`}
              accessibilityState={{ selected: mode === m }}
            >
              <Text style={[styles.chipText, mode === m && styles.chipTextActive]}>{m}</Text>
            </Pressable>
          ))}
        </View>

        {mode === 'friends' ? (
          <>
            <Field
              label="Interests (comma-separated)"
              value={fields.friendsInterests}
              onChange={(v) => updateField('friendsInterests', v)}
            />
            <Field
              label="Music taste"
              value={fields.friendsMusic}
              onChange={(v) => updateField('friendsMusic', v)}
            />
            <Field
              label="Hobbies"
              value={fields.friendsHobbies}
              onChange={(v) => updateField('friendsHobbies', v)}
            />
            <Field
              label="Fun fact"
              value={fields.friendsFunFacts}
              onChange={(v) => updateField('friendsFunFacts', v)}
              multiline
            />
          </>
        ) : null}

        {mode === 'networking' ? (
          <>
            <Field
              label="Role"
              value={fields.networkingRole}
              onChange={(v) => updateField('networkingRole', v)}
            />
            <Field
              label="Industry"
              value={fields.networkingIndustry}
              onChange={(v) => updateField('networkingIndustry', v)}
            />
            <Field
              label="Skills (comma-separated)"
              value={fields.networkingSkills}
              onChange={(v) => updateField('networkingSkills', v)}
            />
          </>
        ) : null}

        {mode === 'dating' ? (
          <>
            <Field
              label="Profile aesthetic"
              value={fields.datingAesthetic}
              onChange={(v) => updateField('datingAesthetic', v)}
            />
            <Field
              label="Chemistry / vibe"
              value={fields.datingChemistry}
              onChange={(v) => updateField('datingChemistry', v)}
              multiline
            />
          </>
        ) : null}

        <Text style={styles.label}>Group size</Text>
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

        <Button
          title={loading ? 'Checking in...' : 'Check in & enter the room'}
          onPress={submit}
          disabled={submitDisabled}
          accessibilityLabel="Check in and enter the room"
          style={styles.submit}
        />
      </ScrollView>
    </Screen>
  );

  if (tooltipVisible) {
    return (
      <TooltipOverlay
        title="You're visible in one mode"
        message="Pick friends, dating, or networking. Only people in the same venue and mode can see you. Your session ends when you check out or after a few hours."
        onDismiss={dismissTooltip}
      >
        {formContent}
      </TooltipOverlay>
    );
  }

  return formContent;
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        accessibilityLabel={label}
      />
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    padding: spacing.md,
    fontSize: 16,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  chipText: { color: colors.textMuted, textTransform: 'capitalize' },
  chipTextActive: { color: colors.text, fontWeight: '600' },
  submit: { marginTop: spacing.xl, marginBottom: spacing.xl },
  backVenue: { marginTop: spacing.md },
});
