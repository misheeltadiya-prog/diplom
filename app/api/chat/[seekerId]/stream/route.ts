import { getCurrentUser } from "@/lib/auth";
import { chatConversationId } from "@/lib/chat-conversation";
import { ensureChatTable } from "@/lib/chat-db";
import { chatConversationParams, chatConversationWhere } from "@/lib/chat-queries";
import { getLinkedFreelancerUserIdForChat } from "@/lib/chat-linked-user";
import { getDb } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ seekerId: string }>;
};

type MsgRow = {
  id: number;
  sender_id: number;
  sender_name: string;
  message: string;
  created_at: Date;
};

const POLL_MS = 1200;
const HEARTBEAT_MS = 15000;

export async function GET(req: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new Response("Unauthorized", { status: 401 });
  }

  const ip = getClientIp(req);
  if (!checkRateLimit(`chat-sse:${currentUser.id}:${ip}`, { windowMs: 60_000, max: 12 }).allowed) {
    return new Response("Too many connections", { status: 429 });
  }

  const { seekerId } = await context.params;
  const seekerProfileId = Number(seekerId);
  const url = new URL(req.url);
  const clientParam = url.searchParams.get("clientUserId");
  const bodyClientId = clientParam ? Number(clientParam) : null;

  const encoder = new TextEncoder();
  let lastId = 0;

  await ensureChatTable();
  const db = getDb();
  const linkedFreelancerUserId = await getLinkedFreelancerUserIdForChat(db, seekerProfileId);

  let convId: string | null;
  if (linkedFreelancerUserId === currentUser.id) {
    if (bodyClientId == null || !Number.isFinite(bodyClientId)) {
      return new Response("clientUserId required", { status: 400 });
    }
    convId = chatConversationId(seekerProfileId, bodyClientId);
  } else {
    convId = chatConversationId(seekerProfileId, currentUser.id);
  }

  try {
    const cw = chatConversationWhere();
    const cp = chatConversationParams(convId, currentUser.id, seekerProfileId);
    const [rows] = (await db.execute(
      `SELECT MAX(id) as max_id FROM chat_messages WHERE ${cw}`,
      cp,
    )) as [Array<{ max_id: number | null }>, unknown];
    lastId = rows[0]?.max_id ?? 0;
  } catch {
    lastId = 0;
  }

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode("event: connected\ndata: {}\n\n"));

      let lastHeartbeat = Date.now();
      const interval = setInterval(async () => {
        const now = Date.now();
        if (now - lastHeartbeat >= HEARTBEAT_MS) {
          controller.enqueue(encoder.encode(`: ping ${now}\n\n`));
          lastHeartbeat = now;
        }

        try {
          const dbInner = getDb();
          const cw = chatConversationWhere();
          const cp = chatConversationParams(convId, currentUser.id, seekerProfileId);
          const [msgRows] = (await dbInner.execute(
            `SELECT id, sender_id, sender_name, message, created_at
             FROM chat_messages
             WHERE id > ? AND (${cw})
             ORDER BY id ASC
             LIMIT 20`,
            [lastId, ...cp],
          )) as [MsgRow[], unknown];

          for (const row of msgRows) {
            const msg = {
              id: row.id,
              senderId: row.sender_id,
              senderName: row.sender_name,
              message: row.message,
              sender: row.sender_id === currentUser.id ? "me" : "other",
              time: new Date(row.created_at).toLocaleTimeString("mn-MN", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };
            controller.enqueue(encoder.encode(`event: message\ndata: ${JSON.stringify(msg)}\n\n`));
            lastId = row.id;
          }
        } catch {
          /* keep alive */
        }
      }, POLL_MS);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
