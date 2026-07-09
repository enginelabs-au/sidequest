import { checkoutUser } from '@/lib/connections';

/** Deletes check-in via RPC and refreshes AuthContext check-in state. */
export async function performCheckout(refreshCheckIn: () => Promise<void>): Promise<void> {
  await checkoutUser();
  await refreshCheckIn();
}
