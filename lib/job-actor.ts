import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

type UserIdRow = {
  id: number;
};

export async function resolveJobActorId() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    return currentUser.id;
  }

  const db = getDb();
  const [existing] = (await db.query("SELECT id FROM users ORDER BY id ASC LIMIT 1")) as [
    UserIdRow[],
    unknown,
  ];

  if (existing.length > 0) {
    return existing[0].id;
  }

  const [result] = (await db.execute(
    `
      INSERT INTO users (full_name, phone, email, password_hash)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)
    `,
    ["System User", "00000000", "system@zeel.local", "system-hash"],
  )) as [{ insertId: number }, unknown];

  return Number(result.insertId);
}
