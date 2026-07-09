import { supabase } from '@/lib/supabase';

export const REPORT_REASONS = [
  { id: 'harassment', label: 'Harassment' },
  { id: 'spam', label: 'Spam' },
  { id: 'inappropriate', label: 'Inappropriate' },
  { id: 'other', label: 'Other' },
] as const;

export type ReportReasonId = (typeof REPORT_REASONS)[number]['id'];

export type BlockedUserRow = {
  blocked_id: string;
  created_at: string;
};

export async function fetchMyBlocks(): Promise<BlockedUserRow[]> {
  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as BlockedUserRow[]) ?? [];
}

export async function submitSafetyReport(params: {
  reportedId: string;
  connectionId?: string | null;
  reason: string;
  details?: string;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const details = params.details?.trim() || null;

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_id: params.reportedId,
    connection_id: params.connectionId ?? null,
    reason: params.reason,
    details,
  });
  if (error) throw error;
}
