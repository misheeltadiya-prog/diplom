import { getDb } from "@/lib/db";

/**
 * Өргөдлийн хүснэгт байхгүй эсвэл хуучин бүтэцтэй DB-д зориулсан idempotent ensure.
 */
export async function ensureJobApplicationsTable() {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS job_applications (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      job_id VARCHAR(40) NOT NULL,
      applicant_user_id BIGINT UNSIGNED NULL,
      full_name VARCHAR(120) NOT NULL,
      email VARCHAR(160) NOT NULL,
      phone VARCHAR(40) NOT NULL,
      cover_note TEXT NOT NULL,
      cv_file_path VARCHAR(512) NOT NULL DEFAULT '',
      status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
      reviewed_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY job_applications_job_idx (job_id),
      KEY job_applications_status_idx (status)
    )
  `);

  for (const sql of [
    `ALTER TABLE job_applications ADD COLUMN applicant_user_id BIGINT UNSIGNED NULL AFTER job_id`,
    `ALTER TABLE job_applications ADD COLUMN cv_file_path VARCHAR(512) NOT NULL DEFAULT '' AFTER cover_note`,
  ]) {
    try {
      await db.execute(sql);
    } catch {
      /* column exists */
    }
  }
}
