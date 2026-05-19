import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getCurrentUser } from "@/lib/auth";
import { ensureChatTable } from "@/lib/chat-db";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type InboxRow = RowDataPacket & {
  conversation_id: string;
  last_id: number;
};

type MsgRow = RowDataPacket & {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: Date;
  conversation_id: string;
};

type UserRow = RowDataPacket & {
  id: number;
  full_name: string;
  role: string | null;
  avatar_url: string | null;
};

function parsePeerConvId(convId: string): { a: number; b: number } | null {
  const m = /^u(\d+)-u(\d+)$/.exec(convId.trim());
  if (!m) return null;
  return { a: Number(m[1]), b: Number(m[2]) };
}

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  await ensureChatTable();
  const db = getDb();

  // Only peer threads (uX-uY). Legacy seeker threads stay on the seeker modal.
  const [rows] = (await db.execute(
    `
      SELECT conversation_id, MAX(id) AS last_id
      FROM chat_messages
      WHERE conversation_id LIKE 'u%-u%'
        AND (sender_id = ? OR receiver_id = ?)
      GROUP BY conversation_id
      ORDER BY last_id DESC
      LIMIT 80
    `,
    [currentUser.id, currentUser.id],
  )) as [InboxRow[], unknown];

  const convIds = rows.map((r) => String(r.conversation_id));
  if (convIds.length === 0) {
    return NextResponse.json({ ok: true, threads: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const lastIds = rows.map((r) => Number(r.last_id)).filter((x) => Number.isFinite(x));
  const placeholders = lastIds.map(() => "?").join(", ");
  const [msgRows] = (await db.query(
    `
      SELECT id, sender_id, receiver_id, message, created_at, IFNULL(conversation_id,'') AS conversation_id
      FROM chat_messages
      WHERE id IN (${placeholders})
    `,
    lastIds,
  )) as [MsgRow[], unknown];

  const msgByConv = new Map<string, MsgRow>();
  for (const m of msgRows) {
    msgByConv.set(String(m.conversation_id), m);
  }

  const otherUserIds: number[] = [];
  const otherByConv = new Map<string, number>();
  for (const convId of convIds) {
    const parsed = parsePeerConvId(convId);
    if (!parsed) continue;
    const other = parsed.a === currentUser.id ? parsed.b : parsed.b === currentUser.id ? parsed.a : null;
    if (other == null) continue;
    otherByConv.set(convId, other);
    otherUserIds.push(other);
  }

  const uniqueOther = [...new Set(otherUserIds)];
  const usersPlaceholders = uniqueOther.map(() => "?").join(", ");
  const [userRows] = (await db.query(
    `SELECT id, full_name, role, IFNULL(avatar_url,'') AS avatar_url FROM users WHERE id IN (${usersPlaceholders})`,
    uniqueOther,
  )) as [UserRow[], unknown];

  const userById = new Map<number, UserRow>();
  for (const u of userRows) userById.set(Number(u.id), u);

  const threads = convIds
    .map((convId) => {
      const otherId = otherByConv.get(convId);
      const otherUser = otherId != null ? userById.get(otherId) : null;
      const last = msgByConv.get(convId) ?? null;
      return {
        conversationId: convId,
        otherUser: otherUser
          ? {
              id: Number(otherUser.id),
              fullName: String(otherUser.full_name ?? ""),
              role: String(otherUser.role ?? "client"),
              avatarUrl: String(otherUser.avatar_url ?? "") || null,
            }
          : otherId != null
            ? { id: otherId, fullName: `User ${otherId}`, role: "client", avatarUrl: null as string | null }
            : null,
        lastMessage: last
          ? {
              id: Number(last.id),
              text: String(last.message ?? ""),
              at: new Date(last.created_at).toISOString(),
              fromMe: Number(last.sender_id) === currentUser.id,
            }
          : null,
      };
    })
    .filter((t) => t.otherUser);

  return NextResponse.json({ ok: true, threads }, { headers: { "Cache-Control": "no-store" } });
}

