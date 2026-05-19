import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { clearCompanyMediaUrl, replaceCompanyMediaUrl } from "@/lib/company-media";
import { uploadFile } from "@/lib/file-upload";
import { guardUploadRate } from "@/lib/upload-guard";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "company") {
      return NextResponse.json({ ok: false, error: "Only companies can upload logos" }, { status: 403 });
    }

    const rateBlocked = guardUploadRate(request, user.id, "logo");
    if (rateBlocked) return rateBlocked;

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    const result = await uploadFile(file, "logos", `company-${user.id}`);
    if (!result.success || !result.url) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    await replaceCompanyMediaUrl(user.id, "logo_url", result.url);
    return NextResponse.json({ ok: true, url: result.url });
  } catch (error) {
    logger.error("logo_upload_error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ ok: false, error: "Failed to upload logo" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "company") {
      return NextResponse.json({ ok: false, error: "Only companies can delete logos" }, { status: 403 });
    }

    await clearCompanyMediaUrl(user.id, "logo_url");
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("logo_delete_error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ ok: false, error: "Failed to delete logo" }, { status: 500 });
  }
}
