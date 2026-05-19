import type { RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";
import { getAiFeatureFlags } from "@/lib/features";
import {
  isPaidTier,
  maxJobAppliesPerDay,
  maxActiveJobsForEmployer,
  maxPortfolioItems,
  type PlanKey,
} from "@/lib/subscription-tier";
import { countActiveJobsForUser } from "@/lib/jobs-store";
import { getEffectiveSubscription } from "@/lib/user-subscription";

const APPLY_ACTION = "apply_job";
const POST_JOB_ACTION = "post_job";

export async function ensureUsageLimitsTable() {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS usage_limits (
      user_id BIGINT UNSIGNED NOT NULL,
      action_type VARCHAR(40) NOT NULL,
      usage_date DATE NOT NULL,
      count INT UNSIGNED NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, action_type, usage_date),
      KEY usage_limits_user_date_idx (user_id, usage_date),
      CONSTRAINT usage_limits_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function getCanonicalPlanForUser(userId: number): Promise<PlanKey> {
  const s = await getEffectiveSubscription(userId);
  return s.planKey;
}

type UsageRow = RowDataPacket & { count: number };

export async function getUsageCountToday(userId: number, actionType: string): Promise<number> {
  await ensureUsageLimitsTable();
  const db = getDb();
  const [rows] = (await db.execute(
    `SELECT count FROM usage_limits
     WHERE user_id = ? AND action_type = ? AND usage_date = CURDATE()
     LIMIT 1`,
    [userId, actionType],
  )) as [UsageRow[], unknown];
  return Number(rows[0]?.count ?? 0);
}

export async function incrementUsageToday(userId: number, actionType: string): Promise<void> {
  await ensureUsageLimitsTable();
  const db = getDb();
  await db.execute(
    `
    INSERT INTO usage_limits (user_id, action_type, usage_date, count)
    VALUES (?, ?, CURDATE(), 1)
    ON DUPLICATE KEY UPDATE count = count + 1
  `,
    [userId, actionType],
  );
}

export async function canApplyToJobToday(userId: number): Promise<{ ok: true } | { ok: false; reason: string }> {
  const tier = await getCanonicalPlanForUser(userId);
  const max = maxJobAppliesPerDay(tier);
  if (!Number.isFinite(max)) return { ok: true };
  const used = await getUsageCountToday(userId, APPLY_ACTION);
  if (used >= max) {
    return {
      ok: false,
      reason: `Өдөрт зөвхөн ${max} өргөдөл илгээх эрхтэй (${tier.toUpperCase()}). Маргааш дахин оролдоно уу эсвэл төлөвлөгөөг өргөтгөнө үү.`,
    };
  }
  return { ok: true };
}

export async function canPostJob(userId: number): Promise<{ ok: true } | { ok: false; reason: string }> {
  const tier = await getCanonicalPlanForUser(userId);
  const max = maxActiveJobsForEmployer(tier);
  if (!Number.isFinite(max)) return { ok: true };
  const current = await countActiveJobsForUser(userId);
  if (current >= max) {
    return {
      ok: false,
      reason: `Идэвхтэй ажлын зарын дээд хязгаарт хүрсэн (${current}/${max}, ${tier.toUpperCase()}). Зар хааж дахин нэмнэ үү эсвэл төлөвлөгөөг өргөтгөнө үү.`,
    };
  }
  return { ok: true };
}

export async function recordJobApplicationUsage(userId: number) {
  const tier = await getCanonicalPlanForUser(userId);
  if (!Number.isFinite(maxJobAppliesPerDay(tier))) return;
  await incrementUsageToday(userId, APPLY_ACTION);
}

export async function getSubscriptionPayloadForApi(userId: number) {
  const s = await getEffectiveSubscription(userId);
  const tier = s.planKey;
  return {
    plan: tier,
    status: s.status,
    expiresAt: s.expiresAt ? s.expiresAt.toISOString() : null,
    isPaid: isPaidTier(tier),
    limits: {
      maxActiveJobs: Number.isFinite(maxActiveJobsForEmployer(tier)) ? maxActiveJobsForEmployer(tier) : null,
      maxAppliesPerDay: Number.isFinite(maxJobAppliesPerDay(tier)) ? maxJobAppliesPerDay(tier) : null,
      maxPortfolioItems: maxPortfolioItems(tier),
    },
    ai: getAiFeatureFlags(tier),
  };
}
