import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getCurrentUser } from "@/lib/auth";
import { CHAT_MESSAGE_MAX_CHARS, ensureChatTable } from "@/lib/chat-db";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

type MsgRow = RowDataPacket & {
  id: number;
  sender_id: number;
  receiver_id: number;
  sender_name: string;
  message: string;
  created_at: Date;
};

function parsePeerConvId(convId: string): { a: number; b: number } | null {
  const m = /^u(\d+)-u(\d+)$/.exec(convId.trim());
  if (!m) return null;
  return { a: Number(m[1]), b: Number(m[2]) };
}

export async function GET(req: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  const { conversationId: raw } = await context.params;
  const conversationId = raw.trim();
  const parsed = parsePeerConvId(conversationId);
  if (!parsed || (parsed.a !== currentUser.id && parsed.b !== currentUser.id)) {
    return NextResponse.json({ error: "Invalid conversation." }, { status: 400 });
  }

  await ensureChatTable();
  const db = getDb();

  const [rows] = (await db.execute(
    `
      SELECT id, sender_id, receiver_id, sender_name, message, created_at
      FROM chat_messages
      WHERE conversation_id = ?
      ORDER BY id ASC
      LIMIT 300
    `,
    [conversationId],
  )) as [MsgRow[], unknown];

  const messages = rows.map((r) => ({
    id: Number(r.id),
    senderId: Number(r.sender_id),
    receiverId: Number(r.receiver_id),
    senderName: String(r.sender_name ?? ""),
    message: String(r.message ?? ""),
    sender: Number(r.sender_id) === currentUser.id ? "me" : "other",
    time: new Date(r.created_at).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" }),
    at: new Date(r.created_at).toISOString(),
  }));

  return NextResponse.json({ ok: true, conversationId, messages }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  const { conversationId: raw } = await context.params;
  const conversationId = raw.trim();
  const parsed = parsePeerConvId(conversationId);
  if (!parsed || (parsed.a !== currentUser.id && parsed.b !== currentUser.id)) {
    return NextResponse.json({ error: "Invalid conversation." }, { status: 400 });
  }

  const otherUserId = parsed.a === currentUser.id ? parsed.b : parsed.a;

  const body = (await req.json()) as { message?: string };
  const message = body.message?.trim() ?? "";
  if (!message) {
    return NextResponse.json({ error: "Мессеж хоосон байна." }, { status: 400 });
  }
  if (message.length > CHAT_MESSAGE_MAX_CHARS) {
    return NextResponse.json(
      { error: `Мессеж ${CHAT_MESSAGE_MAX_CHARS} тэмдэгтээс урт байж болохгүй.` },
      { status: 400 },
    );
  }

  await ensureChatTable();
  const db = getDb();

  const [result] = (await db.execute(
    `INSERT INTO chat_messages (sender_id, receiver_id, sender_name, message, conversation_id)
     VALUES (?, ?, ?, ?, ?)`,
    [currentUser.id, otherUserId, currentUser.fullName, message, conversationId],
  )) as [{ insertId: number }, unknown];

  return NextResponse.json({
    ok: true,
    message: {
      id: Number(result.insertId),
      senderId: currentUser.id,
      receiverId: otherUserId,
      senderName: currentUser.fullName,
      message,
      sender: "me",
      time: new Date().toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" }),
      at: new Date().toISOString(),
    },
  });
}

