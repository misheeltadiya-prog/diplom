/**
 * Чат real-time: Next.js App Router дээр WebSocket server байхгүй тул SSE ашиглана.
 * `REALTIME_PROVIDER=sse` (default) | `pusher` | `ably` (удаахгүй hook).
 */
export type RealtimeProvider = "sse" | "pusher" | "ably";

export function getRealtimeProvider(): RealtimeProvider {
  const raw = process.env.REALTIME_PROVIDER?.trim().toLowerCase();
  if (raw === "pusher" || raw === "ably") return raw;
  return "sse";
}

export function isPusherConfigured(): boolean {
  return Boolean(
    process.env.PUSHER_APP_ID?.trim() &&
      process.env.PUSHER_KEY?.trim() &&
      process.env.PUSHER_SECRET?.trim() &&
      process.env.PUSHER_CLUSTER?.trim(),
  );
}

export function getChatStreamPath(conversationId: number | string) {
  return `/api/chat/thread/${conversationId}/stream`;
}
