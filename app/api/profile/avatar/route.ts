import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { deletePublicUpload, uploadFile } from "@/lib/file-upload";
import { logger } from "@/lib/logger";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Файл сонгоно уу." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Зөвхөн зураг." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Файл хэт том (5MB хүртэл)." }, { status: 400 });
  }

  let oldUrl: string | null = user.avatarUrl?.trim() || null;
  try {
    const db = getDb();
    const [rows] = (await db.execute(
      `SELECT IFNULL(avatar_url, '') AS avatar_url FROM users WHERE id = ? LIMIT 1`,
      [user.id],
    )) as [{ avatar_url: string }[], unknown];
    const fromDb = rows[0]?.avatar_url?.trim();
    if (fromDb) oldUrl = fromDb;
  } catch {
    /* avatar_url column optional */
  }

  const result = await uploadFile(file, "avatars", String(user.id));
  if (!result.success || !result.url) {
    return NextResponse.json(
      { error: result.error ?? "Зураг хадгалахад алдаа гарлаа." },
      { status: 400 },
    );
  }

  try {
    const db = getDb();
    await db.execute(`UPDATE users SET avatar_url = ? WHERE id = ?`, [result.url, user.id]);
  } catch (err) {
    logger.error("avatar_db_update_failed", {
      userId: user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Өгөгдлийн санд хадгалахад алдаа гарлаа." }, { status: 500 });
  }

  if (oldUrl && oldUrl !== result.url) {
    await deletePublicUpload(oldUrl).catch(() => undefined);
  }

  return NextResponse.json({ ok: true, url: result.url, storage: result.storage });
}
