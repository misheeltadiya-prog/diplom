/**
 * Legacy rows stored receiver_id as job_seeker_profiles.id; newer rows use conversation_id.
 * GET / stream must use the same predicate so SSE does not miss messages.
 */

export function chatConversationWhere(prefix = ""): string {
  const p = prefix ? `${prefix}.` : "";
  return `(${p}conversation_id = ?
    OR (
      (${p}conversation_id = '' OR ${p}conversation_id IS NULL)
      AND ((${p}sender_id = ? AND ${p}receiver_id = ?) OR (${p}sender_id = ? AND ${p}receiver_id = ?))
    ))`;
}

export function chatConversationParams(
  convId: string,
  currentUserId: number,
  seekerProfileId: number,
): [string, number, number, number, number] {
  return [convId, currentUserId, seekerProfileId, seekerProfileId, currentUserId];
}
