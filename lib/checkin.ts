import { CHECK_IN_DURATION_HOURS } from '@/constants/theme';
import { ensureProfile } from '@/lib/auth';
import { saveDevLocalCheckIn, updateDevLocalCheckInMode } from '@/lib/devLocalCheckIn';
import { supabase } from '@/lib/supabase';
import type { CheckIn, Database, GroupSize, IntentMode, Profile } from '@/types/database';
import type { Session } from '@supabase/supabase-js';

type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpsertPatch = Omit<ProfileInsert, 'id'>;

export type CheckInFormFields = {
  displayName: string;
  friendsInterests: string;
  friendsMusic: string;
  friendsHobbies: string;
  friendsFunFacts: string;
  networkingRole: string;
  networkingIndustry: string;
  networkingSkills: string;
  datingAesthetic: string;
  datingChemistry: string;
};

function parseTags(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinTags(tags: string[] | null | undefined): string {
  return (tags ?? []).join(', ');
}

export async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return (data as Profile) ?? null;
}

/** Ensures a profile row exists, then returns form fields (never hard-fails check-in). */
export async function loadProfileFormFields(
  userId: string,
  fallbackDisplayName: string,
): Promise<CheckInFormFields> {
  try {
    await ensureProfile();
  } catch {
    // Continue with fallback when ensure fails (offline / race).
  }
  try {
    const profile = await loadProfile(userId);
    return profileToFormFields(profile, fallbackDisplayName);
  } catch {
    return profileToFormFields(null, fallbackDisplayName);
  }
}

export async function clearOwnCheckIns(userId: string): Promise<void> {
  const { error } = await supabase.from('check_ins').delete().eq('user_id', userId);
  if (error) throw error;
}

export function buildModeProfileUpdate(
  mode: IntentMode,
  fields: CheckInFormFields,
): ProfileUpsertPatch {
  const display_name = fields.displayName.trim();

  switch (mode) {
    case 'friends':
      return {
        display_name,
        friends_interests: parseTags(fields.friendsInterests),
        friends_music: parseTags(fields.friendsMusic),
        friends_hobbies: parseTags(fields.friendsHobbies),
        friends_fun_facts: fields.friendsFunFacts.trim() || null,
      };
    case 'networking':
      return {
        display_name,
        networking_role: fields.networkingRole.trim() || null,
        networking_industry: fields.networkingIndustry.trim() || null,
        networking_skills: parseTags(fields.networkingSkills),
      };
    case 'dating':
      return {
        display_name,
        dating_aesthetic: fields.datingAesthetic.trim() || null,
        dating_chemistry_notes: fields.datingChemistry.trim() || null,
      };
  }
}

/** User-facing hint when the check-in button is inactive due to missing fields. */
export function checkInDisabledHint(
  mode: IntentMode,
  fields: CheckInFormFields,
  opts?: { needsAuth?: boolean },
): string {
  const validation = validateCheckInForm(mode, fields);
  if (validation) return validation;
  if (opts?.needsAuth) {
    return 'Sign in with Apple, Google, or phone to check in and save to the room.';
  }
  return 'Complete all required fields marked with * to check in.';
}

export function validateCheckInForm(mode: IntentMode, fields: CheckInFormFields): string | null {
  if (!fields.displayName.trim()) {
    return 'Display name is required.';
  }

  switch (mode) {
    case 'friends': {
      const hasTags =
        parseTags(fields.friendsInterests).length > 0 ||
        parseTags(fields.friendsMusic).length > 0 ||
        parseTags(fields.friendsHobbies).length > 0;
      const hasFact = fields.friendsFunFacts.trim().length > 0;
      if (!hasTags && !hasFact) {
        return 'Add at least one interest, hobby, music taste, or fun fact for friends mode.';
      }
      return null;
    }
    case 'networking': {
      if (!fields.networkingRole.trim() && !fields.networkingIndustry.trim()) {
        return 'Add your role or industry for networking mode.';
      }
      return null;
    }
    case 'dating': {
      if (!fields.datingAesthetic.trim() && !fields.datingChemistry.trim()) {
        return 'Add your aesthetic or chemistry notes for dating mode.';
      }
      return null;
    }
  }
}

export function profileToFormFields(
  profile: Profile | null,
  fallbackDisplayName?: string,
): CheckInFormFields {
  return {
    displayName: profile?.display_name?.trim() || fallbackDisplayName || '',
    friendsInterests: joinTags(profile?.friends_interests),
    friendsMusic: joinTags(profile?.friends_music),
    friendsHobbies: joinTags(profile?.friends_hobbies),
    friendsFunFacts: profile?.friends_fun_facts ?? '',
    networkingRole: profile?.networking_role ?? '',
    networkingIndustry: profile?.networking_industry ?? '',
    networkingSkills: joinTags(profile?.networking_skills),
    datingAesthetic: profile?.dating_aesthetic ?? '',
    datingChemistry: profile?.dating_chemistry_notes ?? '',
  };
}

export async function updateFullProfile(userId: string, fields: CheckInFormFields): Promise<void> {
  if (!fields.displayName.trim()) {
    throw new Error('Display name is required.');
  }

  const profilePatch: ProfileInsert = {
    id: userId,
    display_name: fields.displayName.trim(),
    friends_interests: parseTags(fields.friendsInterests),
    friends_music: parseTags(fields.friendsMusic),
    friends_hobbies: parseTags(fields.friendsHobbies),
    friends_fun_facts: fields.friendsFunFacts.trim() || null,
    networking_role: fields.networkingRole.trim() || null,
    networking_industry: fields.networkingIndustry.trim() || null,
    networking_skills: parseTags(fields.networkingSkills),
    dating_aesthetic: fields.datingAesthetic.trim() || null,
    dating_chemistry_notes: fields.datingChemistry.trim() || null,
  };

  const { error } = await supabase.from('profiles').upsert(profilePatch);
  if (error) throw error;
}

export async function submitCheckIn(params: {
  userId: string;
  venueId: string;
  mode: IntentMode;
  groupSize: GroupSize;
  fields: CheckInFormFields;
  session: Session | null;
  devBypassActive?: boolean;
}): Promise<CheckIn> {
  const validationError = validateCheckInForm(params.mode, params.fields);
  if (validationError) throw new Error(validationError);

  if (params.devBypassActive && !params.session) {
    return saveDevLocalCheckIn({
      userId: params.userId,
      venueId: params.venueId,
      mode: params.mode,
      groupSize: params.groupSize,
    });
  }

  if (!params.session) {
    throw new Error('Sign in with Apple, Google, or phone to check in.');
  }

  await ensureProfile();

  await clearOwnCheckIns(params.userId);

  const profilePatch: ProfileInsert = {
    id: params.userId,
    ...buildModeProfileUpdate(params.mode, params.fields),
  };

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(profilePatch, { onConflict: 'id' });
  if (profileError) throw profileError;

  const expiresAt = new Date(
    Date.now() + CHECK_IN_DURATION_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { data, error: checkInError } = await supabase
    .from('check_ins')
    .insert({
      user_id: params.userId,
      venue_id: params.venueId,
      mode: params.mode,
      group_size: params.groupSize,
      expires_at: expiresAt,
    })
    .select('*')
    .single();

  if (checkInError) throw checkInError;
  return data as CheckIn;
}

export async function updateActiveCheckInMode(
  userId: string,
  mode: IntentMode,
): Promise<CheckIn | null> {
  const { data, error } = await supabase
    .from('check_ins')
    .update({ mode })
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return (data as CheckIn) ?? null;
}

/** Updates active check-in mode (Supabase or dev-local storage). */
export async function changeActiveCheckInMode(
  userId: string,
  mode: IntentMode,
  opts?: { devBypassActive?: boolean },
): Promise<CheckIn | null> {
  if (opts?.devBypassActive) {
    return updateDevLocalCheckInMode(userId, mode);
  }
  return updateActiveCheckInMode(userId, mode);
}
