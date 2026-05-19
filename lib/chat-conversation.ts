import { REGISTERED_FREELANCER_SEEKER_ID_OFFSET } from "@/lib/job-seekers";

/** Freelancer card (job_seeker_profiles.id) + client (users.id) нэг thread. */
export function chatConversationId(seekerProfileId: number, clientUserId: number) {
  return `s${seekerProfileId}-u${clientUserId}`;
}

/** Хоёр users.id хоорондын DM — аль ч тал профайл нээсэн ижил мөрөнд уншина. */
export function peerChatConversationId(userIdA: number, userIdB: number): string {
  const lo = Math.min(userIdA, userIdB);
  const hi = Math.max(userIdA, userIdB);
  return `u${lo}-u${hi}`;
}

function registeredFreelancerCardId(userId: number): number {
  return REGISTERED_FREELANCER_SEEKER_ID_OFFSET + userId;
}

function uniqueConvIds(ids: string[]): string[] {
  return [...new Set(ids.filter((s) => s.length > 0))];
}

/**
 * Нэг чат мөрөнд тохирох бүх conversation_id (шинэ peer + хуучин s-карт-u хэрэглэгч хувилбарууд).
 * Бүртгэлтэй freelancer хоорондын чат нэгдэхэд хэрэглэнэ.
 */
export function allDmConversationIds(opts: {
  seekerProfileId: number;
  currentUserId: number;
  linkedFreelancerUserId: number | null;
  /** Профайл эзэмшигч өөрийн карт дээрээс нөгөө тал (client / freelancer) */
  otherUserId: number | null;
}): string[] {
  const { seekerProfileId, currentUserId, linkedFreelancerUserId, otherUserId } = opts;

  if (linkedFreelancerUserId == null) {
    return [chatConversationId(seekerProfileId, currentUserId)];
  }

  if (linkedFreelancerUserId === currentUserId) {
    if (otherUserId == null || !Number.isFinite(otherUserId)) {
      return [];
    }
    return uniqueConvIds([
      peerChatConversationId(currentUserId, otherUserId),
      chatConversationId(seekerProfileId, otherUserId),
    ]);
  }

  const owner = linkedFreelancerUserId;
  return uniqueConvIds([
    peerChatConversationId(currentUserId, owner),
    chatConversationId(seekerProfileId, currentUserId),
    chatConversationId(registeredFreelancerCardId(currentUserId), owner),
  ]);
}

/** Шинэ мессеж INSERT: бүртгэлтэй хэрэглэгч хооронд үргэлж peer ID. */
export function primaryConversationIdForInsert(opts: {
  seekerProfileId: number;
  currentUserId: number;
  clientUserIdParam: number | null;
  linkedFreelancerUserId: number | null;
}): string | null {
  const { seekerProfileId, currentUserId, clientUserIdParam, linkedFreelancerUserId } = opts;

  if (linkedFreelancerUserId === currentUserId) {
    if (clientUserIdParam == null || !Number.isFinite(clientUserIdParam)) {
      return null;
    }
    return peerChatConversationId(currentUserId, clientUserIdParam);
  }

  if (linkedFreelancerUserId != null) {
    return peerChatConversationId(currentUserId, linkedFreelancerUserId);
  }

  return chatConversationId(seekerProfileId, currentUserId);
}

export function parseConversationId(raw: string): { seekerId: number; clientUserId: number } | null {
  const m = /^s(\d+)-u(\d+)$/.exec(raw.trim());
  if (!m) return null;
  return { seekerId: Number(m[1]), clientUserId: Number(m[2]) };
}
