/** Freelancer card (job_seeker_profiles.id) + client (users.id) нэг thread. */
export function chatConversationId(seekerProfileId: number, clientUserId: number) {
  return `s${seekerProfileId}-u${clientUserId}`;
}

export function parseConversationId(raw: string): { seekerId: number; clientUserId: number } | null {
  const m = /^s(\d+)-u(\d+)$/.exec(raw.trim());
  if (!m) return null;
  return { seekerId: Number(m[1]), clientUserId: Number(m[2]) };
}
