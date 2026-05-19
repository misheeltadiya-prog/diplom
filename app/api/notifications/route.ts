import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

type NotifRow = {
  id: number;
  type: string;
  title: string;
  body: string;
  payload: string;
  is_read: number;
  created_at: Date;
};

async function ensureTable() {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      type VARCHAR(60) NOT NULL,
      title VARCHAR(180) NOT NULL,
      body VARCHAR(500) NOT NULL DEFAULT '',
      payload JSON NOT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY notifications_user_idx (user_id)
    )
  `);
}

// GET — хэрэглэгчийн мэдэгдлүүд
export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  await ensureTable();
  const db = getDb();

  const [rows] = (await db.execute(
    `SELECT id, type, title, body, payload, is_read, created_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    [currentUser.id],
  )) as [NotifRow[], unknown];

  const notifications = rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    payload: r.payload,
    isRead: r.is_read === 1,
    createdAt: new Date(r.created_at).toISOString(),
  }));

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return NextResponse.json({ ok: true, notifications, unreadCount });
}

// PATCH — бүгдийг уншсан болгох
export async function PATCH() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  await ensureTable();
  const db = getDb();

  await db.execute(
    `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
    [currentUser.id],
  );

  return NextResponse.json({ ok: true });
}

// DELETE — энэ хэрэглэгчийн бүх мэдэгдлийг устгах
export async function DELETE() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  await ensureTable();
  const db = getDb();

  await db.execute(`DELETE FROM notifications WHERE user_id = ?`, [currentUser.id]);

  return NextResponse.json({ ok: true });
}
