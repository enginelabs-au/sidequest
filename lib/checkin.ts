import { CHECK_IN_DURATION_HOURS } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import type { CheckIn, Database, GroupSize, IntentMode, Profile } from '@/types/database';

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
  if (error) throw error;
  return (data as Profile) ?? null;
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

export async function submitCheckIn(params: {
  userId: string;
  venueId: string;
  mode: IntentMode;
  groupSize: GroupSize;
  fields: CheckInFormFields;
}): Promise<CheckIn> {
  const validationError = validateCheckInForm(params.mode, params.fields);
  if (validationError) throw new Error(validationError);

  await clearOwnCheckIns(params.userId);

  const profilePatch: ProfileInsert = {
    id: params.userId,
    ...buildModeProfileUpdate(params.mode, params.fields),
  };

  const { error: profileError } = await supabase.from('profiles').upsert(profilePatch);
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
