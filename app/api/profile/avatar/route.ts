import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getPublicDir } from "@/lib/public-dir";

const MAX_BYTES = 2 * 1024 * 1024;

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
    return NextResponse.json({ error: "Файл хэт том (2MB хүртэл)." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  // Use a versioned filename to avoid stale browser cache.
  const rel = `/uploads/avatars/${user.id}-${Date.now()}.${ext}`;
  const pub = getPublicDir();
  const dir = path.join(pub, "uploads", "avatars");
  const full = path.join(pub, rel.slice(1));

  await mkdir(dir, { recursive: true });
  await writeFile(full, buf);

  try {
    const db = getDb();
    await db.execute(`UPDATE users SET avatar_url = ? WHERE id = ?`, [rel, user.id]);
  } catch {
    /* avatar_url column optional */
  }

  return NextResponse.json({ ok: true, url: rel });
}
