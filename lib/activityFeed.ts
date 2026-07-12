import {
    loadDeletedActivityIds,
    loadLocalActivityItems,
} from '@/lib/socialLocal';
import { MOCK_ACTIVITY_ITEMS, type ActivityItem } from '@/lib/socialMock';

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
  return mergeActivity(local, MOCK_ACTIVITY_ITEMS).filter((i) => !deleted.has(i.id));
}
