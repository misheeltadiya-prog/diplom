import { getDb } from "@/lib/db";

type NotifyPayload = {
  userId: number;
  type: "new_message" | "new_application" | "application_status" | "new_review" | "job_offer";
  title: string;
  body?: string;
  payload?: Record<string, unknown>;
};

/**
 * Хэрэглэгчид мэдэгдэл илгээх.
 * Алдаа гарвал дуугүй орхино — notification нь critical биш.
 */
export async function notify(data: NotifyPayload) {
  try {
    const db = getDb();
    await db.execute(
      `INSERT INTO notifications (user_id, type, title, body, payload)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.userId,
        data.type,
        data.title,
        data.body ?? "",
        JSON.stringify(data.payload ?? {}),
      ],
    );
  } catch {
    // Notification failure should never break the main flow
  }
}
