import { DEV_LOCAL_CHECKIN_KEY } from '@/constants/storage';
import { recordPastCheckIn, type PastCheckIn } from '@/lib/checkinHistory';
import { checkoutUser } from '@/lib/connections';
import { clearDevLocalCheckIn } from '@/lib/devLocalCheckIn';
import type { IntentMode } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CheckoutMeta = {
  venueId: string;
  venueName: string;
  mode: IntentMode;
};

/** Deletes check-in via RPC (or clears dev-local storage) and refreshes AuthContext. */
export async function performCheckout(
  refreshCheckIn: () => Promise<void>,
  meta?: CheckoutMeta,
  onSuccess?: () => void,
): Promise<void> {
  if (meta) {
    await recordPastCheckIn({
      venueId: meta.venueId,
      venueName: meta.venueName,
      mode: meta.mode,
      checkedOutAt: new Date().toISOString(),
    } satisfies PastCheckIn);
  }

  const hasLocal = !!(await AsyncStorage.getItem(DEV_LOCAL_CHECKIN_KEY));
  if (hasLocal) {
    await clearDevLocalCheckIn();
  } else {
    await checkoutUser();
  }
  await refreshCheckIn();
  onSuccess?.();
}
