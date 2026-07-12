import { isDevIvyPeerId } from '@/lib/devFakePeer';
import { isGuestSimulationActive } from '@/lib/guestSimulation';
import {
    loadDeletedActivityIds,
    loadLocalActivityItems,
} from '@/lib/socialLocal';
import { MOCK_ACTIVITY_ITEMS, type ActivityItem } from '@/lib/socialMock';

function isStubPeerId(peerUserId: string | undefined): boolean {
  if (!peerUserId) return false;
  return peerUserId.startsWith('mock-') || isDevIvyPeerId(peerUserId);
}

function withoutStubActivity(items: ActivityItem[]): ActivityItem[] {
  if (isGuestSimulationActive()) return items;
  return items.filter((i) => !isStubPeerId(i.peerUserId));
}

function mergeActivity(local: ActivityItem[], mock: ActivityItem[]): ActivityItem[] {
  const seen = new Set<string>();
  const merged: ActivityItem[] = [];
  for (const item of [...local, ...mock]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
  return merged;
}

/** Mock + local activity rows for profile inbox CTA decisions. */
export async function loadMergedActivityItems(): Promise<ActivityItem[]> {
  const [local, deletedIds] = await Promise.all([
    loadLocalActivityItems(),
    loadDeletedActivityIds(),
  ]);
  const deleted = new Set(deletedIds);
  const stub = isGuestSimulationActive() ? MOCK_ACTIVITY_ITEMS : [];
  return withoutStubActivity(mergeActivity(local, stub)).filter((i) => !deleted.has(i.id));
}
