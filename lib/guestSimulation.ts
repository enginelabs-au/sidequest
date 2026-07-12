/**
 * Simulator guest mode — mock user with no real Supabase session (DEV_AUTH_BYPASS).
 * Stub peers, inbox, and activity data are only shown when this is active.
 */
let guestSimulationActive = false;

export function setGuestSimulationActive(active: boolean): void {
  guestSimulationActive = active;
}

export function isGuestSimulationActive(): boolean {
  return guestSimulationActive;
}
