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

/** Олон conversation_id (peer + legacy) — ижил DM thread-ийг нэгтгэн уншина. */
export function chatConversationWhereMulti(convIds: string[]): string {
  if (convIds.length === 0) {
    return "(1=0)";
  }
  if (convIds.length === 1) {
    return chatConversationWhere();
  }
  const placeholders = convIds.map(() => "?").join(", ");
  return `(conversation_id IN (${placeholders})
    OR (
      (conversation_id = '' OR conversation_id IS NULL)
      AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
    ))`;
}

export function chatConversationParamsMulti(
  convIds: string[],
  currentUserId: number,
  seekerProfileId: number,
): (string | number)[] {
  if (convIds.length === 1) {
    return [...chatConversationParams(convIds[0], currentUserId, seekerProfileId)];
  }
  return [...convIds, currentUserId, seekerProfileId, seekerProfileId, currentUserId];
}
