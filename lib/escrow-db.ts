import { getDb } from "@/lib/db";

export async function ensurePaymentEscrowsTable() {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS payment_escrows (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      payer_user_id BIGINT UNSIGNED NOT NULL,
      payee_user_id BIGINT UNSIGNED NOT NULL,
      amount_mnt BIGINT UNSIGNED NOT NULL DEFAULT 0,
      currency VARCHAR(8) NOT NULL DEFAULT 'MNT',
      status ENUM('pending', 'funded', 'released', 'refunded', 'cancelled') NOT NULL DEFAULT 'pending',
      provider ENUM('manual', 'stripe', 'qpay') NOT NULL DEFAULT 'manual',
      external_ref VARCHAR(120) NOT NULL DEFAULT '',
      contract_note TEXT NOT NULL,
      job_offer_id BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY payment_escrows_payer_idx (payer_user_id, status),
      KEY payment_escrows_payee_idx (payee_user_id, status)
    )
  `);
}
