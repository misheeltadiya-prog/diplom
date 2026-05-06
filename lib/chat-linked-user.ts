import type { Pool } from "mysql2/promise";
import { registeredSeekerCardIdToUserId } from "@/lib/job-seekers";

/** Чат / мэдэгдэл: картын ID → холбогдсон freelancer `users.id`. */
export async function getLinkedFreelancerUserIdForChat(db: Pool, seekerProfileId: number): Promise<number | null> {
  const fromRegistered = registeredSeekerCardIdToUserId(seekerProfileId);
  if (fromRegistered != null) {
    try {
      const [rows] = (await db.execute(
        `SELECT id FROM users WHERE id = ? AND role = 'freelancer' LIMIT 1`,
        [fromRegistered],
      )) as [{ id: number }[], unknown];
      if (rows.length > 0) return fromRegistered;
    } catch {
      /* ignore */
    }
  }
  try {
    const [rows] = (await db.execute(
      `SELECT linked_user_id FROM job_seeker_profiles WHERE id = ? LIMIT 1`,
      [seekerProfileId],
    )) as [{ linked_user_id: number | null }[], unknown];
    return rows[0]?.linked_user_id ?? null;
  } catch {
    return null;
  }
}
