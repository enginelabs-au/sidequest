import {
    CHAT_READ_STATUS_KEY,
    DELETED_ACTIVITY_IDS_KEY,
    DELETED_INBOX_PEER_IDS_KEY,
    DEV_LOCAL_CHECKIN_KEY,
    INVISIBLE_PREF_KEY,
    LOCAL_ACTIVITY_KEY,
    LOCAL_INBOX_KEY,
    PAST_CHECKINS_KEY,
    SAME_MODE_ONLY_KEY,
    SELECTED_MODE_KEY,
    SELECTED_VENUE_KEY,
    WAVED_USER_IDS_KEY,
} from '@/constants/storage';
import { clearLocalAuthSession } from '@/lib/authSession';
import { resetDevJordanChat } from '@/lib/devJordanChat';
import { resetPendingPeerChats } from '@/lib/devPendingChat';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Exact phrase users must type before permanent deletion. */
export const DELETE_ACCOUNT_CONFIRM_PHRASE = 'delete account';

const USER_DATA_KEYS = [
  SELECTED_VENUE_KEY,
  SELECTED_MODE_KEY,
  INVISIBLE_PREF_KEY,
  SAME_MODE_ONLY_KEY,
  LOCAL_INBOX_KEY,
  LOCAL_ACTIVITY_KEY,
  DELETED_INBOX_PEER_IDS_KEY,
  DELETED_ACTIVITY_IDS_KEY,
  WAVED_USER_IDS_KEY,
  PAST_CHECKINS_KEY,
  DEV_LOCAL_CHECKIN_KEY,
  CHAT_READ_STATUS_KEY,
] as const;

/** Clear on-device user data after account removal. */
export async function clearUserLocalData(): Promise<void> {
  await AsyncStorage.multiRemove([...USER_DATA_KEYS]);
  resetPendingPeerChats();
  resetDevJordanChat();
}

/**
 * Permanently delete the signed-in account and all server-side user data.
 * Hard delete today — see migration TODO for 30-day soft delete.
 */
export async function deleteOwnAccount(opts?: { devBypassOnly?: boolean }): Promise<void> {
  if (opts?.devBypassOnly || !isSupabaseConfigured) {
    await clearUserLocalData();
    await clearLocalAuthSession();
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('You must be signed in to delete your account.');
  }

  const { error } = await supabase.rpc('delete_own_account');
  if (error) {
    const msg = error.message ?? '';
    if (
      error.code === '42883' ||
      /could not find the function|schema cache/i.test(msg)
    ) {
      throw new Error(
        'Account deletion is not enabled on the server yet. Run: npm run db:push (or apply delete_own_account migration in Supabase).',
      );
    }
    throw new Error(msg || 'Could not delete account. Try again in a moment.');
  }

  await clearUserLocalData();
  await clearLocalAuthSession();
}
