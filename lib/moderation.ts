// MVP: client-side substring filter only.
// Future: supabase/functions/moderate-message — OpenAI moderation on reports/messages.

const BLOCKED_WORDS = ['spam', 'scam', 'abuse'];

export function containsBlockedContent(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some((word) => lower.includes(word));
}

export function sanitizeMessage(text: string): string {
  return text.trim().slice(0, 2000);
}
