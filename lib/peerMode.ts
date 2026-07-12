import type { IntentMode } from '@/types/database';

export const MODE_DISPLAY_LABEL: Record<IntentMode, string> = {
  friends: 'Friends',
  networking: 'Networking',
  dating: 'Dating',
};

export function filterBySameMode<T extends { mode: IntentMode }>(
  peers: T[],
  viewerMode: IntentMode,
): T[] {
  return peers.filter((peer) => peer.mode === viewerMode);
}
