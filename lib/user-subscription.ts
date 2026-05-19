import type { RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";
import { PAID_SUBSCRIPTION_DAYS } from "@/lib/subscription-config";
import {
  isPaidTier,
  normalizeStoredPlanKey,
  type PlanKey,
} from "@/lib/subscription-tier";

export type { PlanKey };

type SubscriptionRow = RowDataPacket & {
  plan_key: string;
  status: string;
  expires_at: Date | string | null;
  started_at?: Date | string | null;
  is_active?: number | null;
};

export async function ensureUserSubscriptionsTable() {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_subscriptions (
      user_id BIGINT UNSIGNED NOT NULL,
      plan_key VARCHAR(40) NOT NULL DEFAULT 'basic',
      status VARCHAR(40) NOT NULL DEFAULT 'active',
      expires_at DATETIME NULL,
      started_at DATETIME NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id),
      CONSTRAINT user_subscriptions_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
    )
  `);
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Stripe / API-аас ирсэн alias-уудыг DB-д бичих canonical утга руу. */
function normalizePlanKeyForWrite(raw: string | undefined | null): PlanKey {
  return normalizeStoredPlanKey(raw);
}

/**
 * DB-аас уншиж, төлбөртэй төлөвлөгөөний хугацаа дууссан бол basic болгоно.
 */
export async function getEffectiveSubscription(userId: number): Promise<{
  planKey: PlanKey;
  status: string;
  expiresAt: Date | null;
}> {
  await ensureUserSubscriptionsTable();
  const db = getDb();
  const [rows] = (await db.execute(
    `SELECT plan_key, status, expires_at FROM user_subscriptions WHERE user_id = ? LIMIT 1`,
    [userId],
  )) as [SubscriptionRow[], unknown];

  const row = rows[0];
  if (!row) {
    return { planKey: "basic", status: "active", expiresAt: null };
  }

  let planKey = normalizeStoredPlanKey(row.plan_key);
  const exp = toDate(row.expires_at);

  if (isPaidTier(planKey) && exp && exp.getTime() < Date.now()) {
    await db.execute(
      `UPDATE user_subscriptions SET plan_key = 'basic', status = 'active', expires_at = NULL, updated_at = NOW() WHERE user_id = ?`,
      [userId],
    );
    return { planKey: "basic", status: "active", expiresAt: null };
  }

  return {
    planKey,
    status: row.status ?? "active",
    expiresAt: exp,
  };
}

/**
 * Төлөвлөгөө бичих. Stripe: `pro`→premium, `business`→standard (legacy нэршил).
 */
export async function setUserPlan(
  userId: number,
  planKey: PlanKey | "free" | "pro" | "business" | string,
): Promise<{ expiresAt: Date | null }> {
  await ensureUserSubscriptionsTable();
  const db = getDb();

  const canonical = normalizePlanKeyForWrite(planKey);

  let expiresAt: Date | null = null;
  if (isPaidTier(canonical)) {
    expiresAt = new Date(Date.now() + PAID_SUBSCRIPTION_DAYS * 86400000);
  }

  await db.execute(
    `INSERT INTO user_subscriptions (user_id, plan_key, status, expires_at)
     VALUES (?, ?, 'active', ?)
     ON DUPLICATE KEY UPDATE
       plan_key = VALUES(plan_key),
       status = 'active',
       expires_at = VALUES(expires_at),
       updated_at = NOW()`,
    [userId, canonical, expiresAt],
  );

  return { expiresAt };
}

export async function getUserSubscriptionSummaryForLayout(userId: number): Promise<{
  planKey: PlanKey;
  hasPaidPlan: boolean;
  expiresAt: string | null;
}> {
  try {
    const s = await getEffectiveSubscription(userId);
    const hasPaidPlan = isPaidTier(s.planKey);
    return {
      planKey: s.planKey,
      hasPaidPlan,
      expiresAt: s.expiresAt ? s.expiresAt.toISOString() : null,
    };
  } catch {
    return { planKey: "basic", hasPaidPlan: false, expiresAt: null };
  }
}
