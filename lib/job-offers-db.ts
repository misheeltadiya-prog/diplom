import { getDb } from "@/lib/db";

/**
 * job_offers хүснэгт байхгүй DB-д зориулсан. FK-гүй (суулгалтын дараалал алдагдахгүй).
 */
export async function ensureJobOffersTable() {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS job_offers (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      company_user_id BIGINT UNSIGNED NOT NULL,
      freelancer_user_id BIGINT UNSIGNED NOT NULL,
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      offer_details_json TEXT NULL,
      status ENUM('pending', 'accepted', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      responded_at DATETIME NULL,
      PRIMARY KEY (id),
      KEY job_offers_freelancer_idx (freelancer_user_id, status),
      KEY job_offers_company_idx (company_user_id)
    )
  `);

  for (const sql of [
    `ALTER TABLE job_offers ADD COLUMN responded_at DATETIME NULL`,
    `ALTER TABLE job_offers ADD COLUMN offer_details_json TEXT NULL AFTER message`,
  ]) {
    try {
      await db.execute(sql);
    } catch {
      /* column exists */
    }
  }
}
