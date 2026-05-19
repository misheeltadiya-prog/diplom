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
      return NextResponse.json({ ok: false, error: "Only companies can upload banners" }, { status: 403 });
    }

    const rateBlocked = guardUploadRate(request, user.id, "banner");
    if (rateBlocked) return rateBlocked;

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    const result = await uploadFile(file, "banners", `company-${user.id}`);
    if (!result.success || !result.url) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    await replaceCompanyMediaUrl(user.id, "banner_url", result.url);
    return NextResponse.json({ ok: true, url: result.url });
  } catch (error) {
    logger.error("banner_upload_error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ ok: false, error: "Failed to upload banner" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "company") {
      return NextResponse.json({ ok: false, error: "Only companies can delete banners" }, { status: 403 });
    }

    await clearCompanyMediaUrl(user.id, "banner_url");
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("banner_delete_error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ ok: false, error: "Failed to delete banner" }, { status: 500 });
  }
}
