import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { allDmConversationIds, primaryConversationIdForInsert } from "@/lib/chat-conversation";
import { CHAT_MESSAGE_MAX_CHARS, ensureChatTable } from "@/lib/chat-db";
import {
  chatConversationParamsMulti,
  chatConversationWhere,
  chatConversationWhereMulti,
} from "@/lib/chat-queries";
import { getLinkedFreelancerUserIdForChat } from "@/lib/chat-linked-user";
import { getDb } from "@/lib/db";
import { notify } from "@/lib/notify";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ seekerId: string }>;
};

type MsgRow = {
  id: number;
  sender_id: number;
  receiver_id: number;
  sender_name: string;
  message: string;
  conversation_id: string | null;
  created_at: Date;
};

export async function GET(req: Request, context: RouteContext) {
  const { seekerId } = await context.params;
  const seekerProfileId = Number(seekerId);
  const currentUser = await getCurrentUser();

  if (!currentUser || !Number.isFinite(seekerProfileId)) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  try {
    await ensureChatTable();
    const db = getDb();
    const url = new URL(req.url);
    const clientUserIdParam = url.searchParams.get("clientUserId");
    const parsedClientParam = clientUserIdParam ? Number(clientUserIdParam) : null;

    const linkedFreelancerUserId = await getLinkedFreelancerUserIdForChat(db, seekerProfileId);
    const convIds = allDmConversationIds({
      seekerProfileId,
      currentUserId: currentUser.id,
      linkedFreelancerUserId,
      otherUserId: parsedClientParam,
    });

    if (convIds.length === 0) {
      return NextResponse.json(
        { error: "clientUserId query параметр шаардлагатай (freelancer хариу бичих)." },
        { status: 400 },
      );
    }

    const cw = convIds.length === 1 ? chatConversationWhere() : chatConversationWhereMulti(convIds);
    const cp = chatConversationParamsMulti(convIds, currentUser.id, seekerProfileId);
    const [rows] = (await db.execute(
      `SELECT id, sender_id, receiver_id, sender_name, message, IFNULL(conversation_id,'') AS conversation_id, created_at
       FROM chat_messages
       WHERE ${cw}
       ORDER BY created_at ASC
       LIMIT 200`,
      cp,
    )) as [MsgRow[], unknown];

    const messages = rows.map((r) => ({
      id: r.id,
      senderId: r.sender_id,
      receiverId: r.receiver_id,
      senderName: r.sender_name,
      message: r.message,
      sender: r.sender_id === currentUser.id ? "me" : "other",
      time: new Date(r.created_at).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" }),
    }));

    return NextResponse.json(
      { ok: true, messages, conversationId: convIds[0] ?? "" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Алдаа гарлаа." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request, context: RouteContext) {
  const { seekerId } = await context.params;
  const seekerProfileId = Number(seekerId);
  const currentUser = await getCurrentUser();

  if (!currentUser || !Number.isFinite(seekerProfileId)) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  const ip = getClientIp(req);
  const rl = checkRateLimit(`chat-post:${currentUser.id}:${ip}`, { windowMs: 60_000, max: 45 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Хэт олон мессеж илгээж байна. Түр хүлээнэ үү." }, { status: 429 });
  }

  try {
    const body = (await req.json()) as { message?: string; clientUserId?: number };
    const message = body.message?.trim();
    const bodyClientId = body.clientUserId != null ? Number(body.clientUserId) : null;

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
    const linkedFreelancerUserId = await getLinkedFreelancerUserIdForChat(db, seekerProfileId);

    const convId = primaryConversationIdForInsert({
      seekerProfileId,
      currentUserId: currentUser.id,
      clientUserIdParam: bodyClientId,
      linkedFreelancerUserId,
    });

    if (!convId) {
      return NextResponse.json(
        { error: "clientUserId заавал (энэ карттай холбогдсон freelancer хариу бичих)." },
        { status: 400 },
      );
    }

    let receiverNumeric: number;
    if (linkedFreelancerUserId === currentUser.id && bodyClientId != null) {
      receiverNumeric = bodyClientId;
    } else if (linkedFreelancerUserId != null) {
      receiverNumeric = linkedFreelancerUserId;
    } else {
      receiverNumeric = seekerProfileId;
    }

    const [result] = (await db.execute(
      `INSERT INTO chat_messages (sender_id, receiver_id, sender_name, message, conversation_id)
       VALUES (?, ?, ?, ?, ?)`,
      [currentUser.id, receiverNumeric, currentUser.fullName, message, convId],
    )) as [{ insertId: number }, unknown];

    try {
      if (linkedFreelancerUserId === currentUser.id && bodyClientId != null) {
        await notify({
          userId: bodyClientId,
          type: "new_message",
          title: "Шинэ мессеж",
          body: `${currentUser.fullName}: ${message.slice(0, 120)}`,
          payload: { seekerId: seekerProfileId, fromUserId: currentUser.id },
        });
      } else if (linkedFreelancerUserId && linkedFreelancerUserId !== currentUser.id) {
        await notify({
          userId: linkedFreelancerUserId,
          type: "new_message",
          title: "Шинэ мессеж",
          body: `${currentUser.fullName}: ${message.slice(0, 120)}`,
          payload: { seekerId: seekerProfileId, fromUserId: currentUser.id },
        });
      }
    } catch {
      /* ignore */
    }

    return NextResponse.json({
      ok: true,
      message: {
        id: result.insertId,
        senderId: currentUser.id,
        receiverId: receiverNumeric,
        senderName: currentUser.fullName,
        message,
        sender: "me",
        time: new Date().toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" }),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Алдаа гарлаа." },
      { status: 500 },
    );
  }
}
