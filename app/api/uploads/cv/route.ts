import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPublicDir } from "@/lib/public-dir";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "CV файл сонгоно уу." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Файл хэт том (5MB хүртэл)." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() || "pdf").toLowerCase().replace(/[^a-z0-9]/g, "") || "pdf";
  const rel = `/uploads/cvs/${user.id}-${Date.now()}.${ext}`;
  const pub = getPublicDir();
  const dir = path.join(pub, "uploads", "cvs");
  const full = path.join(pub, rel.slice(1));

  await mkdir(dir, { recursive: true });
  await writeFile(full, buf);

  return NextResponse.json({ ok: true, cvFilePath: rel });
}
