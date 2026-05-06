import { getDb } from "@/lib/db";

/** UTF-8-safe character cap for chat body (MySQL TEXT fits more). */
export const CHAT_MESSAGE_MAX_CHARS = 4000;

export async function ensureChatTable() {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      sender_id BIGINT UNSIGNED NOT NULL,
      receiver_id BIGINT UNSIGNED NOT NULL,
      sender_name VARCHAR(120) NOT NULL,
      message TEXT NOT NULL,
      conversation_id VARCHAR(96) NOT NULL DEFAULT '',
      read_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY chat_sender_idx (sender_id),
      KEY chat_receiver_idx (receiver_id),
      KEY chat_conversation_id_idx (conversation_id)
    )
  `);
  for (const sql of [
    `ALTER TABLE chat_messages ADD COLUMN conversation_id VARCHAR(96) NOT NULL DEFAULT ''`,
    `ALTER TABLE chat_messages ADD COLUMN read_at DATETIME NULL`,
    `ALTER TABLE chat_messages ADD KEY chat_conversation_id_idx (conversation_id)`,
  ]) {
    try {
      await db.execute(sql);
    } catch {
      /* column or key exists */
    }
  }
}
